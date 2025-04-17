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

// import LayerMapsforge from './components/LayerMapsforge';
// import LayerHillshading from './components/LayerHillshading';
// import LayerMBTilesBitmap from './components/LayerMBTilesBitmap';
// import LayerScalebar from './components/LayerScalebar';
// import LayerPath from './components/LayerPath';
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

	// LayerMapsforge,
	// LayerHillshading,
	// LayerMBTilesBitmap,
	// LayerScalebar,


	// LayerPathSlopeGradient,

	// useRenderStyleOptions,

};

export type * from './types';