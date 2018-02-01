'use strict';

const admin = require('firebase-admin');
const db = admin.firestore();

export class DbHelper {

  static async GetSettings(): Promise<any> {
    const doc = await db.collection('app').doc('settings').get();
    console.log(doc);
    if(!doc.exists) {
      return;
    }
    return doc.data();
  }

}

