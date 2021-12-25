/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  Button,
  Linking,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';

import {InAppBrowser} from 'react-native-inappbrowser-reborn';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Realm, {BSON, Credentials} from 'realm';
import useMongoDB from './hooks/mongodb';

const window = Dimensions.get('window');
const screen = Dimensions.get('screen');

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const db = useMongoDB();
  const [articles, setArticles] = useState([]);
  const [dimensions, setDimensions] = useState({window, screen});
  const [bLoading, setBLoading] = useState(false);
  const [uLoading, setULoading] = useState(false);
  const [m, setM] = useState(false);
  const [article, setArticle] = useState(false);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({window, screen}) => {
        setDimensions({window, screen});
      },
    );
    return () => subscription?.remove();
  });

  const getLatest = () => {
    setULoading(true);
    db.collection('articles')
      .find({description: {$ne: ''}}, {limit: 5, sort: {created: -1}})
      .then(objs => {
        setULoading(false);
        setArticles(objs);
      });
  };

  useEffect(() => {
    if (db) {
      getLatest();
    }
  }, [db]);

  async function fetchEarlierArticles() {
    if (db && !bLoading && !uLoading) {
      setBLoading(true);
      const objs = await db.collection('articles').find(
        {
          description: {$ne: ''},
          created: {$lt: articles[articles.length - 1].created},
        },
        {limit: 2, sort: {created: -1}},
      );
      setBLoading(false);
      setArticles(prev => {
        const newA = [...prev, ...objs];

        return newA.filter(
          (a, id, self) => self.findIndex(b => b._id == a._id) == id,
        );
      });
    }
  }

  const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };
  useEffect(() => {
    console.log(article.title);
  }, [article]);

  const [imgDims, setImgDims] = useState({w: 0, h: 0});
  useEffect(() => {
    if (article && article.image && article.image != '') {
      Image.getSize(article.image, (width, height) => {
        let dimWidth = dimensions.window.width - 48;
        const scale = dimWidth / width;
        setImgDims({w: dimWidth, h: height * scale});
      });
    }
  }, [article]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={
          <Text
            style={{
              color: '#fff',
              fontSize: 44,
              fontWeight: 'bold',
              marginHorizontal: 24,
              marginTop: 32,
              marginBottom: 16,
              fontFamily: 'Damascus',
              opacity: 0.87,
            }}>
            Quickbits
          </Text>
        }
        style={styles.container}
        onRefresh={() => getLatest()}
        refreshing={uLoading}
        onScroll={({nativeEvent}) => {
          if (isCloseToBottom(nativeEvent)) {
            fetchEarlierArticles();
          }
        }}
        data={articles}
        renderItem={({item}) => (
          <Article
            article={item}
            key={item._id}
            dimensions={dimensions}
            onShowMore={() => {
              setArticle(item);
              setM(true);
            }}
          />
        )}
        ListFooterComponent={bLoading ? <ActivityIndicator /> : null}
        //onScrollEndDrag={() => fetchEarlierArticles()}
      />
      <Modal
        animationType="fade"
        presentationStyle="pageSheet"
        visible={m}
        backgroundColor="#121212"
        //onRequestClose={setM(false)}
      >
        <View style={{...StyleSheet.absoluteFill, backgroundColor: '#1f1f1f'}}>
          <ScrollView>
            <View
              style={{
                ...styles.container,
                paddingTop: 24,
                backgroundColor: '#1f1f1f',
                paddingHorizontal: 24,
              }}>
              <Button title="Close" onPress={() => setM(false)} />

              <Text
                style={{
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: '600',
                  marginTop: 8,
                  marginBottom: 8,
                }}>
                {article.title}
              </Text>
              {article.image != '' && (
                <Image
                  source={{uri: article.image}}
                  style={{
                    ...styles.articleImage,
                    width: imgDims.w,
                    height: imgDims.h,
                  }}
                />
              )}
              <Text
                style={{
                  color: '#A7A7A7',
                  fontSize: 17,
                  lineHeight: 28,
                }}>
                {article.summary}
              </Text>
              <Button
                title={`View On ${article.outlet}`}
                onPress={() => InAppBrowser.open(article.url)}
                style={styles.articleButton}
              />
              <Button title="Close" onPress={() => setM(false)} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const Article = ({article, dimensions, onShowMore}) => {
  const [imgDims, setImgDims] = useState({w: 0, h: 0});
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (article.image != '') {
      Image.getSize(article.image, (width, height) => {
        let dimWidth = dimensions.window.width - 48;
        const scale = dimWidth / width;
        setImgDims({w: dimWidth, h: height * scale});
      });
    }
  }, []);

  return (
    <TouchableOpacity onPress={() => setMore(prev => !prev)} activeOpacity={1}>
      <View style={styles.articleContainer}>
        <Text style={styles.articleTitle}>{article.title}</Text>
        {article.image != '' && (
          <Image
            source={{uri: article.image.split('resize')[0]}}
            style={{
              ...styles.articleImage,
              width: imgDims.w,
              height: imgDims.h,
            }}
          />
        )}
        <Text style={styles.articleDescription}>
          {more ? article.summary : article.description}
        </Text>
        <Button
          title={`View On ${article.outlet}`}
          onPress={() => InAppBrowser.open(article.url)}
          color="#84e2d8"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  navBar: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    textAlign: 'center',
    borderRadius: '0px 0px 8px 8px',
    boxShadow: '0px 4px 8px 1px rgba(0, 0, 0, 0.25)',
  },
  navTitle: {
    color: '#FFFFFF',
    fontSize: '2.5em',
    fontWeight: '600',
    margin: '0.2em',
  },
  container: {
    width: '100%',
    backgroundColor: '#000',
    margin: 0,
  },
  colContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginTop: '1em',
    marginLeft: '2em',
    marginRight: '2em',
  },
  articleContainer: {
    flex: 1,
    backgroundColor: '#000',
    radius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    borderRadius: 16,
    boxShadow: '0px 4px 5px 1px rgba(0, 0, 0, 0.25)',
  },
  articleBoxLeft: {
    display: 'flex',
    flex: 4,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'start',
    textAlign: 'justify',
    marginRight: '1.5em',
  },
  articleImage: {
    flex: 1,
    borderRadius: 16,
    marginBottom: 16,
  },
  articleTitle: {
    color: '#ffffff',
    fontSize: 24,
    flex: 1,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Damascus',
    opacity: 0.87,
    //marginLeft: "10px",
  },
  articleDescription: {
    color: '#fff', //"#A7A7A7",
    fontSize: 17,
    flex: 1,
    lineHeight: 24,
    fontFamily: 'Damascus',
    opacity: 0.87,
  },
  articleButton: {
    background: 'transparent',
    border: 'none',
    textDecoration: 'underline',
    color: '#fff',
    textAlign: 'left',
    marginRight: 8,
  },
};

export default App;
