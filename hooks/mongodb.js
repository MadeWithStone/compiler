// https://github.com/mongodb-developer/realm-web-example/blob/master/src/providers/mongodb.js
// https://www.mongodb.com/developer/how-to/querying-mongodb-browser-realm-react/

import React, {useContext, useEffect, useState} from 'react';

import Realm from 'realm';

const useMongoDB = () => {
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const REALM_APP_ID = 'compiler-db-istwt';
  const app = new Realm.App({id: REALM_APP_ID});

  useEffect(() => {
    async function init() {
      app
        .logIn(
          Realm.Credentials.serverApiKey(
            '0Taf5cBmsGupkKvmmUzEKwXrXe2dgfiehZObSqptoWHDe7d6KU3ZZ6WSHkahTKaV',
          ),
        )
        .then(u => setUser(u));
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user !== null) {
      const realmService = user.mongoClient('mongodb-atlas');
      setDb(realmService.db('main'));
    }
  }, [user]);

  return db;
};

export default useMongoDB;
