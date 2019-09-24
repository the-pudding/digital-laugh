/* global d3 */
import firebase from '@firebase/app';
import '@firebase/database';
import generateID from './generate-id';
import checkStorage from './check-storage';

const DEV = true;
let firebaseApp = null;
let firebaseDB = null;
let userData = {};
let connected = false;

const hasStorage = checkStorage('localStorage');

function formatDecimal(d) {
  return d3.format('.2f')(d);
}

function getAnswer(id) {
  if (userData.answers) return userData.answers[id];
  return null;
}

function hasAnswers() {
  return !!Object.keys(userData.answers).length;
}

function getReturner() {
  return userData.returner;
}

function setReturner() {
  userData.returner = 'true';
  if (hasStorage) window.localStorage.setItem('pudding_laugh_returner', 'true');
}

function setupUserData() {
  if (hasStorage) {
    let id = window.localStorage.getItem('pudding_laugh_id');
    if (!id) {
      id = generateID({ chron: true, numbers: false });
      window.localStorage.setItem('pudding_laugh_id', id);
    }

    let answers = window.localStorage.getItem('pudding_laugh_answers');
    answers = answers ? JSON.parse(answers) : {};

    const returner = window.localStorage.getItem('pudding_laugh_returner');

    return { id, answers, returner };
  }

  const newID = generateID();
  window.localStorage.setItem('pudding_laugh_id', newID);
  return { id: newID, answers: {}, returner: false };
}

function connect() {
  // Initialize Firebase
  const config = {
    apiKey: 'AIzaSyDUKxTphIP_3BKFIY3TRLSCi3lCE65s9yA',
    authDomain: 'digital-laugh.firebaseapp.com',
    databaseURL: 'https://digital-laugh.firebaseio.com',
    projectId: 'digital-laugh',
  };
  firebaseApp = firebase.initializeApp(config);
  firebaseDB = firebaseApp.database();
  connected = true;
}

function clear() {
  localStorage.removeItem('pudding_laugh_id');
  localStorage.removeItem('pudding_laugh_answers');
  localStorage.removeItem('pudding_laugh_finished');
  localStorage.removeItem('pudding_laugh_returner');
}

function setup() {
  if (window.location.host.includes('localhost')) clear();
  userData = setupUserData();
  if (!userData.finished) connect();
  console.log({ userData });
}

function closeConnection() {
  if (connected)
    firebaseApp.delete().then(() => {
      connected = false;
    });
}

function finish() {
  userData.finished = 'true';
  if (hasStorage) window.localStorage.setItem('pudding_laugh_finished', 'true');

  closeConnection();
}

function getSubmissions(data) {
  const output = {};
  Object.keys(data).forEach(d => {
    const g = data[d];
    // add to submit list
    if (g.store) output[d] = g;
  });
  return output;
}

function update({ key, min, max }) {
  userData.answers[key] = {
    key,
    min: min ? formatDecimal(min) : '1.00',
    max: max ? formatDecimal(max) : '5.00',
    store: min && max,
  };
  if (hasStorage)
    window.localStorage.setItem(
      'pudding_laugh_answers',
      JSON.stringify(userData.answers)
    );
  const { id, answers } = userData;
  const submissions = getSubmissions(answers);

  if (!DEV && Object.keys(submissions).length && connected) {
    firebaseDB
      .ref(id)
      .set({ answers: submissions })
      .then(() => {
        // console.log('saved');
      })
      .catch(console.log);
  }
}

export default {
  setup,
  update,
  finish,
  getAnswer,
  hasAnswers,
  setReturner,
  getReturner,
  closeConnection,
};
