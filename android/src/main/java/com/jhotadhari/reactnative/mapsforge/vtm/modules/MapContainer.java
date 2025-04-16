package com.jhotadhari.reactnative.mapsforge.vtm.modules;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.jhotadhari.reactnative.mapsforge.vtm.NativeMapContainerSpec;

import java.util.HashMap;
import java.util.Map;

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
		WritableMap center = new WritableNativeMap();
		center.putDouble( "lng", -77.605 );
		center.putDouble( "lat", -9.118 );
		constants.put( "center", center );
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

}
