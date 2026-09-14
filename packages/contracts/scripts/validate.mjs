import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse as parseYaml } from "yaml";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const mqttDirectory = join(packageRoot, "mqtt");
const examplesDirectory = join(packageRoot, "examples");
const openApiPath = join(packageRoot, "openapi", "openapi-v1.yaml");

const openApiText = await readFile(openApiPath, "utf8");
const openApi = parseYaml(openApiText);

if (openApi.openapi !== "3.1.0" || openApi.info?.version !== "1.0.0") {
  throw new Error("OpenAPI must remain at contract 3.1.0 / API 1.0.0 during Sprint 0.");
}

const forbiddenOperation = /\b(commands?|setpoints?|start|stop|bypass|remote control)\b/iu;
for (const [path, operations] of Object.entries(openApi.paths ?? {})) {
  for (const [method, operation] of Object.entries(operations)) {
    if (typeof operation !== "object" || operation === null) continue;
    const searchable = `${path} ${method} ${operation.operationId ?? ""} ${operation.summary ?? ""}`
      .replace(/([a-z])([A-Z])/gu, "$1 $2")
      .replace(/[-_/]+/gu, " ")
      .toLowerCase();
    if (forbiddenOperation.test(searchable)) {
      throw new Error(`Forbidden remote-control semantics in OpenAPI: ${searchable}`);
    }
  }
}

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  strictRequired: false,
});
addFormats(ajv);

const schemaFiles = (await readdir(mqttDirectory))
  .filter((file) => file.endsWith(".schema.json"))
  .sort();

const validators = new Map();
for (const file of schemaFiles) {
  const schema = JSON.parse(await readFile(join(mqttDirectory, file), "utf8"));
  validators.set(file, ajv.compile(schema));
}

const cases = [
  {
    schema: "telemetry-envelope.v1.schema.json",
    example: "telemetry-valid.json",
    expected: true,
  },
  {
    schema: "telemetry-envelope.v1.schema.json",
    example: "telemetry-invalid-no-data.json",
    expected: false,
  },
  {
    schema: "config-desired.v1.schema.json",
    example: "config-desired-valid.json",
    expected: true,
  },
];

for (const testCase of cases) {
  const validate = validators.get(testCase.schema);
  if (validate === undefined) {
    throw new Error(`Missing schema ${testCase.schema}`);
  }
  const example = JSON.parse(await readFile(join(examplesDirectory, testCase.example), "utf8"));
  const result = validate(example);
  if (result !== testCase.expected) {
    throw new Error(
      `${basename(testCase.example)} expected valid=${testCase.expected}, got ${String(result)}: ` +
        JSON.stringify(validate.errors),
    );
  }
}

console.log(
  JSON.stringify({
    event: "contracts.validated",
    openapi: "1.0.0",
    mqttSchemas: schemaFiles.length,
    examples: cases.length,
  }),
);
