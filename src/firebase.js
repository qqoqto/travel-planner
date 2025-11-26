import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, remove, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBQa3KlpqZ3V3_olAgE1bKG8BFcQo7lYjs",
  authDomain: "travel-planner-app-13961.firebaseapp.com",
  projectId: "travel-planner-app-13961",
  storageBucket: "travel-planner-app-13961.firebasestorage.app",
  messagingSenderId: "18751446142",
  appId: "1:18751446142:web:769426a5c3d59f6eef4c2f",
  databaseURL: "https://travel-planner-app-13961-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue, set, push, remove, update };
