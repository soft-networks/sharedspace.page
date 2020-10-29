import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { getGrass } from "./lib/grassLib.js";
import { displayWarning } from "./lib/utils.js";

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
    renderer.physicallyCorrectLights = true;
    renderer.setSize(windowSize[0], windowSize[1]);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;

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
        Math.max(roomSize.x, roomSize.y) * (windowSize[0] >= 800 ? 1.5 : 2);

    var roomGeo = new THREE.BoxGeometry(roomSize.x, roomSize.y, roomSize.z);
    var roomMat = new THREE.MeshStandardMaterial({
        roughness: 10,
        metalness: 0.2,
        color: "#fff",
    });
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
    var cameraPos = getRoomRelPos(0, 0, -0.9);
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

    var cameraLookAt = getRoomRelPos(0, 0, 0);
    camera.lookAt(cameraLookAt);

    if (debug) {
        controls = new OrbitControls(camera, renderer.domElement);
    }
}

function updateLights() {}

function setupLights() {}

// 🌳🌳🌳 🌳🌳🌳 🌳🌳🌳🌳
// Models, which here is literally just cursors
//  🌳🌳🌳 🌳🌳🌳 🌳🌳🌳

function setupModels() {
    setupSphere();
    myCursor = getCursor();
    scene.add(myCursor);
    moveMyCursor(0.5, 0.5);
    updateLightForCursor("me", 0, 0);
    if (debug) setupTestEnv();
}

function updateModels() {
    updateSphere();
    if (debug) updateTestEnv();
}

var myCursor;
var NPCCursors = {};

function getCursor(opt = "default") {
    let cursorGroup = new THREE.Group();

    let cursorlight = new THREE.PointLight(0xffffff, 7, 100, 2);
    cursorlight.castShadow = true;
    cursorGroup.add(cursorlight);

    let color = 0xffffff;
    if (opt === "npc") {
        color = 0xdadada;
    }
    var sphereSize = getRoomRelPos(0.005, 0.005, 0.005);
    let cursorSphereGeo = new THREE.SphereGeometry(sphereSize.z, 16, 16);
    let cursorSphereMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: 0.2,
        opacity: 1.0,
    });
    let cursorSphere = new THREE.Mesh(cursorSphereGeo, cursorSphereMat);
    cursorGroup.add(cursorSphere);

    return cursorGroup;
}

export function updateLightForCursor(id, scrollYPercent, scrollXPercent) {
    let cursor;
    if (id === "me") {
        cursor = myCursor;
    } else if (NPCCursors[id]) {
        cursor = NPCCursors[id];
    } else {
        displayWarning(id + " wasn't found, cant update its light");
        console.log(NPCCursors);
        return;
    }

    console.log("Setting new light");
    //These values mean that we start with 0,0 as a bright blue :)
    let saturation = 1 - scrollXPercent;
    let hue = 0.7 - scrollYPercent * 0.7;
    let lightness = 1 - saturation / 2;

    cursor.traverse((cursorChildren) => {
        if (cursorChildren.isLight) {
            cursorChildren.color.setHSL(hue, saturation, lightness);
        }
        if (cursorChildren.isMesh) {
            cursorChildren.material.color.setHSL(hue, saturation, lightness);
        }
    });
    return { hue: scrollYPercent, saturation: scrollXPercent };
}

//I update my cursor and also tell firebase that I'm  updating

export function moveMyCursor(mouseXPercent, mouseZPercent) {
    if (myCursor) {
        var cursorPosAsPercent = new THREE.Vector3(-mouseXPercent * 0.5,
            mouseZPercent * 0.5,
            mouseZPercent * 0.5
        );
        var cursorPos = getRoomRelPos(
            cursorPosAsPercent.x,
            cursorPosAsPercent.y,
            cursorPosAsPercent.z
        );
        myCursor.position.set(cursorPos.x, cursorPos.y, cursorPos.z);
        return cursorPosAsPercent;
    }
}

//Firebase says to move a specific cursor
export function updateNPCCursor(id, xP, yP, zP) {
    if (NPCCursors[id]) {
        let cursor = NPCCursors[id];
        let cursorPos = getRoomRelPos(xP, yP, zP);
        cursor.position.set(cursorPos.x, cursorPos.y, cursorPos.z);
    }
}

//Firebase says to add a specific cursor
//TODO; Its a hack that i've randomly made this -0.25 fwiw :)
export function addNPCCursor(id) {
    var newGrassCursor = getCursor("npc");
    if (!NPCCursors[id]) {
        NPCCursors[id] = newGrassCursor;
        updateNPCCursor(id, 0, 0, 0);
        console.log(NPCCursors);
        scene.add(newGrassCursor);
    }
}

//Firebase says to remove a specific cursor
export function removeNPCCursor(id) {
    if (NPCCursors[id]) {
        var cursorToRemove = NPCCursors[id];
        scene.remove(cursorToRemove);
        delete NPCCursors[id];
    }
}

//🧪🧪🧪🧪🧪 Test environment
var sphere, box;

function updateSphere() {
    if (sphere) {
        scene.remove(sphere);
    }
    setupSphere();
}

function setupSphere() {
    var spherePos = getRoomRelPos(0, 0, 0);
    const sphereRadius = getRoomRelPos(0, 0.02, 0).y;
    const sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
        roughness: 0,
        metalness: 1,
        color: "white",
        envMap: camera.renderTarget,
    });
    sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(spherePos.x, -spherePos.y, spherePos.z);
    scene.add(sphere);
}

function updateTestEnv() {
    if (sphere || box) {
        scene.remove(sphere);
        scene.remove(box);
    }
    setupTestEnv();
}

function setupTestEnv() {
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
    renderer.render(scene, camera);
    if (controls) controls.update();
    requestAnimationFrame(animate);
}