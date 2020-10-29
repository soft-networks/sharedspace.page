import React from "react";
import Iframe from "react-iframe";
import "../core.css";

export default class journalRoom extends React.Component {
  render() {
    return (
      <div>
        <div className="container">
          <Iframe
            url="https://docs.google.com/presentation/d/1X4FTXOlyZ_B-3oaL8EmiJ5CNh-nX_CJTxJDIpH3ro2E/edit"
            width="100%"
            height="100%"
            id="journalIframe"
            className="myClassname"
            display="initial"
            position="relative"
          />
        </div>
        <div id="footer">
          <div className="left">
            this page is a shared space about this shared space
          </div>
          <div className="right"></div>
        </div>
      </div>
    );
  }
}
