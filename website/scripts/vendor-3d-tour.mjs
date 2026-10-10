// Copies the 3D tour's libraries (three.js, its loaders, the Draco decoder and Spark)
// from node_modules into public/3d-tour/vendor so the tour is served from this site
// instead of third-party CDNs. Runs automatically before `npm run dev` and `npm run build`.
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nodeModules = resolve(projectDirectory, "node_modules");
const vendorDirectory = resolve(projectDirectory, "public/3d-tour/vendor");

const FILES = [
  "three/build/three.module.js",
  "three/build/three.core.js",
  "three/examples/jsm/loaders/GLTFLoader.js",
  "three/examples/jsm/loaders/DRACOLoader.js",
  "three/examples/jsm/renderers/CSS2DRenderer.js",
  "three/examples/jsm/utils/BufferGeometryUtils.js",
  "three/examples/jsm/libs/draco/gltf/draco_decoder.js",
  "three/examples/jsm/libs/draco/gltf/draco_decoder.wasm",
  "three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js",
  ["@sparkjsdev/spark/dist/spark.module.js", "spark/spark.module.js"],
];

for (const entry of FILES) {
  const [source, target] = Array.isArray(entry) ? entry : [entry, entry];
  const destination = resolve(vendorDirectory, target);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(resolve(nodeModules, source), destination);
}
