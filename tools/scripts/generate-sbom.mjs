import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const pnpmEntryPoint = process.env.npm_execpath;

if (pnpmEntryPoint === undefined) {
  throw new Error("npm_execpath is required to locate the active pinned pnpm runtime.");
}

const result = spawnSync(
  process.execPath,
  [
    pnpmEntryPoint,
    "sbom",
    "--sbom-format=cyclonedx",
    "--sbom-spec-version=1.6",
    "--sbom-type=application",
    "--sbom-supplier=SOLIS IAOS",
  ],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  },
);

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const sbom = JSON.parse(result.stdout);
if (sbom.bomFormat !== "CycloneDX" || sbom.specVersion !== "1.6") {
  throw new Error("pnpm returned an unexpected SBOM format.");
}

const destination = resolve("artifacts/sbom.cdx.json");
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, `${JSON.stringify(sbom, null, 2)}\n`, "utf8");

process.stdout.write(
  `${JSON.stringify({
    event: "sbom.generated",
    path: destination,
    components: sbom.components?.length ?? 0,
  })}\n`,
);
