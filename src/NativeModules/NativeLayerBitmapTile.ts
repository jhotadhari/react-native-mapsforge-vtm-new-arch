import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { Double, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import type { ErrorBase, ResponseBase } from '../types';

interface ModuleParams {
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

interface CreateLayerParams extends ModuleParams {
	nativeNodeHandle?: Int32;
	reactTreeIndex?: Int32;
};

interface RemoveLayerParams {
	nativeNodeHandle: Int32;
	uuid: string;
};

interface UpdateEnabledZoomMinMaxParams {
	nativeNodeHandle: Int32;
	uuid: string;
	enabledZoomMin?: Int32;
	enabledZoomMax?: Int32;
};

interface SetAlphaParams {
	nativeNodeHandle: Int32;
	uuid: string;
	alpha?: Int32;
};

export type LayerBitmapTileProps = {
	nativeNodeHandle?: CreateLayerParams['nativeNodeHandle'];
	reactTreeIndex?: CreateLayerParams['reactTreeIndex'];
	url?: string;
	alpha?: CreateLayerParams['alpha'];
	zoomMin?: CreateLayerParams['zoomMin'];
	zoomMax?: CreateLayerParams['zoomMax'];
	enabledZoomMin?: CreateLayerParams['enabledZoomMin'];
	enabledZoomMax?: CreateLayerParams['enabledZoomMax'];
	cacheSize?: CreateLayerParams['cacheSize'];
	cacheDirBase?: `/${string}`;
	cacheDirChild?: CreateLayerParams['cacheDirChild'];
	onCreate?: null | ( ( result: ResponseBase ) => void );
	onRemove?: null | ( ( result: ResponseBase ) => void );
	onChange?: null | ( ( result: ResponseBase ) => void );
	onError?: null | ( ( err: ErrorBase ) => void );
};

export interface Spec extends TurboModule {
	getConstants(): ModuleParams;
	createLayer( params: CreateLayerParams ): Promise<string>;
	removeLayer( params: RemoveLayerParams ): Promise<string>;
	updateEnabledZoomMinMax( params: UpdateEnabledZoomMinMaxParams ): Promise<string>;
	setAlpha( params: SetAlphaParams ): Promise<string>;
};

export default TurboModuleRegistry.getEnforcing<Spec>( 'LayerBitmapTile' );
