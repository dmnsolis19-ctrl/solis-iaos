import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import process from "node:process";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const pnpmEntryPoint = process.env.npm_execpath;
if (pnpmEntryPoint === undefined) {
  throw new Error("npm_execpath is required to locate the active pinned pnpm runtime.");
}

const child = spawn(
  process.execPath,
  [pnpmEntryPoint, "exec", "turbo", "run", "dev", "--parallel"],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  },
);

child.once("exit", (code, signal) => {
  if (signal !== null) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
