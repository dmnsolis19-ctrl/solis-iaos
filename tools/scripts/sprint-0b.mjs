import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const composeFile = "infra/local/compose.yaml";
const supportedModes = new Set(["all", "local", "preflight", "security", "static", "terraform"]);
const mode = process.argv[2] ?? "all";
const keepRunning = process.argv.includes("--keep-running");
const runId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const evidenceDirectory = resolve(projectRoot, "artifacts", "sprint-0b", runId);
const evidenceRelative = relative(projectRoot, evidenceDirectory).replaceAll("\\", "/");
const steps = [];
let stepNumber = 0;
let composeStarted = false;

const databaseEnvironment = {
  PGHOST: "127.0.0.1",
  PGPORT: "5432",
  PGDATABASE: "solis_iaos",
  PGUSER: "solis_owner",
  PGPASSWORD: "local-only-change-me",
};

const localImages = {
  api: "solis-iaos/api:0.2.0-local",
  telemetryWorker: "solis-iaos/telemetry-worker:0.2.0-local",
  simulator: "solis-iaos/simulator:0.2.0-local",
  web: "solis-iaos/web:0.2.0-local",
};

if (!supportedModes.has(mode)) {
  throw new Error(
    `Unknown Sprint 0B mode "${mode}". Expected one of: ${[...supportedModes].join(", ")}`,
  );
}

await mkdir(evidenceDirectory, { recursive: true });

function safeName(value) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(^-|-$)/gu, "");
}

function quotedCommand(command, args) {
  return [command, ...args]
    .map((value) => (/^[a-z0-9_./:@=-]+$/iu.test(value) ? value : JSON.stringify(value)))
    .join(" ");
}

async function recordStep(name, executor) {
  stepNumber += 1;
  const startedAt = new Date();
  const logPath = resolve(
    evidenceDirectory,
    `${String(stepNumber).padStart(2, "0")}-${safeName(name)}.log`,
  );
  process.stdout.write(`\n[SPRINT-0B] ${name}\n`);

  try {
    const result = await executor();
    const output = result?.output ?? "";
    await writeFile(logPath, output, "utf8");
    steps.push({
      name,
      status: "passed",
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      log: relative(projectRoot, logPath).replaceAll("\\", "/"),
      ...(result?.details === undefined ? {} : { details: result.details }),
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const output =
      error !== null && typeof error === "object" && "output" in error
        ? String(error.output)
        : `${message}\n`;
    await writeFile(logPath, output, "utf8");
    steps.push({
      name,
      status: "failed",
      startedAt: startedAt.toISOString(),
      durationMs: Date.now() - startedAt.getTime(),
      log: relative(projectRoot, logPath).replaceAll("\\", "/"),
      error: message,
    });
    throw error;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? projectRoot,
      env: { ...process.env, ...options.env },
      shell: false,
      windowsHide: true,
    });
    let output = `$ ${quotedCommand(command, args)}\n`;

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.once("error", (error) => {
      const wrapped = new Error(`${command} could not start: ${error.message}`);
      wrapped.output = output;
      rejectPromise(wrapped);
    });
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise({ output, exitCode: code });
        return;
      }
      const wrapped = new Error(
        `${command} exited with ${signal === null ? `code ${String(code)}` : `signal ${signal}`}`,
      );
      wrapped.output = output;
      rejectPromise(wrapped);
    });
  });
}

function pnpmArgs(...args) {
  const entryPoint = process.env.npm_execpath;
  if (entryPoint === undefined) {
    throw new Error("Run Sprint 0B through pnpm so the pinned package manager is used.");
  }
  return { command: process.execPath, args: [entryPoint, ...args] };
}

function runPnpm(...args) {
  const invocation = pnpmArgs(...args);
  return run(invocation.command, invocation.args);
}

function composeArgs(...args) {
  return ["compose", "-f", composeFile, ...args];
}

function parseLastJson(output) {
  const candidates = [];
  for (let index = 0; index < output.length; index += 1) {
    const character = output[index];
    const startsLine = index === 0 || output[index - 1] === "\n";
    if (startsLine && (character === "{" || character === "[")) {
      candidates.push(output.slice(index).trim());
    }
  }

  for (const candidate of candidates.reverse()) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Continue until a command-emitted JSON line is found.
    }
  }
  throw new Error("The command did not emit a parseable JSON result.");
}

async function preflight({ dockerRequired }) {
  await recordStep("Runtime preflight", async () => {
    const nodeVersion = process.versions.node;
    const nodeMajor = Number(nodeVersion.split(".")[0]);
    if (nodeMajor !== 24) {
      throw new Error(`Node.js 24 is required; found ${nodeVersion}.`);
    }

    const pnpmResult = await runPnpm("--version");
    const pnpmVersion = pnpmResult.output.trim().split(/\r?\n/gu).at(-1);
    const pnpmMajor = Number(pnpmVersion?.split(".")[0]);
    if (pnpmMajor !== 11) {
      throw new Error(`pnpm 11 is required; found ${String(pnpmVersion)}.`);
    }

    const details = {
      platform: process.platform,
      architecture: process.arch,
      node: nodeVersion,
      pnpm: pnpmVersion,
      dockerRequired,
    };
    let output = `Node.js ${nodeVersion}\npnpm ${String(pnpmVersion)}\n`;

    if (dockerRequired) {
      const docker = await run("docker", ["version", "--format", "{{.Server.Version}}"]);
      const compose = await run("docker", ["compose", "version", "--short"]);
      details.docker = docker.output.trim().split(/\r?\n/gu).at(-1);
      details.compose = compose.output.trim().split(/\r?\n/gu).at(-1);
      output += `${docker.output}${compose.output}`;
    }

    return { output, details };
  });
}

async function runStaticValidation() {
  await recordStep("Quality, contracts and build", () => runPnpm("run", "ci"));
  await recordStep("Secret scan", () => runPnpm("security:secrets"));
  await recordStep("Dependency audit", () => runPnpm("security:audit"));
  await recordStep("CycloneDX SBOM", () => runPnpm("run", "sbom"));
}

async function assertMigrationIdempotency() {
  await recordStep("First migration application", () =>
    runPnpmWithEnvironment(["db:migrate:up"], databaseEnvironment),
  );
  await recordStep("Second migration application is idempotent", async () => {
    const result = await runPnpmWithEnvironment(["db:migrate:up"], databaseEnvironment);
    const parsed = parseLastJson(result.output);
    if (parsed.event !== "migration.up" || !Array.isArray(parsed.applied)) {
      throw new Error("Unexpected migration runner response.");
    }
    if (parsed.applied.length !== 0) {
      throw new Error(`Second migration run applied changes: ${parsed.applied.join(", ")}`);
    }
    return { ...result, details: { appliedOnSecondRun: parsed.applied } };
  });
  await recordStep("Migration ledger and checksum status", async () => {
    const result = await runPnpmWithEnvironment(["db:status"], databaseEnvironment);
    const parsed = parseLastJson(result.output);
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      parsed.some(
        (migration) =>
          migration.applied !== true || migration.appliedChecksum !== migration.checksum,
      )
    ) {
      throw new Error("Migration ledger is incomplete or contains checksum drift.");
    }
    return { ...result, details: { migrations: parsed.length, checksums: "matched" } };
  });
}

function runPnpmWithEnvironment(args, environment) {
  const invocation = pnpmArgs(...args);
  return run(invocation.command, invocation.args, {
    env: { ...environment },
  });
}

async function assertImageUsers() {
  await recordStep("Images and running containers are non-root", async () => {
    let output = "";
    const services = [
      ["api", localImages.api],
      ["telemetry-worker", localImages.telemetryWorker],
      ["simulator", localImages.simulator],
      ["web", localImages.web],
    ];

    for (const [service, image] of services) {
      const configured = await run("docker", [
        "image",
        "inspect",
        "--format",
        "{{.Config.User}}",
        image,
      ]);
      output += configured.output;
      const configuredUser = configured.output.trim().split(/\r?\n/gu).at(-1);
      if (configuredUser === undefined || ["", "0", "root"].includes(configuredUser)) {
        throw new Error(`${image} does not declare a non-root runtime user.`);
      }

      const runtime = await run("docker", [
        ...composeArgs("--profile", "apps", "exec", "-T", service, "id", "-u"),
      ]);
      output += runtime.output;
      const runtimeUid = runtime.output.trim().split(/\r?\n/gu).at(-1);
      if (runtimeUid === "0") {
        throw new Error(`${service} is running as root.`);
      }
    }

    return { output, details: { services: services.length, result: "non-root" } };
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${JSON.stringify(body)}`);
  }
  return { response, body };
}

async function assertApplicationHealth() {
  await recordStep("Application health and end-to-end trace", async () => {
    const correlationId = randomUUID();
    const api = await fetchJson("http://127.0.0.1:3000/health/ready", {
      headers: { "x-correlation-id": correlationId },
    });
    const worker = await fetchJson("http://127.0.0.1:3001/health/ready");
    const simulator = await fetchJson("http://127.0.0.1:3002/health/ready");
    const webResponse = await fetch("http://127.0.0.1:8080/health");

    if (!webResponse.ok) {
      throw new Error(`Web health returned ${webResponse.status}.`);
    }
    const web = await webResponse.json();
    const returnedCorrelation = api.response.headers.get("x-correlation-id");
    if (returnedCorrelation !== correlationId || api.body.correlationId !== correlationId) {
      throw new Error("API correlation ID was not propagated end-to-end.");
    }
    if (!/^[0-9a-f]{32}$/u.test(api.body.traceId ?? "")) {
      throw new Error("API health did not expose a valid OpenTelemetry trace ID.");
    }
    if (api.body.version !== "0.2.0") {
      throw new Error(`API returned unexpected version ${String(api.body.version)}.`);
    }
    if (worker.body.status !== "ok" || simulator.body.status !== "ok" || web.status !== "ok") {
      throw new Error("At least one local application is not ready.");
    }

    const evidence = {
      correlationId,
      traceId: api.body.traceId,
      api: api.body,
      worker: worker.body,
      simulator: simulator.body,
      web,
    };
    return {
      output: `${JSON.stringify(evidence, null, 2)}\n`,
      details: { correlationId, traceId: api.body.traceId },
    };
  });
}

async function collectComposeDiagnostics() {
  try {
    await recordStep("Docker Compose diagnostics", () =>
      run("docker", composeArgs("--profile", "apps", "logs", "--no-color", "--tail", "500")),
    );
  } catch {
    // The original failure remains authoritative.
  }
}

async function stopCompose({ volumes = false } = {}) {
  const args = composeArgs("--profile", "apps", "down", "--remove-orphans");
  if (volumes) args.push("-v");
  await run("docker", args);
  composeStarted = false;
}

async function runLocalValidation() {
  await recordStep("Compose model validation", () =>
    run("docker", composeArgs("--profile", "apps", "config", "--quiet")),
  );
  await recordStep("Start PostgreSQL, MQTT and SQS", async () => {
    composeStarted = true;
    await run("docker", composeArgs("up", "-d", "--wait"));
    return run("docker", composeArgs("ps"));
  });
  await assertMigrationIdempotency();
  await recordStep("PostgreSQL and RLS integration suite", () =>
    runPnpmWithEnvironment(["test:integration"], {
      ...databaseEnvironment,
      TEST_DATABASE: "true",
    }),
  );
  await recordStep("PostgreSQL, MQTT and SQS smoke", () =>
    runPnpmWithEnvironment(["local:smoke"], {
      ...databaseEnvironment,
      MQTT_PORT: "1883",
      SQS_PORT: "4566",
    }),
  );
  await recordStep("Build and start four application images", () =>
    run("docker", composeArgs("--profile", "apps", "up", "-d", "--build", "--wait")),
  );
  await assertImageUsers();
  await assertApplicationHealth();
  await recordStep("Final Compose state", () =>
    run("docker", composeArgs("--profile", "apps", "ps")),
  );
}

function dockerVolume(hostPath, containerPath, readOnly = false) {
  return `${hostPath}:${containerPath}${readOnly ? ":ro" : ""}`;
}

async function runTerraformValidation() {
  const terraformImage = "hashicorp/terraform:1.15.8";
  const base = [
    "run",
    "--rm",
    "-v",
    dockerVolume(projectRoot, "/workspace"),
    "-w",
    "/workspace/infra/terraform/staging",
    terraformImage,
  ];

  await recordStep("Terraform format", () =>
    run("docker", [...base, "fmt", "-check", "-recursive"]),
  );
  await recordStep("Terraform init without backend", () =>
    run("docker", [...base, "init", "-backend=false", "-input=false"]),
  );
  await recordStep("Terraform multi-platform provider lock", () =>
    run("docker", [
      ...base,
      "providers",
      "lock",
      "-platform=linux_amd64",
      "-platform=linux_arm64",
      "-platform=windows_amd64",
      "-platform=darwin_amd64",
      "-platform=darwin_arm64",
    ]),
  );
  await recordStep("Terraform validate", () => run("docker", [...base, "validate", "-no-color"]));
}

async function ensureLocalImages() {
  for (const image of Object.values(localImages)) {
    try {
      await run("docker", ["image", "inspect", image]);
    } catch {
      await recordStep("Build local images for security scan", () =>
        run("docker", composeArgs("--profile", "apps", "build")),
      );
      return;
    }
  }
}

async function runTrivyValidation() {
  const trivyImage = "aquasec/trivy:0.69.3";
  await ensureLocalImages();

  await recordStep("Trivy filesystem and IaC scan", () =>
    run("docker", [
      "run",
      "--rm",
      "-v",
      dockerVolume(projectRoot, "/workspace", true),
      "-v",
      dockerVolume(evidenceDirectory, "/evidence"),
      trivyImage,
      "fs",
      "--scanners",
      "vuln,misconfig,secret",
      "--severity",
      "HIGH,CRITICAL",
      "--ignore-unfixed",
      "--exit-code",
      "1",
      "--format",
      "json",
      "--output",
      "/evidence/trivy-filesystem.json",
      "/workspace",
    ]),
  );

  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), "solis-sprint0b-images-"));
  try {
    for (const [name, image] of Object.entries(localImages)) {
      const tarPath = resolve(temporaryDirectory, `${name}.tar`);
      await recordStep(`Export ${name} image`, () =>
        run("docker", ["image", "save", "--output", tarPath, image]),
      );
      await recordStep(`Trivy ${name} image scan`, () =>
        run("docker", [
          "run",
          "--rm",
          "-v",
          dockerVolume(temporaryDirectory, "/scan", true),
          "-v",
          dockerVolume(evidenceDirectory, "/evidence"),
          trivyImage,
          "image",
          "--input",
          `/scan/${name}.tar`,
          "--scanners",
          "vuln",
          "--severity",
          "HIGH,CRITICAL",
          "--ignore-unfixed",
          "--exit-code",
          "1",
          "--format",
          "json",
          "--output",
          `/evidence/trivy-image-${name}.json`,
        ]),
      );
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function writeSummary(verdict, failure) {
  const completedAt = new Date().toISOString();
  const summary = {
    project: "SOLIS IAOS",
    increment: "Sprint 0B — Local Validation",
    version: "0.2.0",
    mode,
    runId,
    startedAt: steps[0]?.startedAt ?? completedAt,
    completedAt,
    verdict,
    keepRunning,
    constraints: {
      data: "synthetic-only",
      otConnection: false,
      remoteControl: false,
      awsDeployment: false,
    },
    steps,
    ...(failure === undefined ? {} : { failure }),
  };
  await writeFile(
    resolve(evidenceDirectory, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );

  const rows = steps
    .map((step) => `| ${step.name} | ${step.status === "passed" ? "PASS" : "FAIL"} | ${step.log} |`)
    .join("\n");
  const report = `# SOLIS IAOS — Evidencia Sprint 0B

**Versión:** 0.2.0  
**Modo:** ${mode}  
**Ejecución:** ${runId}  
**Dictamen:** ${verdict}

| Control | Resultado | Evidencia |
| --- | --- | --- |
${rows}

## Restricciones vigentes

- Datos exclusivamente sintéticos.
- Sin conexión a red OT ni planta real.
- Sin control remoto.
- Sin despliegue AWS.

${failure === undefined ? "" : `## Falla\n\n${failure}\n`}
`;
  await writeFile(resolve(evidenceDirectory, "REPORT.md"), report, "utf8");
  await writeFile(resolve(projectRoot, "artifacts", "sprint-0b", "LATEST"), `${runId}\n`, "utf8");
}

let failure;
try {
  if (mode === "preflight") {
    await preflight({ dockerRequired: true });
  } else if (mode === "static") {
    await preflight({ dockerRequired: false });
    await runStaticValidation();
  } else if (mode === "local") {
    await preflight({ dockerRequired: true });
    await runLocalValidation();
  } else if (mode === "terraform") {
    await preflight({ dockerRequired: true });
    await runTerraformValidation();
  } else if (mode === "security") {
    await preflight({ dockerRequired: true });
    await runTrivyValidation();
  } else {
    await preflight({ dockerRequired: true });
    await runStaticValidation();
    await runLocalValidation();
    await runTerraformValidation();
    await runTrivyValidation();
  }
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
  if (composeStarted) await collectComposeDiagnostics();
  process.exitCode = 1;
} finally {
  if (composeStarted && !keepRunning) {
    try {
      await recordStep("Stop local stack", () => stopCompose());
    } catch (error) {
      const cleanupFailure = error instanceof Error ? error.message : String(error);
      failure = failure === undefined ? cleanupFailure : `${failure}; cleanup: ${cleanupFailure}`;
      process.exitCode = 1;
    }
  }
  await writeSummary(failure === undefined ? "PASS" : "FAIL", failure);
  process.stdout.write(`\nEvidence: ${evidenceRelative}\n`);
}
