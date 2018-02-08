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
    const currentLocation = {
      "latitude": req.params.lat,
      "longitude": req.params.long
    }
    const range = req.params.range;
    console.log("current location:" + currentLocation);
    await db.collection('pointsOfInterest').get().then(snapshot => {
      snapshot.forEach(doc => {

        console.log(doc.id, '=>', doc.data());

        const monumentLocation = {
          "latitude": doc.data().geoLocation._latitude,
          "longitude": doc.data().geoLocation._longitude
        }
        if(geoHelper.getDistanceSimple(currentLocation, monumentLocation) < range){
          documentsList.push(doc.data());
          console.log("added monument to list")
        } 

        console.log(geoHelper.getDistanceSimple(currentLocation, monumentLocation) + "m from current location to monument location");
      });
    })
      .catch(err => {
        console.log('Error getting documents', err);
      });
    return documentsList;
  }

}

