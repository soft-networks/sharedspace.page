import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";

import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Home from "./components/home.jsx";
import SmileyGrid from "./components/HTML/smileyRoom";
import chairRoom from "./components/3D/chairRoom.jsx";
import grassRoom from "./components/3D/grassRoom.jsx";
import sunRoom from "./components/3D/sunRoom.jsx";
import lightRoom from "./components/3D/lightRoom.jsx";
import trashRoom from "./components/HTML/trashRoom.jsx";
import aboutRoom from "./components/HTML/aboutRoom.jsx";

import "./components/core.css";

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path="/smile" component={SmileyGrid} />{" "}
        <Route path="/grass" component={grassRoom} />{" "}
        <Route path="/sun" component={sunRoom} />{" "}
        <Route path="/chair" component={chairRoom} />{" "}
        <Route path="/light" component={lightRoom} />{" "}
        <Route path="/trash" component={trashRoom} />{" "}
        <Route path="/about" component={aboutRoom} />{" "}
        <Route path="/about" component={aboutRoom} />{" "}
        <Route path="/" exact component={Home} />{" "}
      </Switch>{" "}
    </Router>{" "}
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
