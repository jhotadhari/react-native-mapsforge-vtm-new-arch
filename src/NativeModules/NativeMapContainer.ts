import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

/*
 * Type should be redeclared because of codegen ts parser doesn't allow imported type
 * [comments](https://github.com/reactwg/react-native-new-architecture/discussions/91#discussioncomment-4282452)
 */

interface Location {
    lng: Double;
    lat: Double;
    alt?: Double;
};

interface ResponseInclude {
    // [value: string]: Int32       // Doesn't work with codegen
	zoomLevel?: Int32,
	zoom?: Int32,
	scale?: Int32,
	zoomScale?: Int32,
	bearing?: Int32,
	roll?: Int32,
	tilt?: Int32,
	center?: Int32,
}

export interface ModuleParams {
    width: null | Double;
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
    hgtDirPath: null | string;
    hgtInterpolation: boolean;
    hgtReadFileRate: Int32;
    hgtFileInfoPurgeThreshold: Int32;
    responseInclude: ResponseInclude;
    mapEventRate: Int32;
    emitsMapUpdateEvents: null | boolean;
    emitsHardwareKeyUp: ReadonlyArray<string>;
};

export interface Spec extends TurboModule {
	getConstants(): ModuleParams;
};

export default TurboModuleRegistry.getEnforcing<Spec>( 'MapContainer' );
