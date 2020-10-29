var colorSwitcherOn = false,
  windowSizeCalc = true;

//TODO: it can't actually be switched to false lmao... it always works.
export function setWindowSizeCalc(option) {
  windowSizeCalc = option;
  if (windowSizeCalc) setUpWindowSizeCalc();
}

function setUpWindowSizeCalc() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  let vw = window.innerWidth * 0.01;
  document.documentElement.style.setProperty("--vw", `${vw}px`);

  window.addEventListener("resize", () => {
    // We execute the same script as before
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);

    let vw = window.innerWidth * 0.01;
    document.documentElement.style.setProperty("--vw", `${vw}px`);
  });
}
setUpWindowSizeCalc();

//Drag to switch colors in variables called --FGColor and --BGColor
export function setColorSwitcher(option) {
  colorSwitcherOn = option;
  if (colorSwitcherOn) {
    setupColorSwitcher();
  }
}

function setupColorSwitcher() {
  var _x = 20;
  var _y = 50;
  var mousePress = false;

  function changeColor(currentX, currentY) {
    if (mousePress) {
      _x = Math.round(((20 * currentX) / window.innerWidth) * 255);
      _y = Math.round(((20 * currentY) / window.innerHeight) * 255);
    }
  }

  function updateColors() {
    let root = document.documentElement;
    root.style.setProperty("--FGFill", "hsl(" + _x + ",100%,50%)");
    root.style.setProperty("--BGFill", "hsl(" + _y + ",100%,50%)");
    requestAnimationFrame(updateColors);
  }
  updateColors();

  document.addEventListener("mousemove", (e) =>
    changeColor(e.clientX, e.clientY)
  );
  document.addEventListener("mousedown", () => (mousePress = true));
  document.addEventListener("mouseup", () => (mousePress = false));
  document.addEventListener("touchmove", (e) =>
    changeColor(e.touches[0].clientX, e.touches[0].clientY)
  );
  document.addEventListener("touchend", () => (mousePress = false));
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length > 1) {
      //Do nothing its a multi-tap
    } else {
      mousePress = true;
    }
  });
}

//Functions that help you figure out if you're backgrounded
//From: https://blog.sethcorker.com/harnessing-the-page-visibility-api-with-react
export function getBrowserDocumentHiddenProp() {
  if (typeof document.hidden !== "undefined") {
    return "hidden";
  } else if (typeof document.msHidden !== "undefined") {
    return "msHidden";
  } else if (typeof document.webkitHidden !== "undefined") {
    return "webkitHidden";
  }
}
export function getIsDocumentHidden() {
  return !document[getBrowserDocumentHiddenProp()];
}
