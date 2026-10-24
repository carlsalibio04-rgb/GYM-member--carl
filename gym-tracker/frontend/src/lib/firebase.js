
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhwjWeJsl76vNXdWDQX5o4cQuVhNG3X4k",
  authDomain: "gym-traker-a7393.firebaseapp.com",
  projectId: "gym-traker-a7393",
  storageBucket: "gym-traker-a7393.firebasestorage.app",
  messagingSenderId: "372665566167",
  appId: "1:372665566167:web:ba71f96d8c8beacad2c192"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

