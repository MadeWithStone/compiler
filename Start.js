import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import useIsAuthenticated from './hooks/useisAuthenticated';
import auth from '@react-native-firebase/auth';
import App from './App';

const Start = () => {
  const [initializing, user] = useIsAuthenticated();
  const [siginingIn, setSigningIn] = useState(false);

  useEffect(() => {
    console.log(initializing, user);
    if (!initializing && !user && !siginingIn) {
      setSigningIn(true);
      auth()
        .signInAnonymously()
        .then(() => {
          console.log('User signed in anonymously');
          setSigningIn(false);
        })
        .catch(error => {
          if (error.code === 'auth/operation-not-allowed') {
            console.log('Enable anonymous in your firebase console.');
          }
          setSigningIn(false);
          console.error(error);
        });
    }
  }, [initializing, user]);

  useEffect(() => {
    console.log('initializing', initializing);
    console.log('user', user);
  }, [initializing, user]);

  if (initializing || !user)
    return <View style={{flex: 1, backgroundColor: '#121212'}}></View>;

  if (!initializing && user) return <App />;
};

export default Start;
