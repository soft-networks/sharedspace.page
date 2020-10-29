import React from "react";
import "../core.css";
import { displayProgress, displayWarning } from "./lib/utils";
import { isMobile } from "react-device-detect";

import {
  addMyselfToDB,
  setupDB,
  setupNPCFromDB,
  writeMyPosToDB,
  writeMyStateToDB,
  forceRemovePlayer,
} from "./lib/multiplayer";

import {
  setupScene,
  updateNPCCursor,
  addNPCCursor,
  removeNPCCursor,
  moveMyCursor,
  updateLightForCursor,
} from "./lightRoom";

export default class lightRoom extends React.Component {
  constructor(props) {
    super(props);
    this.scrollElem = React.createRef();
    this.DBCONST = "lightRoom";
  }

  componentDidMount() {
    setupScene();
    setupDB(this.DBCONST);
    this.myKey = addMyselfToDB();
    setupNPCFromDB(addNPCCursor, removeNPCCursor, updateNPCCursor, {
      light: this.updateNPCLight,
    });
    let myLight = updateLightForCursor("me", 0, 0);
    writeMyStateToDB("light", {
      hue: myLight["hue"],
      saturation: myLight["saturation"],
    });
  }

  componentWillUnmount() {
    forceRemovePlayer(this.myKey);
  }

  //When my mouse moves, move my character and update DB for other rooms
  handleMouseMove = (e) => {
    var mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    var mouseZ = -(e.clientY / window.innerHeight) * 2 + 1;
    var myPos = moveMyCursor(mouseX, mouseZ);
    writeMyPosToDB(myPos);
  };

  updateNPCLight = (id, value) => {
    updateLightForCursor(id, value["hue"], value["saturation"]);
  };

  handleScroll = (e, override) => {
    let el = e.target;
    let scrollTopP = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    let adjustedScrollTopP = (scrollTopP - 0.2) / 0.8;
    let scrollLeftP = (el.scrollLeft + el.clientWidth) / el.scrollWidth;
    let adjustedScrollLeftP = (scrollLeftP - 0.2) / 0.8;
    let myLight = updateLightForCursor(
      "me",
      adjustedScrollTopP,
      adjustedScrollLeftP
    );
    writeMyStateToDB("light", {
      hue: myLight["hue"],
      saturation: myLight["saturation"],
    });
  };

  render() {
    return (
      <div
        style={{ cursor: "none" }}
        onMouseMove={this.handleMouseMove}
        onClick={(e) => {
          if (isMobile) this.handleMouseMove(e);
        }}
      >
        <div className="container"> </div>
        <div id="footer">
          <div className="left">visibility</div>
          <div className="right">
            {!isMobile && "move mouse"} {isMobile && "click"}, scroll left/right
          </div>
        </div>
        <div
          id="scroll-container"
          className="horizontal"
          ref={this.scrollElem}
          onScroll={this.handleScroll}
        >
          <div id="scroll-element"> </div>{" "}
        </div>{" "}
      </div>
    );
  }
}
