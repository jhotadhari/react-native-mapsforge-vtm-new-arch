package com.jhotadhari.reactnative.mapsforge.vtm;

import org.oscim.layers.Layer;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Shared uuid -> Layer lookup across all layer-type modules (LayerMarker, LayerPath,
 * LayerBitmapTile), keyed by nativeNodeHandle. Each module owns its own LayerHelper instance
 * with its own private layers map, but reordering is a whole-map concern that has to resolve
 * uuids regardless of which module created them, so this lookup has to be shared rather than
 * living on a single LayerHelper instance.
 */
public class LayerOrderRegistry {

	private static final Map<Integer, Map<String, Layer>> layersByMap = new ConcurrentHashMap<>();

	public static void put( int nativeNodeHandle, String uuid, Layer layer ) {
		layersByMap
			.computeIfAbsent( nativeNodeHandle, k -> new HashMap<>() )
			.put( uuid, layer );
	}

	public static void remove( int nativeNodeHandle, String uuid ) {
		Map<String, Layer> layers = layersByMap.get( nativeNodeHandle );
		if ( null != layers ) {
			layers.remove( uuid );
		}
	}

	public static Layer get( int nativeNodeHandle, String uuid ) {
		Map<String, Layer> layers = layersByMap.get( nativeNodeHandle );
		return null == layers ? null : layers.get( uuid );
	}

}
