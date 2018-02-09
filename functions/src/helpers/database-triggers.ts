'use strict';

const admin = require('firebase-admin');

export class DatabaseTriggers {
  static async UserOnlineStatusSync(event): Promise<any> {
    const status = event.data.val();
    const userRef = admin.firestore().collection('users').doc(event.params.userId);
    return userRef.set({ status: status }, { merge: true });
  }
}
