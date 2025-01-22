import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getPerformance } from "firebase/performance";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCGtMEemCUNW2-G9_hJPliHWiXaPQFTfoE",
  authDomain: "pghs-wisdom-of-the-crowd.firebaseapp.com",
  databaseURL:
    "https://pghs-wisdom-of-the-crowd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pghs-wisdom-of-the-crowd",
  storageBucket: "pghs-wisdom-of-the-crowd.firebasestorage.app",
  messagingSenderId: "298356275057",
  appId: "1:298356275057:web:ed4e46eddb66e07d7fa8d0",
  measurementId: "G-W5ZLKRKYEY",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const firestore = getFirestore(app);
const db = getDatabase(app);
const storage = getStorage(app);

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("page:transition:finish", () => {
    getPerformance(app);
    getAnalytics(app);
  });

  nuxtApp.vueApp.provide("auth", auth);
  nuxtApp.provide("auth", auth);

  nuxtApp.vueApp.provide("db", db);
  nuxtApp.provide("db", db);

  nuxtApp.vueApp.provide("storage", storage);
  nuxtApp.provide("storage", storage);

  nuxtApp.vueApp.provide("firestore", firestore);
  nuxtApp.provide("firestore", firestore);
});

export { db };
