// Firebase App (the core Firebase SDK) is always required and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/firestore";

const app = firebase.app();
const db = firebase.firestore();

db.collection("sms")
  .add({
    originator: "FunFacts",
    body: "marcel you are a great tester",
    recipients: [window.user.phoneNumber],
  })
  .then(function(docRef) {
    console.log("Document written with ID: ", docRef.id);
  })
  .catch(function(error) {
    console.error("Error adding document: ", error);
  });
