import * as interpolate from "color-interpolate";

//OKAY SO BASICALLY THIS IS A HORRIBLY FRAGILE DATASTRUCTURE, AND I NEED TO UPDATE IT

//Notes for a future me - skygradientramp is an array of 5 "gradient stops". Each gradient stop is its own "color ramp". A color ramp takes in a float (0-1) and returns a color
//frankly its hard to even describe to be honest. at each time of day (midnight) there is a vertical gradient (top to bottom) that has 5 gradient stops
//So Across the day, at one position (gradient stop) there is a merge between the gradient stops of different times of day
//So for each gradient stop, there is a color ramp merging beteween colors of day. fucking sick. basically we really dont want the clien to worry about any of the horrid shit so here its abstracted

const skyStops = [
    "midnight",
    "sunrise",
    "dawn",
    "midday",
    "lateday",
    "sunset",
    "twilight",
];
const gradientStops = 5;

var skyGradientRamps = [],
    skyAmbientRamp;

var debug = false;

export function setupSkyColors(debugOption) {
    if (debugOption != undefined) debug = debugOption;

    //Gradients
    for (let i = 0; i < gradientStops; i++) {
        let skyPosRamp = [];

        for (let j = 0; j < skyStops.length; j++) {
            let id = skyStops[j];
            let skyColor = skyGradients[id][i];
            let convertedSkyColor = toHSBString(skyColor);
            skyPosRamp.push(convertedSkyColor);
        }
        //console.log("At pos " + i + " sky is " + skyPosRamp);
        let skyRamp = interpolate(skyPosRamp);
        skyGradientRamps.push(skyRamp);
        if (debug) debugColorRamp(skyRamp, "sky-gradient-pos" + i);
    }
    console.log(skyGradientRamps);

    //Ambient color
    let skyAmbientArray = [];
    for (let j = 0; j < skyStops.length; j++) {
        let id = skyStops[j];
        let color = skyAmbient[id];
        let convertedSkyColor = toHSBString(color);
        skyAmbientArray.push(convertedSkyColor);
    }
    console.log(skyAmbientArray);
    skyAmbientRamp = interpolate(skyAmbientArray);
    if (debug) debugColorRamp(skyAmbientRamp, "ambient");
    if (debug) createAmbientIntensityRamp();
}

var rampDebugNum = 1;
var ambientDebugDom;

function debugColorRamp(ramp, name) {
    var domElement = document.createElement("div");
    if (name == undefined) name = "";
    domElement.innerHTML = name;
    domElement.id = "gradient-test" + rampDebugNum;
    domElement.style.position = "absolute";
    domElement.style.top = 0;
    domElement.style.left = `${10 * rampDebugNum}%`;
    domElement.style.width = "3%";
    domElement.style.height = "10%";
    domElement.style.zIndex = 500;

    var colors = [ramp(0), ramp(0.25), ramp(0.5), ramp(0.75), ramp(1)];
    var backgroundImage = `linear-gradient(to bottom, ${colors[0]} 0%, ${colors[1]} 25%, ${colors[2]} 50%, ${colors[3]} 75%, ${colors[4]} 100%)`;
    domElement.style.backgroundImage = backgroundImage;

    document.body.appendChild(domElement);
    rampDebugNum += 1;
}

function debugAmbientIntensity(newValue, percent = "") {
    if (ambientDebugDom == undefined) {
        ambientDebugDom = document.createElement("div");
        ambientDebugDom.id = "ambient-debug";
        ambientDebugDom.style.position = "absolute";
        ambientDebugDom.style.top = 0;
        ambientDebugDom.style.right = 0;
        ambientDebugDom.style.width = "10%";
        ambientDebugDom.style.height = "10%";
        ambientDebugDom.style.zIndex = 500;
        document.body.appendChild(ambientDebugDom);
    }

    ambientDebugDom.innerHTML =
        "ambientintensity <br/>" + newValue + " <br/> with percent <br/>" + percent;
    ambientDebugDom.style.backgroundColor = `hsl(100, 0%, ${newValue * 100}%)`;
    ambientDebugDom.style.color = `hsl(100, 0%, ${(1 - newValue) * 100}%)`;
}

function toHSBString(color) {
    if (color.length != 3) {
        alert("Error in color conversion");
        return;
    } else {
        let hsbString = `hsl(${color[0]}, ${color[1]}%, ${color[2]}%)`;
        //console.log("returning" + hsbString);
        return hsbString;
    }
}

export function getSkyGradientAtTime(tPercent) {
    //Go through and get the color for each gradient stop as per time
    var skyGradient = [];
    for (var i = 0; i < gradientStops; i++) {
        var gradValue = skyGradientRamps[i](tPercent);
        skyGradient.push(gradValue);
    }

    var cssGradient = getCSSGradient(skyGradient);
    return cssGradient;
}

//TODO : WRITE A HELPER FUNCTION THAT VISUALIZES ANY GIVEN GRADIENT RAMP;

//TODO: this class should auto-generate the %'ages. it doesnt scale to more gradient stops right now.
function getCSSGradient(skyGradient) {
    //Convert this to a css gradient
    var bgGradient = `linear-gradient(to bottom, ${skyGradient[0]} 0%, ${skyGradient[1]} 25%, ${skyGradient[2]} 50%, ${skyGradient[3]} 75%, ${skyGradient[4]} 100%)`;
    return bgGradient;
}

export function getSkyAmbientColorAtTime(tPercent) {
    let skyAmbient = skyAmbientRamp(tPercent);
    console.log(skyAmbient);
    return skyAmbient;
}

function clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
}

export function getSkyAmbientIntensityAtTime(tPercent) {
    var x = tPercent;
    var intensityFactor;

    //Simple, sin curve arcs at 0.5
    // intensityFactor = Math.sin(x * Math.PI);

    //Cubic curve- not great but kind of works  https://mycurvefit.com/share/16ed005a-d1a4-4d4f-b031-9c0a168af5da
    // y = -6.106227e-16 + 5.35918*x - 8.07754*x^2 + 2.71836*x^3
    intensityFactor = -6.106227 * Math.E ** -16 +
        5.35918 * x +
        -8.07754 * x ** 2 +
        2.71836 * x ** 3;
    intensityFactor = clamp(intensityFactor, 0, 1.2);

    if (debug) debugAmbientIntensity(intensityFactor, tPercent);

    return intensityFactor;
}

function createAmbientIntensityRamp() {
    var colors = [];

    for (var i = 0; i <= 1; i += 0.25) {
        let intensity = getSkyAmbientIntensityAtTime(i);
        let color = toHSBString([100, 0, intensity * 100]);
        colors.push(color);
    }

    var ambientIntensityRamp = interpolate(colors);
    debugColorRamp(ambientIntensityRamp, "ambient-intensity");
}

var skyGradients = {
    midnight: [
        [247, 74, 10],
        [259, 78, 20],
        [244, 63, 32],
        [241, 60, 43],
        [241, 65, 57],
    ],
    sunrise: [
        [221, 82, 26],
        [204, 100, 57],
        [194, 100, 82],
        [190, 36, 78],
        [241, 13, 78],
    ],
    dawn: [
        [212, 83, 76],
        [200, 73, 79],
        [194, 73, 82],
        [193, 45, 82],
        [193, 22, 81],
    ],
    midday: [
        [193, 89, 80],
        [193, 89, 80],
        [193, 89, 80],
        [193, 75, 80],
        [193, 59, 80],
    ],
    lateday: [
        [200, 70, 60],
        [200, 70, 60],
        [200, 70, 60],
        [200, 70, 60],
        [200, 70, 60],
    ],
    sunset: [
        [203, 75, 79],
        [197, 55, 89],
        [197, 55, 89],
        [345, 80, 89],
        [29, 98, 62],
    ],
    twilight: [
        [229, 69, 33],
        [240, 65, 33],
        [231, 64, 33],
        [235, 59, 61],
        [230, 51, 67],
    ],
};

var skyAmbient = {
    midnight: [248, 65, 54],
    sunrise: [217, 54, 69],
    dawn: [198, 67, 91],
    midday: [193, 89, 90],
    lateday: [200, 70, 88],
    sunset: [29, 98, 62],
    twilight: [230, 51, 67],
};