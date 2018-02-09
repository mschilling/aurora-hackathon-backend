import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';

admin.initializeApp(functions.config().firebase);

import { DbHelper as db} from './helpers/db-helper';
import { DatabaseTriggers as triggers } from './helpers/database-triggers';

const express = require('express');
const cors = require('cors');

const app = express();
const router = express.Router();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/ping', async (req, res) => res.json({ result: 'pong' }) );

router.get('/time', async (req, res) => res.json({ time: moment().toISOString() }) );

// Retrieve App settings from DB
router.get('/settings', async (req, res) => res.json( await db.getSettings() ) );

// Retrieve all Points of Interest
router.get('/pointsOfInterest', async (req, res) => res.json( await db.getPointsOfInterest() ) );

// Retrieve Points of interest within range
router.get('/pointsOfInterest/lat/:lat/long/:long/range/:range', async (req, res) => res.json( await db.getPointsOfInterestInRange(req) ) );

app.use('/v1', router);

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app);

// Sync online status of users between Firestore and Realtime Database
exports.syncUserOnlineStatus = functions.database.ref('/users/{userId}/status')
    .onWrite(triggers.UserOnlineStatusSync);
