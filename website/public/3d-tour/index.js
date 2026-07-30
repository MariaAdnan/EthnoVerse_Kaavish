// to maria and afifah: watch this: https://youtu.be/lGokKxJ8D2c?si=Ye0FsN33LdLfcbYM
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { SplatMesh } from "@sparkjsdev/spark";
// ── URL params — must be first, everything reads from these ──
const urlParams = new URLSearchParams(window.location.search);
const isAdmin = urlParams.get('mode') === 'admin';
const COMMUNITY_ID = urlParams.get('community') || 'YOUR_ACTUAL_UUID_HERE';
const terrainParam = urlParams.get('terrain');
const isKolhi = !terrainParam;
const isCustomTerrain = terrainParam === 'custom';
const SUPABASE_URL = urlParams.get('supabaseUrl');
const SUPABASE_KEY = urlParams.get('supabaseKey');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Supabase configuration is missing from the tour URL');
}

const ASSET_URLS = Object.freeze({
  'bangles1 (1)-2.spz': 'https://res.cloudinary.com/dve5xqucs/raw/upload/v1785415706/ethnoverse/3d-tour/bangles1%20%281%29-2.spz',
  'bangles2-2.spz': 'https://res.cloudinary.com/dve5xqucs/raw/upload/v1785415707/ethnoverse/3d-tour/bangles2-2.spz',
  'box.spz': 'https://res.cloudinary.com/dve5xqucs/raw/upload/v1785415710/ethnoverse/3d-tour/box.spz',
  'char_pai.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415711/ethnoverse/3d-tour/char_pai.glb',
  'desert-v1.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415715/ethnoverse/3d-tour/desert-v1.glb',
  'frame03.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415717/ethnoverse/3d-tour/frame03.glb',
  'grass.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415718/ethnoverse/3d-tour/grass.glb',
  'hut.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415723/ethnoverse/3d-tour/hut.glb',
  'matka.spz': 'https://res.cloudinary.com/dve5xqucs/raw/upload/v1785415725/ethnoverse/3d-tour/matka.spz',
  'mountains.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415730/ethnoverse/3d-tour/mountains.glb',
  'oak_trees.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415732/ethnoverse/3d-tour/oak_trees.glb',
  'outfit-2.spz': 'https://res.cloudinary.com/dve5xqucs/raw/upload/v1785415734/ethnoverse/3d-tour/outfit-2.spz',
  'realistic_bush.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415737/ethnoverse/3d-tour/realistic_bush.glb',
  'rocky.glb': 'https://res.cloudinary.com/dve5xqucs/image/upload/v1785415740/ethnoverse/3d-tour/rocky.glb',
});

function assetUrl(filename) {
  const url = ASSET_URLS[filename];
  if (!url) throw new Error(`Missing 3D asset URL for ${filename}`);
  return url;
}

const pendingAdminTokenRequests = new Map();

window.addEventListener('message', (event) => {
  if (
    event.origin !== window.location.origin ||
    event.data?.type !== 'ethnoverse:admin-token'
  ) {
    return;
  }

  const pending = pendingAdminTokenRequests.get(event.data.requestId);
  if (!pending) return;

  pendingAdminTokenRequests.delete(event.data.requestId);
  window.clearTimeout(pending.timeoutId);

  if (event.data.accessToken) {
    pending.resolve(event.data.accessToken);
  } else {
    pending.reject(new Error('An authenticated admin session is required'));
  }
});

function requestAdminAccessToken() {
  return new Promise((resolve, reject) => {
    if (!isAdmin || window.parent === window) {
      reject(new Error('An authenticated admin session is required'));
      return;
    }

    const requestId = crypto.randomUUID();
    const timeoutId = window.setTimeout(() => {
      pendingAdminTokenRequests.delete(requestId);
      reject(new Error('Timed out while checking the admin session'));
    }, 3000);

    pendingAdminTokenRequests.set(requestId, { resolve, reject, timeoutId });
    window.parent.postMessage(
      { type: 'ethnoverse:request-admin-token', requestId },
      window.location.origin,
    );
  });
}

async function supabaseHeaders(requireAdmin = false) {
  const accessToken = requireAdmin
    ? await requestAdminAccessToken()
    : SUPABASE_KEY;

  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken}`,
  };
}

const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8d4b0); 
scene.fog = new THREE.Fog(0xe8d4b0, 30, 50);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let object;
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.178.0/examples/jsm/libs/draco/gltf/');

function createGLTFLoader() {
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);
  return gltfLoader;
}

const loader = createGLTFLoader();

// ── CSS2D label renderer ───────────────────────────────────────────────────
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
document.getElementById('container3D').appendChild(labelRenderer.domElement);

const LABEL_DISTANCE = 2.5;
const allLabels = [];
// const terrainParam = urlParams.get('terrain'); 
// null means Kolhi (no param), otherwise it's a new community terrain

const TERRAIN_FILES = {
  desert:    'desert-v1.glb',
  grass:     'grass.glb',
  rocky:     'rocky.glb',
  mountains: 'mountains.glb',
};

const terrainFile = isKolhi ? 'desert-v1.glb' : (TERRAIN_FILES[terrainParam] || 'grass.glb');

async function loadTerrain() {
  if (isCustomTerrain) {
    let t = { scale: 1, rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: -2, posZ: 0 };
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/communities?community_id=eq.${COMMUNITY_ID}&select=terrain_transform`,
        { headers: await supabaseHeaders() }
      );
      const rows = await res.json();
      if (rows?.[0]?.terrain_transform) {
        try { t = JSON.parse(rows[0].terrain_transform); } catch (_) {}
      }
    } catch (e) { console.warn('Could not fetch terrain transform:', e); }

    const glbUrl = `${SUPABASE_URL}/storage/v1/object/public/terrain-files/${COMMUNITY_ID}-terrain.glb`;
    loader.load(glbUrl, function (gltf) {
      object = gltf.scene;
      object.position.set(t.posX ?? 0, t.posY ?? -2, t.posZ ?? 0);
      const s = t.scale ?? 1;
      object.scale.set(s, s, s);
      object.rotation.set(t.rotX ?? 0, t.rotY ?? 0, t.rotZ ?? 0, 'XYZ');
      object.traverse((child) => {
        if (child.isMesh) { child.material.roughness = 1.0; child.material.metalness = 0.0; }
      });
      scene.add(object);
    }, undefined, (err) => {
      console.error('Custom terrain GLB failed:', err);
      loader.load(assetUrl('grass.glb'), (gltf) => {
        object = gltf.scene;
        object.position.set(0, -2, 0);
        object.scale.set(1, 1, 1);
        scene.add(object);
      });
    });
    return;
  }

  loader.load(assetUrl(terrainFile), function (gltf) {
    object = gltf.scene;
    if (isKolhi) {
      object.position.set(70, -4.5, -70);
      object.scale.set(0.07, 0.07, 0.07);
      object.traverse((child) => {
        if (child.isMesh) {
          const siltColor = new THREE.Color(0xffffff);
          child.material.color.lerp(siltColor, 0.7);
          child.material.roughness = 1.0;
          child.material.metalness = 0.0;
        }
      });
      scene.add(object);
      loadKolhiObjects();
    } else {
      object.position.set(0, -2, 0);
      object.scale.set(1, 1, 1);
      object.traverse((child) => {
        if (child.isMesh) { child.material.roughness = 1.0; child.material.metalness = 0.0; }
      });
      scene.add(object);
    }
  });
}
loadTerrain();
function makeLabel(title, description, worldX, worldY, worldZ, offsetX = 0, offsetY = 0, offsetZ = 0) {
  if (!title) return null;
  const div = document.createElement('div');
  div.className = 'label3d';
  div.innerHTML = `<strong>${title}</strong>${description ? `<p>${description}</p>` : ''}`;
  div.style.opacity = '0';
  const anchor = new THREE.Object3D();
  anchor.position.set(worldX + offsetX, worldY + offsetY, worldZ + offsetZ);
  scene.add(anchor);
  const obj = new CSS2DObject(div);
  obj.position.set(0, 0, 0);
  anchor.add(obj);
  // proximityPos is the group world position (no offset) used for distance check
  const proximityPos = new THREE.Vector3(worldX, worldY, worldZ);
  allLabels.push({ obj, div, anchor, proximityPos });
  return anchor;
}

function updateLabelHeights() {
  for (const { obj, anchor } of allLabels) {
    obj.position.y = camera.position.y - anchor.position.y;
  }
}
function loadKolhiObjects() {


  const matkaRotation = [Math.PI, 0, 0];
  const matka = new SplatMesh({ url: assetUrl("matka.spz") });
  matka.position.set(1.5, -3.7, -2.8);
  matka.scale.set(2, 2, 2);
  matka.rotation.set(...matkaRotation, 'XYZ');
  scene.add(matka);
  makeLabel(
    'Matka (Clay Pot)',
    'A handcrafted earthen pot used primarily for storing and cooling water through natural evaporation. Reflects sustainable living practices and indigenous pottery techniques.',
    1.2, -3.3, -2.5
  );

  const matka2 = new SplatMesh({ url: assetUrl("matka.spz") });
  matka2.position.set(1, -3.3, -2.5);
  matka2.scale.set(1.5, 1.5, 1.5);
  matka2.rotation.set(...matkaRotation, 'XYZ');
  scene.add(matka2);

  const matka3 = new SplatMesh({ url: assetUrl("matka.spz") });
  matka3.position.set(1.2, -3.3, -2.0);
  matka3.scale.set(1.5, 1.5, 1.5);
  matka3.rotation.set(...matkaRotation, 'XYZ');
  scene.add(matka3);


loader.load(assetUrl('hut.glb'), function (gltf) {
  const masterHut = gltf.scene;
  const hutPositions = [
    { x: 5, z: -5, y: 0, rot: 0 },
    { x: -8, z: -10, y: 0.2, rot: Math.PI / 4 },
    { x: 12, z: -15, y: 0.8, rot: Math.PI },
    { x: -5, z: 8, y: -0.5, rot: -Math.PI / 2 },
    { x: 10, z: 5, y: -0.5, rot: 2.5 }
  ];
  hutPositions.forEach((pos) => {
    const hut = masterHut.clone();
    hut.name = "hut";
    hut.position.set(pos.x, pos.y, pos.z); 
    hut.rotation.y = pos.rot;
    hut.scale.set(1, 1, 1); 
    const forwardOffset = 0;
    const sideOffset = 0.5;
    const hutCenter = new THREE.Vector3(
      pos.x + (Math.sin(pos.rot) * forwardOffset) + (Math.cos(pos.rot) * sideOffset),
      pos.y,
      pos.z + (Math.cos(pos.rot) * forwardOffset) - (Math.sin(pos.rot) * sideOffset)
    );
    const keepRadius = 3;
    hut.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.color.multiplyScalar(0.3);
        const colorBooster = new THREE.Color(0x8b5a2b); 
        child.material.color.lerp(colorBooster, 0.4);
        child.material.roughness = 1.0;
        child.material.metalness = 0.0;
        const uniqueUniforms = {
          uCenter: { value: hutCenter },
          uMaxDist: { value: keepRadius }
        };
        child.material.onBeforeCompile = (shader) => {
          shader.uniforms.uCenter = uniqueUniforms.uCenter;
          shader.uniforms.uMaxDist = uniqueUniforms.uMaxDist;
          shader.vertexShader = `
            varying vec3 vWorldPosition;
            ${shader.vertexShader}
          `.replace(
            `#include <worldpos_vertex>`,
            `#include <worldpos_vertex>
             vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
          );
          shader.fragmentShader = `
            varying vec3 vWorldPosition;
            uniform vec3 uCenter;
            uniform float uMaxDist;
            ${shader.fragmentShader}
          `.replace(
            `#include <clipping_planes_fragment>`,
            `#include <clipping_planes_fragment>
             float dist = distance(vWorldPosition.xz, uCenter.xz);
             if (dist > uMaxDist) discard;`
          );
        };
        child.material.needsUpdate = true;
      }
    });
    scene.add(hut);
    // No label for hut 1 (contains the outfit — labelled separately)
    if (pos.x === 5 && pos.z === -5) return;
    makeLabel(
      'Tribal Hut',
      'A traditional dwelling constructed using locally sourced materials such as mud, thatch, and wooden branches. Reflects indigenous architectural knowledge, emphasizing sustainability and thermal comfort.',
      pos.x, pos.y, pos.z
    );
  });

  // Outfit centered in hut 1
  const outfit = new SplatMesh({ url: assetUrl("outfit-2.spz") });
  outfit.position.set(5.5, -0.4, -5);
  outfit.scale.set(0.3, 0.3, 0.3);
  outfit.rotation.set(0.354, -0.4, 0, 'ZYX');
  scene.add(outfit);
  makeLabel(
    'Traditional Kameez',
    'A loose, long tunic worn by women, typically paired with shalwar or trousers. Varies in fabric, embroidery, and style, representing cultural identity, regional aesthetics, and social customs.',
    5.5, -0.4, -5
  );

  // Charpai outside hut 2
  const charpaiLoader = createGLTFLoader();
  charpaiLoader.load(assetUrl('char_pai.glb'), (gltf) => {
    const charpai = gltf.scene;
    charpai.position.set(0, -1.5, -8.5);
    charpai.rotation.y = Math.PI / 2;
    charpai.scale.set(1.5, 1.5, 1.5);
    charpai.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.color.multiplyScalar(0.45);
        child.material.roughness = 1.0;
        child.material.metalness = 0.0;
      }
    });
    scene.add(charpai);
    makeLabel(
      "Chaarpa'i",
      'A traditional woven bed made from a wooden frame and interlaced ropes or fibers. Used for sleeping, sitting, and social gatherings, often placed outdoors in open spaces.',
      0, -1.5, -8.5
    );
  });

  // Oak trees
  const treeLoader = createGLTFLoader();
  const treePositions = [
    { x: -15, y: -2.0, z: 2,   scale: 0.04,  rot: 0 },
    { x: -13, y: -2.0, z: 4,   scale: 0.035, rot: 0.8 },
    { x: 16,  y: -2.0, z: -18, scale: 0.045, rot: 0 },
    { x: 18,  y: -2.0, z: -16, scale: 0.038, rot: 1.2 },
  ];
  treeLoader.load(assetUrl('oak_trees.glb'), (gltf) => {
    treePositions.forEach((pos) => {
      const tree = gltf.scene.clone();
      tree.position.set(pos.x, pos.y, pos.z);
      tree.rotation.y = pos.rot;
      tree.scale.setScalar(pos.scale);
      tree.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          const sandyTint = new THREE.Color(0xe8d4b0);
          child.material.color.lerp(sandyTint, 0.45);
          child.material.roughness = 1.0;
          child.material.metalness = 0.0;
        }
      });
      scene.add(tree);
    });
  });

  // Bushes
  const bushLoader = createGLTFLoader();
  const bushPositions = [
    { x: 8,   y: -2.0, z: 2,   scale: 0.28, rot: 0 },
    { x: -3,  y: -2.0, z: -3,  scale: 0.42, rot: 1.1 },
    { x: -12, y: -2.0, z: -5,  scale: 0.35, rot: 0.4 },
    { x: 14,  y: -2.0, z: -10, scale: 0.55, rot: 2.0 },
    { x: -7,  y: -2.0, z: 5,   scale: 0.22, rot: 0.7 },
    { x: 12,  y: -2.0, z: 1,   scale: 0.48, rot: 1.8 },
    { x: 2,   y: -2.0, z: -12, scale: 0.32, rot: 3.0 },
    { x: -16, y: -2.0, z: -8,  scale: 0.60, rot: 0.2 },
  ];
  bushLoader.load(assetUrl('realistic_bush.glb'), (gltf) => {
    bushPositions.forEach((pos) => {
      const bush = gltf.scene.clone();
      bush.position.set(pos.x, pos.y, pos.z);
      bush.rotation.y = pos.rot;
      bush.scale.setScalar(pos.scale);
      bush.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          const sandyTint = new THREE.Color(0xe8d4b0);
          child.material.color.lerp(sandyTint, 0.4);
          child.material.roughness = 1.0;
          child.material.metalness = 0.0;
        }
      });
      scene.add(bush);
    });
  });
});
}
const renderer = new THREE.WebGLRenderer({ alpha: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding; 
renderer.localClippingEnabled = true; 
document.getElementById("container3D").appendChild(renderer.domElement);
camera.position.set(0, -0.5, 0); 

const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(0, 100, 0);
scene.add(topLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const moveSpeed = 0.1;
const lookSpeed = 0.03;
let moveW = false, moveS = false, moveA = false, moveD = false;
let lookUp = false, lookDown = false, lookLeft = false, lookRight = false;
let cameraYaw = 0, cameraPitch = 0;

function handleKeyDown(event) {
  switch (event.code) {
    case 'KeyW': moveW = true; break;
    case 'KeyS': moveS = true; break;
    case 'KeyA': moveA = true; break;
    case 'KeyD': moveD = true; break;
    case 'ArrowUp': lookUp = true; break;
    case 'ArrowDown': lookDown = true; break;
    case 'ArrowLeft': lookLeft = true; break;
    case 'ArrowRight': lookRight = true; break;
  }
}
function handleKeyUp(event) {
  switch (event.code) {
    case 'KeyW': moveW = false; break;
    case 'KeyS': moveS = false; break;
    case 'KeyA': moveA = false; break;
    case 'KeyD': moveD = false; break;
    case 'ArrowUp': lookUp = false; break;
    case 'ArrowDown': lookDown = false; break;
    case 'ArrowLeft': lookLeft = false; break;
    case 'ArrowRight': lookRight = false; break;
  }
}
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

const performancePanel = document.getElementById('performancePanel');
const deviceClass = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768
  ? 'mobile/touch'
  : 'desktop';
let fpsWindowStartedAt = performance.now();
let fpsFrameCount = 0;
const fpsSamples = [];

window.ethnoversePerformance = {
  deviceClass,
  currentFps: 0,
  averageFps: 0,
  samples: fpsSamples,
};

function recordFrame(timestamp) {
  fpsFrameCount += 1;
  const elapsed = timestamp - fpsWindowStartedAt;
  if (elapsed < 1000) return;

  const currentFps = (fpsFrameCount * 1000) / elapsed;
  fpsSamples.push(Number(currentFps.toFixed(2)));
  if (fpsSamples.length > 120) fpsSamples.shift();
  const averageFps = fpsSamples.reduce((sum, value) => sum + value, 0) / fpsSamples.length;

  window.ethnoversePerformance.currentFps = currentFps;
  window.ethnoversePerformance.averageFps = averageFps;
  if (performancePanel) {
    performancePanel.textContent =
      `${currentFps.toFixed(1)} FPS\n${averageFps.toFixed(1)} AVG · ${deviceClass.toUpperCase()}`;
  }

  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'ethnoverse:fps',
        deviceClass,
        currentFps,
        averageFps,
        sampleCount: fpsSamples.length,
      },
      window.location.origin,
    );
  }

  fpsFrameCount = 0;
  fpsWindowStartedAt = timestamp;
}

function animate() {
  requestAnimationFrame(animate);
  recordFrame(performance.now());
  if (lookLeft) cameraYaw += lookSpeed;
  if (lookRight) cameraYaw -= lookSpeed;
  if (lookUp) cameraPitch += lookSpeed;
  if (lookDown) cameraPitch -= lookSpeed;
  cameraPitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraPitch));
  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(new THREE.Euler(cameraPitch, cameraYaw, 0, 'YXZ'));
  camera.quaternion.copy(quaternion);
  if (moveW || moveS || moveA || moveD) {
    const forwardVector = new THREE.Vector3();
    const rightVector = new THREE.Vector3();
    camera.getWorldDirection(forwardVector);
    forwardVector.y = 0;
    forwardVector.normalize();
    rightVector.crossVectors(camera.up, forwardVector).normalize();
    if (moveW) camera.position.addScaledVector(forwardVector, moveSpeed);
    if (moveS) camera.position.addScaledVector(forwardVector, -moveSpeed);
    if (moveA) camera.position.addScaledVector(rightVector, moveSpeed);
    if (moveD) camera.position.addScaledVector(rightVector, -moveSpeed);
    if (object) {
      raycaster.set(new THREE.Vector3(camera.position.x, 10, camera.position.z), downVector);
      const intersects = raycaster.intersectObject(object, true);
      if (intersects.length > 0) {
        const terrainHeight = intersects[0].point.y;
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, terrainHeight + 1.5, 0.1);
      }
    }
    const boundary = 20;
    camera.position.x = Math.max(-boundary, Math.min(boundary, camera.position.x));
    camera.position.z = Math.max(-boundary, Math.min(boundary, camera.position.z));
  }
  if (moveW || moveS || moveA || moveD) {
    console.log(`My Position - X: ${camera.position.x.toFixed(2)}, Z: ${camera.position.z.toFixed(2)}`);
  }

  updateLabelHeights();
  const camPos = camera.position;
  for (const { obj, div, anchor, proximityPos } of allLabels) {
    const worldPos = proximityPos ?? anchor.position;
    const dx = camPos.x - worldPos.x;
    const dz = camPos.z - worldPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const opacity = dist < LABEL_DISTANCE ? Math.min(1, (LABEL_DISTANCE - dist) / 0.5) : 0;
    div.style.opacity = opacity.toFixed(3);
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

let isNight = false;
const daySettings = { sky: 0xe8d4b0, ambient: 0.5, directional: 1.0, fogNear: 30, fogFar: 50 };
const nightSettings = { sky: 0x000000, ambient: 0.15, directional: 0.3, fogNear: 5, fogFar: 35 };

const btn = document.getElementById('timeSwitch');
if (btn) {
  btn.addEventListener('click', () => {
    isNight = !isNight;
    const s = isNight ? nightSettings : daySettings;
    btn.innerText = isNight ? "Switch to Day" : "Switch to Night";
    scene.background.setHex(s.sky);
    scene.fog.color.setHex(s.sky);
    scene.fog.near = s.fogNear;
    scene.fog.far = s.fogFar;
    ambientLight.intensity = s.ambient;
    topLight.intensity = s.directional;
  });
}

// MARIAS CODE STARTS
// ─── PERSISTENT OBJECT PLACEMENT (ADMIN) ────────────────────────────────────

// ── Terrain Transform Panel (admin only, non-Kolhi) ─────────────────────────
if (isAdmin && !isKolhi) {
  // Current slider values — initialised from DB on load
  const terrainT = { scale: 1, rotX: 0, rotY: 0, rotZ: 0, posX: 0, posY: -2, posZ: 0 };

  // ── Panel DOM ──────────────────────────────────────────────────────────────
  const tPanel = document.createElement('div');
  tPanel.id = 'terrain-panel';
  tPanel.style.cssText = `
    position: fixed; left: 20px; top: 80px; z-index: 998;
    background: rgba(10,10,10,0.88); color: white;
    border: 1px solid rgba(255,255,255,0.12); border-radius: 12px;
    padding: 18px 20px; width: 280px; display: none;
    font-family: sans-serif; font-size: 13px; backdrop-filter: blur(8px);
  `;

  // Toggle button — always visible
  const tToggleBtn = document.createElement('button');
  tToggleBtn.id = 'terrain-toggle';
  tToggleBtn.style.cssText = `
    position: fixed; left: 20px; top: 160px; z-index: 998;
    padding: 8px 16px; background: rgba(10,10,10,0.75); color: white;
    border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;
    font-size: 13px; cursor: pointer; font-family: sans-serif;
    display: none;
  `;
  tToggleBtn.innerText = '⚙ Adjust Terrain';
  tToggleBtn.addEventListener('click', () => {
    tPanel.style.display = tPanel.style.display === 'none' ? 'block' : 'none';
  });
  document.body.appendChild(tToggleBtn);

  // ── Build slider helper ────────────────────────────────────────────────────
  function makeTerrainSlider({ label, min, max, step, value, key }) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom: 12px;';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:4px; opacity:0.65; font-size:11px;';
    const lbl = document.createElement('span');
    lbl.innerText = label;
    const val = document.createElement('span');
    val.innerText = Number(value).toFixed(2);
    header.appendChild(lbl);
    header.appendChild(val);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.style.cssText = 'width:100%; accent-color:#c8a96e; cursor:pointer;';

    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      val.innerText = v.toFixed(2);
      terrainT[key] = v;
      applyTerrainTransform();
    });

    wrap.appendChild(header);
    wrap.appendChild(slider);
    return { wrap, slider, val };
  }

  function sectionLabel(text) {
    const el = document.createElement('div');
    el.innerText = text;
    el.style.cssText = 'font-size:10px; opacity:0.35; letter-spacing:0.1em; text-transform:uppercase; margin: 10px 0 6px;';
    tPanel.appendChild(el);
  }

  // ── Apply transform to terrain object ─────────────────────────────────────
  function applyTerrainTransform() {
    if (!object) return;
    object.position.set(terrainT.posX, terrainT.posY, terrainT.posZ);
    object.scale.set(terrainT.scale, terrainT.scale, terrainT.scale);
    object.rotation.set(terrainT.rotX, terrainT.rotY, terrainT.rotZ, 'XYZ');
  }

  // ── Build panel contents ───────────────────────────────────────────────────
  function buildTerrainPanel() {
    tPanel.innerHTML = '';

    const title = document.createElement('div');
    title.innerText = '🏔 Terrain Transform';
    title.style.cssText = 'font-weight:600; font-size:14px; margin-bottom:14px; letter-spacing:0.02em;';
    tPanel.appendChild(title);

    const sliderDefs = [
      { section: 'Position', sliders: [
        { label: 'X', key: 'posX', min: -30, max: 30, step: 0.1 },
        { label: 'Y', key: 'posY', min: -10, max: 10, step: 0.1 },
        { label: 'Z', key: 'posZ', min: -30, max: 30, step: 0.1 },
      ]},
      { section: 'Scale', sliders: [
        { label: 'Scale', key: 'scale', min: 0.01, max: 5, step: 0.01 },
      ]},
      { section: 'Rotation', sliders: [
        { label: 'Rot X', key: 'rotX', min: -Math.PI, max: Math.PI, step: 0.01 },
        { label: 'Rot Y', key: 'rotY', min: -Math.PI, max: Math.PI, step: 0.01 },
        { label: 'Rot Z', key: 'rotZ', min: -Math.PI, max: Math.PI, step: 0.01 },
      ]},
    ];

    for (const { section, sliders } of sliderDefs) {
      sectionLabel(section);
      for (const def of sliders) {
        const { wrap } = makeTerrainSlider({ ...def, value: terrainT[def.key] });
        tPanel.appendChild(wrap);
      }
    }

    // Divider
    const hr = document.createElement('div');
    hr.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.1); margin: 14px 0 10px;';
    tPanel.appendChild(hr);

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.innerText = '✓ Save Transform';
    saveBtn.style.cssText = `
      width:100%; padding:9px; border-radius:8px; border:none; cursor:pointer;
      background:#c8a96e; color:#111; font-weight:600; font-size:13px; font-family:sans-serif;
    `;
    saveBtn.addEventListener('click', async () => {
      saveBtn.innerText = 'Saving…';
      saveBtn.disabled = true;
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/communities?community_id=eq.${COMMUNITY_ID}`,
          {
            method: 'PATCH',
            headers: {
              ...(await supabaseHeaders(true)),
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({ terrain_transform: JSON.stringify(terrainT) }),
          }
        );
        if (!res.ok) throw new Error(await res.text());
        saveBtn.innerText = '✓ Saved!';
        setTimeout(() => {
          saveBtn.innerText = '✓ Save Transform';
          saveBtn.disabled = false;
          // collapse panel, show toggle button
          tPanel.style.display = 'none';
          tToggleBtn.style.display = 'block';
          tToggleBtn.style.top = '60px'; // move up now insertBtn is visible
        }, 1200);
      } catch (err) {
        console.error('Save terrain transform failed:', err);
        saveBtn.innerText = '❌ Failed — retry';
        saveBtn.disabled = false;
      }
    });
    tPanel.appendChild(saveBtn);
  }

  // ── On load: fetch existing transform, then show panel ────────────────────
  async function initTerrainPanel() {
    let isFirstTime = true;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/communities?community_id=eq.${COMMUNITY_ID}&select=terrain_transform`,
        { headers: await supabaseHeaders() }
      );
      const rows = await res.json();
      const saved = rows?.[0]?.terrain_transform;
      if (saved) {
        isFirstTime = false;
        try {
          const t = JSON.parse(saved);
          Object.assign(terrainT, t);
          applyTerrainTransform();
        } catch (_) {}
      }
    } catch (e) { console.warn('Could not fetch terrain_transform:', e); }

    buildTerrainPanel();
    document.body.appendChild(tPanel);

    if (isFirstTime) {
      // First time — auto-open so admin sees sliders immediately
      tPanel.style.display = 'block';
      tToggleBtn.style.display = 'none';
    } else {
      // Already saved before — show toggle button only
      tPanel.style.display = 'none';
      tToggleBtn.style.display = 'block';
    }
  }

  // Stop click/keyboard events from leaking through the panel
  tPanel.addEventListener('click',      (e) => e.stopPropagation());
  tPanel.addEventListener('mousedown',  (e) => e.stopPropagation());
  tPanel.addEventListener('keydown',    (e) => e.stopPropagation());
  tPanel.addEventListener('keyup',      (e) => e.stopPropagation());

  initTerrainPanel();
}

// const urlParams = new URLSearchParams(window.location.search);
// const isAdmin = urlParams.get('mode') === 'admin';
// const COMMUNITY_ID = urlParams.get('community') || 'YOUR_ACTUAL_UUID_HERE';

// ── Load saved objects on startup ──────────────────────────────────────────
async function loadSavedObjects() {
  if (!COMMUNITY_ID || COMMUNITY_ID === 'YOUR_ACTUAL_UUID_HERE') {
    console.warn('[loadSavedObjects] No community_id in URL — skipping.');
    return;
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tour_objects?community_id=eq.${COMMUNITY_ID}&select=*`,
    { headers: await supabaseHeaders() }
  );

  if (!res.ok) {
    console.error('[loadSavedObjects] Supabase error:', res.status, await res.text());
    return;
  }

  const rows = await res.json();
  console.log('[loadSavedObjects] community_id:', COMMUNITY_ID, '| rows:', rows.length);

  if (!Array.isArray(rows)) {
    console.error('[loadSavedObjects] Unexpected response:', rows);
    return;
  }

  for (const row of rows) {
    console.log('[loadSavedObjects] loading:', row.object_name, row.object_url);
    if (row.type === 'ply') {
      const mesh = new SplatMesh({ url: row.object_url });
      mesh.position.set(row.offset_x ?? 0, row.offset_y ?? 0, row.offset_z ?? 0);
      const group = new THREE.Group();
      group.position.set(row.position_x, row.position_y, row.position_z);
      group.scale.set(row.scale ?? 1, row.scale ?? 1, row.scale ?? 1);
      group.rotation.set(row.rotation_x ?? 0, row.rotation_y ?? 0, row.rotation_z ?? 0, 'XYZ');
      group.add(mesh);
      scene.add(group);

      if (row.label_title) {
        makeLabel(
          row.label_title,
          row.label_description ?? '',
          row.position_x, row.position_y, row.position_z
        );
      }
    } else {
      const gltfLoader = createGLTFLoader();
      gltfLoader.load(row.object_url, (gltf) => {
        const obj = gltf.scene;
        obj.position.set(row.position_x, row.position_y, row.position_z);
        obj.scale.setScalar(row.scale ?? 1);
        obj.rotation.set(row.rotation_x ?? 0, row.rotation_y ?? 0, row.rotation_z ?? 0, 'XYZ');
        scene.add(obj);
      });
    }
  }
}
loadSavedObjects();

// ── Save a placed object to Supabase ──────────────────────────────────────
async function saveObjectToSupabase({ objectUrl, objectName, type, x, y, z, scale = 1, rotationX = 0, rotationY = 0, rotationZ = 0, offsetX = 0, offsetY = 0, offsetZ = 0, labelTitle = '', labelDescription = '' }) {
  const body = {
    community_id: COMMUNITY_ID,
    object_name: objectName,
    object_url: objectUrl,
    type,
    position_x: x,
    position_y: y,
    position_z: z,
    scale,
    rotation_x: rotationX,
    rotation_y: rotationY,
    rotation_z: rotationZ,
    offset_x: offsetX,
    offset_y: offsetY,
    offset_z: offsetZ,
    label_title: labelTitle || null,
    label_description: labelDescription || null,
  };
  console.log('[saveObjectToSupabase] saving:', body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tour_objects`, {
    method: 'POST',
    headers: {
      ...(await supabaseHeaders(true)),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to save object: ${await res.text()}`);
  console.log('[saveObjectToSupabase] saved OK');
}

// ── Admin UI (only shown when ?mode=admin) ─────────────────────────────────
if (isAdmin) {
  let awaitingPlacement = false;
  let pendingObject = null;

  const insertBtn = document.createElement('button');
  insertBtn.innerText = '+ Insert Object';
  insertBtn.style.cssText = `
    position: fixed; top: 100px; right: 20px; z-index: 999;
    padding: 10px 18px; background: rgba(0,0,0,0.6); color: white;
    border: 1px solid rgba(255,255,255,0.4); border-radius: 8px;
    font-size: 14px; cursor: pointer;
  `;
  document.body.appendChild(insertBtn);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.ply';
  fileInput.setAttribute('aria-label', 'Choose a binary Gaussian-splat PLY file');
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const banner = document.createElement('div');
  banner.setAttribute('role', 'status');
  banner.setAttribute('aria-live', 'polite');
  banner.style.cssText = `
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    z-index: 999; padding: 12px 24px; background: rgba(0,0,0,0.7); color: white;
    border-radius: 10px; font-size: 14px; display: none;
  `;
  document.body.appendChild(banner);

  insertBtn.addEventListener('click', () => fileInput.click());

  async function computePlyCentroid(file) {
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer.slice(0, 2048));
    const headerEnd = text.indexOf('end_header');
    if (headerEnd === -1) return { x: 0, y: 0, z: 0 };
    const header = text.slice(0, headerEnd);
    const isBinary = header.includes('binary_little_endian') || header.includes('binary_big_endian');
    const isBigEndian = header.includes('binary_big_endian');
    const vertexMatch = header.match(/element vertex (\d+)/);
    if (!vertexMatch) return { x: 0, y: 0, z: 0 };
    const vertexCount = parseInt(vertexMatch[1]);
    const props = [];
    for (const line of header.split('\n')) {
      const m = line.trim().match(/^property (\w+) (\w+)/);
      if (m) props.push({ type: m[1], name: m[2] });
    }
    const typeSizes = { float: 4, double: 8, int: 4, uint: 4, short: 2, ushort: 2, uchar: 1, char: 1 };
    let stride = 0, xOff = -1, yOff = -1, zOff = -1;
    for (const p of props) {
      const sz = typeSizes[p.type] ?? 4;
      if (p.name === 'x') xOff = stride;
      if (p.name === 'y') yOff = stride;
      if (p.name === 'z') zOff = stride;
      stride += sz;
    }
    if (xOff === -1 || yOff === -1 || zOff === -1) return { x: 0, y: 0, z: 0 };
    if (isBinary) {
      const dataStart = headerEnd + 'end_header'.length + 1;
      const data = new DataView(buffer, dataStart);
      let sumX = 0, sumY = 0, sumZ = 0, count = 0;
      const step = Math.max(1, Math.floor(vertexCount / 5000));
      for (let i = 0; i < vertexCount; i += step) {
        const base = i * stride;
        sumX += data.getFloat32(base + xOff, !isBigEndian);
        sumY += data.getFloat32(base + yOff, !isBigEndian);
        sumZ += data.getFloat32(base + zOff, !isBigEndian);
        count++;
      }
      return { x: sumX / count, y: sumY / count, z: sumZ / count };
    } else {
      const lines = new TextDecoder().decode(buffer).split('\n');
      const dataIdx = lines.findIndex(l => l.trim() === 'end_header') + 1;
      let sumX = 0, sumY = 0, sumZ = 0, count = 0;
      const step = Math.max(1, Math.floor(vertexCount / 5000));
      for (let i = 0; i < vertexCount; i += step) {
        const parts = lines[dataIdx + i]?.trim().split(/\s+/);
        if (!parts || parts.length < 3) continue;
        sumX += parseFloat(parts[0]);
        sumY += parseFloat(parts[1]);
        sumZ += parseFloat(parts[2]);
        count++;
      }
      return count > 0 ? { x: sumX / count, y: sumY / count, z: sumZ / count } : { x: 0, y: 0, z: 0 };
    }
  }

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const maxPlyBytes = 200 * 1024 * 1024;
    if (!/\.ply$/i.test(file.name)) {
      banner.innerText = 'Choose a .ply point-cloud file.';
      banner.style.display = 'block';
      fileInput.value = '';
      return;
    }
    if (file.size === 0 || file.size > maxPlyBytes) {
      banner.innerText = 'PLY files must be between 1 byte and 200 MB.';
      banner.style.display = 'block';
      fileInput.value = '';
      return;
    }
    const signature = new TextDecoder().decode((await file.slice(0, 64).arrayBuffer()));
    if (!signature.startsWith('ply')) {
      banner.innerText = 'This file does not contain a valid PLY header.';
      banner.style.display = 'block';
      fileInput.value = '';
      return;
    }
    if (!signature.includes('format binary_little_endian')) {
      banner.innerText = 'Choose a binary little-endian Gaussian-splat PLY file.';
      banner.style.display = 'block';
      fileInput.value = '';
      return;
    }
    const objectName = file.name.replace(/\.ply$/i, '');
    banner.innerText = '⏳ Reading file...';
    banner.style.display = 'block';
    insertBtn.style.opacity = '0.5';
    let centroid;
    try {
      centroid = await computePlyCentroid(file);
    } catch (error) {
      console.error('Could not read PLY file:', error);
      banner.innerText = 'Could not read this PLY file.';
      insertBtn.style.opacity = '1';
      fileInput.value = '';
      return;
    }
    const localUrl = URL.createObjectURL(file);
    pendingObject = {
      type: 'ply',
      url: localUrl,
      name: objectName,
      file,
      autoOffset: { x: -centroid.x, y: -centroid.y, z: -centroid.z },
    };
    awaitingPlacement = true;
    banner.innerText = '🖱️ Click on the world to place. Esc to cancel.';
    insertBtn.innerText = '(click on world to place...)';
    insertBtn.style.opacity = '1';
    fileInput.value = '';
  });

  // ── Adjustment panel ──────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Adjust 3D object');
  panel.style.cssText = `
    position: fixed; right: 20px; top: 80px; z-index: 999;
    background: rgba(10,10,10,0.85); color: white;
    border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
    padding: 18px 20px; width: 260px; display: none;
    font-family: sans-serif; font-size: 13px; backdrop-filter: blur(6px);
    max-height: 90vh; overflow-y: auto;
  `;

  function makeSlider({ label, min, max, step, value, onChange }) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom: 14px;';
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 4px; opacity: 0.75;';
    const lbl = document.createElement('span');
    lbl.innerText = label;
    const val = document.createElement('span');
    val.innerText = Number(value).toFixed(2);
    header.appendChild(lbl);
    header.appendChild(val);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.setAttribute('aria-label', label);
    slider.style.cssText = 'width: 100%; accent-color: #c8a96e; cursor: pointer;';
    slider.addEventListener('input', () => {
      val.innerText = Number(slider.value).toFixed(2);
      onChange(Number(slider.value));
    });
    wrap.appendChild(header);
    wrap.appendChild(slider);
    return { wrap, slider, val };
  }

  function makeTextInput({ placeholder, multiline = false }) {
    const el = multiline ? document.createElement('textarea') : document.createElement('input');
    if (!multiline) el.type = 'text';
    el.placeholder = placeholder;
    el.style.cssText = `
      width: 100%; background: rgba(255,255,255,0.08); color: white;
      border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
      padding: 7px 9px; font-size: 12px; font-family: sans-serif;
      resize: ${multiline ? 'vertical' : 'none'};
      ${multiline ? 'min-height: 70px;' : ''}
      box-sizing: border-box; margin-bottom: 12px;
      outline: none;
    `;
    // Stop keyboard events from triggering movement controls
    el.addEventListener('keydown', (e) => e.stopPropagation());
    el.addEventListener('keyup', (e) => e.stopPropagation());
    return el;
  }

  const sliders = {};
  let activeMesh = null;
  let activeGroup = null;
  let labelTitleInput = null;
  let labelDescInput = null;

  function buildPanel(pos) {
    panel.innerHTML = '';

    const title = document.createElement('div');
    title.innerText = '⚙️ Adjust Object';
    title.style.cssText = 'font-weight: 600; margin-bottom: 16px; font-size: 14px; letter-spacing: 0.03em;';
    panel.appendChild(title);

    function sectionLabel(text) {
      const lbl = document.createElement('div');
      lbl.innerText = text;
      lbl.style.cssText = 'font-size: 11px; opacity: 0.45; letter-spacing: 0.08em; text-transform: uppercase; margin: 10px 0 6px;';
      panel.appendChild(lbl);
    }

    sectionLabel('Position');
    const defs = [
      { key: 'x', label: 'X', min: -30, max: 30, step: 0.05, value: pos.x },
      { key: 'y', label: 'Y', min: -10, max: 10, step: 0.05, value: pos.y },
      { key: 'z', label: 'Z', min: -30, max: 30, step: 0.05, value: pos.z },
    ];
    defs.forEach(({ key, label, min, max, step, value }) => {
      const { wrap } = makeSlider({ label, min, max, step, value, onChange: (v) => { sliders[key] = v; applyToMesh(); } });
      sliders[key] = value;
      panel.appendChild(wrap);
    });

    sectionLabel('Scale & Rotation');
    const transformDefs = [
      { key: 'scale', label: 'Scale',      min: 0.01,     max: 5,       step: 0.01, value: 1 },
      { key: 'rotY',  label: 'Rotation Y', min: -Math.PI, max: Math.PI, step: 0.01, value: 0 },
      { key: 'rotX',  label: 'Rotation X', min: -Math.PI, max: Math.PI, step: 0.01, value: 0 },
    ];
    transformDefs.forEach(({ key, label, min, max, step, value }) => {
      const { wrap } = makeSlider({ label, min, max, step, value, onChange: (v) => { sliders[key] = v; applyToMesh(); } });
      sliders[key] = value;
      panel.appendChild(wrap);
    });

    sectionLabel('Label (optional)');
    labelTitleInput = makeTextInput({ placeholder: 'Title e.g. Traditional Bangles' });
    panel.appendChild(labelTitleInput);
    labelDescInput = makeTextInput({ placeholder: 'Description (optional)', multiline: true });
    panel.appendChild(labelDescInput);

    const hr = document.createElement('div');
    hr.style.cssText = 'border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0;';
    panel.appendChild(hr);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 8px;';

    const confirmBtn = document.createElement('button');
    confirmBtn.innerText = '✓ Save';
    confirmBtn.style.cssText = `
      flex: 1; padding: 9px; border-radius: 8px; border: none; cursor: pointer;
      background: #c8a96e; color: #111; font-weight: 600; font-size: 13px;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    cancelBtn.style.cssText = `
      flex: 1; padding: 9px; border-radius: 8px; cursor: pointer;
      background: transparent; color: white; font-size: 13px;
      border: 1px solid rgba(255,255,255,0.25);
    `;

    confirmBtn.addEventListener('click', async () => {
      if (!activeGroup || !pendingObject) return;
      confirmBtn.innerText = 'Uploading…';
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;

      let permanentUrl = pendingObject.url;
      if (pendingObject.file) {
        const fileName = `${Date.now()}-${pendingObject.file.name}`;
        const uploadRes = await fetch(
          `${SUPABASE_URL}/storage/v1/object/tour-objects/${fileName}`,
          {
            method: 'POST',
            headers: {
              ...(await supabaseHeaders(true)),
              'Content-Type': 'application/octet-stream',
              'x-upsert': 'true',
            },
            body: pendingObject.file,
          }
        );
        if (!uploadRes.ok) {
          console.error('Upload failed:', await uploadRes.text());
          confirmBtn.innerText = '❌ Upload failed';
          confirmBtn.disabled = false;
          cancelBtn.disabled = false;
          return;
        }
        permanentUrl = `${SUPABASE_URL}/storage/v1/object/public/tour-objects/${fileName}`;
      }

      confirmBtn.innerText = 'Saving…';
      await saveObjectToSupabase({
        objectUrl:        permanentUrl,
        objectName:       pendingObject.name,
        type:             pendingObject.type,
        x:                sliders.x,
        y:                sliders.y,
        z:                sliders.z,
        scale:            sliders.scale,
        rotationX:        sliders.rotX,
        rotationY:        sliders.rotY,
        rotationZ:        0,
        offsetX:          pendingObject.autoOffset?.x ?? 0,
        offsetY:          pendingObject.autoOffset?.y ?? 0,
        offsetZ:          pendingObject.autoOffset?.z ?? 0,
        labelTitle:       labelTitleInput?.value.trim().slice(0, 120) ?? '',
        labelDescription: labelDescInput?.value.trim().slice(0, 1_000) ?? '',
      });

      if (pendingObject.file) URL.revokeObjectURL(pendingObject.url);
      resetAdminState();
    });

    cancelBtn.addEventListener('click', () => {
      if (activeGroup) scene.remove(activeGroup);
      resetAdminState();
    });

    btnRow.appendChild(confirmBtn);
    btnRow.appendChild(cancelBtn);
    panel.appendChild(btnRow);
  }

  function applyToMesh() {
    if (!activeGroup || !activeMesh) return;
    activeGroup.position.set(sliders.x, sliders.y, sliders.z);
    activeGroup.scale.set(sliders.scale, sliders.scale, sliders.scale);
    activeGroup.rotation.set(sliders.rotX, sliders.rotY, 0, 'XYZ');
    activeGroup.matrixWorldNeedsUpdate = true;
    activeGroup.updateMatrixWorld(true);
  }

  function resetAdminState() {
    activeMesh = null;
    activeGroup = null;
    pendingObject = null;
    awaitingPlacement = false;
    labelTitleInput = null;
    labelDescInput = null;
    panel.style.display = 'none';
    banner.style.display = 'none';
    insertBtn.innerText = '+ Insert Object';
    insertBtn.style.opacity = '1';
  }

  document.body.appendChild(panel);
  panel.addEventListener('click',      (e) => e.stopPropagation());
  panel.addEventListener('mousedown',  (e) => e.stopPropagation());
  panel.addEventListener('pointerdown',(e) => e.stopPropagation());

  scene.onBeforeRender = () => { if (activeGroup) applyToMesh(); };

  window.addEventListener('click', (event) => {
    if (!awaitingPlacement || !pendingObject) return;
    if (panel.contains(event.target)) return;

    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const intersects = object ? raycaster.intersectObject(object, true) : [];

    if (intersects.length > 0) {
      const point = intersects[0].point;
      activeMesh = new SplatMesh({ url: pendingObject.url });
      const ao = pendingObject.autoOffset ?? { x: 0, y: 0, z: 0 };
      activeMesh.position.set(ao.x, ao.y, ao.z);
      activeGroup = new THREE.Group();
      activeGroup.position.set(point.x, point.y, point.z);
      activeGroup.add(activeMesh);
      scene.add(activeGroup);

      awaitingPlacement = false;
      banner.style.display = 'none';
      insertBtn.innerText = '+ Insert Object';
      insertBtn.style.opacity = '1';

      buildPanel(point);
      panel.style.display = 'block';
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (awaitingPlacement) {
        awaitingPlacement = false;
        pendingObject = null;
        banner.style.display = 'none';
        insertBtn.innerText = '+ Insert Object';
        insertBtn.style.opacity = '1';
      } else if (activeGroup) {
        scene.remove(activeGroup);
        resetAdminState();
      }
    }
  });
}
// MARIAS CODE ENDS

animate();
