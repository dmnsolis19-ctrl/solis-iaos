import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = process.cwd();
const excludedDirectories = new Set([".git", ".turbo", "node_modules"]);
const excludedFiles = new Set(["CHECKSUMS.sha256", ".env", ".env.mvp"]);

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;

    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collect(absolutePath)));
    } else if (entry.isFile() && !excludedFiles.has(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

const files = (await collect(root)).sort((left, right) =>
  relative(root, left).localeCompare(relative(root, right)),
);
const lines = [];

for (const file of files) {
  const hash = createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
  lines.push(`${hash}  ${relative(root, file)}`);
}

await writeFile(resolve(root, "CHECKSUMS.sha256"), `${lines.join("\n")}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ event: "checksums.generated", files: lines.length })}\n`);
