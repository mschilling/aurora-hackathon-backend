'use strict';

const admin = require('firebase-admin');
const geoHelper = require('geolib');
const db = admin.firestore();

export class DbHelper {


  static async getSettings(): Promise<any> {
    const doc = await db.collection('app').doc('settings').get();
    console.log(doc);
    if (!doc.exists) {
      return;
    }
    return doc.data();
  }

  static async getPointsOfInterest(): Promise<any> {
    const documentsList = [];
    await db.collection('pointsOfInterest').get().then(snapshot => {
      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
        documentsList.push(doc.data());
      });
    })
      .catch(err => {
        console.log('Error getting documents', err);
      });
    return documentsList;
  }

  static async getPointsOfInterestInRange(req): Promise<any> {
    const documentsList = [];
    console.log(req.params.lat);
    console.log(req.params.long);
    const currentLocation = {
      "latitude": req.params.lat,
      "longitude": req.params.long
    }
    console.log("current location:" + currentLocation);
    await db.collection('pointsOfInterest').get().then(snapshot => {
      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
        documentsList.push(doc.data());
        console.log("geopoint:" + doc.data().geoLocation._latitude);
        console.log(geoHelper.getDistanceSimple(currentLocation, doc.data().geoLocation));
      });
    })
      .catch(err => {
        console.log('Error getting documents', err);
      });
    return documentsList;
  }

}

