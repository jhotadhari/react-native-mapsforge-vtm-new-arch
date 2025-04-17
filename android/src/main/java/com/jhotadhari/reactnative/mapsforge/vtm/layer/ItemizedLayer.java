package com.jhotadhari.reactnative.mapsforge.vtm.layer;

import org.oscim.layers.marker.MarkerInterface;
import org.oscim.layers.marker.MarkerSymbol;
import org.oscim.map.Map;

import java.util.List;

public class ItemizedLayer extends org.oscim.layers.marker.ItemizedLayer {

	protected final MarkerSymbol mDefaultMarker;

	public ItemizedLayer( Map map, List<MarkerInterface> list, MarkerSymbol defaultMarker, OnItemGestureListener<MarkerInterface> listener ) {
		super( map, list, defaultMarker, listener );
		mDefaultMarker = defaultMarker;
	}

	public MarkerSymbol getDefaultMarker() {
		return mDefaultMarker;
	}
}
