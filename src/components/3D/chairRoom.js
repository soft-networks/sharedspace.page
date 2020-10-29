import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { displayProgress, displayWarning } from "./lib/utils";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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
//The roomSize should be changeable and material lol.
// but roomSize doesnt acutally mean anything - because its related to the size of window. -- its just a global "scale" vibe
//it would also be useful to have a getRoomRelPos(x,y,z,model) to recenter acc to model bounding box
// 🏠🏠🏠🏠🏠 🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠🏠

var room;
var roomColor = "#ffffff";
var roomSize = new THREE.Vector3(15, 15, 25);

//Creates a room of a constant width, as defined in roomSize above.
//Z factor of room changes based on how large the room is, to force a perspective
function setupRoom() {
    roomSize.y = roomSize.x * (windowSize[1] / windowSize[0]);
    roomSize.z = Math.max(roomSize.x, roomSize.y);

    var roomGeo = new THREE.BoxGeometry(roomSize.x, roomSize.y, roomSize.z);
    let loader = new THREE.TextureLoader();
    let texture = loader.load("/assets/chair/wallpaper.png");
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(5, 5);
    // var roomMat = new THREE.MeshBasicMaterial({
    //     map: texture,
    // });
    let wallpaper_texture = loader.load("/assets/chair/room/wallpaper.png");
    wallpaper_texture.wrapS = THREE.RepeatWrapping;
    wallpaper_texture.wrapT = THREE.RepeatWrapping;
    wallpaper_texture.repeat.set(5, 5);

    let tile_texture = loader.load("/assets/chair/room/herringbone.jpg");
    tile_texture.wrapS = THREE.RepeatWrapping;
    tile_texture.wrapT = THREE.RepeatWrapping;
    tile_texture.repeat.set(2, 2);

    const roomMat = [
        new THREE.MeshBasicMaterial({
            map: wallpaper_texture,
            side: THREE.BackSide,
        }),
        new THREE.MeshBasicMaterial({
            map: wallpaper_texture,
            side: THREE.BackSide,
        }),
        new THREE.MeshBasicMaterial({
            map: wallpaper_texture,
            side: THREE.BackSide,
        }),
        new THREE.MeshStandardMaterial({
            map: tile_texture,
            side: THREE.BackSide,
            receiveShadow: true,
        }),
        new THREE.MeshStandardMaterial({
            map: wallpaper_texture,
            side: THREE.BackSide,
            receiveShadow: true,
        }),
        new THREE.MeshBasicMaterial({
            map: wallpaper_texture,
            side: THREE.BackSide,
        }),
    ];
    room = new THREE.Mesh(roomGeo, roomMat);
    room.receiveShadow = true;
    scene.add(room);
}

//Updates room by removing it and re-adding it
function updateRoom() {
    if (room) scene.remove(room);
    setupRoom();
}

//Takes percentage of roomSize, Returns world coordinate positions
// Every variable should range from -0.5, to 0.5
function getRoomRelPos(xPercent, yPercent, zPercent) {
    return new THREE.Vector3(
        xPercent * roomSize.x,
        yPercent * roomSize.y,
        zPercent * roomSize.z
    );
}

function posAsRoomPercent(pos) {
    return new THREE.Vector3(
        pos.x / roomSize.x,
        pos.y / roomSize.y,
        pos.z / roomSize.z
    );
}

//📸 💡📸 📸 📸 📸 📸 📸 📸 📸 📸 📸
// Positions camera as needed
// 📸 📸 📸 📸 📸 📸 📸 📸 📸 📸 📸

function updateCameraPos() {
    var cameraPos = getRoomRelPos(0, 0.4, -0.9);
    camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

    var cameraLookAt = getRoomRelPos(0, -0.1, 0);
    camera.lookAt(cameraLookAt);

    if (debug) {
        controls = new OrbitControls(camera, renderer.domElement);
    }
}

var keyRight, keyLeft, ceilLight;
var directionalHelperL, directionalHelperR, ceilLightHelper;

function updateLights() {
    var keyPos = getRoomRelPos(0.4, 0.4, 0);
    keyRight.position.set(keyPos.x, keyPos.y, keyPos.z);
    //keyLeft.position.set(-keyPos.x, keyPos.y, keyPos.z);
    // if (debug) {
    //     directionalHelperL.update();
    //     directionalHelperR.update();
    // }
}

function setupLights() {
    // var ceilLightPosition = getRoomRelPos(0.0, 0.5, 0.0);
    // ceilLight = new THREE.DirectionalLight(0xffffff, 2.6);
    // ceilLight.position.set(0, ceilLightPosition.y, 0);
    // let targetPos = getRoomRelPos(0.4, -0.25, 0.4);
    // ceilLight.target.position.set(targetPos.x, targetPos.y, targetPos.z);
    // ceilLight.target.updateMatrixWorld();
    // ceilLight.castShadow = true;
    // //scene.add(ceilLight);
    // scene.add(ceilLight.target);

    var ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    var keyPos = getRoomRelPos(0.4, 0.4, 0);
    keyRight = new THREE.DirectionalLight(0xff19e0, 0.2);
    keyRight.position.set(keyPos.x, keyPos.y, keyPos.z);
    keyRight.castShadow = true;
    scene.add(keyRight);

    // keyLeft = new THREE.DirectionalLight(0xffffff, 1.0);
    // keyLeft.position.set(-keyPos.x, keyPos.y, keyPos.z);
    // scene.add(keyLeft);

    // if (debug) {
    //     ceilLightHelper = new THREE.DirectionalLightHelper(ceilLight);
    //     scene.add(ceilLightHelper);

    //     directionalHelperR = new THREE.DirectionalLightHelper(keyRight);
    //     scene.add(directionalHelperR);

    //     directionalHelperL = new THREE.DirectionalLightHelper(keyLeft);
    //     scene.add(directionalHelperL);
    // }
}

// 🌳🌳🌳 🌳🌳🌳 🌳🌳🌳🌳
// Models, which here is the chair and other things
//  🌳🌳🌳 🌳🌳🌳 🌳🌳🌳

//TODO when abstracting, think about the *type* of update sthe system can handle
//A lot of the updates are onRoomSizeChange, or onAnimationCycle.. and not just "update"

function setupModels() {
    setupMyCursor();
    setupChair();
    if (debug) setupTestEnv();
}

function updateModels() {
    updateChair();
    if (debug) updateTestEnv();
}

//🎷 Chair

var chair, chairGeo;

function setupChair() {
    var loader = new GLTFLoader();
    var resourceURL = "/assets/chair/Chair.gltf";

    loader.load(resourceURL, function(gltf) {
        chair = gltf.scene;

        chair.traverse(function(node) {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                // node.material = new THREE.MeshLambertMaterial({
                //     color: 0xffc0cb,
                //     emissive: 0x750666,
                // });
                chairGeo = node.geometry;
            }
        });
        resizeChair();
        scene.add(chair);
    });
}

function resizeChair() {
    let chairSize = getRoomRelPos(0.3, 0.4, 0.15);
    let chairPos = getRoomRelPos(0, -0.5, 0);

    //Rescale
    var bbox = new THREE.Box3().setFromObject(chair);
    var cent = bbox.getCenter(new THREE.Vector3());
    var size = bbox.getSize(new THREE.Vector3());

    var maxAxis = size.y;
    var desiredSize = chairSize.y;
    chair.scale.multiplyScalar(desiredSize / maxAxis);
    bbox.setFromObject(chair);
    bbox.getCenter(cent);
    bbox.getSize(size);

    //Reset position to 0
    chair.position.copy(cent).multiplyScalar(-1);
    chair.rotation.y = Math.PI;

    chair.position.set(chairPos.x, chairPos.y, chairPos.z);
}

function updateChair() {
    if (chair) {
        resizeChair();
    }
}

//FWIW: collisions are solved here
//https://discourse.threejs.org/t/resolved-how-to-detect-if-two-objects-overlap/3789/3
function willIntersectChair(collisionMesh, collisionMeshNewPosition) {
    if (!chair) {
        return false;
    }

    let chairBoundingBox = new THREE.Box3().setFromObject(chair);
    // chairGeo.computeBoundingBox();
    //chairBoundingBox.copy(chairGeo.boundingBox).applyMatrix4(chair.matrixWorld);

    let collisionBoundingBox = new THREE.Box3();
    let clonedMesh = collisionMesh.clone();
    clonedMesh.position.set(
        collisionMeshNewPosition.x,
        collisionMeshNewPosition.y,
        collisionMeshNewPosition.z
    );
    collisionBoundingBox.setFromObject(clonedMesh);

    let collisionHappened = chairBoundingBox.intersectsBox(collisionBoundingBox);
    return collisionHappened;
}

/// 😁😁😁😁😁😁 Functions related to people!

//Notes for abstracting  this bitch
//TODO i think that replacing "getCursor" is pretty much enough to override this bad boy
//I would also change the updateMy/NPCCursor function to have the "Y" axis be -half the size of the cursor, or user defined
//Note: movement is stored into DB and synced independently of chair occupation by design
var myCursor;
var NPCCursors = {};

function getCursorMaterial(opt = "default") {
    return new THREE.MeshBasicMaterial({ color: 0x000000 });
}

function getCursor(opt = "default") {
    let cursorGroup = new THREE.Object3D();

    let label = createCursorLabel();
    cursorGroup.add(label);

    var sphereSize = getRoomRelPos(0.05, 0.02, 0.005);
    let cursorGeo = new THREE.SphereGeometry(sphereSize.z, 32, 32);
    let cursorMat = getCursorMaterial();
    let cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    cursorMesh.position.set(0, -sphereSize.y, 0);
    cursorGroup.add(cursorMesh);

    return cursorGroup;
}

const borderSize = 2,
    fontSize = 12,
    chairAsk = [
        "chair plz",
        "chair?",
        "chaaair?",
        "can i chair",
        "just once, chair",
        "lonely w/o chair",
    ];

function getRandomText() {
    return chairAsk[Math.floor(Math.random() * chairAsk.length)];
}

function changeCursorLabelText(id, text) {
    let cursor;

    if (id === "me") {
        cursor = myCursor;
    } else if (NPCCursors[id]) {
        cursor = NPCCursors[id];
    } else {
        displayWarning(id + "doesnt exist, cant change text", [NPCCursors]);
        return;
    }

    cursor.traverse((cursorChildren) => {
        if (cursorChildren.isSprite) {
            let canvas = cursorChildren.material.map.image;
            let ctx = canvas.getContext("2d");
            console.log("*********");
            console.log(ctx);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText(text, borderSize, borderSize);

            cursorChildren.material.needsUpdate = true;
            cursorChildren.material.map.needsUpdate = true;
        }
    });
}

function createCursorLabel() {
    const canvas = makeLabelCanvas(fontSize, "id like the chair");
    const texture = new THREE.CanvasTexture(canvas);
    // because our canvas is likely not a power of 2
    // in both dimensions set the filtering appropriately.
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    const labelMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
    });
    const label = new THREE.Sprite(labelMaterial);
    const labelBaseScale = 0.015;
    label.scale.x = canvas.width * labelBaseScale;
    label.scale.y = canvas.height * labelBaseScale;

    return label;
}

function setupMyCursor() {
    if (!myCursor) {
        myCursor = getCursor();
        scene.add(myCursor);
        updateMyCursor(0, 0);
    }
}

//https://threejsfundamentals.org/threejs/lessons/threejs-canvas-textures.html
function makeLabelCanvas(size, text) {
    const ctx = document.createElement("canvas").getContext("2d");
    const font = `${size}px monospace`;
    ctx.font = font;
    // measure how long the name will be
    const doubleBorderSize = borderSize * 2;
    const width = ctx.measureText(text).width + doubleBorderSize;
    const height = size + doubleBorderSize;
    ctx.canvas.width = width;
    ctx.canvas.height = height;

    // need to set font again after resizing canvas
    ctx.font = font;
    ctx.textBaseline = "top";

    // ctx.fillStyle = "blue";
    // ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fillText(text, borderSize, borderSize);

    return ctx.canvas;
}

//Firebase says to move a specific cursor
export function updateNPCCursor(id, xP, yP, zP) {
    if (NPCCursors[id]) {
        let cursor = NPCCursors[id];
        let cursorPos = getRoomRelPos(xP, yP, zP);
        cursor.position.set(cursorPos.x, cursorPos.y, cursorPos.z);
        changeCursorLabelText(id, getRandomText());
    }
}

//Firebase says to add a specific cursor
//TODO; Its a hack that i've randomly made this -0.25 fwiw :)
export function addNPCCursor(id) {
    var newGrassCursor = getCursor("npc");
    if (!NPCCursors[id]) {
        NPCCursors[id] = newGrassCursor;
        updateNPCCursor(id, 0, -0.25, 0);

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

// 🐒🐒🐒🐒🐒🐒🐒🐒🐒🐒🐒🐒
// Functions related to "occupying" the chair
// The way this works is that we basically see if there is someone occupying the chair. If so - we disallow move into chair (managed in moveMyCursor)
// If I intersect with chair, and no one is in it, then i occupy chair
// The database syncs the chair Occupation state, and I always know if chair is occupied and who is in it
// For now: "who is in it" only controls the material coloring, it does not control movement by design
/// 🐒🐒🐒🐒🐒🐒🐒🐒🐒🐒🐒🐒

let chairOccupied = false;
let occupyingChairID;

export function setChairOccupation(newChairOccupation) {
    if (chairOccupied) {
        if (newChairOccupation == false) {
            //The chair was occupied, now it isnt
            allUnoccupyChair();
        } else {
            //Nothing changed, do nothing
        }
    }
    if (!chairOccupied) {
        if (newChairOccupation !== false) {
            var id = newChairOccupation;
            occupyChair(id);
        } else {
            //Nothing changed, do nothing
        }
    }
}

export function getChairOccupation() {
    if (chairOccupied) {
        return occupyingChairID;
    } else {
        return false;
    }
}

function iAmInChair() {
    return occupyingChairID == "me";
}

export function isChairOccupied() {
    return chairOccupied;
}

export function occupyChair(id) {
    chairOccupied = true;
    occupyingChairID = id;

    displayProgress(id + " is occupying chair");
    let cursorToOccupy;
    if (id === "me") {
        cursorToOccupy = myCursor;
    } else if (NPCCursors[id]) {
        cursorToOccupy = NPCCursors[id];
    } else {
        displayWarning("Sorry a bad thing happened " + id + " doesnt exist", [
            NPCCursors,
        ]);
        return;
    }
    changeCursorLabelText(id, "😄😄😄😄😄😄😄😄😄");
    let chairOccupationPos = getRoomRelPos(0, -0.2, 0);
    cursorToOccupy.position.set(
        chair.position.x,
        chairOccupationPos.y,
        chair.position.z
    );
}

export function allUnoccupyChair() {
    if (chairOccupied) {
        unoccupyChair(occupyingChairID);
    }
}

function unoccupyChair(id) {
    chairOccupied = false;
    occupyingChairID = "";

    let cursorToOccupy, cursorNewMaterial;
    if (id === "me") {
        cursorToOccupy = myCursor;
        cursorNewMaterial = getCursorMaterial();
    } else if (NPCCursors[id]) {
        cursorToOccupy = NPCCursors[id];
        cursorNewMaterial = getCursorMaterial("npc");
    } else {
        displayWarning(id + " tried to unocupy chair but it doesnt exist");
        return;
    }

    changeCursorLabelText(id, getRandomText());
    displayProgress(id + " is no longer occupying chair");
}

//I update my cursor and also tell firebase that I'm  updating

export function updateMyCursor(mouseXPercent, mouseZPercent) {
    if (!myCursor) {
        displayWarning("No cursor yet to update");
        return false;
    }

    //First calculate the trajectory of the mouse
    //Convert the mouse percent into a room rel percent, choosing a fixed y
    var roomRelPercent = new THREE.Vector3(-mouseXPercent * 0.5, -0.25,
        mouseZPercent * 0.5
    );

    //Convert those percentages into a coord depending on room and set room to that
    var roomRelPos = getRoomRelPos(
        roomRelPercent.x,
        roomRelPercent.y,
        roomRelPercent.z
    );

    //Then figure out collisions, based on which we return the cursor position, but as a percentage of the room
    var cursorPosAsPercent;

    if (iAmInChair()) {
        displayProgress("I have moved. i am occupying chair");
        //Case 1: I am occupying chair
        if (willIntersectChair(myCursor, roomRelPos)) {
            //1A: My new position continues to be "on chair", do nothing
            return false;
        } else {
            //1B: My new position is away from chair, so I unoccupy chair now
            unoccupyChair("me");
            myCursor.position.set(roomRelPos.x, roomRelPos.y, roomRelPos.z);
            cursorPosAsPercent = roomRelPercent;
            return cursorPosAsPercent;
        }
    } else {
        displayProgress("I have moved. i am not occupying chair");
        //Case 2: I am NOT occupying chair
        changeCursorLabelText("me", getRandomText());
        if (willIntersectChair(myCursor, roomRelPos)) {
            //2A: My new position will collide with chair
            displayProgress("I would intersect with chair if i moved there");
            if (isChairOccupied()) {
                //2A.1: If someone is in chair, I cant move do nothing
                displayProgress("Would collide, not moving");
                return false;
            } else {
                //2A.2: No one is in chair, so I occupy chair
                occupyChair("me");
                cursorPosAsPercent = posAsRoomPercent(myCursor.position);
                return cursorPosAsPercent;
            }
        } else {
            //2B: My new position is not going to collide with chair
            myCursor.position.set(roomRelPos.x, roomRelPos.y, roomRelPos.z);
            cursorPosAsPercent = roomRelPercent;
            return cursorPosAsPercent;
        }
    }
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
    renderer.render(scene, camera);
    if (controls) controls.update();
    requestAnimationFrame(animate);
}