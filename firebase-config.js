import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";      
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCt6glmSHPwjewxq8HazI_VmmcocVK5500",
  authDomain: "peer-fit.firebaseapp.com",
  projectId: "peer-fit",
  storageBucket: "peer-fit.firebasestorage.app",
  messagingSenderId: "331638589440",
  appId: "1:331638589440:web:ce293c398bdbbc9303f0e5",
  measurementId: "G-6Z3R3FKGTF"
};
console.log("Firebase config:", firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);