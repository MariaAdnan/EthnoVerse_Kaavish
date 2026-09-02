import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const serverDirectory = resolve(projectDirectory, "dist/server");

await mkdir(serverDirectory, { recursive: true });
await copyFile(
  resolve(projectDirectory, "worker/index.js"),
  resolve(serverDirectory, "index.js"),
);
