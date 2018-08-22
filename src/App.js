import React, { Component } from 'react'
import { Button } from 'semantic-ui-react'
import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'
import githubApi from './githubApi'
import { ULEX_REPO_NAME } from './constants'

firebase.initializeApp({
  apiKey: 'AIzaSyC4jUofAOrxS-qpNGBopxzkkJsTo66WYTg',
  authDomain: 'ulex-editor.firebaseapp.com',
  databaseURL: 'https://ulex-editor.firebaseio.com',
  projectId: 'ulex-editor',
  storageBucket: 'ulex-editor.appspot.com',
  messagingSenderId: '436701741549',
})

class App extends Component {
  componentDidMount = () => {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this._userOn(user.uid)
      } else {
        this.setState(() => ({ user: null }))
      }
    })
  }

  state = {
    user: null,
    isUlexForked: false,
    readme: '',
  }

  _signIn = e => {
    e.preventDefault()
    const provider = new firebase.auth.GithubAuthProvider()
    provider.addScope('repo')
    provider.addScope('read:user')
    provider.addScope('user:email')
    firebase
      .auth()
      .signInWithPopup(provider)
      .then(({ additionalUserInfo, user, credential: { accessToken } }) => {
        const { uid, email, displayName, photoURL } = user
        const newUser = {
          uid,
          email,
          displayName,
          photoURL,
          additionalUserInfo,
          accessToken,
        }
        firebase
          .database()
          .ref('users/' + uid)
          .update(newUser)
      })
      .catch(console.error)
  }

  _userOn = uid => {
    firebase
      .database()
      .ref('users/' + uid)
      .on('value', snap => {
        const user = snap.val()
        this.setState(() => ({ user }))
      })
  }

  _setupGithubApi = () => {
    if (this.state.user && this.state.user.accessToken) {
      this.githubApi = githubApi(
        this.state.user.accessToken,
        this.state.user.additionalUserInfo.username,
      )
    }
  }

  _getReadme = async () => {
    this._setupGithubApi()
    const readmeContents = await this.githubApi.getReadme()
    this.setState(() => ({ readme: atob(readmeContents.content) }))
    console.log(readmeContents)
  }

  _checkUlexForked = async () => {
    this._setupGithubApi()
    let ulexFork = await this.githubApi.forkedUlex()
    if (typeof ulexFork !== 'undefined') {
      return this.setState(() => ({ isUlexForked: true }))
    }
    ulexFork = await this.githubApi.forkUlex()
    if (
      ulexFork.fullName ===
      this.state.user.additionalUserInfo.username + '/' + ULEX_REPO_NAME
    ) {
      this.setState(() => ({ isUlexForked: true }))
    }
  }

  render() {
    return (
      <div>
        {this.state.user ? (
          <div>
            <Button onClick={() => firebase.auth().signOut()}>Sign Out</Button>
            <Button onClick={this._checkUlexForked}>Check Fork</Button>
            <Button onClick={this._getReadme}>Get Readme</Button>
          </div>
        ) : (
          <Button onClick={this._signIn}>Sign In with GitHub</Button>
        )}
        <div>
          <p>{this.state.readme}</p>
          <pre>{JSON.stringify(this.state.user, null, 2)}</pre>
        </div>
      </div>
    )
  }
}

export default App
