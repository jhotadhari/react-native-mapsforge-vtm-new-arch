/**
 * External dependencies
 */
import {
	cloneElement,
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
	Children,
	isValidElement,
} from 'react';
import {
	findNodeHandle,
	useWindowDimensions,
	View,
} from 'react-native';
import { get, isBoolean } from 'lodash-es';

/**
 * Internal dependencies
 */

import NativeMapContainer from '../NativeModules/NativeMapContainer';
import MapsforgeVtmView, {
    type MapViewProps,
} from '../NativeViews/MapsforgeVtmViewNativeComponent';

const moduleDefaults = NativeMapContainer.getConstants();

const useDefaultWidth = ( propsWidth?: number | null ) => {
	const { width } = useWindowDimensions();
	return propsWidth || width;
};

export type MapContainerProps = {
	children?: React.ReactNode;
	nativeNodeHandle?: null | number;
	setNativeNodeHandle?: null | Dispatch<SetStateAction<number | null>>;
	width?: null | MapViewProps['width'];
	height?: MapViewProps['height'];
	center?: MapViewProps['center'];
	zoomLevel?: MapViewProps['zoomLevel'];
	zoomMin?: MapViewProps['zoomMin'];
	zoomMax?: MapViewProps['zoomMax'];
	moveEnabled?: MapViewProps['moveEnabled'];
	tiltEnabled?: MapViewProps['tiltEnabled'];
	rotationEnabled?: MapViewProps['rotationEnabled'];
	zoomEnabled?: MapViewProps['zoomEnabled'];
	tilt?:  MapViewProps['tilt'];
	minTilt?:  MapViewProps['minTilt'];
	maxTilt?:  MapViewProps['maxTilt'];
	bearing?:  MapViewProps['bearing'];
	minBearing?:  MapViewProps['minBearing'];
	maxBearing?:  MapViewProps['maxBearing'];
	roll?:  MapViewProps['roll'];
	minRoll?:  MapViewProps['minRoll'];
	maxRoll?:  MapViewProps['maxRoll'];
	hgtDirPath?: null | `/${string}` | `content://${string}`;
	hgtInterpolation?:  MapViewProps['hgtInterpolation'];
	hgtReadFileRate?:  MapViewProps['hgtReadFileRate'];
	hgtFileInfoPurgeThreshold?:  MapViewProps['hgtFileInfoPurgeThreshold'];
	responseInclude?: MapViewProps['responseInclude'];
	mapEventRate?: MapViewProps['mapEventRate'];
	emitsMapUpdateEvents?: null | MapViewProps['emitsMapUpdateEvents'];
	onMapUpdate?: MapViewProps['onMapUpdate'];
	onPause?: MapViewProps['onPause'];
	onResume?: MapViewProps['onResume'];
	onError?: MapViewProps['onError'];
};

const MapContainer = ( {
	children,
	nativeNodeHandle = null,	// It's not possible to control the nativeNodeHandle. It's a prop just to lift the state up.
	setNativeNodeHandle = null,
	width = moduleDefaults.width,
	height = moduleDefaults.height,
	center = moduleDefaults.center,
	zoomLevel = moduleDefaults.zoomLevel,
	zoomMin = moduleDefaults.zoomMin,
	zoomMax = moduleDefaults.zoomMax,
	moveEnabled = moduleDefaults.moveEnabled,
	tiltEnabled = moduleDefaults.tiltEnabled,
	rotationEnabled = moduleDefaults.rotationEnabled,
	zoomEnabled = moduleDefaults.zoomEnabled,
	tilt = moduleDefaults.tilt,
	minTilt = moduleDefaults.minTilt,
	maxTilt = moduleDefaults.maxTilt,
	bearing = moduleDefaults.bearing,
	minBearing = moduleDefaults.minBearing,
	maxBearing = moduleDefaults.maxBearing,
	roll = moduleDefaults.roll,
	minRoll = moduleDefaults.minRoll,
	maxRoll = moduleDefaults.maxRoll,
	hgtDirPath = moduleDefaults.hgtDirPath as MapContainerProps['hgtDirPath'],
	hgtInterpolation = moduleDefaults.hgtInterpolation,
	hgtReadFileRate = moduleDefaults.hgtReadFileRate,
	hgtFileInfoPurgeThreshold = moduleDefaults.hgtFileInfoPurgeThreshold,
	responseInclude = moduleDefaults.responseInclude,
	mapEventRate = moduleDefaults.mapEventRate,
	emitsMapUpdateEvents = moduleDefaults.emitsMapUpdateEvents,
	onMapUpdate,
	onPause,
	onResume,
	onError,
} : MapContainerProps ) => {

	const ref = useRef( null );

	const [nativeNodeHandle_, setNativeNodeHandle_] = useState< number | null >( null );
	nativeNodeHandle = nativeNodeHandle ? nativeNodeHandle : nativeNodeHandle_;
	setNativeNodeHandle = setNativeNodeHandle ? setNativeNodeHandle : setNativeNodeHandle_;

    const [mapCreated,setMapCreated] = useState( false );

	width = useDefaultWidth( width );

    useEffect( () => {
		if ( ref?.current ) {
			const nodeHandle = findNodeHandle( ref?.current );
			if ( nodeHandle ) {
				setNativeNodeHandle( nodeHandle );
			}
		}
    }, [ref?.current] );

	let lastIndex = 0; // It starts with the MapFragment event layer. Otherwise it would be -1 here.
	const wrapChildren = ( children: React.ReactNode ): null | React.ReactNode => ! children || ! findNodeHandle( ref?.current ) ? null : Children.map( children, child => {
		let newChild = child;

		if ( ! isValidElement<{ children?: React.ReactNode }>( child )) {
			return newChild
		}

		const type = get( child, 'type' );
		if ( ! type || ! type.valueOf ) {
			return newChild
		}
		const isMapLayer = get( type.valueOf(), 'isMapLayer' );

		lastIndex = isMapLayer ? lastIndex + 1 : lastIndex;
		newChild = child && type ? cloneElement(
			child,
			{
				...( { nativeNodeHandle } ),
				...( isMapLayer ? { reactTreeIndex: lastIndex } : {} ),
				...( child?.props?.children && { children: wrapChildren( child.props.children ) } ),
			},
		) : child;

		return newChild;
	} );

	const wrappedChildren = wrapChildren( children );

	return <View>
		<MapsforgeVtmView
			ref={ ref }
			width={ width }
			height={ height }
			center={ center }
			zoomLevel={ Math.round( zoomLevel ) }
			zoomMin={ Math.round( zoomMin ) }
			zoomMax={ Math.round( zoomMax ) }
			moveEnabled={ moveEnabled }
			tiltEnabled={ tiltEnabled }
			rotationEnabled={ rotationEnabled }
			zoomEnabled={ zoomEnabled }
			tilt={ tilt }
			minTilt={ minTilt }
			maxTilt={ maxTilt }
			bearing={ bearing }
			minBearing={ minBearing }
			maxBearing={ maxBearing }
			roll={ roll }
			minRoll={ minRoll }
			maxRoll={ maxRoll }
			hgtDirPath={ hgtDirPath || '' }
			hgtInterpolation={ hgtInterpolation }
			hgtReadFileRate={ Math.round( hgtReadFileRate ) }
			hgtFileInfoPurgeThreshold={ Math.round( hgtFileInfoPurgeThreshold ) }
			responseInclude={ { ...moduleDefaults.responseInclude, ...responseInclude } }
			mapEventRate={ Math.round( mapEventRate ) }
			emitsMapUpdateEvents={ isBoolean( emitsMapUpdateEvents ) ? emitsMapUpdateEvents : !! onMapUpdate }
            onMapCreated={ () => setMapCreated( true ) }
            onMapUpdate={ onMapUpdate ? onMapUpdate : null }
            onPause={ onPause ? onPause : null }
            onResume={ onResume ? onResume : null }
            onError={ onError ? onError : null }
		/>
		{ mapCreated && wrappedChildren }
	</View>;
};

MapContainer.defaults = moduleDefaults;


export default MapContainer;
