import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import type { Position as GeoJsonPosition } from 'geojson';

/*
 * Type should be redeclared because of codegen ts parser doesn't allow imported type
 * [comments](https://github.com/reactwg/react-native-new-architecture/discussions/91#discussioncomment-4282452)
 *
 * Mirrors geojson's `Position` ( `[ lng, lat, alt? ]` ), but using `Double` as required by codegen.
 */
type Position = ReadonlyArray<Double>;

// 0	never include in response.
// 1	include in lifeCycle response.
// 2	include in lifeCycle and onMapEvent response.
export interface ResponseInclude {
  // [value: string]: Int32       // Doesn't work with codegen
  coordinates?: Int32;
  bounds?: Int32;
}

export type GeometryStyle = {
  strokeWidth?: Double;
  strokeColor?: `#${string}`;
  fillColor?: `#${string}`;
  fillAlpha?: Double;
  buffer?: Double;
  scalingZoomLevel?: Int32;
  cap?: 'SQUARE' | 'ROUND' | 'BUTT';
  fixed?: boolean;
  strokeIncrease?: Double;
  blur?: Double;
  stipple?: Int32;
  stippleColor?: `#${string}`;
  stippleWidth?: Double;
  dropDistance?: Double;
  textureRepeat?: boolean;
  heightOffset?: Double;
  randomOffset?: boolean;
  transparent?: boolean;
};

interface ModuleParams {
  style?: {
    strokeWidth?: Double;
    strokeColor?: string;
  };
  responseInclude?: {
    // ResponseInclude
    coordinates?: Int32;
    bounds?: Int32;
  };
  // supportsGestures?: boolean;
  gestureScreenDistance?: Double;
  simplificationTolerance?: Double;
}

interface CreateLayerParams extends ModuleParams {
  nativeNodeHandle?: Int32;
  reactTreeIndex?: Int32;
  coordinates?: ReadonlyArray<Position>; // geojson LineString-style `coordinates`
  filePath?: string;
  supportsGestures?: boolean;
}

interface UpdateStyleParams {
  nativeNodeHandle?: Int32;
  uuid?: string;
  style?: {
    // GeometryStyle
    strokeWidth?: Double;
    strokeColor?: string;
    fillColor?: string;
    fillAlpha?: Double;
    buffer?: Double;
    scalingZoomLevel?: Int32;
    cap?: string;
    fixed?: boolean;
    strokeIncrease?: Double;
    blur?: Double;
    stipple?: Int32;
    stippleColor?: string;
    stippleWidth?: Double;
    dropDistance?: Double;
    textureRepeat?: boolean;
    heightOffset?: Double;
    randomOffset?: boolean;
    transparent?: boolean;
  };
  responseInclude?: {
    // ResponseInclude
    coordinates?: Int32;
    bounds?: Int32;
  };
}

interface UpdateGestureScreenDistanceParams {
  nativeNodeHandle?: Int32;
  uuid?: string;
  gestureScreenDistance?: Double;

  responseInclude?: {
    // ResponseInclude
    coordinates?: Int32;
    bounds?: Int32;
  };
}

interface RemoveLayerParams {
  nativeNodeHandle: Int32;
  uuid: string;
}

export type Bounds = {
  minLat: Double;
  minLng: Double;
  maxLat: Double;
  maxLng: Double;
};

export interface PathCoordinate {
  position: Position; // [ lng, lat, alt? ]
  distance?: Double;
  time?: Double;
}

interface ResponseBase {
  uuid: string;
  nativeNodeHandle: Int32;
}

export interface LayerPathResponse extends ResponseBase {
  coordinates?: PathCoordinate[];
  bounds?: Bounds;
}

export interface LayerPathGestureResponse extends ResponseBase {
  type: string;
  distance: number;
  nearestPoint: GeoJsonPosition;
  eventPosition: GeoJsonPosition;
}

export type LayerPathProps = {
  nativeNodeHandle?: null | number;
  reactTreeIndex?: number;
  filePath?: null | `/${string}` | `content://${string}`;
  coordinates?: GeoJsonPosition[]; // e.g. a geojson LineString's `coordinates`
  responseInclude?: ResponseInclude;
  gestureScreenDistance?: number;
  simplificationTolerance?: number;
  style?: GeometryStyle;
  onRemove?: null | ((response: ResponseBase) => void);
  onCreate?: null | ((response: LayerPathResponse) => void);
  onChange?: null | ((response: LayerPathResponse) => void);
  onError?: null | ((err: any) => void);
  onPress?: null | ((response: LayerPathGestureResponse) => void);
  onLongPress?: null | ((response: LayerPathGestureResponse) => void);
  onDoubleTap?: null | ((response: LayerPathGestureResponse) => void);
  onTrigger?: null | ((response: LayerPathGestureResponse) => void);
};

export interface Spec extends TurboModule {
  getConstants(): ModuleParams;
  createLayer(params: CreateLayerParams): Promise<LayerPathResponse>;
  removeLayer(params: RemoveLayerParams): Promise<string>;

  updateStyle(params: UpdateStyleParams): Promise<LayerPathResponse>;
  updateGestureScreenDistance(
    params: UpdateGestureScreenDistanceParams
  ): Promise<LayerPathResponse>;
  // triggerEvent( params: TriggerParamsCG ): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('LayerPath');
