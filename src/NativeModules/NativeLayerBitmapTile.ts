import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';

export interface ModuleParams {
	url?: string;
	alpha?: Double;			// float between 0 and 1.
	zoomMin?: Int32;
	zoomMax?: Int32;
	enabledZoomMin?: Int32;
	enabledZoomMax?: Int32;
	cacheSize?: Int32;		// mb
	cacheDirBase?: string;	// empty will be handled java side.
	cacheDirChild?: string;	// empty will be handled java side.
};

export interface CreateLayerParams extends ModuleParams {
	nativeNodeHandle?: Int32;
	reactTreeIndex?: Int32;
};

export interface RemoveLayerParams {
	nativeNodeHandle: Int32;
	uuid: string;
};

export interface UpdateEnabledZoomMinMaxParams {
	nativeNodeHandle: Int32;
	uuid: string;
	enabledZoomMin?: Int32;
	enabledZoomMax?: Int32;
};

export interface SetAlphaParams {
	nativeNodeHandle: Int32;
	uuid: string;
	alpha?: Int32;
};

export interface Spec extends TurboModule {
	getConstants(): ModuleParams;
	createLayer( params: CreateLayerParams ): Promise<string>;
	removeLayer( params: RemoveLayerParams ): Promise<string>;
	updateEnabledZoomMinMax( params: UpdateEnabledZoomMinMaxParams ): Promise<string>;
	setAlpha( params: SetAlphaParams ): Promise<string>;
};

export default TurboModuleRegistry.getEnforcing<Spec>( 'LayerBitmapTile' );
