// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "mern-estate-bcf11.firebaseapp.com",
  projectId: "mern-estate-bcf11",
  storageBucket: "mern-estate-bcf11.firebasestorage.app",
  messagingSenderId: "759902706896",
  appId: "1:759902706896:web:a06999c3b44240bd6b12d5"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);