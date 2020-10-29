//Based on:
//"Realistic real-time grass rendering" by Eddie Lee, 2010
//https://www.eddietree.com/grass
//https://medium.com/@Zadvorsky/into-vertex-shaders-594e6d8cd804u
//https://github.com/zadvorsky/three.bas
//https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_instancing_dynamic.html
//https://www.opengl-tutorial.org/intermediate-tutorials/tutorial-17-quaternions/

//TODO: Update to be width and height
//Update to move with the wind :)

import * as THREE from "three";
import { Noise } from "./perlin.js";
import { vertexShader, fragmentShader } from "./grassShader.js";

export function getGrass(width, height) {
    //Default sizes of grass path
    if (width == undefined) {
        width = 120;
        height = 120;
    }
    console.log("Creating grass: " + width + " / " + height);

    var returnMeshes = [];
    const mobile =
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/webOS/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/BlackBerry/i) ||
        navigator.userAgent.match(/Windows Phone/i);

    //Variables for blade mesh
    var joints = 5;
    var w_ = 0.03;
    var h_ = 0.7;

    //Number of blades
    var instances = 15000;
    if (mobile) {
        instances = 8000;
    }

    //http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
    function multiplyQuaternions(q1, q2) {
        x = q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x;
        y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y;
        z = q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z;
        w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w;
        return new THREE.Vector4(x, y, z, w);
    }

    //************** Shader sources **************

    //************** Setup **************
    //Use noise.js library to generate a grid of 2D simplex noise values
    let noise = Noise();
    noise.seed(Math.random());

    function getYPosition(x, z) {
        var y = 2 * noise.simplex2(x / 50, z / 50);
        y += 4 * noise.simplex2(x / 100, z / 100);
        y += 0.2 * noise.simplex2(x / 10, z / 10); //Were ignoring this, we want flat surface
        y = 0;
        return y;
    }

    //The ground
    var ground_geometry = new THREE.PlaneGeometry(width, height, 32, 32);
    ground_geometry.lookAt(new THREE.Vector3(0, 1, 0));
    ground_geometry.verticesNeedUpdate = true;

    var groundColor = new THREE.Color();
    var ground_material = new THREE.MeshBasicMaterial({ color: 0x42ac32 });
    var ground = new THREE.Mesh(ground_geometry, ground_material);

    for (var i = 0; i < ground.geometry.vertices.length; i++) {
        var v = ground.geometry.vertices[i];
        v.y = getYPosition(v.x, v.z);
    }
    ground.geometry.computeVertexNormals();
    returnMeshes.push(ground);

    //Define base geometry that will be instanced. We use a plane for an individual blade of grass
    var base_geometry = new THREE.PlaneBufferGeometry(w_, h_, 1, joints);
    base_geometry.translate(0, h_ / 2, 0);
    var base_material = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
    });
    var base_blade = new THREE.Mesh(base_geometry, base_material);

    //From:
    //https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_instancing_dynamic.html
    var instanced_geometry = new THREE.InstancedBufferGeometry();

    //************** Attributes **************
    instanced_geometry.index = base_geometry.index;
    instanced_geometry.attributes.position = base_geometry.attributes.position;
    instanced_geometry.attributes.uv = base_geometry.attributes.uv;

    // Each instance has its own data for position, rotation and scale
    var offsets = [];
    var orientations = [];
    var stretches = [];
    var halfRootAngleSin = [];
    var halfRootAngleCos = [];

    //Temp variables
    var quaternion_0 = new THREE.Vector4();
    var quaternion_1 = new THREE.Vector4();
    var x, y, z, w;

    //The min and max angle for the growth direction (in radians)
    var min = -0.25;
    var max = 0.25;

    //For each instance of the grass blade
    for (var i = 0; i < instances; i++) {
        //Offset of the roots
        x = Math.random() * width - width / 2;
        z = Math.random() * height - height / 2;
        y = getYPosition(x, z);
        offsets.push(x, y, z);

        //Define random growth directions
        //Rotate around Y
        var angle = Math.PI - Math.random() * (2 * Math.PI);
        halfRootAngleSin.push(Math.sin(0.5 * angle));
        halfRootAngleCos.push(Math.cos(0.5 * angle));

        var RotationAxis = new THREE.Vector3(0, 1, 0);
        var x = RotationAxis.x * Math.sin(angle / 2.0);
        var y = RotationAxis.y * Math.sin(angle / 2.0);
        var z = RotationAxis.z * Math.sin(angle / 2.0);
        var w = Math.cos(angle / 2.0);
        quaternion_0.set(x, y, z, w).normalize();

        //Rotate around X
        angle = Math.random() * (max - min) + min;
        RotationAxis = new THREE.Vector3(1, 0, 0);
        x = RotationAxis.x * Math.sin(angle / 2.0);
        y = RotationAxis.y * Math.sin(angle / 2.0);
        z = RotationAxis.z * Math.sin(angle / 2.0);
        w = Math.cos(angle / 2.0);
        quaternion_1.set(x, y, z, w).normalize();

        //Combine rotations to a single quaternion
        quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1);

        //Rotate around Z
        angle = Math.random() * (max - min) + min;
        RotationAxis = new THREE.Vector3(0, 0, 1);
        x = RotationAxis.x * Math.sin(angle / 2.0);
        y = RotationAxis.y * Math.sin(angle / 2.0);
        z = RotationAxis.z * Math.sin(angle / 2.0);
        w = Math.cos(angle / 2.0);
        quaternion_1.set(x, y, z, w).normalize();

        //Combine rotations to a single quaternion
        quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1);

        orientations.push(
            quaternion_0.x,
            quaternion_0.y,
            quaternion_0.z,
            quaternion_0.w
        );

        //Define variety in height
        if (i < instances / 3) {
            stretches.push(Math.random() * 1.8);
        } else {
            stretches.push(Math.random());
        }
    }

    var offsetAttribute = new THREE.InstancedBufferAttribute(
        new Float32Array(offsets),
        3
    );
    var stretchAttribute = new THREE.InstancedBufferAttribute(
        new Float32Array(stretches),
        1
    );
    var halfRootAngleSinAttribute = new THREE.InstancedBufferAttribute(
        new Float32Array(halfRootAngleSin),
        1
    );
    var halfRootAngleCosAttribute = new THREE.InstancedBufferAttribute(
        new Float32Array(halfRootAngleCos),
        1
    );
    var orientationAttribute = new THREE.InstancedBufferAttribute(
        new Float32Array(orientations),
        4
    );

    instanced_geometry.setAttribute("offset", offsetAttribute);
    instanced_geometry.setAttribute("orientation", orientationAttribute);
    instanced_geometry.setAttribute("stretch", stretchAttribute);
    instanced_geometry.setAttribute(
        "halfRootAngleSin",
        halfRootAngleSinAttribute
    );
    instanced_geometry.setAttribute(
        "halfRootAngleCos",
        halfRootAngleCosAttribute
    );

    //Get alpha map and blade texture
    //These have been taken from "Realistic real-time grass rendering" by Eddie Lee, 2010
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = "";
    var texture = loader.load(
        "/assets/grass/blade_diffuse_cray.jpg"
    );
    var alphaMap = loader.load(
        "/assets/grass/blade_alpha.jpg"
    );

    //Define the material, specifying attributes, uniforms, shaders etc.
    var material = new THREE.RawShaderMaterial({
        uniforms: {
            map: { value: texture },
            alphaMap: { value: alphaMap },
            time: { type: "float", value: 0 },
            windPos: { type: "vec3", value: new THREE.Vector3(0, 0, 0) },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide,
    });

    var mesh = new THREE.Mesh(instanced_geometry, material);
    returnMeshes.push(mesh);

    return returnMeshes;
    //Show base geometry
    //scene.add(base_blade);
}