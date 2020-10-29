import Matter from "matter-js";
import { displayWarning } from "../3D/lib/utils";

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint,
    Composite = Matter.Composite;

var engine, domElement, render, world;

var boundSize = 50;
var ground, wallLeft, wallRight, ceiling, trashCan;
var groundSize, wallSize;
var mouseConstraint, mouse;

export function setupScene() {
    // create an engine
    engine = Engine.create();

    // create a renderer
    domElement = document.getElementById("trashroom-container");
    render = Render.create({
        element: domElement,
        engine: engine,
        options: {
            wireframes: false,
        },
    });
    render.canvas.width = domElement.clientWidth;
    render.canvas.height = domElement.clientHeight;

    setupWalls();
    setupTrashCan();

    // add mouse control
    mouse = Mouse.create(render.canvas);

    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false,
            },
        },
    });
    world = engine.world;
    World.add(world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // add all of the bodies to the world
    World.add(world, [ground, ceiling, wallLeft, wallRight]);

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);
}

//🌳 Models

function setupTrashCan() {
    let canPosition = getPositionRelToCanvas(0.8, 0.15);
    trashCan = Bodies.circle(canPosition.x, canPosition.y, 80, {
        isStatic: true,
        render: {
            fillStyle: "white",
        },
    });
    trashCan.id = "TRASHCAN";
    World.add(engine.world, [trashCan]);
}

export function setupTrashCanCallback(callback) {
    Matter.Events.on(engine, "collisionStart", function(event) {
        // We know there was a collision so fetch involved elements ...
        var a = event.pairs[0].bodyA;
        var b = event.pairs[0].bodyB;

        if (a.id === "TRASHCAN" || b.id === "TRASHCAN") {
            let trash, trashCan;
            if (a.id == "TRASHCAN") {
                trash = b;
                trashCan = a;
            } else {
                trash = a;
                trashCan = b;
            }
            //Matter.Composite.remove(world, trash);
            callback(a);
        }
        // Now do something with the event and elements ... your task ;-)
    });
}

function getRadius() {
    return Math.floor(Math.random() * 30);
}
export function addTrash(id, xPercent, yPercent) {
    let trashPosition = getPositionRelToCanvas(xPercent, yPercent);
    let numSides = Math.floor(Math.random() * 5 + 3);
    let trash = Bodies.polygon(trashPosition.x, trashPosition.y, numSides, 50, {
        render: {
            fillStyle: "#191920",
            strokeStyle: "white",
            lineWidth: 2,
        },
        chamfer: { radius: [getRadius(), getRadius(), getRadius(), getRadius()] },
    });
    trash.id = id;

    World.add(engine.world, [trash]);
}

export function removeTrashFromScene(id) {
    let trash = Matter.Composite.get(world, id, "body");
    if (trash == null) {
        displayWarning("That body " + id + " doesnt exist", [world]);
        return;
    }
    Matter.Composite.remove(world, trash);
}

//🏠🏠🏠🏠🏠🏠
// basically room shit
//🏠🏠🏠🏠🏠🏠

function setupWalls() {
    groundSize = Matter.Vector.create(
        getPositionRelToCanvas(1, 0.1).x,
        boundSize
    );
    let groundPos = getPositionRelToCanvas(0.5, 1, 0, boundSize / 2 + 2);
    ground = Bodies.rectangle(
        groundPos.x,
        groundPos.y,
        groundSize.x,
        groundSize.y, {
            isStatic: true,
        }
    );

    let ceilingPos = getPositionRelToCanvas(0.5, 0, 0, -boundSize / 2 - 1);
    ceiling = Bodies.rectangle(
        ceilingPos.x,
        ceilingPos.y,
        groundSize.x,
        groundSize.y, {
            isStatic: true,
        }
    );

    wallSize = Matter.Vector.create(boundSize, getPositionRelToCanvas(0.1, 1).y);
    let wallLeftPos = getPositionRelToCanvas(0, 0.5, -boundSize / 2 - 1, 0);
    wallLeft = Bodies.rectangle(
        wallLeftPos.x,
        wallLeftPos.y,
        wallSize.x,
        wallSize.y, {
            isStatic: true,
        }
    );

    let wallRightPos = getPositionRelToCanvas(1, 0.5, boundSize / 2 + 1, 0);
    wallRight = Bodies.rectangle(
        wallRightPos.x,
        wallRightPos.y,
        wallSize.x,
        wallSize.y, {
            isStatic: true,
        }
    );
}

function getPositionRelToCanvas(xPercent, yPercent, xOffset = 0, yOffset = 0) {
    let canvasWidth = render.canvas.width;
    let canvasHeight = render.canvas.height;

    let xPos = xPercent * canvasWidth;
    let yPos = yPercent * canvasHeight;

    xPos = xPos + xOffset;
    yPos = yPos + yOffset;

    let pos = Matter.Vector.create(xPos, yPos);
    return pos;
}

//FYI this breaks when resizing to small sizes...
//PS: need to add wall left and right resizing but idc right now
export function updateRendererSize() {
    render.canvas.width = domElement.clientWidth;
    render.canvas.height = domElement.clientHeight;

    let groundPos = getPositionRelToCanvas(0.5, 1);
    groundPos = Matter.Vector.create(
        groundPos.x,
        groundPos.y + boundSize / 2 + 1
    );
    let desiredGroundSize = getPositionRelToCanvas(1, 0.1);
    let xScale = desiredGroundSize.x / groundSize.x;
    Body.scale(ground, xScale, 1);
    Body.setPosition(ground, groundPos);
    groundSize = desiredGroundSize;
}