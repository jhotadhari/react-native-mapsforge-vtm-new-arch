package com.jhotadhari.reactnative.mapsforge.vtm.modules;

import android.content.Context;
import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.documentfile.provider.DocumentFile;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.goebl.simplify.Simplify;
import com.jhotadhari.reactnative.mapsforge.vtm.Coordinate;
import com.jhotadhari.reactnative.mapsforge.vtm.LayerHelper;
import com.jhotadhari.reactnative.mapsforge.vtm.NativeLayerPathSpec;
import com.jhotadhari.reactnative.mapsforge.vtm.Utils;
import com.jhotadhari.reactnative.mapsforge.vtm.layer.VectorLayer;
import com.jhotadhari.reactnative.mapsforge.vtm.views.MapFragment;

import org.joda.time.DateTime;
import org.locationtech.jts.geom.Envelope;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.impl.CoordinateArraySequence;
import org.oscim.android.MapView;
import org.oscim.backend.canvas.Color;
import org.oscim.backend.canvas.Paint;
import org.oscim.core.GeoPoint;
import org.oscim.layers.vector.geometries.LineDrawable;
import org.oscim.layers.vector.geometries.Style;
import org.xmlpull.v1.XmlPullParserException;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import io.ticofab.androidgpxparser.parser.GPXParser;
import io.ticofab.androidgpxparser.parser.domain.Gpx;
import io.ticofab.androidgpxparser.parser.domain.TrackPoint;

@ReactModule( name = LayerPath.NAME )
public class LayerPath extends NativeLayerPathSpec {

	public static final String NAME = "LayerPath";

	private final LayerHelper layerHelper;

	protected Map<String, Coordinate[]> originalJtsCoordinatesMap = new HashMap<>();


	public LayerPath( ReactApplicationContext reactContext) {
		super(reactContext);
		layerHelper = new LayerHelper( this, this.getReactApplicationContext() );
	}

	@NonNull
	@Override
	public String getName() {
		return NAME;
	}

	@Override
	protected Map<String, Object> getTypedExportedConstants() {
		final Map<String, Object> constants = new HashMap<>();
		WritableMap style = new WritableNativeMap();
		style.putDouble( "strokeWidth", 4 );
		style.putString( "strokeColor", "#ff0000" );
		constants.put( "style", style );
		WritableMap responseInclude = new WritableNativeMap();
		responseInclude.putInt( "coordinates", 0 );
		responseInclude.putInt( "bounds", 0 );
		constants.put( "gestureScreenDistance", 20d );
		constants.put( "simplificationTolerance", 0d );
		constants.put( "responseInclude", responseInclude );
		return constants;
	}

	protected Style.Builder getStyleBuilderFromMap( ReadableMap styleMap ) {
		// Get params, assign defaults.
		double strokeWidth = Utils.rMapHasKey( styleMap, "strokeWidth" ) ? styleMap.getDouble( "strokeWidth" ) : (double) getConstants().get( "strokeWidth" );
		String strokeColor = Utils.rMapHasKey( styleMap, "strokeColor" ) ? styleMap.getString( "strokeColor" ) : (String) getConstants().get( "strokeColor" );

		Style.Builder styleBuilder = Style.builder();
		styleBuilder.strokeWidth( (float) strokeWidth );
		styleBuilder.strokeColor( Color.parseColor( Objects.requireNonNull( strokeColor ) ) );

		if ( Utils.rMapHasKey( styleMap, "fillColor" ) ) {
			styleBuilder.fillColor( Color.parseColor( Objects.requireNonNull( styleMap.getString("fillColor" ) ) ) );
		}
		if ( Utils.rMapHasKey( styleMap, "fillAlpha" ) ) {
			styleBuilder.fillAlpha( (float) styleMap.getDouble( "fillAlpha" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "buffer" ) ) {
			styleBuilder.buffer( styleMap.getDouble( "buffer" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "scalingZoomLevel" ) ) {
			styleBuilder.scaleZoomLevel( (int) styleMap.getInt( "scalingZoomLevel" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "cap" ) ) {
			Paint.Cap cap = switch ( Objects.requireNonNull( styleMap.getString("cap" ) ) ) {
				case "ROUND" -> Paint.Cap.ROUND;
				case "BUTT" -> Paint.Cap.BUTT;
				case "SQUARE" -> Paint.Cap.SQUARE;
				default -> null;
			};
			if ( cap != null ) {
				styleBuilder.cap( cap );
			}
		}
		if ( Utils.rMapHasKey( styleMap, "fixed" ) ) {
			styleBuilder.fixed( styleMap.getBoolean( "fixed" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "strokeIncrease" ) ) {
			styleBuilder.strokeIncrease( styleMap.getDouble( "strokeIncrease" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "blur" ) ) {
			styleBuilder.blur( (float) styleMap.getDouble( "blur" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "stipple" ) ) {
			styleBuilder.stipple( (int) styleMap.getInt( "stipple" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "stippleColor" ) ) {
			styleBuilder.stippleColor( Color.parseColor( Objects.requireNonNull( styleMap.getString("stippleColor" ) ) ) );
		}
		if ( Utils.rMapHasKey( styleMap, "stippleWidth" ) ) {
			styleBuilder.stippleWidth( (float) styleMap.getDouble( "stippleWidth" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "dropDistance" ) ) {
			styleBuilder.dropDistance( (float) styleMap.getDouble( "dropDistance" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "textureRepeat" ) ) {
			styleBuilder.textureRepeat( styleMap.getBoolean( "textureRepeat" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "heightOffset" ) ) {
			styleBuilder.heightOffset( (float) styleMap.getDouble( "heightOffset" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "randomOffset" ) ) {
			styleBuilder.randomOffset( styleMap.getBoolean( "randomOffset" ) );
		}
		if ( Utils.rMapHasKey( styleMap, "transparent" ) ) {
			styleBuilder.transparent( styleMap.getBoolean( "transparent" ) );
		}
		return styleBuilder;
	}

	protected static Coordinate[] readableArrayToJtsCoordinates( ReadableArray positions, float simplificationToloerance ) {
		Coordinate[] jtsCoordinates = new Coordinate[positions.size()];
		for ( int i = 0; i < positions.size(); i++ ) {
			ReadableType readableType = positions.getType( i );
			if ( readableType == ReadableType.Map ) {
				ReadableMap position = positions.getMap( i );
				jtsCoordinates[i] = new Coordinate(
					(double) position.getDouble( "lng" ),
					(double) position.getDouble( "lat" ),
					(double) ( position.hasKey( "alt" ) ? position.getDouble( "alt" ) : 0 )
				);
			}
		}
		if ( simplificationToloerance > 0 ) {
			Simplify<Coordinate> simplify = new Simplify<Coordinate>( new Coordinate[0] );
			jtsCoordinates = simplify.simplify( jtsCoordinates, simplificationToloerance, true );
		}
		return jtsCoordinates;
	}

	protected Coordinate[] loadGpxToJtsCoordinates( Context context, String filePath, float simplificationTolerance, Promise promise ) throws URISyntaxException, IOException {
		Coordinate[] jtsCoordinates = new Coordinate[0];

		InputStream in = null;
		if ( filePath.startsWith( "content://" ) ) {
			DocumentFile dir = DocumentFile.fromSingleUri( context, Uri.parse( filePath ) );
			if ( dir == null || ! dir.exists() || ! dir.isFile() ) {
				return null;
			}
			if ( ! Utils.hasScopedStoragePermission( context, filePath, false ) ) {
				promise.reject( "Error", "No scoped storage read permission for filePath " + filePath ); return null;
			}
			in = context.getContentResolver().openInputStream( Uri.parse( filePath ) );
			assert in != null;
		}

		if ( filePath.startsWith( "/" ) ) {
			File gpxFile = new File( filePath );
			if( ! gpxFile.exists() || ! gpxFile.isFile() || ! gpxFile.canRead() ) {
				return null;
			}
			in = new FileInputStream( gpxFile );
		}
		if( in == null ) {
			return null;
		}

		GPXParser parser = new GPXParser();
		Gpx parsedGpx = null;
		try {
			parsedGpx = parser.parse( in );
		} catch ( IOException | XmlPullParserException e ) {
			e.printStackTrace();
			promise.reject( "Error", e ); return jtsCoordinates;
		}
		if ( parsedGpx == null ) {
			promise.reject( "Error", "Unable to parse gpx file: " + filePath ); return jtsCoordinates;
		}
		List<TrackPoint> points = parsedGpx.getTracks().get(0).getTrackSegments().get(0).getTrackPoints();
		jtsCoordinates = new Coordinate[points.size()];
		for ( int i = 0; i < points.size(); i++) {
			TrackPoint point = (TrackPoint) points.get( i );
			jtsCoordinates[i] = new Coordinate(
				point.getLongitude(),
				point.getLatitude(),
				point.getElevation(),
				point.getTime()
			);
		}
		if ( simplificationTolerance > 0 ) {
			Simplify<Coordinate> simplify = new Simplify<Coordinate>( new Coordinate[0] );
			jtsCoordinates = simplify.simplify( jtsCoordinates, simplificationTolerance, true );
		}
		return jtsCoordinates;
	}

	@Override
	public void createLayer( ReadableMap params, Promise promise ) {
		try {
			if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
				Utils.promiseReject( promise,"Undefined nativeNodeHandle" ); return;
			}
			MapView mapView = Utils.getMapView( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
			MapFragment mapFragment = Utils.getMapFragment( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
			if ( null == mapView || null == mapFragment ) {
				Utils.promiseReject( promise,"Unable to find mapView or mapFragment" ); return;
			}

			// Get params, assign defaults.
			boolean supportsGestures = Utils.rMapHasKey( params, "supportsGestures" ) && params.getBoolean( "supportsGestures" );
			double gestureScreenDistance = Utils.rMapHasKey( params, "gestureScreenDistance" ) ? params.getDouble( "gestureScreenDistance" ) : (double) getConstants().get( "gestureScreenDistance" );
			double simplificationTolerance = Utils.rMapHasKey( params, "simplificationTolerance" ) ? params.getDouble( "simplificationTolerance" ) : (double) getConstants().get( "simplificationTolerance" );
			ReadableArray positions = Utils.rMapHasKey( params, "positions" ) ? params.getArray( "positions" ) : null;
			ReadableMap responseInclude = Utils.rMapHasKey( params, "responseInclude" ) ? params.getMap( "responseInclude" ) : (ReadableMap) getConstants().get( "responseInclude" );
			ReadableMap style = Utils.rMapHasKey( params, "style" ) ? params.getMap( "style" ) : (ReadableMap) getConstants().get( "style" );
			String filePath = Utils.rMapHasKey( params, "filePath" ) ? params.getString( "filePath" ) : null;

			String uuid = UUID.randomUUID().toString();

			// The promise response
			WritableMap responseParams = new WritableNativeMap();

			// Init layer
			VectorLayer vectorLayer = new VectorLayer(
				mapView.map(),
				uuid,
				getReactApplicationContext(),
				supportsGestures,
				"PathGesture",
				(float) gestureScreenDistance
			);

			// Store layer.
			layerHelper.addLayer( vectorLayer, params, uuid );

			// Convert input params to jtsCoordinates
			Coordinate[] jtsCoordinates = new Coordinate[0];
			if ( null != positions && positions.size() > 0 ) {
				jtsCoordinates = readableArrayToJtsCoordinates( positions, (float) simplificationTolerance );
			} else if ( filePath != null && filePath.length() > 0 && filePath.endsWith( ".gpx" ) ) {
				jtsCoordinates = loadGpxToJtsCoordinates( mapView.getContext(), filePath, (float) simplificationTolerance, promise );
			}
			if ( null == jtsCoordinates || jtsCoordinates.length == 0 ) {
				promise.reject( "Error", "Unable to parse positions or gpx file" ); return;
			}

			// Store coordinates
			originalJtsCoordinatesMap.put( uuid, jtsCoordinates );

			// Draw line.
			drawLineForCoordinates(
				jtsCoordinates,
				getStyleBuilderFromMap( style ),
				uuid,
				vectorLayer
			);

			addStuffToResponse( uuid, responseInclude, 0, responseParams );

			// Resolve layer hash
			responseParams.putString( "uuid", uuid );
			promise.resolve( responseParams );
		} catch( Exception e ) {
			e.printStackTrace();
			promise.reject( "Error", e );
		}
	}

//
//	@ReactMethod
//	public void triggerEvent(
//			int nativeNodeHandle,
//			String layerUuid,
//			float x,
//			float y,
//			Promise promise
//	) {
//		MapFragment mapFragment = Utils.getMapFragment( this.getReactApplicationContext(), nativeNodeHandle );
//		MapView mapView = (MapView) Utils.getMapView( this.getReactApplicationContext(), nativeNodeHandle );
//		if ( mapFragment == null || null == mapView ) {
//			promise.reject( "Error", "Unable to find mapView or mapFragment" ); return;
//		}
//		VectorLayer vectorLayer = layers.get( layerUuid );
//		if ( vectorLayer == null ) {
//			promise.reject( "Error", "Unable to find vectorLayer" ); return;
//		}
//		WritableMap params = vectorLayer.containsGetResponse( x, y );
//		if (  null != params ) {
//			// Add type
//			params.putString( "type", "trigger" );
//			// Add eventPosition
//			WritableMap eventPosition = new WritableNativeMap();
//			GeoPoint eventPoint = mapView.map().viewport().fromScreenPoint( x, y );
//			eventPosition.putDouble("lng", eventPoint.getLongitude() );
//			eventPosition.putDouble("lat", eventPoint.getLatitude() );
//			params.putMap( "eventPosition", eventPosition );
//			// sendEvent
//			Utils.sendEvent( mapFragment.getReactContext(), vectorLayer.getGestureEventName(), params );
//		}
//		promise.resolve( params );
//	}

	@ReactMethod
	public void updateStyle( ReadableMap params, Promise promise ) {
		WritableMap responseParams = new WritableNativeMap();
		try {
			if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
				Utils.promiseReject( promise,"Undefined nativeNodeHandle" ); return;
			}
			if ( ! Utils.rMapHasKey( params, "uuid" ) ) {
				Utils.promiseReject( promise,"Undefined uuid" ); return;
			}
			String uuid = params.getString( "uuid" );
			responseParams.putString( "uuid", uuid );
			MapView mapView = Utils.getMapView( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
			MapFragment mapFragment = Utils.getMapFragment( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
			if ( null == mapView || null == mapFragment ) {
				Utils.promiseReject( promise,"Unable to find mapView or mapFragment" ); return;
			}

			// Get params, assign defaults.
			ReadableMap responseInclude = Utils.rMapHasKey( params, "responseInclude" ) ? params.getMap( "responseInclude" ) : (ReadableMap) getConstants().get( "responseInclude" );
			ReadableMap style = Utils.rMapHasKey( params, "style" ) ? params.getMap( "style" ) : (ReadableMap) getConstants().get( "style" );

			VectorLayer vectorLayer = (VectorLayer) layerHelper.getLayers().get( uuid );
			if ( null == vectorLayer ) {
				Utils.promiseReject( promise,"Layer not found" ); return;
			}

			// Create new vectorLayer.
			VectorLayer vectorLayerNew = new VectorLayer(
				mapView.map(),
				uuid,
				getReactApplicationContext(),
				vectorLayer.getSupportsGestures(),
				vectorLayer.getGestureEventName(),
				vectorLayer.getGestureScreenDistance()
			);

			// draw new
			drawLineForCoordinates(
				originalJtsCoordinatesMap.get( uuid ),
				getStyleBuilderFromMap( style ),
				uuid,
				vectorLayerNew
			);

			layerHelper.replaceLayer(
				params.getInt( "nativeNodeHandle" ),
				uuid,
				vectorLayerNew
			);

			addStuffToResponse( uuid, responseInclude, 1, responseParams );

		} catch( Exception e ) {
			e.printStackTrace();
			promise.reject( "Error", e );
		}
		promise.resolve( responseParams );
	}

	@ReactMethod
	public void updateGestureScreenDistance( ReadableMap params, Promise promise ) {
		WritableMap responseParams = new WritableNativeMap();
		try {

			if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
				Utils.promiseReject( promise,"Undefined nativeNodeHandle" ); return;
			}
			if ( ! Utils.rMapHasKey( params, "uuid" ) ) {
				Utils.promiseReject( promise,"Undefined uuid" ); return;
			}
			String uuid = params.getString( "uuid" );
			responseParams.putString( "uuid", uuid );
			MapView mapView = Utils.getMapView( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
			if ( null == mapView ) {
				Utils.promiseReject( promise,"Unable to find mapView" ); return;
			}
			VectorLayer vectorLayer = (VectorLayer) layerHelper.getLayers().get( uuid );
			if ( null == vectorLayer ) {
				Utils.promiseReject( promise,"Layer not found" ); return;
			}

			// Get params, assign defaults.
			double gestureScreenDistance = Utils.rMapHasKey( params, "gestureScreenDistance" ) ? params.getDouble( "gestureScreenDistance" ) : (double) getConstants().get( "gestureScreenDistance" );
			ReadableMap responseInclude = Utils.rMapHasKey( params, "responseInclude" ) ? params.getMap( "responseInclude" ) : (ReadableMap) getConstants().get( "responseInclude" );

			vectorLayer.setGestureScreenDistance( (float) gestureScreenDistance );
			addStuffToResponse( uuid, responseInclude, 1, responseParams );
		} catch( Exception e ) {
			promise.reject( "Error", e );
		}
		promise.resolve( responseParams );
	}

	protected void drawLineForCoordinates(
			Coordinate[] jtsCoordinates,
			Style.Builder styleBuilder,
			String uuid,
			VectorLayer vectorLayer
	) {
		if ( null == jtsCoordinates || jtsCoordinates.length == 0 ) {
			return;
		}
		Style style = styleBuilder.build();
		for (int i = 0; i < jtsCoordinates.length; i++) {
			if ( i != 0 ) {
				double[] segment = new double[4];
				segment[0] = jtsCoordinates[i].x;
				segment[1] = jtsCoordinates[i].y;
				segment[2] = jtsCoordinates[i-1].x;
				segment[3] = jtsCoordinates[i-1].y;
				vectorLayer.add( new LineDrawable(
						segment,
						style
				) );
			}
		}
	}

	protected void addStuffToResponse( String uuid, ReadableMap responseInclude, int includeLevel, WritableMap responseParams ) {
		// Maybe add coordinates to promise response.
		if ( responseInclude.getInt( "coordinates" ) > includeLevel ) {
			addCoordinatesToResponse( originalJtsCoordinatesMap.get( uuid ), responseParams );
		}
		// Maybe add bounds to response.
		if ( responseInclude.getInt( "bounds" ) > includeLevel ) {
			addBoundsToResponse( originalJtsCoordinatesMap.get( uuid ), responseParams );
		}
	}

	protected void addBoundsToResponse(
		@Nullable Coordinate[] jtsCoordinates,
		WritableMap responseParams
	) {
		if ( null != jtsCoordinates ) {
			Geometry geometry = new LineString( new CoordinateArraySequence( jtsCoordinates ), new GeometryFactory() );
			Envelope boundingBox = geometry.getEnvelopeInternal();
			WritableMap boundsParams = new WritableNativeMap();
			boundsParams.putDouble("minLat", boundingBox.getMinY());
			boundsParams.putDouble("minLng", boundingBox.getMinX());
			boundsParams.putDouble("maxLat", boundingBox.getMaxY());
			boundsParams.putDouble("maxLng", boundingBox.getMaxX());
			responseParams.putMap("bounds", boundsParams);
		}
	}

	protected void addCoordinatesToResponse(
		@Nullable Coordinate[] jtsCoordinates,
		WritableMap responseParams
	) {
		if ( null != jtsCoordinates && jtsCoordinates.length > 0 && ! responseParams.hasKey( "coordinates" ) ) {
			WritableArray coordinatesResponseArray = new WritableNativeArray();
			double accumulatedDistance = 0;
			for (int i = 0; i < jtsCoordinates.length; i++) {
				double distanceToLast = i == 0
					? 0
					: new GeoPoint(
					(double) jtsCoordinates[i].y,
					(double) jtsCoordinates[i].x
				).sphericalDistance( new GeoPoint(
					(double) jtsCoordinates[i-1].y,
					(double) jtsCoordinates[i-1].x
				) );
				accumulatedDistance += distanceToLast;
				WritableMap position = getResponsePositionFromJtsCoordinate( jtsCoordinates[i], accumulatedDistance );
				coordinatesResponseArray.pushMap( position );
			}
			// Add to responseParams.
			responseParams.putArray( "coordinates", coordinatesResponseArray );
		}
	}

	protected WritableMap getResponsePositionFromJtsCoordinate( Coordinate coordinate, double accumulatedDistance ){
		WritableMap position = new WritableNativeMap();
		position.putDouble( "lng", (double) coordinate.x );
		position.putDouble( "lat", (double) coordinate.y );
		position.putDouble( "alt", (double) coordinate.z );
		position.putDouble( "distance", (double) accumulatedDistance );
		DateTime time = coordinate.dateTime;
		if ( null != time ) {
			position.putDouble( "time", (double) ( time.getMillis() / 1000L ) );
		}
		return position;
	}

	@Override
	public void removeLayer( ReadableMap params, Promise promise ) {
		if ( ! Utils.rMapHasKey( params, "uuid" ) || ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
			Utils.promiseReject( promise,"Undefined uuid or nativeNodeHandle" ); return;
		}
		originalJtsCoordinatesMap.remove( params.getString( "uuid" ) );
		layerHelper.removeLayer( params, promise );
	}

}
