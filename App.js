/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState, useRef} from 'react';
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
import Swiper from 'react-native-swiper';

const window = Dimensions.get('window');
const screen = Dimensions.get('screen');

const upToDate = {
  _id: 'uptodate',
  title: 'You Are All Up To Date',
  description: 'Check back later for more news.',
  image: '',
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const db = useMongoDB();
  const [articles, setArticles] = useState([]);
  const [dimensions, setDimensions] = useState({window, screen});
  const [bLoading, setBLoading] = useState(false);
  const [uLoading, setULoading] = useState(true);
  const [m, setM] = useState(false);
  const [article, setArticle] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const swiper = useRef();

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
      console.log('initial fetch');
      fetchNextArticles();
    }
  }, [db]);

  async function fetchEarlierArticles() {
    if (db && !bLoading && !uLoading) {
      setULoading(true);
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

  async function fetchNextArticles() {
    console.log('fetching articles');
    if (db) {
      setBLoading(true);
      let d = new Date();
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      d = new Date(d.getFullYear(), d.getMonth(), 22, 0, 0, 0);
      console.log(d.toISOString());

      const objs = await db.collection('articles').find(
        {
          description: {$ne: ''},
          created: {
            $gt:
              articles.length > 0
                ? articles[articles.length - 1].created
                : d.toISOString(),
          },
        },
        {limit: 10, sort: {created: 1}},
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

  useEffect(() => {
    if (currentIdx == articles.length - 2) fetchNextArticles();
  }, [currentIdx]);

  const handleScroll = event => {
    const positionX = event.nativeEvent.contentOffset.x;
    const idx = Math.round(positionX / dimensions.window.width);
    console.log(idx);
    setCurrentIdx(prev => (idx > prev ? idx : prev));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text
        style={{
          color: '#fff',
          fontSize: 44,
          fontWeight: 'bold',
          marginHorizontal: 24,
          marginTop: 32,
          fontFamily: 'Damascus',
          opacity: 0.87,
        }}>
        QuickBits
      </Text>
      {/*<FlatList
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        onRefresh={() => getLatest()}
        refreshing={uLoading}
        onEndReached={() => fetchEarlierArticles()}
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
        horizontal
        //onScrollEndDrag={() => fetchEarlierArticles()}
          />*/}
      <Swiper
        style={[styles.stack]}
        onScroll={handleScroll}
        loop={false}
        scrollEventThrottle={16}
        showsPagination={false}
        onIndexChanged={index => {
          console.log(index);
          //setCurrentIdx(prev => (index > prev ? index : prev));
        }}>
        {articles.length == 0 && (uLoading || bLoading) ? (
          <ActivityIndicator style={{marginTop: 16}} />
        ) : (
          [...articles, upToDate].map((article, idx, self) => (
            <Article
              article={article}
              key={article._id}
              dimensions={dimensions}
              onShowMore={() => {
                setArticle(article);
                setM(true);
              }}
              loader={idx == self.length - 2}
            />
          ))
        )}
      </Swiper>
    </SafeAreaView>
  );
};

const Article = ({article, dimensions, onShowMore, fetchNext, loader}) => {
  const [imgDims, setImgDims] = useState({w: 0, h: 0});
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (article.image != '') {
      Image.getSize(article.image, (width, height) => {
        let dimWidth = dimensions.window.width - 80;
        const scale = dimWidth / width;
        setImgDims({w: dimWidth, h: height * scale});
      });
    }
    //if (loader) fetchNext();
  }, []);

  return (
    <View style={{padding: 24, flex: 1}}>
      <View style={styles.scrollContainer}>
        <ScrollView
          nestedScrollEnabled
          style={{flex: 1}}
          showsVerticalScrollIndicator
          contentContainerStyle={{flexGrow: 1}}>
          <TouchableOpacity
            onPress={() => setMore(prev => !prev)}
            activeOpacity={1}
            style={{flex: 1, flexGrow: 1}}>
            <View style={[styles.articleContainer]}>
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
              {article.url && (
                <Button
                  title={`View On ${article.outlet}`}
                  onPress={() => InAppBrowser.open(article.url)}
                  color="#84e2d8"
                />
              )}
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
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
    backgroundColor: '#121212',
    flex: 1,
    margin: 0,
  },
  stack: {},
  colContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginTop: '1em',
    marginLeft: '2em',
    marginRight: '2em',
  },
  articleContainer: {
    padding: 16,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  articleImage: {
    borderRadius: 16,
    marginBottom: 16,
  },
  articleTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Damascus',
    opacity: 0.87,
    //marginLeft: "10px",
  },
  articleDescription: {
    color: '#fff', //"#A7A7A7",
    fontSize: 17,
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
