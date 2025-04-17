package com.jhotadhari.reactnative.mapsforge.vtm.modules;

import android.content.ContentResolver;
import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.documentfile.provider.DocumentFile;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;
import com.jhotadhari.reactnative.mapsforge.vtm.layer.ItemizedLayer;
import com.jhotadhari.reactnative.mapsforge.vtm.LayerHelper;
import com.jhotadhari.reactnative.mapsforge.vtm.NativeLayerMarkerSpec;
import com.jhotadhari.reactnative.mapsforge.vtm.Utils;
import com.jhotadhari.reactnative.mapsforge.vtm.views.MapFragment;

import org.oscim.android.MapView;
import org.oscim.backend.CanvasAdapter;
import org.oscim.backend.canvas.Bitmap;
import org.oscim.backend.canvas.Canvas;
import org.oscim.backend.canvas.Color;
import org.oscim.backend.canvas.Paint;
import org.oscim.core.Box;
import org.oscim.core.GeoPoint;
import org.oscim.core.Point;
import org.oscim.core.Tile;
import org.oscim.layers.marker.MarkerInterface;
import org.oscim.layers.marker.MarkerItem;
import org.oscim.layers.marker.MarkerSymbol;
import org.oscim.map.Viewport;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@ReactModule( name = LayerMarker.NAME )
public class LayerMarker extends NativeLayerMarkerSpec {

	public static final String NAME = "LayerMarker";

	private final LayerHelper layerHelper;

	protected Map<String, MarkerItem> markers = new HashMap<>();

	protected final Point tmpPoint = new Point();

	public LayerMarker( ReactApplicationContext reactContext) {
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
		// For layer and marker.
		WritableMap symbol = new WritableNativeMap();
		symbol.putDouble( "width", 30 );
		symbol.putDouble( "height", 30 );
		symbol.putString( "filePath", null );
		symbol.putString( "fillColor", null );
		symbol.putString( "strokeColor", null );
		symbol.putInt( "strokeWidth", 5 );
		symbol.putString( "hotspotPlace", "CENTER" );
		symbol.putString( "text", null );
		symbol.putInt( "textMargin", 10 );
		symbol.putInt( "textStrokeWidth", 3 );
		symbol.putNull( "textPositionX" );
		symbol.putNull( "textPositionY" );
		symbol.putString( "textColor", "#111111" );
		symbol.putInt( "textSize", 30 );
		constants.put( "symbol", symbol );
		// For marker.
		constants.put( "title", "" );
		constants.put( "description", "" );
		constants.put( "position", null );
		// For event.
		constants.put( "strategy", "nearest" );
		return constants;
	}

	@Override
	public void triggerEvent( ReadableMap params ) {
		if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
			return;
		}
		MapView mapView = Utils.getMapView( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
		MapFragment mapFragment = Utils.getMapFragment( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
		if ( null == mapView || null == mapFragment ) {
			return;
		}
		if ( ! Utils.rMapHasKey( params, "markerLayerUuid" ) ) {
			return;
		}
		ItemizedLayer markerLayer = (ItemizedLayer) layerHelper.getLayers().get( params.getString( "markerLayerUuid" ) );
		if ( markerLayer == null ) {
			return;
		}
		if ( ! Utils.rMapHasKey( params, "x" ) || ! Utils.rMapHasKey( params, "y" ) ) {
			return;
		}
		String strategy = Utils.rMapHasKey( params, "strategy" ) ? params.getString( "strategy" ) : (String) getConstants().get( "strategy" );
		int x = params.getInt( "x" );
		int y = params.getInt( "y" );

		int size = markerLayer.getItemList().size();
		if ( size == 0 ) {
			return;
		}
		int eventX = x - mapView.map().getWidth() / 2;
		int eventY = y - mapView.map().getHeight() / 2;

		Viewport mapPosition = mapView.map().viewport();

		Box box = mapPosition.getBBox(null, Tile.SIZE / 2 );
		box.map2mercator();
		box.scale( 1E6 );

		int inside = -1;

		// squared dist: 50x50 px ~ 2mm on 400dpi
		// 20x20 px on baseline mdpi (160dpi)
		double dist = ( 20 * CanvasAdapter.getScale() ) * ( 20 * CanvasAdapter.getScale() );
		double distNearest = dist;
		MarkerInterface itemNearest = null;
		int i = 0;
		int iNearest = 0;
		while ( i < size && (
			! Objects.equals( strategy, "first" )
			|| ( Objects.equals( strategy, "first" ) && inside == -1 )
		) ) {
			MarkerInterface item = markerLayer.getItemList().get(i);
			if ( box.contains( item.getPoint().longitudeE6, item.getPoint().latitudeE6 ) ) {
				mapPosition.toScreenPoint( item.getPoint(), tmpPoint );
				MarkerSymbol it = item.getMarker();
				it = null != it ? it : markerLayer.getDefaultMarker();
				float dx = (float) ( eventX - tmpPoint.x );
				float dy = (float) ( eventY - tmpPoint.y );
				if ( it.isInside( dx, dy ) ) {
					double d = dx * dx + dy * dy;
					if ( d <= dist ) {
						inside = i;
						if ( d <= distNearest ) {
							iNearest = i;
							itemNearest = item;
							distNearest = d;
						}
						if ( Objects.equals( strategy, "all" ) || Objects.equals( strategy, "first" ) ) {
							MarkerItem markerItem = (MarkerItem) item;
							WritableMap payload = Arguments.createMap();
							payload.putInt( "index", i );
							payload.putString( "uuid", markerItem.getUid().toString() );
							payload.putString( "event", "itemTrigger" );
							payload.putDouble( "distance", d );
							emitOnMarkerEvent( payload );
						}
					}
				}
			}
			i++;
		}
		if ( Objects.equals( strategy, "nearest" ) && null != itemNearest ) {
			MarkerItem markerItem = (MarkerItem) itemNearest;
			WritableMap payload = Arguments.createMap();
			payload.putInt( "index", iNearest );
			payload.putString( "uuid", markerItem.getUid().toString() );
			payload.putString( "event", "itemTrigger" );
			payload.putDouble( "distance", distNearest );
			emitOnMarkerEvent( payload );
		}
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
			ReadableMap symbolMap = Utils.rMapHasKey( params, "symbol" ) ? params.getMap( "symbol" ) : (ReadableMap) getConstants().get( "symbol" );

			org.oscim.layers.marker.ItemizedLayer.OnItemGestureListener<MarkerInterface> listener = new org.oscim.layers.marker.ItemizedLayer.OnItemGestureListener() {
				@Override
				public boolean onItemSingleTapUp( int i, Object o ) {
					MarkerItem markerItem = (MarkerItem) o;
					WritableMap payload = Arguments.createMap();
					payload.putInt( "index", i );
					payload.putString( "uuid", markerItem.getUid().toString() );
					payload.putString( "event", "itemSingleTapUp" );
					emitOnMarkerEvent( payload );
					return false;
				}
				@Override
				public boolean onItemLongPress( int i, Object o ) {
					MarkerItem markerItem = (MarkerItem) o;
					WritableMap payload = Arguments.createMap();
					payload.putInt( "index", i );
					payload.putString( "uuid", markerItem.getUid().toString() );
					payload.putString( "event", "itemLongPress" );
					emitOnMarkerEvent( payload );
					return false;
				}
			};

			MarkerSymbol symbol = getMarkerSymbol(
				symbolMap,
				mapFragment.getActivity().getContentResolver()
			);

			ItemizedLayer markerLayer = new ItemizedLayer(
				mapView.map(),
				new ArrayList<MarkerInterface>(),
				symbol,
				listener
			);

			// Store layer
			String uuid = layerHelper.addLayer( markerLayer, params );

			// Resolve layer uuid
			if ( null == uuid ) {
				Utils.promiseReject( promise, "Unable to add layer" ); return;
			}
			promise.resolve( uuid );
		} catch ( Exception e ) {
			e.printStackTrace();
			emitError( e.getMessage() );
			Utils.promiseReject( promise, e.getMessage() );
		}
	}

	@Override
	public void createMarker( ReadableMap params, Promise promise ) {
		if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
			Utils.promiseReject( promise,"Undefined nativeNodeHandle" ); return;
		}
		MapView mapView = Utils.getMapView( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
		MapFragment mapFragment = Utils.getMapFragment( getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
		if ( null == mapView || null == mapFragment ) {
			Utils.promiseReject( promise,"Unable to find mapView or mapFragment" ); return;
		}
		if ( ! Utils.rMapHasKey( params, "markerLayerUuid" ) ) {
			Utils.promiseReject( promise,"Undefined markerLayerUuid" ); return;
		}
		ItemizedLayer markerLayer = (ItemizedLayer) layerHelper.getLayers().get( params.getString( "markerLayerUuid" ) );
		if ( markerLayer == null ) {
			Utils.promiseReject( promise,"Unable to find markerLayer" ); return;
		}
		// The promise response
		WritableMap responseParams = new WritableNativeMap();
		// Get params, assign defaults.
		String title = Utils.rMapHasKey( params, "title" ) ? params.getString( "title" ) : (String) getConstants().get( "title" );
		String description = Utils.rMapHasKey( params, "description" ) ? params.getString( "description" ) : (String) getConstants().get( "description" );
		if ( ! Utils.rMapHasKey( params, "position" ) ) {
			Utils.promiseReject( promise,"Marker does not have a position" ); return;
		}
		ReadableMap position = params.getMap( "position" );
		// Create Marker.
		String uuid = UUID.randomUUID().toString();
		MarkerItem markerItem = new MarkerItem(
			uuid,
			title,
			description,
			new GeoPoint(
				position.getDouble( "lat" ),
				position.getDouble( "lng" )
			)
		);
		// Maybe get symbol.
		if ( Utils.rMapHasKey( params, "symbol" ) ) {
			MarkerSymbol symbol = getMarkerSymbol(
				params.getMap( "symbol" ),
				mapFragment.getActivity().getContentResolver()
			);
			markerItem.setMarker( symbol );
		}
		// Add index to response.
		responseParams.putInt( "index", markerLayer.getItemList().size() );
		// Add marker to markerLayer.
		markerLayer.addItem( markerItem );
		// Store marker
		markers.put( uuid, markerItem );
		// Update map.
		mapView.map().updateMap();
		// Resolve uuid
		responseParams.putString( "uuid", uuid );
		promise.resolve( responseParams );
	}

	@Override
	public void removeMarker( ReadableMap params, Promise promise ) {
		if ( ! Utils.rMapHasKey( params, "nativeNodeHandle" ) ) {
			Utils.promiseReject( promise,"Undefined nativeNodeHandle" ); return;
		}
		if ( ! Utils.rMapHasKey( params, "uuid" ) ) {
			Utils.promiseReject( promise,"Undefined uuid" ); return;
		}
		if ( ! Utils.rMapHasKey( params, "markerLayerUuid" ) ) {
			Utils.promiseReject( promise, "Undefined markerLayerUuid" ); return;
		}
		MapView mapView = (MapView) Utils.getMapView( this.getReactApplicationContext(), params.getInt( "nativeNodeHandle" ) );
		if ( null == mapView ) {
			Utils.promiseReject( promise, "Unable to find mapView" ); return;
		}
		ItemizedLayer markerLayer = (ItemizedLayer) layerHelper.getLayers().get( params.getString( "markerLayerUuid" ) );
		if ( markerLayer == null ) {
			Utils.promiseReject( promise, "Unable to find markerLayer" ); return;
		}
		MarkerInterface marker = markers.get( params.getString( "uuid" ) );
		if ( marker == null ) {
			Utils.promiseReject( promise, "Unable to find marker" ); return;
		}
		// Remove marker from markerLayer.
		markerLayer.removeItem( marker );
		// Remove marker from markers.
		markers.remove( params.getString( "uuid" ) );
		// Update map.
		mapView.map().updateMap();
		// Resolve uuid
		promise.resolve( params.getString( "uuid" ) );
	}

	protected MarkerSymbol getMarkerSymbol( ReadableMap symbolMap, ContentResolver contentResolver ) {
		// Get hotspotPlace.
		ReadableMap symbolConstants = (ReadableMap) getConstants().get( "symbol" );
		String hotspotPlaceString = Utils.rMapHasKey( symbolMap, "hotspotPlace" ) ? symbolMap.getString( "hotspotPlace" ) : symbolConstants.getString( "hotspotPlace" );
		MarkerSymbol.HotspotPlace hotspotPlace = switch ( hotspotPlaceString ) {
			case "NONE" -> MarkerSymbol.HotspotPlace.NONE;
			case "CENTER" -> MarkerSymbol.HotspotPlace.CENTER;
			case "BOTTOM_CENTER" -> MarkerSymbol.HotspotPlace.BOTTOM_CENTER;
			case "TOP_CENTER" -> MarkerSymbol.HotspotPlace.TOP_CENTER;
			case "RIGHT_CENTER" -> MarkerSymbol.HotspotPlace.RIGHT_CENTER;
			case "LEFT_CENTER" -> MarkerSymbol.HotspotPlace.LEFT_CENTER;
			case "UPPER_RIGHT_CORNER" -> MarkerSymbol.HotspotPlace.UPPER_RIGHT_CORNER;
			case "LOWER_RIGHT_CORNER" -> MarkerSymbol.HotspotPlace.LOWER_RIGHT_CORNER;
			case "UPPER_LEFT_CORNER" -> MarkerSymbol.HotspotPlace.UPPER_LEFT_CORNER;
			case "LOWER_LEFT_CORNER" -> MarkerSymbol.HotspotPlace.LOWER_LEFT_CORNER;
			default -> MarkerSymbol.HotspotPlace.CENTER;
		};
		// getMarkerBitmap and return MarkerSymbol.
		return new MarkerSymbol(
			getMarkerBitmap(
				symbolMap,
				contentResolver
			),
			hotspotPlace,
			false
		);
	}

	protected Bitmap getMarkerBitmap(
		ReadableMap symbolMap,
		ContentResolver contentResolver
	) {
		// Get params, assign defaults.
		ReadableMap symbolConstants = (ReadableMap) getConstants().get( "symbol" );
		int width = Utils.rMapHasKey( symbolMap, "width" ) ? symbolMap.getInt( "width" ) : symbolConstants.getInt( "width" );
		int height = Utils.rMapHasKey( symbolMap, "height" ) ? symbolMap.getInt( "height" ) : symbolConstants.getInt( "height" );
		String fillColor = Utils.rMapHasKey( symbolMap, "fillColor" ) ? symbolMap.getString( "fillColor" ) : symbolConstants.getString( "fillColor" );
		String strokeColor = Utils.rMapHasKey( symbolMap, "strokeColor" ) ? symbolMap.getString( "strokeColor" ) : symbolConstants.getString( "strokeColor" );
		String text = Utils.rMapHasKey( symbolMap, "text" ) ? symbolMap.getString( "text" ) : symbolConstants.getString( "text" );
		String filePath = Utils.rMapHasKey( symbolMap, "filePath" ) ? symbolMap.getString( "filePath" ) : symbolConstants.getString( "filePath" );
		int strokeWidth = Utils.rMapHasKey( symbolMap, "strokeWidth" ) ? symbolMap.getInt( "strokeWidth" ) : symbolConstants.getInt( "strokeWidth" );
		int textMargin = Utils.rMapHasKey( symbolMap, "textMargin" ) ? symbolMap.getInt( "textMargin" ) : symbolConstants.getInt( "textMargin" );

		// If text, setup text painter and adjust width and height.
		int textWidth = 0;
		int textHeight = 0;
		Paint textPainter = null;
		if ( null != text ) {
			// Get params, assign defaults.
			String textColor = Utils.rMapHasKey( symbolMap, "textColor" ) ? symbolMap.getString( "textColor" ) : symbolConstants.getString( "textColor" );
			int textSize = Utils.rMapHasKey( symbolMap, "textSize" ) ? symbolMap.getInt( "textSize" ) : symbolConstants.getInt( "textSize" );
			int textStrokeWidth = Utils.rMapHasKey( symbolMap, "textStrokeWidth" ) ? symbolMap.getInt( "textStrokeWidth" ) : symbolConstants.getInt( "textStrokeWidth" );
			// Setup textPainter.
			textPainter = CanvasAdapter.newPaint();
			textPainter.setStyle( Paint.Style.STROKE );
			textPainter.setStrokeWidth( textStrokeWidth );
			textPainter.setTextSize( textSize );
			textPainter.setColor( Color.parseColor( textColor ) );
			// Setup text dimensions and adjust width and height to fit text.
			textWidth = ( (int) textPainter.getTextWidth( text ) + 2 * textMargin );
			textHeight = ( (int) textPainter.getTextHeight( text ) + 2 * textMargin );
			width = Math.max( textWidth, width );
			height = Math.max( textHeight, height );
		}

		Bitmap imageBitmap = loadImageBitmap(
			filePath,
			width,
			height,
			contentResolver
		);

		Bitmap markerBitmap = CanvasAdapter.newBitmap( width, height, 0 );
		Canvas markerCanvas = CanvasAdapter.newCanvas();
		markerCanvas.setBitmap( markerBitmap );

		if ( null != imageBitmap ) {
			markerCanvas.drawBitmapScaled( imageBitmap );
		}
		if ( null != fillColor && fillColor.startsWith( "#" ) ) {
			markerCanvasDrawCircle( markerCanvas, width, height, fillColor, Paint.Style.FILL,null );
		}
		if ( null != strokeColor && strokeColor.startsWith( "#" ) ) {
			markerCanvasDrawCircle( markerCanvas, width, height, strokeColor, Paint.Style.STROKE, strokeWidth );
		}
		// Fallback
		if ( null == imageBitmap && fillColor == null && ( strokeColor == null || ! strokeColor.startsWith( "#" ) ) ){
			markerCanvasDrawCircle( markerCanvas, width, height,"#ff0000", Paint.Style.FILL, null );
			markerCanvasDrawCircle( markerCanvas, width, height, "#000000", Paint.Style.STROKE, strokeWidth );
		}
		// Draw text.
		if ( text != null ) {
			Bitmap textBitmap = CanvasAdapter.newBitmap(textWidth + textMargin, textHeight + textMargin, 0 );
			Canvas textCanvas = CanvasAdapter.newCanvas();
			textCanvas.setBitmap( textBitmap );
			textCanvas.drawText( text, textMargin, textHeight - textMargin, textPainter );
			float textPositionX = Utils.rMapHasKey( symbolMap, "textPositionX" )
				? (float) symbolMap.getDouble( "textPositionX" )
				: ( Utils.rMapHasKey( symbolConstants, "textPositionX" )
					? (float) symbolConstants.getDouble( "textPositionX" )
					: width * 0.5f - ( textWidth * 0.5f )
				);
			float textPositionY = Utils.rMapHasKey( symbolMap, "textPositionY" )
				? (float) symbolMap.getDouble( "textPositionY" )
				: ( Utils.rMapHasKey( symbolConstants, "textPositionY" )
					? (float) symbolConstants.getDouble( "textPositionY" )
					: 0
				);
			markerCanvas.drawBitmap( textBitmap, (float) textPositionX, (float) textPositionY );
		}
		return markerBitmap;
	}

	protected Bitmap loadImageBitmap( String filePath, int width, int height, ContentResolver contentResolver ) {
		Bitmap bitmap = null;
		if ( null != filePath && ! filePath.isEmpty() ) {
			FileInputStream fis = getFileInputStream( filePath, contentResolver );
			if ( fis != null ) {
				try {
					bitmap = filePath.endsWith( ".svg" )
						? CanvasAdapter.decodeSvgBitmap( fis, width, height, 100 )
						: CanvasAdapter.decodeBitmap( fis );
				} catch ( IOException e ) {
					e.printStackTrace();
					emitError( "Unable to read file: " + filePath );
				}
			}
		}
		return bitmap;
	}

	protected FileInputStream getFileInputStream( String filePath, ContentResolver contentResolver ) {
		FileInputStream fis = null;
		try {
			if ( null != filePath && ! filePath.isEmpty() ) {
				if ( filePath.startsWith( "content://" ) ) {
					Uri fileUri = Uri.parse( filePath );
					DocumentFile dir = DocumentFile.fromSingleUri( getReactApplicationContext(), fileUri );
					if ( dir == null || ! dir.exists() || ! dir.isFile() ) {
						emitError( "filePath does not exist or is not a file: " + filePath );
					} else {
						if ( ! Utils.hasScopedStoragePermission( getReactApplicationContext(), filePath, false ) ) {
							emitError( "No scoped storage read permission for filePath: " + filePath );
						} else {
							fis = ( FileInputStream ) contentResolver.openInputStream( fileUri );
						}
					}
				} else if ( filePath.startsWith( "/" ) ) {
					File file = new File( filePath );
					if( ! file.exists() || ! file.isFile() || ! file.canRead() ) {
						emitError( "File does not exist or is not a file: " + filePath );
					}
					fis = new FileInputStream( file );
				}
			}
		} catch ( IOException e ) {
			e.printStackTrace();
			emitError( "Unable to read file: " + filePath );
		}
		return fis;
	}

	protected void markerCanvasDrawCircle(
		Canvas markerCanvas,
		float width,
		float height,
		String color,
		Paint.Style style,
		@Nullable Integer strokeWith
	) {
		final Paint painter = CanvasAdapter.newPaint();
		painter.setStyle( style );
		painter.setColor( Color.parseColor( color ) );
		if ( null != strokeWith ) {
			painter.setStrokeWidth( strokeWith );
		} else {
			strokeWith = 0;
		}
		markerCanvas.drawCircle(
			width * 0.5f,
			height * 0.5f,
			( (float) ( ( width - strokeWith ) + ( height - strokeWith ) ) / 2 ) * 0.5f,
			painter
		);
	}

	@Override
	public void removeLayer( ReadableMap params, Promise promise ) {
		layerHelper.removeLayer( params, promise );
	}

	protected void emitError( String errorMsg ) {
		WritableMap payload = Arguments.createMap();
		payload.putString( "errorMsg", errorMsg );
		emitOnError( payload );
	}

}

