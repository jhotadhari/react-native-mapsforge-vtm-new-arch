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
import Marker from '../../src/components/Marker';

const defaultCenter : Location = {
	lng: -77,
	lat: -9,
};


export const randomNumber = ( min: number, max: number ) : number => Math.random() * ( max - min ) + min;

const getRandomPositions = ( length: number ) : Location[] => Array.apply( null, Array( length ) ).map( () => ( {
  lng: randomNumber( -78, -76 ),
  lat: randomNumber( -10, -8 ),
} ) );

const positions = getRandomPositions( 500 );

export default function App() {

  const { width } = useWindowDimensions();
  const [height,setHeight] = useState( 400 );


  const [mapState,setMapState] = useState<MapEventResponse>( {} );
  const [hasMarker,setHasMarker] = useState( true );


  return (
    <View style={styles.container}>

      <Button
        title={ 'Bla' }
        onPress={ () => setHasMarker( ! hasMarker ) }
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
        zoomLevel={ 8 }
        // onMapUpdate={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
        //   console.log( 'debug onMapUpdate', response?.nativeEvent ); // debug
        //   setMapState( response?.nativeEvent );
        // } }
        // onPause={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
        //   console.log( 'debug onPause', response?.nativeEvent ); // debug
        // } }
        // onResume={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
        //   console.log( 'debug onResume', response?.nativeEvent ); // debug
        // } }
        onError={ ( response: NativeSyntheticEvent<Readonly<MapError>> ) => {
          console.log( 'debug onError', response?.nativeEvent ); // debug
        } }
      >
        <LayerBitmapTile/>

        <LayerMarker>

          { hasMarker && [...positions].map( ( position: Location, idx: number ) => {
            return <Marker key={ idx } position={ position }/>;
          } ) }

          {/* { hasMarker && <Marker position={ defaultCenter }/> } */}

        </LayerMarker>

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
