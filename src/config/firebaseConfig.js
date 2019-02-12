import firebase from 'firebase'
import 'firebase/firestore'

// firebase init goes here
const config = {
    apiKey: "AIzaSyDqk8msqqD6b6BZH9kj0JV70PZWKB77Gwk",
    authDomain: "vue-firebase-3c304.firebaseapp.com",
    databaseURL: "https://vue-firebase-3c304.firebaseio.com",
    projectId: "vue-firebase-3c304",
    storageBucket: "vue-firebase-3c304.appspot.com",
    messagingSenderId: "1020779775492"
}
firebase.initializeApp(config)

// firebase utils
const db = firebase.firestore()
const auth = firebase.auth()
const currentUser = auth.currentUser

// date issue fix according to firebase
const settings = {
    timestampsInSnapshots: true
}
db.settings(settings)

// firebase collections
const usersCollection = db.collection('users')
const postsCollection = db.collection('posts')
const commentsCollection = db.collection('comments')
const likesCollection = db.collection('likes')

export {
    db,
    auth,
    currentUser,
    usersCollection,
    postsCollection,
    commentsCollection,
    likesCollection
}