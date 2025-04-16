package com.jhotadhari.reactnative.mapsforge.vtm;

import android.content.Context;
import android.content.UriPermission;
import android.content.res.Resources;
import android.util.DisplayMetrics;

import androidx.fragment.app.FragmentActivity;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import org.oscim.android.MapView;

import java.io.File;
import java.lang.reflect.Array;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.text.Normalizer;
import java.util.List;

public class Utils {

	public static MapFragment getMapFragment( ReactContext reactContext, int nativeNodeHandle ) {
		try {
			FragmentActivity activity = (FragmentActivity) reactContext.getCurrentActivity();
			if ( null == activity ) {
				return null;
			}
			return (MapFragment) activity.getSupportFragmentManager().findFragmentById( (int) nativeNodeHandle );
		} catch(Exception e) {
			return null;
		}
	}

	public static MapView getMapView( ReactContext reactContext, int nativeNodeHandle ) {
		try {
			MapFragment mapFragment = getMapFragment( reactContext, nativeNodeHandle );
			if ( null == mapFragment ) {
				return null;
			}
			return (MapView) mapFragment.getMapView();
		} catch(Exception e) {
			return null;
		}
	}

	/**
	 * This method converts dp unit to equivalent pixels, depending on device density.
	 * Source https://gist.github.com/brandhill/9c947a3e2881dff66bd3
	 *
	 * @param dp A value in dp (density independent pixels) unit. Which we need to convert into pixels
	 * @param context Context to get resources and device specific display metrics
	 * @return A float value to represent px equivalent to dp depending on device density
	 */
	public static float convertDpToPixel(float dp, Context context){
		Resources resources = context.getResources();
		DisplayMetrics metrics = resources.getDisplayMetrics();
		return dp * (metrics.densityDpi / 160f);
	}

	/**
	 * This method converts device specific pixels to density independent pixels.
	 * Source https://gist.github.com/brandhill/9c947a3e2881dff66bd3
	 *
	 * @param px A value in px (pixels) unit. Which we need to convert into db
	 * @param context Context to get resources and device specific display metrics
	 * @return A float value to represent dp equivalent to px value
	 */
	public static float convertPixelsToDp(float px, Context context){
		Resources resources = context.getResources();
		DisplayMetrics metrics = resources.getDisplayMetrics();
		return px / (metrics.densityDpi / 160f);
	}

	public static boolean hasScopedStoragePermission( Context context, String string, boolean checkWritePermission ) {
		// list of all persisted permissions for our app
		List<UriPermission> uriList = context.getContentResolver().getPersistedUriPermissions();
		try {
			// Fake "document" to tree. "document" is first part of path.
			URI jUri = new URI( string );
			String[] pathArray= jUri.getPath().substring(1 ).split( "/" );
			Array.set( pathArray, 0, "tree" );
			String testString = jUri.getScheme() + "://" + jUri.getHost() + "/" + String.join( "/", pathArray );

			for ( UriPermission uriPermission : uriList ) {
				String uriString = URLDecoder.decode( uriPermission.getUri().toString() );
				if ( ( uriString.startsWith( testString ) || testString.startsWith( uriString ) ) && uriPermission.isReadPermission() && ( ! checkWritePermission || uriPermission.isWritePermission() ) ) {
					return true;
				}
			}
		} catch ( URISyntaxException e ) {
			e.printStackTrace();
		}
		return false;
	}

	// Source https://glaforge.dev/posts/2024/01/08/url-slug-or-how-to-remove-accents-in-java/
	public static String slugify( String str ) {
		return Normalizer.normalize( str , Normalizer.Form.NFD)
			.toLowerCase()									// "l'été, où es tu ?"
			.replaceAll("\\p{IsM}+", "")	// "l'ete, ou es tu ?"
			.replaceAll("\\p{IsP}+", " ")	// "l ete  ou es tu  "
			.trim()											// "l ete  ou es tu"
			.replaceAll("\\s+", "-");		// "l-ete-ou-es-tu"
	}

	public static File getCacheDirParent(
		String cacheDirBase,
		ReactApplicationContext context
	) {
		File cacheDirParent = null;
		if (
			cacheDirBase.startsWith( "/" )
			&& cacheDirBase.length() > 1 	// first char is `/`, checks if it's empty after this.
		) {
			File cacheDirBaseFile = new File( cacheDirBase );
			cacheDirParent = cacheDirBaseFile.exists() ? cacheDirBaseFile : null;
		}
		if ( null == cacheDirParent ) {
			cacheDirParent = context.getCacheDir();
		}
		return null == cacheDirParent
			? context.getCacheDir()
			: cacheDirParent;
	}

	public static void promiseReject( Promise promise, String errorMsg ) {
		WritableMap error = new WritableNativeMap();
		error.putString( "errorMsg", errorMsg );
		promise.reject( "error", error );
	}

}
