'use strict';

require('dotenv').config({ silent: true });

const admin = require("firebase-admin");
require('./firebase-init');

const clientId = process.env.FOURSQUARE_CLIENT_ID;
const secretId = process.env.FOURSQUARE_SECRET_ID;

const foursquare = require('node-foursquare-venues')(clientId, secretId, null, null);

const GeoFire = require('geofire');

const query = {};
// query.ll = "52.50,6.09";
// query.radius = 200;
query.near = "Zwolle, Netherlands";
query.intent = "browse";
query.categoryId = [
  '4bf58dd8d48988d181941735', // Museum
].join(',')

foursquare.venues.search(query, updatePois);

function updatePois(error, data) {

  const dbRef = admin.firestore().collection('pointsOfInterest');

  const firebaseRef = admin.database().ref('locations');
  const geoFire = new GeoFire(firebaseRef);



  const actions = [];
  for (let item of data.response.venues) {
    // console.dir(item, {
    //   depth: 3,
    //   colors: true
    // });

    const poi = {
      id: item.id,
      name: item.name,
      description: `${item.name}, ${item.location.address}`,
      geoLocation: new admin.firestore.GeoPoint(item.location.lat, item.location.lng)
    }
    // actions.push(dbRef.doc(poi.id).set(poi, { merge: false }));
    // actions.push(geoFire.set(item.id, [item.location.lat, item.location.lng]));
  }

  Promise.all(actions)
    .then( () => 'Ready :-)' );
}
