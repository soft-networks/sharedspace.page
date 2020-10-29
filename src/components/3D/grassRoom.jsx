import React from "react";
import "../core.css";
import { db } from "../../config";
import { displayProgress, displayWarning } from "./lib/utils";

import {
  setupDB,
  setupStateSyncFromDB,
  writeStateToDB,
} from "./lib/multiplayer";

import {
  setupScene,
  updateSharedGrassSpeed,
  updateMyGrassCursor,
} from "./grassRoom";

export default class grassRoom extends React.Component {
  constructor(props) {
    super(props);
    this.scrollElem = React.createRef();
    this.DBCONST = "grassZone";
  }

  componentDidMount() {
    setupScene();
    setupDB(this.DBCONST);
    setupStateSyncFromDB("scroll", this.onDBScrollChange, false);
  }

  //When my mouse moves, move my character and update DB for other rooms
  handleMouseMove = (e) => {
    var mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    var mouseZ = -(e.clientY / window.innerHeight) * 2 + 1;
    updateMyGrassCursor(mouseX, mouseZ);
  };

  onDBScrollChange = (dbScrollPercent) => {
    if (dbScrollPercent != undefined) {
      displayProgress("Scroll moved.. updating room", [dbScrollPercent]);
      updateSharedGrassSpeed(dbScrollPercent);
      let el = this.scrollElem.current;
      let scrollTopVal = dbScrollPercent * el.scrollHeight - el.clientHeight;
      this.scrollElem.current.scrollTop = scrollTopVal;
    }
  };

  //When I change scroll, update the DB and scene state
  handleScroll = (e) => {
    let el = e.target;
    let scrollP = (el.scrollTop + el.clientHeight) / el.scrollHeight;
    writeStateToDB("scroll", scrollP);
    updateSharedGrassSpeed(scrollP); //Q: is this necessary, or should we just let it come from DB?
  };

  render() {
    return (
      <div onClick={this.handleMouseMove} style={{ cursor: "crosshair" }}>
        <div className="container"> </div>{" "}
        <div id="footer">
          <div className="left">movement</div>
          <div className="right">scroll up/down, click</div>
        </div>{" "}
        <div
          id="scroll-container"
          ref={this.scrollElem}
          onScroll={this.handleScroll}
        >
          <div id="scroll-element"> </div>{" "}
        </div>{" "}
      </div>
    );
  }
}
