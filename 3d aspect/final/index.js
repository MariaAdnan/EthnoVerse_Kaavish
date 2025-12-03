// to maria and afifah: watch this: https://youtu.be/lGokKxJ8D2c?si=Ye0FsN33LdLfcbYM

//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8d4b0); // Sandy/desert sky color
scene.fog = new THREE.Fog(0xe8d4b0, 5, 15); // Fog color, start distance, end distance
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//Keep the 3D object on a global variable so we can access it later
let object;

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

//Load the file
loader.load(
  `./desert_landscape/scene.gltf`,
  function (gltf) {
    //If the file is loaded, add it to the scene
    
    object = gltf.scene;
    object.position.set(0, -2, 0); // Center it at (0, -2, 0)
    object.scale.set(15, 15, 15); // Makes it bigger
    scene.add(object);
  },
  function (xhr) {
    //While it is loading, log the progress
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    //If there is an error, log it
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true }); //Alpha: true allows for the transparent background
renderer.setSize(window.innerWidth, window.innerHeight);

//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

camera.position.set(0, 0.01, 0); // FPS starting position

//Add lights to the scene, so we can actually see the 3D model
const topLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
topLight.position.set(500, 500, 500) //top-left-ish
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const moveSpeed = 0.1;
const lookSpeed = 0.03;

let moveW = false;
let moveS = false;
let moveA = false;
let moveD = false;
let lookUp = false;
let lookDown = false;
let lookLeft = false;
let lookRight = false;

// Camera rotation state
let cameraYaw = 0;
let cameraPitch = 0;

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

//Render the scene
function animate() {
  requestAnimationFrame(animate);
  
  // ADD THIS CAMERA MOVEMENT LOGIC:
  // Handle looking
  if (lookLeft || lookRight) {
    if (lookLeft) cameraYaw += lookSpeed;
    if (lookRight) cameraYaw -= lookSpeed;
  }
  
  if (lookUp || lookDown) {
    if (lookUp) cameraPitch += lookSpeed;
    if (lookDown) cameraPitch -= lookSpeed;
    cameraPitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraPitch));
  }
  
  // Apply rotation to camera
  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(new THREE.Euler(cameraPitch, cameraYaw, 0, 'YXZ'));
  camera.quaternion.copy(quaternion);
  
  // Handle movement
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
    
    camera.position.y = 0.01; // Keep camera at consistent height

    const boundary = 15; // Adjust this number to change the play area size
    camera.position.x = Math.max(-boundary, Math.min(boundary, camera.position.x));
    camera.position.z = Math.max(-boundary, Math.min(boundary, camera.position.z));
  }

  renderer.render(scene, camera);
}

//Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//Start the 3D rendering
animate();