import firestore from '@react-native-firebase/firestore';
const articlesCollection = firestore().collection('articles');

async function fetchNextArticles(date, outlets) {
  console.log('fetching articles from ', date);

  const snaps = await articlesCollection
    .orderBy('created', 'asc')
    .startAfter(date)
    .where('outlet', 'in', outlets)
    .limit(15)
    .get();
  console.log(snaps.size);

  let objs = [];
  snaps.forEach(snap => objs.push({...snap.data(), id: snap.id}));
  objs = objs.filter(
    (o, idx, self) => self.findIndex(a => a.id == o.id) == idx,
  );
  console.log(objs.map(o => o.id));
  return objs;
}

export {fetchNextArticles};
