import Vue from 'vue'
import Vuex from 'vuex'
import * as firebase from 'firebase'

const fb = require('../config/firebaseConfig.js')

Vue.use(Vuex)

// handle page reload
fb.auth.onAuthStateChanged(user => {
    if (user) {
        store.commit('setCurrentUser', user)
        store.dispatch('fetchUserProfile')

        fb.usersCollection.doc(user.uid).onSnapshot(doc => {
            store.commit('setUserProfile', doc.data())
        })
        // realtime updates from our posts collection
        fb.postsCollection.orderBy('createdOn', 'desc').onSnapshot(querySnapshot => {
            // check if created by currentUser
            console.log(querySnapshot.docChanges()[0].doc.data().userId);
            let createdByCurrentUser
            if (querySnapshot.docs.length) {
                createdByCurrentUser = store.state.currentUser.uid == querySnapshot.docChanges()[0].doc.data().userId ? true : false
            }

            // add new posts to hiddenPosts array after initial load
            if (querySnapshot.docChanges().length !== querySnapshot.docs.length
                && querySnapshot.docChanges()[0].type == 'added' && !createdByCurrentUser) {

                let post = querySnapshot.docChanges()[0].doc.data()
                post.id = querySnapshot.docChanges()[0].doc.id

                store.commit('setHiddenPosts', post)
            } else {
                let postsArray = []

                querySnapshot.forEach(doc => {
                    let post = doc.data()
                    post.id = doc.id
                    postsArray.push(post)
                })

                store.commit('setPosts', postsArray)
            }
        })
    }
})

export const store = new Vuex.Store({
    state: {
        currentUser: null,
        userProfile: {},
        posts: [],
        hiddenPosts: []
    },
    actions: {
        clearData({ commit }) {
            commit('setCurrentUser', null)
            commit('setUserProfile', {})
            commit('setPosts', null)
            commit('setHiddenPosts', null)
        },
        createPost ({commit, getters, state}, payload) {
            const postData = {
                createdOn: payload.createdOn,
                content: payload.content,
                userId: payload.userId,
                image: '',
                userName: payload.userName,
                comments: payload.comments,
                likes: payload.likes
            }

            let imageUrl
            let key
            fb.postsCollection.add(postData)
            .then((data) => {
             console.log(data);
              key = data.id
              console.log("key "+ key)
              return key
            })
            .then(key => {
             console.log(payload)
              const filename = payload.image.name
              const ext = filename.slice(filename.lastIndexOf('.'))
              return firebase.storage().ref('posts/' + key  + ext).put(payload.image)
            })
            .then(uploadTaskSnapshot => {
                 return uploadTaskSnapshot.ref.getDownloadURL()
              })
            .then(imageUrl => {
              console.log(imageUrl);
               return fb.postsCollection.doc(key).update({image: imageUrl})
            })
            .then((data) => {
              console.log(data)
              const key = data.id
              commit('createPost', {
                ...postData,
                imageUrl: imageUrl,
                id: key
              })
            })
            .catch((error) => {
              console.log(error)
            })
          // Reach out to firebase and store it
        },
        fetchUserProfile({ commit, state }) {
            fb.usersCollection.doc(state.currentUser.uid).get().then(res => {
                commit('setUserProfile', res.data())
            }).catch(err => {
                console.log(err)
            })
        },
        updateProfile({ commit, state }, data) {
            let name = data.name
            let title = data.title

            fb.usersCollection.doc(state.currentUser.uid).update({ name, title }).then(user => {
                // update all posts by user to reflect new name
                fb.postsCollection.where('userId', '==', state.currentUser.uid).get().then(docs => {
                    docs.forEach(doc => {
                        fb.postsCollection.doc(doc.id).update({
                            userName: name
                        })
                    })
                })
                // update all comments by user to reflect new name
                fb.commentsCollection.where('userId', '==', state.currentUser.uid).get().then(docs => {
                    docs.forEach(doc => {
                        fb.commentsCollection.doc(doc.id).update({
                            userName: name
                        })
                    })
                })
            }).catch(err => {
                console.log(err)
            })
        }
    },
    mutations: {
        setCurrentUser(state, val) {
            state.currentUser = val
        },
        createPost (state, payload) {
          state.posts.push(payload)
        },
        setUserProfile(state, val) {
            state.userProfile = val
        },
        setPosts(state, val) {
            if (val) {
                state.posts = val
            } else {
                state.posts = []
            }
        },
        setHiddenPosts(state, val) {
            if (val) {
                // make sure not to add duplicates
                if (!state.hiddenPosts.some(x => x.id === val.id)) {
                    state.hiddenPosts.unshift(val)
                }
            } else {
                state.hiddenPosts = []
            }
        }
    }
})
