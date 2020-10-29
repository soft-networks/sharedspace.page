import React from "react";
import { displayWarning, displayProgress } from "../3D/lib/utils";
import { db } from "../../config";

import {
  setupScene,
  updateRendererSize,
  addTrash,
  setupTrashCanCallback,
  removeTrashFromScene,
} from "./trashRoom.js";
import { getIsDocumentHidden } from "../utils";

export default class trashRoom extends React.Component {
  constructor(props) {
    super(props);
    this.dbRef = "trashRoom";
    this.totalMove = 0;
    this.state = {
      numTrash: 0,
      mouseX: 0.5,
      mouseY: 0.5,
      isDown: false,
    };
    this.DBCONST = "trashRoom";
  }

  componentDidMount() {
    setupScene();
    this.talkToDatabase();
    this.cycleTrash();
    window.addEventListener("resize", updateRendererSize);
    setupTrashCanCallback(this.onTrashCollidedWithTrashCan);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", updateRendererSize);
  }

  onTrashCollidedWithTrashCan = (trash) => {
    console.log(trash);
    //Remove from DB
    let trashList = db.ref(this.DBCONST);
    let key = trash.id;
    trashList.child(key).remove();
  };

  generateNewTrash = () => {
    //Write new trash to DB

    if (getIsDocumentHidden()) {
      console.log("Generating trash...");
      let currentTrashObjects = this.state.trashObjects;
      let leftPos = this.state.mouseX;
      let topPos = this.state.mouseY;

      if (this.state.numTrash < 150) {
        let trashList = db.ref(this.DBCONST);
        let newTrashRef = trashList.push();
        let trashID = newTrashRef.key;

        var postData = { left: leftPos, top: topPos };
        var dbUpdates = {};
        dbUpdates[this.DBCONST + "/" + trashID] = postData;
        db.ref().update(dbUpdates);
      } else {
        console.log("Hidden, no trash generated");
      }
    }
  };

  // User interaction
  cycleTrash = () => {
    this.generateNewTrash();

    setTimeout(() => this.cycleTrash(), 10 * 1000);
  };

  handleMouseMove = (e) => {
    let x = e.clientX / window.innerWidth;
    let y = e.clientY / window.innerHeight;
    this.setState({ mouseX: x, mouseY: y });

    this.totalMove += 1;
    if (this.totalMove >= 250) {
      this.totalMove = 0;
      this.generateNewTrash();
    }
  };

  //Database stuff

  talkToDatabase = () => {
    let trashList = db.ref(this.DBCONST);

    trashList.on("child_added", (data) => {
      let id = data.key;
      let position = data.val();
      let leftPos = position.left;
      let topPos = position.top;
      this.setState({ numTrash: this.state.numTrash + 1 });

      addTrash(id, leftPos, topPos);
    });

    trashList.on("child_removed", (data) => {
      let id = data.key;
      this.setState({ numTrash: this.state.numTrash - 1 });
      removeTrashFromScene(id);
    });
  };

  render() {
    return (
      <div
        onMouseMove={this.handleMouseMove}
        style={{ cursor: this.state.isDown ? "grabbing" : "grab" }}
        onMouseDown={() => {
          this.setState({ isDown: true });
        }}
        onMouseUp={() => {
          this.setState({ isDown: false });
        }}
      >
        <div className="container" id="trashroom-container"></div>
        <div id="footer">
          <div className="left">
            responsibility over {this.state.numTrash} trash{" "}
          </div>
          <div className="right">move, drag</div>
        </div>
      </div>
    );
  }
}
