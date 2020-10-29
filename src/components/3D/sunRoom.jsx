import React from "react";
import "../core.css";
import { db } from "../../config";
import { displayProgress, displayWarning } from "./lib/utils";
import { setup, updateSunPos } from "./sunRoom.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  setupStateSyncFromDB,
  writeStateToDB,
  setupDB,
} from "./lib/multiplayer";

export default class sunRoom extends React.Component {
  constructor(props) {
    super(props);
    this.scrollElem = React.createRef();
    this.simulatedSunPercent = 0.0;
    this.fgElem = React.createRef();
    this.state = { scrollPercent: 0.0 };
  }

  componentDidMount() {
    setup();
    setupDB("sunRoom");
    setupStateSyncFromDB("scroll", this.onDBScrollChange, false);
    //this.simulateSunMove();
  }

  onDBScrollChange = (dbScrollPercent) => {
    //update dom
    if (
      dbScrollPercent !== undefined &&
      dbScrollPercent !== this.state.scrollPercent
    ) {
      updateSunPos(dbScrollPercent);
      let actualScrollP = dbScrollPercent * 0.8 + 0.2;
      let el = this.scrollElem.current;
      let scrollTopVal = actualScrollP * el.scrollHeight - el.clientHeight;
      this.scrollElem.current.scrollTop = scrollTopVal;
    }
  };

  handleScroll = (e) => {
    let el = e.target;
    let scrollP = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    let adjustedScrollP = (scrollP - 0.2) / 0.8;
    this.setState({ scrollP: adjustedScrollP });
    displayProgress("Scroll updated " + adjustedScrollP);
    updateSunPos(adjustedScrollP);
    writeStateToDB("scroll", adjustedScrollP);
  };

  //TODO: Make the scroll container and the "Canvas FG its own fucking components?"
  render() {
    return (
      <div>
        <div className="container" id="sunroom-container">
          <div
            id="canvas-foreground"
            style={{
              width: "600%",
              height: "100%",
              flexDirection: "row",
              left: -this.state.scrollP * 500 + "%",
              top: "-100%",
              opacity: "0.8",
            }}
          >
            <div
              className="fg-img"
              style={{
                backgroundImage: "url(/assets/sky/29-star.png)",
                backgroundRepeat: "round",
                backgroundSize: "29% auto",
              }}
            ></div>
            <div
              className="fg-img"
              style={{
                backgroundImage:
                  "url(/assets/sky/29-star.png), url(/assets/sky/V2/CLOUD-CIRRUS.png) ",
                backgroundRepeat: "repeat, no-repeat",
                backgroundSize: "29% auto, contain",
              }}
            ></div>
            <div
              className="fg-img"
              style={{
                backgroundImage:
                  "url(/assets/sky/V2/29-cloud.png), url(/assets/sky/V2/CLOUD-CUMULO.png)",
                backgroundRepeat: "no-repeat, no-repeat",
                backgroundSize: "20% auto, contain",
                backgroundPosition: "right, center",
              }}
            ></div>
            <div
              className="fg-img"
              style={{
                backgroundImage: "url(/assets/sky/V2/CLOUD-CIRRUS.png)",
                backgroundRepeat: "no-repeat",
                backgroundSize: "50%",
                backgroundPosition: "top",
              }}
            ></div>
            <div className="fg-img"></div>
            <div
              className="fg-img"
              style={{
                backgroundImage: "url(/assets/sky/29-star.png)",
                backgroundRepeat: "round",
                backgroundSize: "29% auto",
              }}
            ></div>
          </div>
        </div>
        <div id="footer">
          {" "}
          <div id="footer">
            <div className="left">time </div>
            <div className="right">scroll up/down</div>
          </div>{" "}
        </div>
        <div
          id="scroll-container"
          ref={this.scrollElem}
          onScroll={this.handleScroll}
        >
          <div id="scroll-element"> </div>
        </div>
      </div>
    );
  }

  // Test functions
  simulateSunMove() {
    this.simulatedSunPercent += 0.05;
    if (this.simulatedSunPercent >= 1.0) {
      this.simulatedSunPercent = 0;
    }
    updateSunPos(this.simulatedSunPercent);
    setTimeout(() => this.simulateSunMove(), 500);
  }
}
