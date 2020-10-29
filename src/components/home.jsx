import React from "react";
import { BrowserRouter as Router, Link, Switch } from "react-router-dom";

import {
  addMyselfToDB,
  setupDB,
  setupNPCFromDB,
  writeMyPosToDB,
  forceRemovePlayer,
} from "./3D/lib/multiplayer";

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userList: {},
    };
    this.myKey = "NEWKEY";
    this.DBCONST = "home";
  }

  componentDidMount() {
    setupDB(this.DBCONST);
    this.myKey = addMyselfToDB();
    this.addNewUser(this.myKey);
    setupNPCFromDB(this.addNewUser, this.removeUser, this.moveCursor);
  }

  componentWillUnmount() {
    forceRemovePlayer(this.myKey);
  }

  addNewUser = (key) => {
    let updatedUserList = this.state.userList;
    let userPos = { left: 50, top: 50 };

    updatedUserList[key] = userPos;
    this.setState({ userList: updatedUserList });
  };

  removeUser = (key) => {
    let updatedUserList = this.state.userList;
    if (updatedUserList[key]) {
      delete updatedUserList[key];
    }
    this.setState({ userList: updatedUserList });
  };

  renderUsers = () => {
    let divList = [];
    let userList = this.state.userList;

    Object.keys(userList).forEach((userKey) => {
      let user = userList[userKey];
      divList.push(
        <div
          style={{ top: user.top + "%", left: user.left + "%" }}
          key={userKey}
        >
          {" "}
        </div>
      );
    });
    return divList;
  };

  moveCursor = (key, x, y) => {
    let updatedUserList = this.state.userList;
    if (updatedUserList[key] && key !== this.myKey) {
      let userPos = { left: x, top: y };
      updatedUserList[key] = userPos;
      this.setState({ userList: updatedUserList });
    }
  };

  handleMouseMove = (e) => {
    var xPercent = (100 * e.clientX) / window.innerWidth;
    var yPercent = (100 * e.clientY) / window.innerHeight;
    writeMyPosToDB({ x: xPercent, y: yPercent, z: 0 });
    this.moveCursor(this.myKey, xPercent, yPercent);

    //Then just update it here, because we dont want the DB to update it
    let updatedUserList = this.state.userList;
    let userPos = { left: xPercent, top: yPercent };
    updatedUserList[this.myKey] = userPos;
    this.setState({ userList: updatedUserList });
  };

  render() {
    return (
      <div style={{ cursor: "none" }}>
        <div id="users">{this.renderUsers()}</div>
        <div className="container" onMouseMove={this.handleMouseMove}>
          <div className="header" style={{ padding: "24px" }}></div>
          <Switch>
            <ul>
              <li style={{ top: "20%", left: "30%" }}>
                <Link to="/grass"> movement </Link>
              </li>
              <li style={{ top: "15%", left: "65%" }}>
                <Link to="/sun"> time </Link>
              </li>
              <li style={{ top: "35%", left: "65%" }}>
                <Link to="/chair"> ownership </Link>
              </li>
              <li style={{ top: "65%", left: "35%" }}>
                <Link to="/light"> visibility </Link>
              </li>
              <li style={{ top: "85%", left: "15%" }}>
                <Link to="/trash"> responsibility </Link>
              </li>
              <li style={{ top: "-24px", left: "90%" }}>
                <Link to="/about"> describe this </Link>
              </li>
              <li style={{ top: "60%", left: "60%" }}>
                <Link to="/smile"> your happiness </Link>
              </li>
            </ul>
          </Switch>
        </div>
        <div id="footer">
          <div className="left">an invitation to perform</div>
          <div className="right">move/click</div>
        </div>
      </div>
    );
  }
}
