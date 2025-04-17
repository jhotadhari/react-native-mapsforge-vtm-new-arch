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

export const FontFamily = [
    'DEFAULT',
    'DEFAULT_BOLD',
    'MONOSPACE',
    'SANS_SERIF',
    'SERIF',
    'THIN',
    'LIGHT',
    'MEDIUM',
    'BLACK',
    'CONDENSED',
] as const;

export const FontStyle = [
    'BOLD',
    'BOLD_ITALIC',
    'ITALIC',
    'NORMAL'
] as const;

export interface SymbolParams {
    width?: Double;
    height?: Double;
    filePath?: `/${string}` | `content://${string}`;
    fillColor?: `#${string}`;
    strokeColor?: `#${string}`;
    strokeWidth?: Int32;
    hotspotPlace?: typeof MarkerHotspotPlaces[number];
    text?: null | string;
    textColor?: `#${string}`;
    textSize?: Int32;
    textMargin?: Int32;
    textPositionX?: null | Double;
    textPositionY?: null | Double;
    fontFamily?: typeof FontFamily[number];
    fontStyle?: typeof FontStyle[number];
}

export interface ModuleLayerParams {
	symbol?: {                          // SymbolParams
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
        textPositionX?: null | Double;
        textPositionY?: null | Double;
        fontFamily?: string;            // FontFamily
        fontStyle?: string;             // FontStyle
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
