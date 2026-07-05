import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyCzG0UDz6v-OYlwyRbJpd09IbbbyIITPCc',
  authDomain: 'aleboj-27krts.firebaseapp.com',
  projectId: 'aleboj-27krts',
  storageBucket: 'aleboj-27krts.firebasestorage.app',
  messagingSenderId: '537592698413',
  appId: '1:537592698413:web:83a06bbb11f8fa425d8aa4',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
