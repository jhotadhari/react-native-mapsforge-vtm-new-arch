import { useEffect, useRef, useState } from 'react';
import {
	View,
	StyleSheet,
	Button,
	useWindowDimensions,
	type NativeSyntheticEvent,
	Text,
	PixelRatio,
} from 'react-native';
import {
	LayerBitmapTile,
	LayerMarker,
	LayerPath,
	MapContainer,
	Marker,
	MarkerTypes,
	type Position,
	// type MapError,
	MapContainerTypes,
	type MapEventResponse,
} from 'react-native-mapsforge-vtm';
// import Marker from '../../src/components/Marker';
// import type { MarkerEvent } from '../../src/NativeModules/NativeLayerMarker';
// import type { TriggerEvent } from '../../src/components/LayerMarker';

const defaultCenter: Position = [-77, -9]; // [ lng, lat ]

const Center = ({ width, height }: { width: number; height: number }) => {
	const size = 25;

	return (
		<View
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				justifyContent: 'center',
				alignItems: 'center',
				width,
				height,
			}}
		>
			<Text
				style={{
					color: 'red',
					fontSize: size,
					fontWeight: 'bold',
				}}
			>
				X
			</Text>
		</View>
	);
};

export const randomNumber = (min: number, max: number): number =>
	Math.random() * (max - min) + min;

const getRandomCoordinates = (length: number): Position[] =>
	Array.apply(null, Array(length)).map(
		(): Position => [
			randomNumber(-78, -76), // lng
			randomNumber(-10, -8), // lat
		]
	);

const coordinates = getRandomCoordinates(50);

export default function App() {
	const { width } = useWindowDimensions();
	const [height] = useState(400);

	// const [mapState,setMapState] = useState<MapEventResponse>( {} );
	const [hasMarker, setHasMarker] = useState(true);
	const [enableBtns, setEnableBtns] = useState(false);

	const triggerEvent = useRef<MarkerTypes.TriggerEvent>(null);

	useEffect(() => {
		setEnableBtns(!!triggerEvent?.current);
	}, [triggerEvent?.current]);

	return (
		<View style={styles.container}>
			<Button
				title={'Bla'}
				onPress={() => setHasMarker(!hasMarker)}
			/>

			<View
				style={{
					width,
					flexDirection: 'row',
					justifyContent: 'space-evenly',
				}}
			>
				<Button
					disabled={enableBtns}
					onPress={() => {
						triggerEvent?.current &&
							triggerEvent?.current({
								x:
									PixelRatio.getPixelSizeForLayoutSize(
										width
									) / 2,
								y:
									PixelRatio.getPixelSizeForLayoutSize(
										height
									) / 2,
								strategy: 'all',
							});
					}}
					title={'Trigger all'}
				/>
				<Button
					disabled={enableBtns}
					onPress={() => {
						triggerEvent?.current &&
							triggerEvent?.current({
								x:
									PixelRatio.getPixelSizeForLayoutSize(
										width
									) / 2,
								y:
									PixelRatio.getPixelSizeForLayoutSize(
										height
									) / 2,
								strategy: 'first',
							});
					}}
					title={'Trigger first'}
				/>
				<Button
					disabled={enableBtns}
					onPress={() => {
						triggerEvent?.current &&
							triggerEvent?.current({
								x:
									PixelRatio.getPixelSizeForLayoutSize(
										width
									) / 2,
								y:
									PixelRatio.getPixelSizeForLayoutSize(
										height
									) / 2,
								strategy: 'nearest',
							});
					}}
					title={'Trigger nearest'}
				/>
			</View>

			<View
				style={{
					height,
					width,
				}}
			>
				<MapContainer
					width={width}
					height={height}
					center={defaultCenter}
					responseInclude={{
						zoomLevel: 2,
						// zoom: 2,
						// scale: 2,
						// zoomScale: 2,
						// bearing: 2,
						// roll: 2,
						// tilt: 2,
						center: 2,
					}}
					zoomLevel={8}
					// onMapUpdate={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
					//   console.log( 'debug onMapUpdate', response?.nativeEvent ); // debug
					//   setMapState( response?.nativeEvent );
					// } }
					onPause={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
					  console.log( 'debug onPause', response?.nativeEvent ); // debug
					} }
					onResume={ ( response: NativeSyntheticEvent<Readonly<MapEventResponse>> ) => {
					  console.log( 'debug onResume', response?.nativeEvent ); // debug
					} }
					onError={(
						response: NativeSyntheticEvent<
							Readonly<MapContainerTypes.MapError>
						>
					) => {
						console.log('debug onError', response?.nativeEvent); // debug
					}}
				>
					<LayerBitmapTile />

					<LayerPath coordinates={coordinates} />

					<LayerMarker
						triggerEvent={triggerEvent}
						onMarkerEvent={(response?: MarkerTypes.MarkerEvent) => {
							console.log('debug onMarkerEvent', response); // debug
						}}
					>
						{hasMarker &&
							[...coordinates].map(
								(position: Position, idx: number) => {
									return (
										<Marker
											key={idx}
											position={position}
											// onEvent={ ( response?: MarkerTypes.MarkerEvent ) => {
											//   console.log( 'debug onEvent', response ); // debug
											// } }

											symbol={{
												// ...symbols[index % symbols.length],
												text: idx + '',
											}}
										/>
									);
								}
							)}

						{/* { hasMarker && <Marker position={ defaultCenter }/> } */}
					</LayerMarker>
				</MapContainer>

				<Center
					height={height}
					width={width}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-evenly',
	},
});
