package com.jhotadhari.reactnative.mapsforge.vtm;

import androidx.annotation.NonNull;

import com.facebook.react.BaseReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MapsforgeVtmViewPackage extends BaseReactPackage {

	@NonNull
	@Override
	public List<ViewManager> createViewManagers( @NonNull ReactApplicationContext reactContext ) {
		List<ViewManager> viewManagers = new ArrayList<>();
		viewManagers.add( new MapsforgeVtmViewManager() );
		return viewManagers;
	}

	@Override
	public NativeModule getModule( @NonNull String s, @NonNull ReactApplicationContext reactApplicationContext ) {
		if ( MapContainerModule.NAME.equals( s ) ) {
			return new MapContainerModule( reactApplicationContext );
		}
		// if ( MapLayerBitmapTileModule.NAME.equals( s ) ) {
		// 	return new MapLayerBitmapTileModule( reactApplicationContext );
		// }
		return null;
	}

	@NonNull
	@Override
	public ReactModuleInfoProvider getReactModuleInfoProvider() {
		return new ReactModuleInfoProvider() {
			@NonNull
			@Override
			public Map<String, ReactModuleInfo> getReactModuleInfos() {
				Map<String, ReactModuleInfo> map = new HashMap<>();
				map.put( MapsforgeVtmViewManager.NAME, new ReactModuleInfo(
					MapsforgeVtmViewManager.NAME, 			// name
					MapsforgeVtmViewManager.NAME, 			// className
					false,							// canOverrideExistingModule
					false,							// needsEagerInit
					false,							// isCxxModule
					true							// isTurboModule
				) );
				map.put( MapContainerModule.NAME, new ReactModuleInfo(
					MapContainerModule.NAME,		// name
					MapContainerModule.NAME,		// className
					false,							// canOverrideExistingModule
					false,							// needsEagerInit
					false,							// isCxxModule
					true							// isTurboModule
				) );
				// map.put( MapLayerBitmapTileModule.NAME, new ReactModuleInfo(
				// 	MapLayerBitmapTileModule.NAME,	// name
				// 	MapLayerBitmapTileModule.NAME,	// className
				// 	false,							// canOverrideExistingModule
				// 	false,							// needsEagerInit
				// 	false,							// isCxxModule
				// 	true							// isTurboModule
				// ) );
				return map;
			}
		};
	}
}
