package com.jhotadhari.reactnative.mapsforge.vtm;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReadableMap;

import org.oscim.android.MapView;
import org.oscim.layers.Layer;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class LayerHelper {

	protected final ReactContextBaseJavaModule module;

	protected final ReactApplicationContext reactContext;

	protected final Map<String, Layer> layers = new HashMap<>();

	public LayerHelper( ReactContextBaseJavaModule module, ReactApplicationContext reactContext ) {
		this.module = module;
		this.reactContext = reactContext;
	}

	public Map<String, Layer> getLayers() {
		return layers;
	}

	public String addLayer( Layer layer, ReadableMap params ) {
		if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) { return null; }
		MapView mapView = Utils.getMapView( reactContext, params.getInt( "nativeNodeHandle" ) );
		if ( null == mapView ) { return null; }

		// Add layer to map.
		mapView.map().layers().add(
			Math.min( mapView.map().layers().size(), (int) params.getInt( "reactTreeIndex" ) ),
			layer
		);

		// Trigger update map.
		mapView.map().clearMap();

		String uuid = UUID.randomUUID().toString();
		layers.put( uuid, layer );

		return uuid;
	}


	public void removeLayer( ReadableMap params, Promise promise ) {
		try {
			if ( ! Utils.rMapHasKey( params, "uuid" ) || ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
				Utils.promiseReject( promise,"Undefined uuid or nativeNodeHandle" ); return;
			}

			int nativeNodeHandle = params.getInt( "nativeNodeHandle" );
			String uuid = params.getString( "uuid" );


			MapView mapView = Utils.getMapView( reactContext, nativeNodeHandle );
			if ( null == mapView ) {
				Utils.promiseReject( promise, "Unable to find mapView" ); return;
			}

			// Remove layer from map.
			int layerIndex = getLayerIndexInMapLayers( nativeNodeHandle, uuid );
			if ( layerIndex != -1 ) {
				mapView.map().layers().remove( layerIndex );
			}

			// Remove layer from layers.
			layers.remove( uuid );

			// Trigger map update.
			mapView.map().clearMap();

			// Resolve uuid
			promise.resolve( uuid );
		} catch( Exception e ) {
			e.printStackTrace();
			Utils.promiseReject( promise, e.getMessage() );
		}
	}


	protected int getLayerIndexInMapLayers(
		int nativeNodeHandle,
		String uuid
	) {
		MapView mapView = Utils.getMapView( reactContext, nativeNodeHandle );
		if ( null == mapView ) {
			return -1;
		}

		Layer layer = layers.get( uuid );
		if ( null == layer ) {
			return -1;
		}

		int layerIndex = -1;
		int i = 0;
		while ( layerIndex == -1 || i < mapView.map().layers().size() ) {
			if ( layer == mapView.map().layers().get( i ) ) {
				layerIndex = i;
			}
			i++;
		}
		return layerIndex;
	}

}
