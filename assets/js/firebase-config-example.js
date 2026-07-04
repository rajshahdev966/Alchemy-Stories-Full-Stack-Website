// Firebase configuration credentials
// REPLACE THESE PLACEHOLDERS WITH YOUR REAL FIREBASE PROJECT DETAILS ONCE READY
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase if loaded
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}
