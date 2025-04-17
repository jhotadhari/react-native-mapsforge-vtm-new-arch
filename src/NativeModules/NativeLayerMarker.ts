import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, EventEmitter, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

interface ResponseBase {
    uuid: string;
    nativeNodeHandle: Int32;
};

export interface MarkerResponse extends ResponseBase {
	index: number;
};

export const MarkerHotspotPlaces = [
    'NONE',
    'CENTER',
    'BOTTOM_CENTER',
    'TOP_CENTER',
    'RIGHT_CENTER',
    'LEFT_CENTER',
    'UPPER_RIGHT_CORNER',
    'LOWER_RIGHT_CORNER',
    'UPPER_LEFT_CORNER',
    'LOWER_LEFT_CORNER',
] as const;

export interface ModuleLayerParams {
	symbol?: {
        width?: Double;
        height?: Double;
        filePath?: null | string;       // `/${string}` | `content://${string}`;
        fillColor?: null | string;      // `#${string}`;
        strokeColor?: null | string;    // `#${string}`;
        strokeWidth?: Int32;
        hotspotPlace?: string;          // MarkerHotspotPlaces
        text?: null | string;
        textColor?: string;             // `#${string}`;
        textSize?: Int32;
        textMargin?: Int32;
        textStrokeWidth?: Int32;
        textPositionX?: null | Double;
        textPositionY?: null | Double;
    };
};

export interface ModuleParams extends ModuleLayerParams {
    title?: string;
    description?: string;
    position?: null | { // Location
        lng: Double;
        lat: Double;
        alt?: Double;
    };
    strategy?: string;
}

interface EventError {
  errorMsg: string;
};

export interface MarkerEvent extends ResponseBase {
	event: string;
    distance?: Double;
};

export interface CreateLayerParams extends ModuleLayerParams {
	nativeNodeHandle?: Int32;
	reactTreeIndex?: Int32;
};

export interface RemoveLayerParams {
	nativeNodeHandle: Int32;
	uuid: string;
};

export interface CreateMarkerParams extends ModuleParams {
	nativeNodeHandle: Int32;
	markerLayerUuid: string;
};

export interface RemoveMarkerParams {
	nativeNodeHandle: Int32;
	markerLayerUuid: string;
	uuid: string;
};

export interface TriggerParams {
    nativeNodeHandle?: Int32;
    markerLayerUuid?: string;
    x?: Double;
    y?: Double;
    strategy?: string;   // 'first' | '`nearest`' | `all`
}

export interface Spec extends TurboModule {
	getConstants(): ModuleParams;
	createLayer( params: CreateLayerParams ): Promise<string>;
	removeLayer( params: RemoveLayerParams ): Promise<string>;
	createMarker( params: CreateMarkerParams ): Promise<MarkerResponse>;
	removeMarker( params: RemoveMarkerParams ): Promise<string>;
    triggerEvent( params: TriggerParams ): void;
    onError: EventEmitter<EventError>;
    onMarkerEvent: EventEmitter<MarkerEvent>;
};

export default TurboModuleRegistry.getEnforcing<Spec>( 'LayerMarker' );
