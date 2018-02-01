import * as functions from 'firebase-functions';

const express = require('express');
const cors = require('cors');

const app = express();
const router = express.Router();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/ping', async (req, res) => res.json({ result: 'pong' }) );

app.use('/v1', router);

// Expose Express API as a single Cloud Function:
exports.api = functions.https.onRequest(app);
