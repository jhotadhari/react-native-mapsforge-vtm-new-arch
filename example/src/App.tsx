import { useState } from 'react';
import {
  View,
  StyleSheet,
  Button,
  useWindowDimensions,
  type NativeSyntheticEvent,
  Text,
} from 'react-native';
import {
  LayerBitmapTile,
  LayerMarker,
  MapContainer,
  type Location,
  type MapError,
  type MapEventResponse,
} from 'react-native-mapsforge-vtm';
import type { Int32 } from 'react-native/Libraries/Types/CodegenTypes';

const defaultCenter : Location = {
	lng: -77.605,
	lat: -9.118,
};

export default function App() {

  const { width } = useWindowDimensions();
  const [height,setHeight] = useState( 400 );


  const [mapState,setMapState] = useState<MapEventResponse>( {} );
  const [initialZoom,setInitialZoom] = useState<Int32>( 8 );


  return (
    <View style={styles.container}>

      <Button
        title={ 'Increase height' }
        onPress={ () => setHeight( height + 100 ) }
      />

      <Text style={ {color: '#ffffff'} }>bla</Text>
      <Text style={ {color: '#ffffff'} }>bla</Text>

      <MapContainer
        width={ width }
        height={ height }
        center={ defaultCenter }
        responseInclude={ {
          zoomLevel: 2,
          // zoom: 2,
          // scale: 2,
          // zoomScale: 2,
          // bearing: 2,
          // roll: 2,
          // tilt: 2,
          center: 2,
        } }
        zoomLevel={ initialZoom }
        onMapUpdate={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
          console.log( 'debug onMapUpdate', response?.nativeEvent ); // debug
          setMapState( response?.nativeEvent );
        } }
        onPause={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
          console.log( 'debug onPause', response?.nativeEvent ); // debug
        } }
        onResume={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
          console.log( 'debug onResume', response?.nativeEvent ); // debug
        } }
        onError={ ( response: NativeSyntheticEvent<Readonly<MapError>> ) => {
          console.log( 'debug onError', response?.nativeEvent ); // debug
        } }
      >
        <LayerBitmapTile/>

        <LayerMarker/>

      </MapContainer>

      <Text style={ {color: '#ffffff'} }>bla</Text>
      <Text style={ {color: '#ffffff'} }>bla</Text>

    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
} );
