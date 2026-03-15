// to maria and afifah: watch this: https://youtu.be/lGokKxJ8D2c?si=Ye0FsN33LdLfcbYM

//Import the THREE.js library
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SplatMesh } from "@sparkjsdev/spark";

// raycaster for ground detection
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0); // Pointing straight down

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8d4b0); 
scene.fog = new THREE.Fog(0xe8d4b0, 30, 50);

//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

let object;
const loader = new GLTFLoader();

loader.load(
  `desert.glb`,
  function (gltf) {
    object = gltf.scene;
    object.position.set(70, -4.5, -70); 

    object.scale.set(0.07, 0.07, 0.07); 

    object.traverse((child) => {
      if (child.isMesh) {
        // Bleach filter to match your photo
        const siltColor = new THREE.Color(0xffffff); 
        child.material.color.lerp(siltColor, 0.7);
        child.material.roughness = 1.0;
        child.material.metalness = 0.0;
      }
    });

    scene.add(object);
  
    const matka = new SplatMesh({ url: "matka.ply" });
    matka.position.set(0, 0, -3);
    scene.add(matka);
  }
);

// Load the Hut
// Load the Hut and create a village
loader.load(
  `hut.glb`, 
  function (gltf) {
    const masterHut = gltf.scene;

    const hutPositions = [
      { x: 5, z: -5, y: 0.2, rot: 0 },
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

      // --- TUNING PARAMETERS ---
      const forwardOffset = 0; // Move back/forward
      const sideOffset = 0.5;    // Move right/left (Positive = Right, Negative = Left)
      
      const hutCenter = new THREE.Vector3(
        pos.x + (Math.sin(pos.rot) * forwardOffset) + (Math.cos(pos.rot) * sideOffset),
        pos.y,
        pos.z + (Math.cos(pos.rot) * forwardOffset) - (Math.sin(pos.rot) * sideOffset)
      );

      const keepRadius = 3;

      hut.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          
          // Color settings
          child.material.color.multiplyScalar(0.3);
          const colorBooster = new THREE.Color(0x8b5a2b); 
          child.material.color.lerp(colorBooster, 0.4);
          child.material.roughness = 1.0;
          child.material.metalness = 0.0;

          // INDIVIDUAL CLIPPING
          // We must define unique uniforms for each material clone
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
          
          // Force Three.js to treat these as unique programs
          child.material.needsUpdate = true;
        }
      });
      
      scene.add(hut);
    });
  }
);

// --- 3. FIX THE RENDERER COLOR SPACE ---
const renderer = new THREE.WebGLRenderer({ alpha: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);

// IMPORTANT: This line stops the "bright orange" neon effect
renderer.outputEncoding = THREE.sRGBEncoding; 
renderer.localClippingEnabled = true; 

document.getElementById("container3D").appendChild(renderer.domElement);

camera.position.set(0, -0.5, 0); 

// --- 4. OVERCAST LIGHTING (Floods shadows with white) ---
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(0, 100, 0); // Directly overhead for no harsh shadows
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// --- 5. MOVEMENT LOGIC (Rest of your code) ---
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

    // --- TERRAIN HEIGHT DETECTION ---
    if (object) { // 'object' is your desert landscape
        // Set the raycaster to start above the camera and point down
        raycaster.set(new THREE.Vector3(camera.position.x, 10, camera.position.z), downVector);
        
        // Check for intersections with the desert
        const intersects = raycaster.intersectObject(object, true);
        
        if (intersects.length > 0) {
            const terrainHeight = intersects[0].point.y;
            // Set camera height to terrain height + a "head height" (e.g., 1.5 units)
            // Using a lerp here makes the camera transition smoothly up/down hills
            const headHeight = 1.5;
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, terrainHeight + headHeight, 0.1);
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

// --- 6. DAY/NIGHT SETTINGS ---
const daySettings = {
  sky: 0xe8d4b0,      
  ambient: 0.5,      
  directional: 1.0,  
  fogNear: 30,
  fogFar: 50
};

const nightSettings = {
  sky: 0x000000,      
  ambient: 0.15,     
  directional: 0.3,  
  fogNear: 5,
  fogFar: 35         
};

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

// 3. Tint the World
  const nightTint = new THREE.Color(0x2a2d4a);
  const dayTint = new THREE.Color(0xffffff);
  const targetTint = isNight ? nightTint : dayTint;

  // TINT THE DESERT (WEAK TINT)
  if (object) {
    object.traverse((child) => {
      if (child.isMesh) {
        // Change 0.4 to 0.15: This keeps the ground much closer to its original color
        child.material.color.lerp(targetTint, 0.15); 
      }
    });
  }

  // TINT THE HUTS (STRONG TINT)
  scene.traverse((node) => {
    if (node.name === "hut" || (node.parent && node.parent.name === "hut")) {
       node.traverse((child) => {
         if (child.isMesh) {
           // Change 0.2 to 0.5: This makes the huts much darker/bluer at night
           child.material.color.lerp(targetTint, 0.3); 
         }
       });
    }
  });
  })
}

// Start the loop
animate();