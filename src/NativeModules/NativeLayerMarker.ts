import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, EventEmitter, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

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

export interface ModuleParams {
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

interface EventError {
  errorMsg: string;
};

export interface CreateLayerParams extends ModuleParams {
	nativeNodeHandle?: Int32;
	reactTreeIndex?: Int32;
};

export interface RemoveLayerParams {
	nativeNodeHandle: Int32;
	uuid: string;
};

export interface Spec extends TurboModule {
	getConstants(): ModuleParams;
	createLayer( params: CreateLayerParams ): Promise<string>;
	removeLayer( params: RemoveLayerParams ): Promise<string>;
    onError: EventEmitter<EventError>;
};

export default TurboModuleRegistry.getEnforcing<Spec>( 'LayerMarker' );
