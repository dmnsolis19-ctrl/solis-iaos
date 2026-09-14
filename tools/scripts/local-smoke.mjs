import { connect } from "node:net";

const host = process.env.SMOKE_HOST ?? "127.0.0.1";

function resolvePort(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`${name} must be a valid TCP port`);
  }
  return value;
}

function checkTcp(name, port) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port });
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`${name} timed out on port ${port}`));
    }, 3000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ name, port, status: "ok" });
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function encodeMqttString(value) {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length > 65_535) throw new Error("MQTT string is too long");
  return Buffer.concat([Buffer.from([bytes.length >> 8, bytes.length & 0xff]), bytes]);
}

function checkMqtt(port) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port });
    const clientId = `solis-sprint0b-${process.pid}`;
    const variableHeader = Buffer.from([
      0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x1e,
    ]);
    const payload = encodeMqttString(clientId);
    const body = Buffer.concat([variableHeader, payload]);
    const packet = Buffer.concat([Buffer.from([0x10, body.length]), body]);
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error(`mqtt handshake timed out on port ${port}`));
    }, 3000);

    socket.once("connect", () => socket.write(packet));
    socket.once("data", (data) => {
      clearTimeout(timeout);
      socket.destroy();
      const isAccepted =
        data.length >= 4 &&
        data[0] === 0x20 &&
        data[1] === 0x02 &&
        data[2] === 0x00 &&
        data[3] === 0x00;
      if (!isAccepted) {
        reject(new Error(`mqtt returned an invalid CONNACK: ${data.toString("hex")}`));
        return;
      }
      resolve({ name: "mqtt", port, status: "ok", protocol: "MQTT-3.1.1" });
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

const postgresPort = resolvePort("PGPORT", 5432);
const mqttPort = resolvePort("MQTT_PORT", 1883);
const queuePort = resolvePort("SQS_PORT", 4566);

const checks = await Promise.all([
  checkTcp("postgres", postgresPort),
  checkMqtt(mqttPort),
  checkTcp("sqs", queuePort),
]);

const localStack = await fetch(`http://${host}:${queuePort}/_localstack/health`);
if (!localStack.ok) {
  throw new Error(`LocalStack health returned ${localStack.status}`);
}

const health = await localStack.json();
const sqsStatus = health.services?.sqs;
if (!["available", "running"].includes(sqsStatus)) {
  throw new Error(`LocalStack SQS is not ready: ${String(sqsStatus)}`);
}

console.log(JSON.stringify({ event: "local.smoke", checks, sqsStatus }));
