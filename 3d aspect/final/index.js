// to maria and afifah: watch this: https://youtu.be/lGokKxJ8D2c?si=Ye0FsN33LdLfcbYM

//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// --- 1. SET BRIGHT, DESATURATED SKY ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); 
scene.fog = new THREE.Fog(0x000000, 30, 50); 

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
  }
);

// Load the Hut
// Load the Hut and create a village
loader.load(
  `hut.glb`, 
  function (gltf) {
    const masterHut = gltf.scene;

    // Define positions for your village huts
    const hutPositions = [
      { x: 5, z: -5, y: 0.2, rot: 0 },
      { x: -8, z: -10, y: 0.2, rot: Math.PI / 4 },      // 45 degrees
      { x: 12, z: -15, y: 0.8, rot: Math.PI },          // 180 degrees (Facing opposite)
      { x: -5, z: 8, y: -0.5, rot: -Math.PI / 2 },     // -90 degrees
      { x: 10, z: 5, y: -0.5, rot: 2.5 }                // Custom angle
    ];

    hutPositions.forEach((pos) => {
      // Clone the master model
      const hut = masterHut.clone();
      
      // Set the specific position for this clone
      hut.position.set(pos.x, pos.y, pos.z); 
      hut.rotation.y = pos.rot;
      hut.scale.set(1, 1, 1); 

      // This is the radius of the circular base
      const keepRadius = 3; 
      // Important: Each hut needs its own clipping center!
      const hutCenter = new THREE.Vector3(pos.x + 0.5, 0.2, pos.z);

      hut.traverse((child) => {
        if (child.isMesh) {
          // --- COLOR & SATURATION FIXES ---
          // Use a clone of the material so they don't all share the same state
          child.material = child.material.clone();
          
          child.material.color.multiplyScalar(0.3); // Keep it dark
          const colorBooster = new THREE.Color(0x8b5a2b); 
          child.material.color.lerp(colorBooster, 0.4); // Add saturation
          
          child.material.roughness = 1.0;
          child.material.metalness = 0.0;

          // --- INDIVIDUAL CLIPPING LOGIC ---
          child.material.onBeforeCompile = (shader) => {
            shader.uniforms.uCenter = { value: hutCenter };
            shader.uniforms.uMaxDist = { value: keepRadius };

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
    
    camera.position.y = -0.5;
    const boundary = 15;
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

animate();