import { createApp } from 'vue'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import App from './App.vue'

const firebaseConfig = {
    apiKey: "AIzaSyC7zRaOUz84DLfitY9F2EyCL6z-Thkp-_w",
    authDomain: "expedition-labs.firebaseapp.com",
    projectId: "expedition-labs",
    storageBucket: "expedition-labs.firebasestorage.app",
    messagingSenderId: "896831660441",
    appId: "1:896831660441:web:25ff4d3864e9127584b308",
    measurementId: "G-9M1BJ1B6M8"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app)

createApp(App).mount('#app')
