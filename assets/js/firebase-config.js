// Firebase configuration credentials
// REPLACE THESE PLACEHOLDERS WITH YOUR REAL FIREBASE PROJECT DETAILS ONCE READY
const firebaseConfig = {
  apiKey: "AIzaSyAZI2NeqnT1b5AICHljclRjVUeV9KbNk9I",
  authDomain: "alchemy-stories-portfolio-3.firebaseapp.com",
  projectId: "alchemy-stories-portfolio-3",
  storageBucket: "alchemy-stories-portfolio-3.firebasestorage.app",
  messagingSenderId: "746144422845",
  appId: "1:746144422845:web:222946435f51d7081550d4",
  measurementId: "G-N3DD0JMZRH"
};

// Initialize Firebase if loaded
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}
