// export { default as MapsforgeVtmView } from './NativeViews/MapsforgeVtmViewNativeComponent';

import MapContainer from './components/MapContainer';
import * as MapContainerTypes from './NativeViews/MapsforgeVtmViewNativeComponent';

import LayerMarker from './components/LayerMarker';
import Marker from './components/Marker';
import * as MarkerTypes from './NativeModules/NativeLayerMarker';

import LayerBitmapTile from './components/LayerBitmapTile';
import * as LayerBitmapTileTypes from './NativeModules/NativeLayerBitmapTile';

import LayerPath from './components/LayerPath';
import * as LayerPathTypes from './NativeModules/NativeLayerPath';

import LayerScalebar from './components/LayerScalebar';
import * as LayerScalebarTypes from './NativeModules/NativeLayerScalebar';

import LayerMBTilesBitmap from './components/LayerMBTilesBitmap';
import * as LayerMBTilesBitmapTypes from './NativeModules/NativeLayerMBTilesBitmap';

// import LayerMapsforge from './components/LayerMapsforge';
// import LayerHillshading from './components/LayerHillshading';
// import LayerPathSlopeGradient from './components/LayerPathSlopeGradient';

// import useRenderStyleOptions from './compose/useRenderStyleOptions';

export {
	MapContainer,
	MapContainerTypes,
	LayerMarker,
	Marker,
	MarkerTypes,
	LayerBitmapTile,
	LayerBitmapTileTypes,
	LayerPath,
	LayerPathTypes,
	LayerScalebar,
	LayerScalebarTypes,
	LayerMBTilesBitmap,
	LayerMBTilesBitmapTypes,

	// LayerMapsforge,
	// LayerHillshading,

	// LayerPathSlopeGradient,

	// useRenderStyleOptions,
};

export type * from './types';
export type * from './NativeViews/MapsforgeVtmViewNativeComponent';
