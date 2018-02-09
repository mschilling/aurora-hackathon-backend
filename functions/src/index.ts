import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as moment from 'moment';

admin.initializeApp(functions.config().firebase);

import { DbHelper as db} from './helpers/db-helper';
import { DatabaseTriggers as triggers } from './helpers/database-triggers';

const express = require('express');
const cors = require('cors');
const Assistant = require('actions-on-google').ApiAiAssistant;

const app = express();
const router = express.Router();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

router.get('/ping', async (req, res) => res.json({ result: 'hoi' }) );

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

const know = admin.database().ref('/animal-knowledge');
const graph = know.child('graph');

// Dialogflow Intent names
const PLAY_INTENT = 'play';
const NO_INTENT = 'discriminate-no';
const YES_INTENT = 'discriminate-yes';
const GIVEUP_INTENT = 'give-up';
const LEARN_THING_INTENT = 'learn-thing';
const LEARN_DISCRIM_INTENT = 'learn-discrimination';
const FIND_MONUMENT_INTENT = 'find-monument';

// Contexts
const WELCOME_CONTEXT = 'welcome';
const QUESTION_CONTEXT = 'question';
const GUESS_CONTEXT = 'guess';
const MONUMENT_CONTEXT = 'monument';
const LEARN_THING_CONTEXT = 'learn-thing';
const LEARN_DISCRIM_CONTEXT = 'learn-discrimination';
const ANSWER_CONTEXT = 'answer';

// Context Parameters
const ID_PARAM = 'id';
const BRANCH_PARAM = 'branch';
const LEARN_THING_PARAM = 'learn-thing';
const GUESSABLE_THING_PARAM = 'guessable-thing';
const LEARN_DISCRIMINATION_PARAM = 'learn-discrimination';
const ANSWER_PARAM = 'answer';
const QUESTION_PARAM = 'question';

exports.assistantcodelab = functions.https.onRequest((request, response) => {
    console.log('headers: ' + JSON.stringify(request.headers));
    console.log('body: ' + JSON.stringify(request.body));
 
    const assistant = new Assistant({request: request, response: response});
 
    let actionMap = new Map();
    actionMap.set(PLAY_INTENT, play);
    actionMap.set(NO_INTENT, discriminate);
    actionMap.set(YES_INTENT, discriminate);
    actionMap.set(FIND_MONUMENT_INTENT, findMonument)
    actionMap.set(GIVEUP_INTENT, giveUp);
    actionMap.set(LEARN_THING_INTENT, learnThing);
    actionMap.set(LEARN_DISCRIM_INTENT, learnDiscrimination);
    assistant.handleRequest(actionMap);
 
    function play(assistant) {
        console.log('play');
        const first_ref = know.child('first');
        first_ref.once('value', snap => {
            const first = snap.val();
            console.log(`First: ${first}`);
            graph.child(first).once('value', snap => {
                const speech = `<speak>
 Great! Think of an animal, but don't tell me what it is yet. <break time="3"/>
 Okay, my first question is: ${snap.val().q}
 </speak>`;
 
                const parameters = {};
                parameters[ID_PARAM] = snap.key;
                assistant.setContext(QUESTION_CONTEXT, 5, parameters);
                assistant.ask(speech);
            });
        });
    }
 
    function discriminate(assistant) {
        const priorQuestion = assistant.getContextArgument(QUESTION_CONTEXT, ID_PARAM).value;
 
        const intent = assistant.getIntent();
        let yes_no;
        if (YES_INTENT === intent) {
            yes_no = 'y';
        } else {
            yes_no = 'n';
        }
 
        console.log(`prior question: ${priorQuestion}`);
        
        //database structured as binairy tree, start
        //                                         |
        //                                        /|\
        //                                       N Q Y      No Question Yes
        //                                       |   |
        //                                       Q   A      No resulting in an other question, yes resulting in an awnser (guess)

        graph.child(priorQuestion).once('value', snap => {
            const next = snap.val()[yes_no];
            graph.child(next).once('value', snap => {
                const node = snap.val();
                if (node.q) {
                    //ask question if availble
                    const speech = node.q; // q for question
                    const parameters = {};
                    parameters[ID_PARAM] = snap.key;
                    assistant.setContext(QUESTION_CONTEXT, 5, parameters);
                    assistant.ask(speech);
                } else {
                    //take a guess if no question availble
                    const guess = node.a;//a for awnser
                    const speech = `Is it a ${guess}?`;
 
                    const parameters = {};
                    parameters[ID_PARAM] = snap.key;
                    parameters[BRANCH_PARAM] = yes_no;
                    assistant.setContext(GUESS_CONTEXT, 5, parameters);
                    assistant.ask(speech);
                }
            });
        });
    }
    
    function findMonument(assistant) {
        //const priorQuestion = assistant.getContextArgument(MONUMENT_CONTEXT, ID_PARAM).value;
        const speech = 'I\'m trying to find some monuments for you!';

        console.log('executing find monument!');

        assistant.ask(speech);
    }

    function giveUp(assistant) {
        const priorQuestion = assistant.getContextArgument(QUESTION_CONTEXT, ID_PARAM).value;
        const guess = assistant.getContextArgument(GUESS_CONTEXT, ID_PARAM).value;
        console.log(`Priorq: ${priorQuestion}, guess: ${guess}`);
 
        const speech = 'I give up!  What are you thinking of?';
 
        const parameters = {};
        parameters[LEARN_THING_PARAM] = true;
        assistant.setContext(LEARN_THING_CONTEXT, 2, parameters);
        assistant.ask(speech);
    }
 
    function learnThing(assistant) {
        const priorQuestion = assistant.getContextArgument(QUESTION_CONTEXT, ID_PARAM).value;
        const guess = assistant.getContextArgument(GUESS_CONTEXT, ID_PARAM).value;
        const branch = assistant.getContextArgument(GUESS_CONTEXT, BRANCH_PARAM).value;
        const new_thing = assistant.getArgument(GUESSABLE_THING_PARAM);
 
        console.log(`Priorq: ${priorQuestion}, guess: ${guess}, branch: ${branch}, thing: ${new_thing}`);
 
        const q_promise = graph.child(priorQuestion).once('value');
        const g_promise = graph.child(guess).once('value');
        Promise.all([q_promise, g_promise]).then(results => {
            const q_snap = results[0];
            const g_snap = results[1];
 
            // TODO codelab-1: set the proper contexts to learn the differentiation
            const speech = `I don't know how to tell a ${new_thing} from a ${g_snap.val().a}!`;
            assistant.ask(speech);
        });
    }
 
    function learnDiscrimination(assistant) {
        const priorQuestion = assistant.getContextArgument(QUESTION_CONTEXT, ID_PARAM).value;
        const guess = assistant.getContextArgument(GUESS_CONTEXT, ID_PARAM).value;
        const branch = assistant.getContextArgument(GUESS_CONTEXT, BRANCH_PARAM).value;
        const answer =  assistant.getContextArgument(ANSWER_CONTEXT, ANSWER_PARAM).value;
        const question = assistant.getArgument(QUESTION_PARAM);
 
        console.log(`Priorq: ${priorQuestion}, answer: ${answer}, guess: ${guess}, branch: ${branch}, question: ${question}`);
 
        const a_node = graph.push({
            a: answer
        });
 
        const q_node = graph.push({
            q: `${question}?`,
            y: a_node.key,
            n: guess
        });
 
        let predicate = 'a';
        if (['a','e','i','o','u'].indexOf(answer.charAt(0)) != -1) {
            predicate = 'an';
        }
 
        const update = {};
        update[branch] = q_node.key;
        graph.child(priorQuestion).update(update).then(() => {
            // TODO codelab-2: give the user an option to play again or end the conversation
            const speech = "Ok, thanks for the information!";
            assistant.ask(speech);
        });
    }
 });
// Sync online status of users between Firestore and Realtime Database
exports.syncUserOnlineStatus = functions.database.ref('/users/{userId}/status')
    .onWrite(triggers.UserOnlineStatusSync);
