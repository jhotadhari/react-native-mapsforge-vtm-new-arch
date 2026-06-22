package com.jhotadhari.reactnative.mapsforge.vtm.modules;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.jhotadhari.reactnative.mapsforge.vtm.LayerOrderRegistry;
import com.jhotadhari.reactnative.mapsforge.vtm.NativeMapContainerSpec;
import com.jhotadhari.reactnative.mapsforge.vtm.Utils;

import org.oscim.android.MapView;
import org.oscim.layers.Layer;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ReactModule( name = MapContainer.NAME )
public class MapContainer extends NativeMapContainerSpec {

	public static final String NAME = "MapContainer";

	public MapContainer( ReactApplicationContext reactContext ) {
		super( reactContext );
	}

	@NonNull
	@Override
	public String getName() {
		return NAME;
	}

	@Override
	protected Map<String, Object> getTypedExportedConstants() {
		final Map<String, Object> constants = new HashMap<>();
		constants.put( "width", null );
		constants.put( "height", 200 );
		constants.put( "center", Utils.positionToWritableArray( -77.605, -9.118, null ) );
		constants.put( "zoomLevel", 12 );
		constants.put( "zoomMin", 1 );
		constants.put( "zoomMax", 20 );
		constants.put( "moveEnabled", true );
		constants.put( "tiltEnabled", true );
		constants.put( "rotationEnabled", true );
		constants.put( "zoomEnabled", true );
		constants.put( "tilt", 0 );
		constants.put( "minTilt", 0 );
		constants.put( "maxTilt", 65 );
		constants.put( "bearing", 0 );
		constants.put( "minBearing", -180 );
		constants.put( "maxBearing", 180 );
		constants.put( "roll", 0 );
		constants.put( "minRoll", -180 );
		constants.put( "maxRoll", 180 );
		constants.put( "hgtDirPath", null );
		constants.put( "hgtInterpolation", true );
		constants.put( "hgtReadFileRate", 100 );
		constants.put( "hgtFileInfoPurgeThreshold", 3 );
		WritableMap responseInclude = new WritableNativeMap();
		responseInclude.putInt( "zoomLevel", 0 );
		responseInclude.putInt( "zoom", 0 );
		responseInclude.putInt( "scale", 0 );
		responseInclude.putInt( "zoomScale", 0 );
		responseInclude.putInt( "bearing", 0 );
		responseInclude.putInt( "roll", 0 );
		responseInclude.putInt( "tilt", 0 );
		responseInclude.putInt( "center", 0 );
		constants.put( "responseInclude", responseInclude );
		constants.put( "mapEventRate", 40 );
		constants.put( "emitsMapUpdateEvents", null );
		WritableArray emitsHardwareKeyUp = new WritableNativeArray();
		emitsHardwareKeyUp.pushString( "KEYCODE_VOLUME_UP" );
		emitsHardwareKeyUp.pushString( "KEYCODE_VOLUME_DOWN" );
		constants.put( "emitsHardwareKeyUp", emitsHardwareKeyUp );
		return constants;
	}

	@Override
	public void reorderLayers( ReadableMap params, Promise promise ) {
		try {
			if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) || ! Utils.rMapHasKey( params, "layerUuids" ) ) {
				Utils.promiseReject( promise, "Undefined nativeNodeHandle or layerUuids" ); return;
			}

			int nativeNodeHandle = params.getInt( "nativeNodeHandle" );
			MapView mapView = Utils.getMapView( getReactApplicationContext(), nativeNodeHandle );
			if ( null == mapView ) {
				Utils.promiseReject( promise, "Unable to find mapView" ); return;
			}

			// Resolve uuids to live Layer instances that are still actually attached to the
			// map. Any tracked layer that isn't mentioned (e.g. still mid-creation on the JS
			// side) is left untouched wherever it currently sits, rather than wiping the whole
			// list, so a reorder triggered by one layer can never orphan another.
			ReadableArray layerUuids = params.getArray( "layerUuids" );
			List<Layer> orderedLayers = new ArrayList<>();
			for ( int i = 0; i < layerUuids.size(); i++ ) {
				Layer layer = LayerOrderRegistry.get( nativeNodeHandle, layerUuids.getString( i ) );
				if ( null != layer && mapView.map().layers().contains( layer ) ) {
					orderedLayers.add( layer );
				}
			}

			for ( Layer layer : orderedLayers ) {
				mapView.map().layers().remove( layer );
			}
			for ( Layer layer : orderedLayers ) {
				mapView.map().layers().add( layer );
			}

			mapView.map().updateMap();

			promise.resolve( null );
		} catch ( Exception e ) {
			e.printStackTrace();
			Utils.promiseReject( promise, e.getMessage() );
		}
	}

}
