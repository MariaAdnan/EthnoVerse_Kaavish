import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "jsm/renderers/CSS2DRenderer.js"; 

// --- SCENE SETUP ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
const width = window.innerWidth;
const height = window.innerHeight;
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50); 
camera.position.set(5, 1, 5); 

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); 

// Orbit Controls - DISABLED for manual control
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// CSS2D Renderer for Labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(width, height);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

// Lighting
const hemisphereLight = new THREE.HemisphereLight(0xf67280, 0x602230, 1);
scene.add(hemisphereLight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Ground Plane
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

// --- KEYBOARD CONTROLS ---
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

// --- OBJECTS & LABELS ---
const labeledObjects = [];

function createLabeledCube(name, x, y, z, size = 1, color = 0xcccccc) {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y + size / 2, z); 
    scene.add(mesh);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.textContent = name;
    labelDiv.style.pointerEvents = 'none';
    
    const label = new CSS2DObject(labelDiv);
    label.position.set(size / 2, size / 2, 0); 
    
    // Store the object with visibility control
    labeledObjects.push({
        mesh: mesh,
        label: label,
        labelDiv: labelDiv,
        visible: false
    });

    return mesh;
}

const objects = [
    // === VILLAGE STRUCTURES (Back of the scene) ===
    { name: "The Village Hut", x: 0, y: 0, z: 8, color: 0xaa8866, size: 2.2 },
    
    // === LIVING AREA (Middle-back) ===
    { name: "Charpai (Woven Bed)", x: -4, y: 0, z: 5, color: 0x996633, size: 1.8 },
    { name: "Dari (Handwoven Rug)", x: -1.5, y: 0, z: 5, color: 0x777777, size: 0.2 },
    
    // === TATTOO PROCESSING AREA (Middle) ===
    { name: "Tawa (for Soot/Ink)", x: 3, y: 0, z: 3, color: 0x888888, size: 0.9 },
    { name: "Ink Paste Container (Soot/Water/Ghee)", x: 5, y: 0, z: 3, color: 0x333333, size: 0.7 },
    
    // === TATTOO TOOLS (Middle-front) ===
    { name: "Matchstick (for Drawing)", x: -3, y: 0, z: 1, color: 0xcc9900, size: 0.15 },
    { name: "Needle (with Thread)", x: -1, y: 0, z: 1, color: 0xaaaaaa, size: 0.12 },
    
    // === SYMBOLS & MEANINGS (Front-center) ===
    { name: "Tajwa (The Tattoo)", x: 0, y: 0, z: -1, color: 0x66ccff, size: 1.3 },
    { name: "Three-Dotted Triangle (Nazar Protection)", x: -2.5, y: 0, z: -2, color: 0xff4444, size: 0.6 },
    { name: "Cow (*Gayi Mata*) Symbol", x: 2.5, y: 0, z: -2, color: 0x66ff66, size: 1.1 },
    
    // === LIFE STAGES (Front-right) ===
    { name: "The Bridal Period (Age 13-15)", x: 6, y: 0, z: 0, color: 0xffcc00, size: 1.6 },
];

objects.forEach(obj => {
    createLabeledCube(obj.name, obj.x, obj.y, obj.z, obj.size, obj.color);
});

// --- ANIMATION LOOP ---
const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();

function checkLabelDistances() {
    const showDistance = 3; // Distance within which labels will show
    
    labeledObjects.forEach(obj => {
        const distance = camera.position.distanceTo(obj.mesh.position);
        
        if (distance <= showDistance) {
            // Show label by adding it to the mesh
            if (!obj.visible) {
                obj.mesh.add(obj.label);
                obj.visible = true;
            }
        } else {
            // Hide label by removing it from the mesh
            if (obj.visible) {
                obj.mesh.remove(obj.label);
                obj.visible = false;
            }
        }
    });
}

function animate() {
    requestAnimationFrame(animate);

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
    
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(new THREE.Euler(cameraPitch, cameraYaw, 0, 'YXZ'));
    camera.quaternion.copy(quaternion);

    // Handle movement
    if (moveW || moveS || moveA || moveD) {
        camera.getWorldDirection(forwardVector);
        forwardVector.y = 0;
        forwardVector.normalize();
        
        rightVector.crossVectors(camera.up, forwardVector).normalize();
        
        if (moveW) camera.position.addScaledVector(forwardVector, moveSpeed);
        if (moveS) camera.position.addScaledVector(forwardVector, -moveSpeed);
        if (moveA) camera.position.addScaledVector(rightVector, moveSpeed);
        if (moveD) camera.position.addScaledVector(rightVector, -moveSpeed);
        
        camera.position.y = 1;
    }

    // Check and update label visibility
    checkLabelDistances();

    // Update controls
    camera.getWorldDirection(forwardVector);
    controls.target.copy(camera.position).add(forwardVector);
    controls.update();

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera); 
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(newWidth, newHeight);
    labelRenderer.setSize(newWidth, newHeight);
});