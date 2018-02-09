'use strict'

const admin = require("firebase-admin");
const serviceAccount = require('./creds.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aurora-hackathon.firebaseio.com"
});
