import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { getGrass } from "./lib/grassLib.js";

var camera,
    scene,
    renderer,
    clock = new THREE.Clock();
var windowSize, domContainer;
var debug = false,
    controls;

//TODO: Is there way to like rewrite all distances to be 0.1 or 0.2 or whatever but as a function of the room?

export function setupScene() {
    //Setup DOM element
    domContainer = document.querySelector(".container");
    windowSize = [domContainer.clientWidth, domContainer.clientHeight];

    //Setup clock
    clock.start();

    //Setup renderer
    renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
    });
    renderer.physicallyCorrectLights = false;
    renderer.setSize(windowSize[0], windowSize[1]);
    if (debug) renderer.setClearColor("#cce4e6", 1);
    domContainer.appendChild(renderer.domElement);

    //Setup scene
    scene = new THREE.Scene();

    //Setup camera
    camera = new THREE.PerspectiveCamera(
        45,
        windowSize[0] / windowSize[1],
        0.1,
        1000
    );

    //Setup listeners
    // document.addEventListener("mousemove", updateOnMouseMove, false);
    window.addEventListener("resize", updateOnWindowResize, false);

    setupRoom();
    updateCameraPos();
    setupLights();
    setupModels();
    animate();
}

// 🏠🏠🏠🏠🏠 🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠
// ROOM RELATED FUNCTIONS.
// TODO: Make this its own class potentially
// 🏠🏠🏠🏠🏠 🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠

var room;
var roomColor = "#FFFFFF";
var roomSize = new THREE.Vector3(15, 15, 15);

//Creates a room of a constant width, as defined in roomSize above.
//Z factor of room changes based on how large the room is, to force a perspective
function setupRoom() {
    roomSize.y = roomSize.x * (windowSize[1] / windowSize[0]);
    roomSize.z =
        Math.max(roomSize.x, roomSize.y) * (windowSize[0] >= 800 ? 1 : 2);

    var roomGeo = new THREE.BoxGeometry(roomSize.x, roomSize.y, roomSize.z);
    var roomMat = new THREE.MeshLambertMaterial({ color: roomColor });
    roomMat.side = THREE.BackSide;
    room = new THREE.Mesh(roomGeo, roomMat);
    scene.add(room);
}

//Updates room by removing it and re-adding it
function updateRoom() {
    if (room) scene.remove(room);
    setupRoom();
}

//Takes percentage of roomSize, Returns world coordinate positions
// Every variable should range from -0.5, to 0.5
//TODO: There is some black magic happening with FOV here that makes z range from -1 to 1, so i have to noramzlie it
function getRoomRelPos(xPercent, yPercent, zPercent) {
    return new THREE.Vector3(
        xPercent * roomSize.x,
        yPercent * roomSize.y,
        zPercent * roomSize.z
    );
}

//📸 💡📸 📸 📸 📸 📸 📸 📸 📸 📸 📸
// Positions camera as needed
// 📸 📸 📸 📸 📸 📸 📸 📸 📸 📸 📸

function updateCameraPos() {
    var cameraPos = getRoomRelPos(0, -0.15, -0.6);
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

    var cameraLookAt = getRoomRelPos(0, -0.4, 0);
    camera.lookAt(cameraLookAt);

    if (debug) {
        controls = new OrbitControls(camera, renderer.domElement);
    }
}

var ambient;

function updateLights() {
    //Do nothing
}

function setupLights() {
    ambient = new THREE.AmbientLight(0xffffff, 1.5);
    ambient.color.setHSL(0.2, 0.5, 0.5);
    scene.add(ambient);
}

// 🌳🌳🌳 🌳🌳🌳 🌳🌳🌳🌳
// Models, which here is just grass and some test stuff
//  🌳🌳🌳 🌳🌳🌳 🌳🌳🌳

function setupModels() {
    setupGrass();
    if (debug) setupTestEnv();
}

function updateModels() {
    updateGrass();
    if (debug) updateTestEnv();
}

//Grass related functions '
var grasses, grassMaterial;
var grassAnimSpeed = 0.7;
var minGrassSpeed = 0.2,
    maxGrassSpeed = 2.3;

function setupGrass() {
    grasses = getGrass(roomSize.x, roomSize.z);
    grasses.forEach((mesh, index) => {
        var grassPosition = getRoomRelPos(0, -0.4, 0);
        mesh.position.set(grassPosition.x, grassPosition.y, grassPosition.z);
        grasses.push = mesh;
        scene.add(mesh);
        if (index === 1) grassMaterial = mesh.material;
    });

    updateMyGrassCursor(0, 0);
}

function animGrass(totalTime) {
    if (grassMaterial)
        grassMaterial.uniforms.time.value = totalTime * grassAnimSpeed;
}

function updateGrass() {
    if (grasses) grasses.forEach((grass) => scene.remove(grass));
    setupGrass();
}

//🤗🤗🤗🤗🤗🤗 Functions related to objects that will be shared in room

var grassLightColorMin = 0.0,
    grassLightColorMax = 1.0;

export function updateSharedGrassSpeed(grassSpeedPercent) {
    grassAnimSpeed = Math.max(minGrassSpeed, grassSpeedPercent * maxGrassSpeed);
    //
    ambient.color.setHSL(
        0.2,
        grassSpeedPercent - 0.2,
        1.0 - grassSpeedPercent / 2
    );
}

//I update my cursor and also tell firebase that I'm  updating

export function updateMyGrassCursor(xPercent, zPercent) {
    var mousePos = getRoomRelPos(-xPercent * 0.5, -0.46, zPercent * 0.5);
    grassMaterial.uniforms.windPos.value = mousePos;
}

//🧪🧪🧪🧪🧪 Test environment
var sphere, box;

function updateTestEnv() {
    if (sphere || box) {
        scene.remove(sphere);
        scene.remove(box);
    }
    setupTestEnv();
}

function setupTestEnv() {
    var spherePos = getRoomRelPos(0, 0.1, 0);
    const sphereRadius = spherePos.y;
    const sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, 16, 16);
    const sphereMat = new THREE.MeshPhongMaterial({ color: "#fff" });
    sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(spherePos.x, -spherePos.y, spherePos.z);
    scene.add(sphere);

    var boxPos = getRoomRelPos(0.1, 0.1, 0.1);
    var boxSize = boxPos.x;
    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxMaterial = new THREE.MeshNormalMaterial();
    box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(boxPos.x, boxPos.y, boxPos.z);
    scene.add(box);

    var gridHelper = new THREE.GridHelper(100, 10);
    scene.add(gridHelper);
}

//✨ ✨ ✨ ✨ ✨ Animate

var totalTime = 0,
    totalScroll = 0;

function updateOnWindowResize() {
    windowSize = [domContainer.clientWidth, domContainer.clientHeight];
    camera.aspect = windowSize[0] / windowSize[1];
    camera.updateProjectionMatrix();
    renderer.setSize(windowSize[0], windowSize[1]);

    updateRoom();
    updateCameraPos();
    updateLights();
    updateModels();
}

function animate() {
    var timeDelta = clock.getDelta();
    totalTime += timeDelta;
    animGrass(totalTime);
    renderer.render(scene, camera);
    if (controls) controls.update();
    requestAnimationFrame(animate);
}