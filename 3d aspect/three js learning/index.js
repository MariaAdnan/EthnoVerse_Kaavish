// to understand: watch https://youtu.be/XPhAR1YdD6o?si=yyJrJR26MvFrpyLU till 7 minutes
// then watch: https://youtu.be/lpAwHNgmvfc?si=9M14hB74G44DG9xV (for square parameters)
// then back to the first video

import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js"; // for mouse controls 

// start: setting up the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true }); // standard practice
// deciding width and height
const width = window.innerWidth;
const height = window.innerHeight;
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement); // this is the canvas element, three js will handle it

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10); // field of view = 75 (how wide u can see, like 90 would be a lot broader), aspect ratio = w/h (it's always this), near = 0.1 (anything closer than 0.1 units will be invisible) and far = 10 (anything further than 10 units will be invisible) 
camera.position.z = 2; // move the camera back so we can view the scene (1 is closer, 10 is further)

const scene = new THREE.Scene();
// end: setting up the renderer (not much changes here, u dont need to understand pura)

// start: adding orbit controls
const controls = new OrbitControls(camera, renderer.domElement); // camera to be controlled, dom element to listen for events
// end: adding orbit controls

// start: creating a cube
const geometry = new THREE.BoxGeometry(1, 1, 1); // width, height, depth (make sure this is according to camera near and far values as well as z value)
const material = new THREE.MeshStandardMaterial({ color: 0xffffff}); // white color (this decides the material of the cube) 
// MeshStandardMaterial is affected by lights, MeshBasicMaterial is not affected by lights
const mesh = new THREE.Mesh(geometry, material); // combining geometry and material to create a mesh (the actual cube)
scene.add(mesh); // adding the cube to the scene
// end: creating a cube

// start: adding light
const hemisphereLight = new THREE.HemisphereLight(0xf67280, 0x602230, 1); // sky color, ground color, intensity
scene.add(hemisphereLight); // adding hemisphere light to the scene (this, instead of directional light, gives a better effect for this cube)
// end: adding light

function animate(t=0) {
    requestAnimationFrame(animate); 
    mesh.scale.setScalar(Math.cos(t * 0.001) + 1); // animate the scale of the cube over time
    
    mesh.rotation.x = t * 0.001; // rotate around X axis
    mesh.rotation.y = t * 0.001; // rotate around Y axis
    renderer.render(scene, camera); // render the scene from the perspective of the camera
}

animate(); // start the animation loop, this will update in real time

renderer.render(scene, camera); // render the scene from the perspective of the camera