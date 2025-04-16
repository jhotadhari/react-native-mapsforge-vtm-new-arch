package com.jhotadhari.reactnative.mapsforge.vtm;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import org.oscim.android.MapView;
import org.oscim.core.MapPosition;
import org.oscim.event.Event;
import org.oscim.layers.Layer;
import org.oscim.map.Map;

import java.lang.reflect.InvocationTargetException;

public class MapFragment extends Fragment {

	private MapView mapView;

	private Map.UpdateListener updateListener;

	protected FixedWindowRateLimiter rateLimiter;

	public MapView getMapView() {
		return mapView;
	}

	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
		return inflater.inflate( R.layout.fragment_map, container, false );
	}

	@Override
	public void onViewCreated( @NonNull View view, Bundle savedInstanceState ) {
		createMapView( view );
		WritableMap payload = Arguments.createMap();
		if ( null != getMapFragmentView() ) {
			getMapFragmentView().emitMapEvent( "onMapCreated", payload );
		}
	}

	protected void createMapView( View view ) {
		try {
			updateRateLimiterRate();
			mapView = new MapView( getContext() );
			RelativeLayout relativeLayout = view.findViewById( R.id.mapView );
			relativeLayout.addView( mapView );
			updateCenter();
			updateZoomBounds();
			updateZoomLevel();
			updateViewportBounds( "tilt" );
			updateViewportBounds( "bearing" );
			updateViewportBounds( "roll" );
			updateViewportValue( "tilt" );
			updateViewportValue( "bearing" );
			updateViewportValue( "roll" );
			updateInteractionEnabled();
			updateUpdateListener();
		} catch ( Exception e ) {
			e.printStackTrace();
			emitError( e.getMessage() );
		}
	}


	public void updateRateLimiterRate() {
		if ( null != getMapFragmentView() ) {
			rateLimiter = new FixedWindowRateLimiter( getMapFragmentView().getMapEventRate(), 1 );
		}
	}

	public void updateUpdateListener() {
		if ( null != getMapFragmentView() && getMapFragmentView().getEmitsMapUpdateEvents() && updateListener == null ) {
			bindUpdateListener();
		} else if ( ! getMapFragmentView().getEmitsMapUpdateEvents() && updateListener != null ) {
			unbindUpdateListener();
		}
	}

	protected void unbindUpdateListener() {
		if ( updateListener != null ) {
			mapView.map().events.unbind( updateListener );
			updateListener = null;
		}
	}

	protected void bindUpdateListener() {
		if ( null != getMapFragmentView() && getMapFragmentView().getEmitsMapUpdateEvents() && null == updateListener ) {
			updateListener = new Map.UpdateListener() {
				@Override
				public void onMapEvent( Event e, MapPosition mapPosition ) {
					if ( rateLimiter.tryAcquire() ) {
						getMapFragmentView().emitMapEvent( "onMapUpdate", getResponseBase( 2 ) );
					}
				}
			};
			mapView.map().events.bind( updateListener );
		}
	}

	protected WritableMap getResponseBase( int includeLevel ) {
		WritableMap payload = Arguments.createMap();
		if ( null == getMapFragmentView() ) {
			return payload;
		}
		ReadableMap responseInclude = getMapFragmentView().getResponseInclude();
		MapPosition mapPosition = mapView.map().getMapPosition();
		if ( responseInclude.getInt( "zoomLevel" ) >= includeLevel ) {
			payload.putDouble( "zoomLevel", mapPosition.getZoomLevel() );
		}
		if ( responseInclude.getInt( "zoom" ) >= includeLevel ) {
			payload.putDouble( "zoom", mapPosition.getZoom() );
		}
		if ( responseInclude.getInt( "scale" ) >= includeLevel ) {
			payload.putDouble( "scale", mapPosition.getScale() );
		}
		if ( responseInclude.getInt( "zoomScale" ) >= includeLevel ) {
			payload.putDouble( "zoomScale", mapPosition.getZoomScale() );
		}
		if ( responseInclude.getInt( "bearing" ) >= includeLevel ) {
			payload.putDouble( "bearing", mapPosition.getBearing() );
		}
		if ( responseInclude.getInt( "roll" ) >= includeLevel ) {
			payload.putDouble( "roll", mapPosition.getRoll() );
		}
		if ( responseInclude.getInt( "tilt" ) >= includeLevel ) {
			payload.putDouble( "tilt", mapPosition.getTilt() );
		}
		// center
		if ( responseInclude.getInt( "center" ) >= includeLevel ) {
			WritableMap center = new WritableNativeMap();
			center.putDouble("lng", mapPosition.getLongitude());
			center.putDouble("lat", mapPosition.getLatitude());
			if ( null != getMapFragmentView().getHgtReader() ) {
				Short altitude = getMapFragmentView().getHgtReader().getAltitudeAtPosition( center, true );
				if ( null == altitude ) {
					center.putNull("alt");
				} else {
					center.putDouble("alt", altitude.doubleValue() );
				}
			}
			payload.putMap("center", center);
		}
		return payload;
	}

	public void updateCenter() {
		if ( null != mapView && null != getMapFragmentView() ) {
			mapView.map().setMapPosition( new MapPosition(
				getMapFragmentView().getCenter().getDouble( "lat" ),
				getMapFragmentView().getCenter().getDouble( "lng" ),
				mapView.map().getMapPosition().getScale()
			) );
		}
	}

	public void updateZoomLevel() {
		if ( null != mapView && null != getMapFragmentView() ) {
			MapPosition mapPosition = mapView.map().getMapPosition();
			mapPosition.setZoomLevel( getMapFragmentView().getZoomLevel() );
			mapView.map().setMapPosition( mapPosition );
		}
	}

	public void updateZoomBounds() {
		if ( null != mapView && null != getMapFragmentView() ) {
			mapView.map().viewport().setMinZoomLevel( getMapFragmentView().getZoomBounds( "min" ) );
			mapView.map().viewport().setMaxZoomLevel( getMapFragmentView().getZoomBounds( "max" ) );
		}
	}

	public void updateViewportBounds( String key ) {
		if ( null != mapView && null != getMapFragmentView() ) {
			switch( key ) {
				case "tilt":
					mapView.map().viewport().setMinTilt( (float) getMapFragmentView().getViewportBounds( key, "min" ) );
					mapView.map().viewport().setMaxTilt( (float) getMapFragmentView().getViewportBounds( key, "max" ) );
					break;
				case "bearing":
					mapView.map().viewport().setMinBearing( (float) getMapFragmentView().getViewportBounds( key, "min" ) );
					mapView.map().viewport().setMaxBearing( (float) getMapFragmentView().getViewportBounds( key, "max" ) );
					break;
				case "roll":
					mapView.map().viewport().setMinRoll( (float) getMapFragmentView().getViewportBounds( key, "min" ) );
					mapView.map().viewport().setMaxRoll( (float) getMapFragmentView().getViewportBounds( key, "max" ) );
					break;
			}
		}
	}

	public void updateViewportValue( String key ) {
		if ( null != mapView && null != getMapFragmentView() ) {
			switch( key ) {
				case "tilt":
					mapView.map().viewport().setTilt( (float) getMapFragmentView().getViewportValue( key ) );
					break;
				case "bearing":
					mapView.map().viewport().setRotation( (float) getMapFragmentView().getViewportValue( key ) );
					break;
				case "roll":
					mapView.map().viewport().setRoll( (float) getMapFragmentView().getViewportValue( key ) );
					break;
			}
		}
	}

	public void updateInteractionEnabled() {
		if ( null != mapView && null != getMapFragmentView() ) {
			mapView.map().getEventLayer().enableMove( getMapFragmentView().getInteractionEnabled( "move" ) );
			mapView.map().getEventLayer().enableTilt( getMapFragmentView().getInteractionEnabled( "tilt" ) );
			mapView.map().getEventLayer().enableRotation( getMapFragmentView().getInteractionEnabled( "rotation" ) );
			mapView.map().getEventLayer().enableZoom( getMapFragmentView().getInteractionEnabled( "zoom" ) );
		}
	}

	@Override
	public void onPause() {
		if ( null != mapView && null != getMapFragmentView() ) {
			mapView.onPause();
			getMapFragmentView().emitMapEvent( "onPause", getResponseBase( 1 ) );
			for ( Layer layer : mapView.map().layers() ) {
				try {
					layer.getClass().getMethod("onPause").invoke( layer );
				} catch ( NoSuchMethodException | InvocationTargetException | IllegalAccessException e ) {
					e.printStackTrace();
					emitError( e.getMessage() );
				}
			}
		}
		super.onPause();
	}

	@Override
	public void onResume() {
		super.onResume();
		if ( null != mapView && null != getMapFragmentView() ) {
			mapView.onResume();
			getMapFragmentView().emitMapEvent( "onResume", getResponseBase( 1 ) );
			for ( Layer layer : mapView.map().layers() ) {
				try {
					layer.getClass().getMethod("onResume").invoke( layer );
				} catch ( NoSuchMethodException | InvocationTargetException | IllegalAccessException e ) {
					e.printStackTrace();
					emitError( e.getMessage() );
				}
			}
		}
	}

	@Override
	public void onDestroy() {
		unbindUpdateListener();
		if ( mapView != null ) {
			mapView.onDestroy();
			mapView = null;
		}
		super.onDestroy();
	}

	public void fixViewLayoutSize() {
		if ( null != getView() && null != getView().findViewById( R.id.mapView ) ) {
			ViewGroup.LayoutParams params = getView().findViewById( R.id.mapView ).getLayoutParams();
			params.width = getView().getWidth();
			params.height = getView().getHeight();
			getView().findViewById( R.id.mapView ).setLayoutParams( params );
		}
	}

	private MapFragmentView getMapFragmentView() {
		if ( null == getView() ) {
			return null;
		}
		return (MapFragmentView) getView().getParent();
	}

	protected void emitError( String errorMsg ) {
		if ( null != getMapFragmentView() ) {
			WritableMap payload = Arguments.createMap();
			payload.putString( "errorMsg", errorMsg );
			getMapFragmentView().emitMapEvent( "onError", payload );
		}
	}

}
