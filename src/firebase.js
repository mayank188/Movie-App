// Firebase configuration and exports for Movie-App

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDO5O4E8Y3PsPBHW2ImeYoUba572KHgGmc",
  authDomain: "movie-app-dd28b.firebaseapp.com",
  projectId: "movie-app-dd28b",
  storageBucket: "movie-app-dd28b.firebasestorage.app",
  messagingSenderId: "583260440502",
  appId: "1:583260440502:web:c7bbd66b55ecded3ebe317",
  measurementId: "G-PY4M6KP7YT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Export services
export {
  app,
  analytics,
  auth,
  firestore,
  googleProvider
};