import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
    setupSkyColors,
    getSkyGradientAtTime,
    getSkyAmbientColorAtTime,
    getSkyAmbientIntensityAtTime,
} from "./lib/skyColors";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

var camera,
    scene,
    renderer,
    clock = new THREE.Clock();
var windowSize, domContainer;
var debug = false,
    controls;

//TODO LIST:
//ALL THE DOM REFERENCES need to be OUTTA here. This should only be three js.
// - Fix the "resize" to be a LERP (both for Z and for cameraPos)

export function setup() {
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
    renderer.shadowMap.enabled = true;
    domContainer.prepend(renderer.domElement);

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

    setupSkyColors(debug);
    setupRoom();
    updateCameraPos();
    setupModels();
    setupLights();
    setInitialSunPos();
    animate();
}

//📸 💡📸 📸 📸 📸 📸 📸 📸 📸 📸 📸
// Positions camera as needed
// 📸 📸 📸 📸 📸 📸 📸 📸 📸 📸 📸

function updateCameraPos() {
    var cameraPos = getRoomRelPos(0, 0.1, -2);
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

    var cameraLookAt = getRoomRelPos(0, -0.1, 0.5);
    camera.lookAt(cameraLookAt);

    if (debug) {
        controls = new OrbitControls(camera, renderer.domElement);
    }
}

// 🏠🏠🏠🏠🏠 🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠
// ROOM RELATED FUNCTIONS.
// TODO: Make this its own class potentially
// 🏠🏠🏠🏠🏠 🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠

var room, floorPlane, backPlane;
var roomSize = new THREE.Vector3(15, 15, 15);
var roomColor = 0xffffff,
    roomEmissiveColor = 0x000000;

//Creates a room of a constant width, as defined in roomSize above.
//Z factor of room changes based on how large the room is, to force a perspective

function setupRoom() {
    roomSize.y = roomSize.x * (windowSize[1] / windowSize[0]);
    roomSize.z = roomSize.y;

    var roomGeo = new THREE.BoxGeometry(roomSize.x, roomSize.y, roomSize.z);
    var roomMat = new THREE.MeshBasicMaterial({
        color: 0x00000,
        wireframe: true,
    });
    room = new THREE.Mesh(roomGeo, roomMat);
    room.receiveShadow = true;
    //scene.add(room);

    // Floor plane
    var floorPlaneSize = getRoomRelPos(1, 0, 1);
    var floorPlanePos = getRoomRelPos(0, -0.5, 0);
    var floorPlaneGeo = new THREE.PlaneGeometry(
        floorPlaneSize.x,
        floorPlaneSize.z,
        20,
        20
    );
    var floorPlaneMat = new THREE.MeshLambertMaterial({
        color: roomColor,
        emissive: roomEmissiveColor,
    });
    floorPlaneMat.side = THREE.DoubleSide;
    floorPlane = new THREE.Mesh(floorPlaneGeo, floorPlaneMat);
    floorPlane.rotation.x = Math.PI / 2;
    floorPlane.position.set(floorPlanePos.x, floorPlanePos.y, floorPlanePos.z);
    floorPlane.receiveShadow = true;
    scene.add(floorPlane);

    //Backplane
    var backPlaneSize = getRoomRelPos(1, 1, 0);
    var backPlanePos = getRoomRelPos(0, 0, 0.5);
    var backPlaneGeo = new THREE.PlaneBufferGeometry(
        backPlaneSize.x,
        backPlaneSize.y,
        20,
        20
    );

    const loader = new THREE.TextureLoader();
    let backPlaneMat = new THREE.MeshLambertMaterial({
        alphaMap: loader.load("/assets/textures/roomWindow-split.png"),
        transparent: true,
        color: roomColor,
        emissive: roomEmissiveColor,
    });
    backPlaneMat.side = THREE.BackSide;
    backPlane = new THREE.Mesh(backPlaneGeo, backPlaneMat);
    var customDepthMaterial = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
        alphaMap: loader.load("/assets/textures/roomWindow-split.png"),
        alphaTest: 0.5,
    });
    backPlane.customDepthMaterial = customDepthMaterial;
    backPlane.position.set(backPlanePos.x, backPlanePos.y, backPlanePos.z);
    backPlane.castShadow = true;

    scene.add(backPlane);
}

//Updates room by removing it and re-adding it
function updateRoom() {
    if (room) {
        scene.remove(room);
        scene.remove(floorPlane);
        scene.remove(backPlane);
    }

    setupRoom();
}

//Takes percentage of roomSize, Returns world coordinate positions
// Every variable should range from -0.5, to 0.5
//TODO: There is some black magic happening with FOV here that makes z range from -1 to 1, so i have to noramzlie it
function getRoomRelPos(xPercent, yPercent, zPercent) {
    var returnVector = new THREE.Vector3(
        xPercent * roomSize.x,
        yPercent * roomSize.y,
        zPercent * roomSize.z
    );

    return returnVector;
}

//🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞
// Sun setup
// 🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞🌞

var sun, sunHelper, sunCameraHelper, sunPos;
var ambient;

function setupLights() {
    setupSun();

    ambient = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambient);
}

function setupSun() {
    sunPos = getRoomRelPos(0.3, 0.5, 1);
    sun = new THREE.DirectionalLight(0xffff00, 1.5);
    sun.color.setHSL(0.2, 1, 0.4);
    sun.position.set(sunPos.x, sunPos.y, sunPos.z);
    sun.castShadow = true;
    sun.shadow.radius = 2;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);

    var lightTargetPos = getLightTarget();
    sun.target.position.set(lightTargetPos.x, lightTargetPos.y, lightTargetPos.z);
    sun.target.updateMatrixWorld();
    scene.add(sun.target);

    var sunCameraBounds = getRoomRelPos(1, 1, 2);
    sun.shadow.camera.left = -sunCameraBounds.x;
    sun.shadow.camera.right = sunCameraBounds.x;
    sun.shadow.camera.top = sunCameraBounds.y;
    sun.shadow.camera.bottom = -sunCameraBounds.y;
    sun.shadow.camera.far = sunCameraBounds.z * 2;
    sun.shadow.camera.updateProjectionMatrix();

    if (debug) {
        sunCameraHelper = new THREE.CameraHelper(sun.shadow.camera);
        scene.add(sunCameraHelper);

        sunHelper = new THREE.DirectionalLightHelper(sun);
        scene.add(sunHelper);
    }
}

function getLightTarget() {
    if (plant) {
        var plantPos = plant.position.clone();
        return plantPos;
    } else {
        return new THREE.Vector3(0, 0, 0);
    }
}

function updateLights() {
    sun.position.set(sunPos.x, sunPos.y, sunPos.z);
    var lightTargetPos = getLightTarget();
    sun.target.position.set(lightTargetPos.x, lightTargetPos.y, lightTargetPos.z);
    sun.target.updateMatrixWorld();
    if (debug) {
        sunHelper.update();
        sunCameraHelper.update();
    }
}

// 🌳🌳🌳 🌳🌳🌳 🌳🌳🌳🌳
// Models, which here is the plant and some test stuff
//  🌳🌳🌳 🌳🌳🌳 🌳🌳🌳

//Plant baby
var plant;

function setupModels() {
    setupPlant();
    //setupTestPlant();
    if (debug) setupTestEnv();
}

function updateModels() {
    updatePlant();
    //updateTestPlant();
    if (debug) updateTestEnv();
}

function animModels(time) {
    //Nothing for now
}

function setupPlant() {
    var loader = new GLTFLoader();
    var resourceURL = "/assets/plant/UmbrellaPalmTree.gltf";

    loader.load(resourceURL, function(gltf) {
        plant = gltf.scene;

        plant.traverse(function(node) {
            if (node.isMesh) {
                node.castShadow = true;
                let currentMaterial = node.material.clone();

                node.material.metalness = 0.2;
                node.material.color.setRGB(1, 1, 1);
                //let newMaterial = new THREE.MeshLambertMaterial({ color: "green" });
                //node.material = newMaterial;
            }
        });
        resizePlant();
        scene.add(plant);
    });
}

function resizePlant() {
    let plantSize = getRoomRelPos(0.1, 0.5, 0.1);
    let plantPos = getRoomRelPos(0, -0.3, 0.45);
    //Rescale
    var bbox = new THREE.Box3().setFromObject(plant);
    var cent = bbox.getCenter(new THREE.Vector3());
    var size = bbox.getSize(new THREE.Vector3());

    var maxAxis = size.y;
    var desiredSize = plantSize.y;
    plant.scale.multiplyScalar(desiredSize / maxAxis);
    bbox.setFromObject(plant);
    bbox.getCenter(cent);
    bbox.getSize(size);

    //Reset position to 0
    plant.position.copy(cent).multiplyScalar(-1);
    plant.position.set(plantPos.x, plantPos.y, plantPos.z - plantSize.z / 2);
}

//TOOD: i can make this more efficient
function updatePlant() {
    if (plant) {
        //alert("Plant removing");
        //scene.remove(plant);
        resizePlant();
    }
}

var testPlant;

function setupTestPlant() {
    var plantSize = getRoomRelPos(0.1, 0.4, 0.1);
    var plantPos = getRoomRelPos(0, -0.5, 0.49); //TODO: this is weird. it should be like this.

    var plantGeo = new THREE.BoxGeometry(plantSize.x, plantSize.y, plantSize.x);
    var plantMat = new THREE.MeshLambertMaterial({ color: 0x0ff00 });
    testPlant = new THREE.Mesh(plantGeo, plantMat);
    testPlant.position.set(
        plantPos.x,
        plantPos.y + plantSize.y / 2,
        plantPos.z - plantSize.z / 2
    );
    testPlant.castShadow = true;

    scene.add(testPlant);
}

function updateTestPlant() {
    if (testPlant) {
        scene.remove(testPlant);
        setupTestPlant();
    }
}

//🧪🧪🧪🧪🧪 Test environment
var sphere;

function updateTestEnv() {
    if (sphere) {
        scene.remove(sphere);
    }
    setupTestEnv();
}

function setupTestEnv() {
    var spherePos = getRoomRelPos(0, 0, 0);
    const sphereRadius = getRoomRelPos(0, 0.05, 0).y;
    const sphereGeo = new THREE.SphereBufferGeometry(sphereRadius, 16, 16);
    const sphereMat = new THREE.MeshPhongMaterial({ color: "#fff" });
    sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(spherePos.x, -spherePos.y, spherePos.z);
    scene.add(sphere);

    //var gridHelper = new THREE.GridHelper(100, 10);
    //scene.add(gridHelper);
}

//✨ ✨ ✨ ✨ ✨ Animate

var totalTime = 0,
    totalScroll = 0;

function setInitialSunPos() {
    updateSunPos(0);
}

export function updateSunPos(sunPercent) {
    //Limit the percent just in case someone does something bad
    sunPercent = Math.min(1.0, sunPercent);
    sunPercent = Math.max(0.0, sunPercent);

    //Then convert to -0.5 to 0.5 :)
    let sunPosPercent = sunPercent - 0.5;
    let newSunPos = getRoomRelPos(sunPosPercent, 0, 0);
    sunPos.x = newSunPos.x;
    updateLights();

    //Also update the light color and room colors
    let sunColor = new THREE.Color(getSkyAmbientColorAtTime(sunPercent));
    sun.color = sunColor;
    ambient.color = sunColor;
    ambient.intensity = 3.5 * getSkyAmbientIntensityAtTime(sunPercent);

    //This is very bad and i will fix it but just for now
    let rootDom = document.getElementById("sunroom-container");
    let cssGradient = getSkyGradientAtTime(sunPercent);
    rootDom.style.backgroundImage = cssGradient;

    //Also rotate the plant because fuckkk itt
    let plantRotation = sunPercent * Math.PI;
    if (plant) plant.rotation.y = plantRotation;

    // renderer.domElement.style.backgroundPositionY = (sunPercent * 100) + "%";
}

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
    animModels(totalTime);
    renderer.render(scene, camera);
    if (controls) controls.update();
    //console.log(camera.position);
    requestAnimationFrame(animate);
}