'use strict';

const admin = require("firebase-admin");
require('./firebase-init');

const db = require('../lib/helpers/db-helper').DbHelper;

(async () => {

  const settings = await db.getSettings();
  console.log(settings);

})();


