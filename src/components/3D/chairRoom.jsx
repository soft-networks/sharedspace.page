import React from "react";
import "../core.css";
import { db } from "../../config";
import { displayProgress, displayWarning } from "./lib/utils";
import { isMobile } from "react-device-detect";

import {
  addMyselfToDB,
  setupDB,
  setupNPCFromDB,
  writeMyPosToDB,
  writeStateToDB,
  setupStateSyncFromDB,
  forceRemovePlayer,
} from "./lib/multiplayer";

import {
  setupScene,
  updateMyCursor,
  updateNPCCursor,
  addNPCCursor,
  removeNPCCursor,
  getChairOccupation,
  setChairOccupation,
  isChairOccupied,
} from "./chairRoom";

export default class chairRoom extends React.Component {
  constructor(props) {
    super(props);

    this.scrollElem = React.createRef();

    this.state = {
      scrollPercent: 0,
      chairOccupied: false,
    };

    this.myKey = "NEWKEY";
    this.DBCONST = "chairRoom/";
  }

  componentDidMount() {
    setupScene();
    setupDB(this.DBCONST);
    this.myKey = addMyselfToDB();
    setupNPCFromDB(addNPCCursor, removeNPCCursor, updateNPCCursor);
    setupStateSyncFromDB(
      "chairOccupation",
      this.handleDBOccupationChange,
      true
    );
    //this.testNPC(1);
  }

  componentWillUnmount() {
    forceRemovePlayer(this.myKey);
  }

  handleDBOccupationChange = (value) => {
    //If we get a value that is this key, then just ignore it
    if (value !== this.myKey) {
      setChairOccupation(value);
      let occupied = isChairOccupied();
      this.setState({ chairOccupied: occupied });
    }
  };

  handleMouseMove = (e) => {
    var mouseXPercent = (e.clientX / window.innerWidth) * 2 - 1;
    var mouseZPercent = -(e.clientY / window.innerHeight) * 2 + 1;
    var myPos = updateMyCursor(mouseXPercent, mouseZPercent);
    if (myPos) writeMyPosToDB(myPos);

    //Write to DB in case anything has changed
    var chairOccuptionState = getChairOccupation();
    if (chairOccuptionState === "me") {
      writeStateToDB("chairOccupation", this.myKey);
    } else if (chairOccuptionState == false) {
      writeStateToDB("chairOccupation", false);
    }
    let occupied = isChairOccupied();
    this.setState({ chairOccupied: occupied });
  };

  render() {
    return (
      <div onClick={this.handleMouseMove}>
        <div className="container"> </div>
        <div id="footer">
          <div className="left">
            an {this.state.chairOccupied ? "occupied" : "unoccupied"} chair
          </div>
          <div className="right">click</div>
        </div>
      </div>
    );
  }
}
