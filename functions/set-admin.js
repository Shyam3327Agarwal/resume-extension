require('dotenv').config();
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const uid = 'CW1w3T6z8ZY83QOJkyDr546lYQp2';

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Admin claim set successfully for UID: ${uid}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed to set admin claim:', err);
    process.exit(1);
  });
