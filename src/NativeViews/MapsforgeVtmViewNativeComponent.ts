import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { Int32, Double, DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';
import type { ViewProps } from 'react-native';

/*
 * Type should be redeclared because of codegen ts parser doesn't allow imported type
 * [comments](https://github.com/reactwg/react-native-new-architecture/discussions/91#discussioncomment-4282452)
 */

interface Location {
    lng: Double;
    lat: Double;
    alt?: Double;
};

export interface MapEventResponse {
    zoomLevel?: Int32;
    zoom?: Double;
    scale?: Double;
    zoomScale?: Double;
    bearing?: Double;
    roll?: Double;
    tilt?: Double;
    center?: {      // type Location
        lng: Double;
        lat: Double;
        alt?: Double;
    };
};

// 0	never include in response.
// 1	include in lifeCycle response.
// 2	include in lifeCycle and onMapEvent response.
export interface ResponseInclude {
    // [value: string]: Int32       // Doesn't work with codegen
	zoomLevel?: Int32,
	zoom?: Int32,
	scale?: Int32,
	zoomScale?: Int32,
	bearing?: Int32,
	roll?: Int32,
	tilt?: Int32,
	center?: Int32,
};

export interface MapError {
    errorMsg: string;
};

export interface MapViewProps extends ViewProps {
    width: Double;
	height: Double;
	center: Location;
    zoomLevel: Int32;
    zoomMin: Int32;
    zoomMax: Int32;
    moveEnabled: boolean;
    tiltEnabled: boolean;
    rotationEnabled: boolean;
    zoomEnabled: boolean;
    tilt: Double;
    minTilt: Double;
    maxTilt: Double;
    bearing: Double;
    minBearing: Double;
    maxBearing: Double;
    roll: Double;
    minRoll: Double;
    maxRoll: Double;
    hgtDirPath: string;
    hgtInterpolation: boolean;
    hgtReadFileRate: Int32;
    hgtFileInfoPurgeThreshold: Int32;
    responseInclude: ResponseInclude;
    mapEventRate: Int32;
    emitsMapUpdateEvents: boolean;
	onMapCreated: DirectEventHandler<Readonly<{}>> | null;
	onMapUpdate: DirectEventHandler<Readonly<MapEventResponse>> | null;
	onPause: DirectEventHandler<Readonly<MapEventResponse>> | null;
	onResume: DirectEventHandler<Readonly<MapEventResponse>> | null;
	onError: DirectEventHandler<Readonly<MapError>> | null;
}

export default codegenNativeComponent<MapViewProps>('MapsforgeVtmView');
