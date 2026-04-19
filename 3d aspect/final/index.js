// to maria and afifah: watch this: https://youtu.be/lGokKxJ8D2c?si=Ye0FsN33LdLfcbYM
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SplatMesh } from "@sparkjsdev/spark";

const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8d4b0); 
scene.fog = new THREE.Fog(0xe8d4b0, 30, 50);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let object;
const loader = new GLTFLoader();

loader.load(`desert-v1.glb`, function (gltf) {
  object = gltf.scene;
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

  const matkaRotation = [Math.PI, 0, 0];
  const matka = new SplatMesh({ url: "matka.ply" });
  matka.position.set(1.5, -3.7, -2.8);
  matka.scale.set(2, 2, 2);
  matka.rotation.set(...matkaRotation, 'XYZ');
  scene.add(matka);

  const matka2 = new SplatMesh({ url: "matka.ply" });
  matka2.position.set(1, -3.3, -2.5);
  matka2.scale.set(1.5, 1.5, 1.5);
  matka2.rotation.set(...matkaRotation, 'XYZ');
  scene.add(matka2);

  const matka3 = new SplatMesh({ url: "matka.ply" });
  matka3.position.set(1.2, -3.3, -2.0);
  matka3.scale.set(1.5, 1.5, 1.5);
  matka3.rotation.set(...matkaRotation, 'XYZ');
  scene.add(matka3);
});

loader.load(`hut.glb`, function (gltf) {
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
  });

  // Outfit centered in hut 1
  const outfit = new SplatMesh({ url: "outfit-2.ply" });
  outfit.position.set(5.5, -0.4, -5);
  outfit.scale.set(0.3, 0.3, 0.3);
  outfit.rotation.set(0.354, -0.4, 0, 'ZYX');
  scene.add(outfit);

  // Bangles — both types placed together inside hut 4 (x:-5, z:8)
  const bangles2 = new SplatMesh({ url: "bangles2-2.ply" });
  bangles2.position.set(-5.0, -2, 8.2);
  bangles2.scale.set(0.4, 0.4, 0.4);
  bangles2.rotation.set(0, 0, Math.PI / 2, 'XYZ'); // lay flat
  scene.add(bangles2);

  const bangles1 = new SplatMesh({ url: "bangles1__1_-2.ply" });
  bangles1.position.set(-4.0, 3, 8.2);
  bangles1.scale.set(0.4, 0.4, 0.4);
  bangles1.rotation.set(0, 0.3, Math.PI / 2, 'XYZ'); // lay flat, slightly rotated
  scene.add(bangles1);

  // Charpai outside hut 2 — darkened and rotated left
  const charpaiLoader = new GLTFLoader();
  charpaiLoader.load('char_pai.glb', (gltf) => {
    const charpai = gltf.scene;
    charpai.position.set(0, -1.5, -8.5);
    charpai.rotation.y = Math.PI / 2;  // rotated left
    charpai.scale.set(1.5, 1.5, 1.5);
    charpai.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.color.multiplyScalar(0.45); // darken
        child.material.roughness = 1.0;
        child.material.metalness = 0.0;
      }
    });
    scene.add(charpai);
  });

  // Oak trees — 2 clusters in different areas
  const treeLoader = new GLTFLoader();
  const treePositions = [
    { x: -15, y: -2.0, z: 2,   scale: 0.04,  rot: 0 },
    { x: -13, y: -2.0, z: 4,   scale: 0.035, rot: 0.8 },
    { x: 16,  y: -2.0, z: -18, scale: 0.045, rot: 0 },
    { x: 18,  y: -2.0, z: -16, scale: 0.038, rot: 1.2 },
  ];
  treeLoader.load('oak_trees.glb', (gltf) => {
    treePositions.forEach((pos) => {
      const tree = gltf.scene.clone();
      tree.position.set(pos.x, pos.y, pos.z);
      tree.rotation.y = pos.rot;
      tree.scale.setScalar(pos.scale);
      tree.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          const sandyTint = new THREE.Color(0xe8d4b0);
          child.material.color.lerp(sandyTint, 0.45); // sandy desert tint
          child.material.roughness = 1.0;
          child.material.metalness = 0.0;
        }
      });
      scene.add(tree);
    });
  });

  // Bushes — scattered in several spots at varying sizes
  const bushLoader = new GLTFLoader();
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
  bushLoader.load('realistic_bush.glb', (gltf) => {
    bushPositions.forEach((pos) => {
      const bush = gltf.scene.clone();
      bush.position.set(pos.x, pos.y, pos.z);
      bush.rotation.y = pos.rot;
      bush.scale.setScalar(pos.scale);
      bush.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          const sandyTint = new THREE.Color(0xe8d4b0);
          child.material.color.lerp(sandyTint, 0.4); // sandy desert tint
          child.material.roughness = 1.0;
          child.material.metalness = 0.0;
        }
      });
      scene.add(bush);
    });
  });
});

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

function animate() {
  requestAnimationFrame(animate);
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
  renderer.render(scene, camera);
}
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
    const nightTint = new THREE.Color(0x2a2d4a);
    const dayTint = new THREE.Color(0xffffff);
    const targetTint = isNight ? nightTint : dayTint;
    if (object) {
      object.traverse((child) => {
        if (child.isMesh) child.material.color.lerp(targetTint, 0.15); 
      });
    }
    scene.traverse((node) => {
      if (node.name === "hut" || (node.parent && node.parent.name === "hut")) {
        node.traverse((child) => {
          if (child.isMesh) child.material.color.lerp(targetTint, 0.3); 
        });
      }
    });
  });
}

// MARIAS CODE STARTS
let lastClickPosition = { screen: null, world: null };
let placedObjectScene = null;
let awaitingPlacement = false;

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
fileInput.accept = '.glb,.ply';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

const banner = document.createElement('div');
banner.innerText = '🖱️ Click anywhere on the world to place your object. Press Escape to cancel.';
banner.style.cssText = `
  position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
  z-index: 999; padding: 12px 24px; background: rgba(0,0,0,0.7); color: white;
  border-radius: 10px; font-size: 14px; display: none;
`;
document.body.appendChild(banner);

insertBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const isPly = file.name.toLowerCase().endsWith('.ply');
  if (isPly) {
    placedObjectScene = { type: 'ply', url };
    awaitingPlacement = true;
    banner.style.display = 'block';
    insertBtn.innerText = '(click on world to place...)';
    insertBtn.style.opacity = '0.5';
  } else {
    const placementLoader = new GLTFLoader();
    placementLoader.load(url, (gltf) => {
      placedObjectScene = { type: 'glb', scene: gltf.scene };
      awaitingPlacement = true;
      banner.style.display = 'block';
      insertBtn.innerText = '(click on world to place...)';
      insertBtn.style.opacity = '0.5';
    });
  }
  fileInput.value = '';
});

window.addEventListener('click', (event) => {
  if (!awaitingPlacement || !placedObjectScene) return;
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const intersects = object ? raycaster.intersectObject(object, true) : [];
  if (intersects.length > 0) {
    const point = intersects[0].point;
    lastClickPosition = {
      screen: { x: event.clientX, y: event.clientY },
      world: { x: point.x.toFixed(2), y: point.y.toFixed(2), z: point.z.toFixed(2) }
    };
    console.log(`Placed at World: X: ${lastClickPosition.world.x}, Y: ${lastClickPosition.world.y}, Z: ${lastClickPosition.world.z}`);
    if (placedObjectScene.type === 'ply') {
      const splatClone = new SplatMesh({ url: placedObjectScene.url });
      splatClone.position.set(point.x, point.y, point.z);
      splatClone.scale.set(1, 1, 1);
      scene.add(splatClone);
    } else {
      const clone = placedObjectScene.scene.clone();
      clone.position.set(point.x, point.y, point.z);
      clone.scale.set(0.01, 0.01, 0.01);
      scene.add(clone);
    }
    awaitingPlacement = false;
    banner.style.display = 'none';
    insertBtn.innerText = '+ Insert Object';
    insertBtn.style.opacity = '1';
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && awaitingPlacement) {
    awaitingPlacement = false;
    placedObjectScene = null;
    banner.style.display = 'none';
    insertBtn.innerText = '+ Insert Object';
    insertBtn.style.opacity = '1';
    console.log('Placement cancelled.');
  }
});
// MARIAS CODE ENDS

animate();