import React from "react";
import "../core.css";
import "./smileyRoom.css";
import { setColorSwitcher, setWindowSizeCalc } from "../utils.js";

export default class SmileyGrid extends React.Component {
  constructor(props) {
    super(props);
    this.contentRef = React.createRef();
    this.state = {
      alignment: "row",
    };
  }

  //Note: I want to find a much better way to do this, than forcing a refs update all the way through
  changeLayout = () => {
    var newAlignment = this.state.alignment === "row" ? "col" : "row";
    this.setState({ alignment: newAlignment });
  };

  componentDidMount() {
    setWindowSizeCalc(true);
    setColorSwitcher(true);
    document.addEventListener("keypress", (e) => {
      if (e.code === "Space") this.changeLayout();
    });
  }

  render() {
    return (
      <div
        id="smileyGrid-root"
        className={"flex-container border " + this.state.alignment}
      >
        <ContentBox kids="1" ref={this.contentRef} />{" "}
      </div>
    );
  }
}

//Long term content box should technically hold anything, just replace <Face/> with whatever you want it to be
class ContentBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numChildren: this.props.kids,
    };
  }

  splitMe = (e) => {
    e.stopPropagation();
    var min = parseInt(this.state.numChildren) + 1;
    var rand = min + Math.floor(Math.random() * 4);
    this.setState({
      numChildren: rand,
    });
  };

  getChildren = () => {
    if (this.state.numChildren == 1) {
      return <Face />;
    } else {
      var faces = [];
      // var numKids = this.state.numChildren -1 -- if you make it this way, it becomes fractally, enforcing nesting kids
      var numKids = 1;
      for (var i = 0; i < this.state.numChildren; i++) {
        faces.push(<ContentBox key={i} kids={numKids} />);
      }
      return faces;
    }
  };

  render() {
    return (
      <div
        className="flex-container flex-child border"
        onClick={(e) => this.splitMe(e)}
      >
        {this.getChildren()}{" "}
      </div>
    );
  }
}

class Face extends React.Component {
  render() {
    return (
      <div
        className="flex-content border face"
        style={{ borderRadius: Math.floor(Math.random() * 40) + 10 + "%" }}
      >
        <div className="smile"> </div>{" "}
      </div>
    );
  }
}

/* 

        Notes for myself:
            Make the row/column stuff change
            Make the colors change
        */
