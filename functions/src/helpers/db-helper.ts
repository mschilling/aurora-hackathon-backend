'use strict';

const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = class DbHelper {

  static async GetSettings() {
    const doc = await db.collection('app').doc('settings').get();
    if(!doc.exists) {
      return;
    }
    return doc.data();
  }

}

