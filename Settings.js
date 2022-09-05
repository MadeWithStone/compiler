import React, {useState, useEffect} from 'react';
import {
  View,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  Image,
  Text,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const sources = ['The Guardian', 'VICE', 'CNN', 'CNBC'];

const Settings = ({settings, shown, updateSettings, hide}) => {
  const [stgs, setStgs] = useState(settings);
  useEffect(() => {
    if (settings.length < sources.length) {
      sources.forEach(source => {
        if (settings.findIndex(s => s.src == source) == -1) {
          settings.push({src: source, show: true});
        }
      });
    }
    setStgs(settings);
    console.log('Settings: ', settings);
  }, [shown]);
  useEffect(() => {
    updateSettings(stgs);
  }, [stgs]);
  return (
    <Modal visible={shown} animationType={'fade'}>
      <SafeAreaView style={styles.container}>
        <View
          style={{
            marginTop: 0,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginHorizontal: 24,
          }}>
          <TouchableOpacity onPress={() => hide()}>
            <Icon name="x" color="#fff" size={24} />
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
            Settings
          </Text>
        </View>
        <FlatList
          data={stgs}
          renderItem={({item, index}) => (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginHorizontal: 8,
                marginVertical: 8,
              }}>
              <Text style={{color: '#fff', fontSize: 17}}>{item.src}</Text>
              <TouchableOpacity
                onPress={() =>
                  setStgs(prev => {
                    var updated = [...prev];
                    updated[index].show = !item.show;
                    return updated;
                  })
                }>
                <Icon
                  name={item.show ? 'check-square' : 'square'}
                  color="#fff"
                  size={24}
                />
              </TouchableOpacity>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
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

export default Settings;
