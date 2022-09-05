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
  AppState,
} from 'react-native';

import {InAppBrowser} from 'react-native-inappbrowser-reborn';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import Swiper from 'react-native-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchNextArticles} from './db/firestore';
import Icon from 'react-native-vector-icons/Feather';

import Settings from './Settings';

const sources = ['The Guardian', 'VICE', 'CNN', 'CNBC'];

const window = Dimensions.get('window');
const screen = Dimensions.get('screen');

const upToDate = {
  id: 'uptodate',
  title: 'All Up To Date',
  description: 'Check back later for more news.',
  summary: 'Check back later for more news.',
  image: '',
  url: '#refresh',
};
const bLoadingPage = {
  id: 'bLoading',
  title: 'Hold On A Sec',
  description: 'We are fetching more stories for you right now.',
  summary: 'We are fetching more stories for you right now.',
  image: '',
};

const storeLatest = async time => {
  try {
    await AsyncStorage.setItem('time', time);
  } catch (e) {
    // saving error
  }
};

const getLatest = async () => {
  try {
    const value = await AsyncStorage.getItem('time');
    if (value !== null) {
      // value previously stored
      return value;
    }
  } catch (e) {
    // error reading value
    return null;
  }
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [articles, setArticles] = useState([]);
  const [dimensions, setDimensions] = useState({window, screen});
  const [bLoading, setBLoading] = useState(true);
  const [uLoading, setULoading] = useState(true);
  const [m, setM] = useState(false);
  const [article, setArticle] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [latestCreated, setLatestCreated] = useState(null);
  const swiper = useRef();

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState('active');

  const [settings, setSettings] = useState([]);
  const [settingsVis, setSettingsVis] = useState(false);

  useEffect(() => {
    console.log('app screen loaded');
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
      console.log('AppState', appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const getSourceList = () => {
    const newSources = sources.filter(
      s => settings.findIndex(setting => setting.src == s) == -1,
    );
    const ss = settings.filter(s => s.show).map(s => s.src);
    return [...ss, ...newSources];
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

  useEffect(() => {
    console.log('got initial date. fetching', latestCreated, appStateVisible);
    if (latestCreated && appStateVisible == 'active') {
      console.log('initial fetch');
      fetchArticles();
    }
  }, [latestCreated, appState]);

  useEffect(() => {
    loadSettings();
    getLatest().then(val => {
      console.log('async val', val);
      let d = new Date();
      const offset = d.getTimezoneOffset();
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      d = new Date(d.getTime() - offset * 60 * 1000);
      if (val) {
        let vD = new Date(val);
        setLatestCreated(vD > d ? val : d.toISOString());
      } else {
        setLatestCreated(d.toISOString());
      }
    });
  }, []);

  async function fetchArticles() {
    setBLoading(true);
    console.log('latest created', latestCreated);
    fetchNextArticles(
      articles.length > 0
        ? articles[articles.length - 1].created
        : latestCreated,
      getSourceList(),
    )
      .then(newArticles => {
        console.log('got new articles');
        setBLoading(false);
        if (articles.length == 0 && newArticles.length > 0) {
          storeLatest(newArticles[0].created);
        }
        console.log(newArticles.length);
        setArticles(prev => {
          const newA = [...prev, ...newArticles];
          return newA.filter(
            (a, id, self) => self.findIndex(b => b.id == a.id) == id,
          );
        });
      })
      .catch(err => {
        console.warn(err);
        setBLoading(false);
      });
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
    if (currentIdx == articles.length - 2 || currentIdx == articles.length - 1)
      fetchArticles();

    if (articles.length > 0 && currentIdx < articles.length) {
      console.log('setting created', articles[currentIdx].created);
      storeLatest(articles[currentIdx].created);
    }
  }, [currentIdx]);

  const handleScroll = event => {
    const positionX = event.nativeEvent.contentOffset.x;
    const idx = Math.round(positionX / dimensions.window.width);
    setCurrentIdx(prev => (idx > prev ? idx : prev));
  };

  const saveSettings = async () => {
    try {
      console.log('saving: ', settings);
      await AsyncStorage.setItem('settings', JSON.stringify(settings));
    } catch (e) {
      // saving error
    }
  };

  const loadSettings = async () => {
    try {
      const value = await AsyncStorage.getItem('settings');
      if (value !== null) {
        // value previously stored
        console.log(value);
        setSettings(JSON.parse(value));
      }
    } catch (e) {
      // error reading value
    }
  };

  useEffect(() => {
    if (settingsVis === false) {
      saveSettings();
    }
  }, [settingsVis]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View
        style={{
          marginTop: 0,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginHorizontal: 24,
        }}>
        <TouchableOpacity onPress={() => setSettingsVis(prev => !prev)}>
          <Icon name="settings" color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
          marginTop: 0,
          marginHorizontal: 24,
          alignItems: 'center',
        }}>
        <Image
          source={require('./quickbits.png')}
          style={{height: 64, width: 64, opacity: 0.87}}
        />
        <Text
          style={{
            color: '#fff',
            fontSize: 44,
            fontWeight: '400',
            fontFamily: 'Damascus',
            opacity: 0.87,
          }}>
          QuickBits
        </Text>
      </View>
      <Settings
        shown={settingsVis}
        hide={() => setSettingsVis(false)}
        settings={settings}
        updateSettings={updates => setSettings(updates)}
      />
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
        {[...articles, bLoading ? bLoadingPage : upToDate].map(
          (article, idx, self) => (
            <Article
              article={article}
              key={article.id}
              dimensions={dimensions}
              onShowMore={() => {
                setArticle(article);
                setM(true);
              }}
              loader={idx == self.length - 2}
              refresh={() => fetchArticles()}
            />
          ),
        )}
      </Swiper>
    </SafeAreaView>
  );
};

const Article = ({
  article,
  dimensions,
  onShowMore,
  fetchNext,
  loader,
  refresh,
}) => {
  const [imgDims, setImgDims] = useState({w: 0, h: 0});
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (article.image != undefined && article.image != '') {
      article.image = article.image.split(' ')[0];
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
            style={{flex: 1, flexGrow: 1}}
            key={article.id}>
            <View style={[styles.articleContainer]}>
              <Text style={styles.articleTitle}>{article.title}</Text>
              {article.image != undefined && article.image.length > 0 && (
                <Image
                  source={{
                    uri:
                      article.image.length > 0
                        ? article.image.split('resize')[0]
                        : '',
                  }}
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
                  title={
                    article.url == '#refresh'
                      ? 'Refresh'
                      : `View On ${article.outlet}`
                  }
                  onPress={
                    article.url == '#refresh'
                      ? () => refresh()
                      : () => InAppBrowser.open(article.url)
                  }
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
    fontWeight: '400',
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
