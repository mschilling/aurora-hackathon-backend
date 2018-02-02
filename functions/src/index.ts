import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp(functions.config().firebase);

import { DbHelper as db} from './helpers/db-helper';

const express = require('express');
const cors = require('cors');

const app = express();
const router = express.Router();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/ping', async (req, res) => res.json({ result: 'pong' }) );

// Retrieve App settings from DB
router.get('/settings', async (req, res) => res.json( await db.GetSettings() ) );

app.use('/v1', router);

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app);
