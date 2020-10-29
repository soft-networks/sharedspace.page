# sharedspace.page

## overview

This Github project is powering a series of sketches hosted at [sharedspace.page](https://sharedspace.page/). These sketches are inquiries into forms of shared space, and intimacy online.

From a technical perspective, the project is powered primarily with React and Firebase Realtime DB. To power the front end, it uses THREE.JS for 3D environments, and Matter.JS for 2D physics. Since these are sketches, there are still some bugs, todos, and not much documentation.

## understanding the project

_major files_
The major files to look at are `index.js` and `/src/components/home.jsx` which setup routes and link to all sketches. Most sketches have a `*Room.jsx` component, that contains the React and Firebase code, and a `*Room.js` component that powers the graphics component.

_multiplayer functionality_
`src/components/3D/lib/multiplayer.js` contains a set of general purpose functions that abstract most of the real-time synchronous / multiplayer functions on the site. They contain functions to manage syncing client and user state to the database (position and arbitrary values), as well as syncing state from other clients and the database back to the client. This powers all the real time cursors (eg: /home, /light), as well as syncing state for rooms (eg: /sun).

_other files of interest_

- Color gradients for sky: A custom algorithm for coloring the sky over a day. in `/components/lib/skyColors.js`.
- Grass shader: in `/components/lib/grassShader.js`. Based on real time grass shader by eddie lee [link](https://www.eddietree.com/grass).

## running it locally

If you want to run this locally, you need to add a config.js file at `src/components/config.js`. This file needs to point to a [firebase](firebase) realtime database instance. The file should look like this

```
import firebase from "firebase";

//get config from firebase
const firebaseConfig = {
    apiKey: ...",
    authDomain: ...,
    databaseURL: ...,
    projectId: ...,
    messagingSenderId: ...,
    appId: ...
};

//initialize and export
firebase.initializeApp(firebaseConfig);
export const db = firebase.database();
export default firebaseConfig;
```

After that you can use the regular create-react-app commands to get things going.

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
