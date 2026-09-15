import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const excludedFiles = new Set(["CHECKSUMS.sha256", ".env", ".env.mvp"]);

const { stdout } = await execFileAsync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  },
);

const paths = stdout
  .split("\0")
  .filter(Boolean)
  .filter((path) => !excludedFiles.has(path.split("/").at(-1)))
  .sort((left, right) => left.localeCompare(right));

const lines = [];

for (const path of paths) {
  const hash = createHash("sha256")
    .update(await readFile(resolve(root, path)))
    .digest("hex");

  lines.push(`${hash}  ${path.replaceAll("/", "\\")}`);
}

await writeFile(resolve(root, "CHECKSUMS.sha256"), `${lines.join("\n")}\n`, "utf8");

process.stdout.write(`${JSON.stringify({ event: "checksums.generated", files: lines.length })}\n`);
