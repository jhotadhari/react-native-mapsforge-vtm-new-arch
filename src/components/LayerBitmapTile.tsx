/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import LayerBitmapTileModule, {
    type CreateLayerParams,
} from '../NativeModules/NativeLayerBitmapTile';
import type { ErrorBase, ResponseBase } from '../types';

export type LayerBitmapTileProps = {
	nativeNodeHandle?: CreateLayerParams['nativeNodeHandle'];
	reactTreeIndex?: CreateLayerParams['reactTreeIndex'];
	url?: string;
	alpha?: CreateLayerParams['alpha'];
	zoomMin?: CreateLayerParams['zoomMin'];
	zoomMax?: CreateLayerParams['zoomMax'];
	enabledZoomMin?: CreateLayerParams['enabledZoomMin'];
	enabledZoomMax?: CreateLayerParams['enabledZoomMax'];
	cacheSize?: CreateLayerParams['cacheSize'];
	cacheDirBase?: `/${string}`;
	cacheDirChild?: CreateLayerParams['cacheDirChild'];
	onCreate?: null | ( ( result: ResponseBase ) => void );
	onRemove?: null | ( ( result: ResponseBase ) => void );
	onChange?: null | ( ( result: ResponseBase ) => void );
	onError?: null | ( ( err: ErrorBase ) => void );
};

const LayerBitmapTile = ( {
	nativeNodeHandle,
	reactTreeIndex,
    url,
    alpha,
    zoomMin,
    zoomMax,
    enabledZoomMin,
    enabledZoomMax,
    cacheSize,
	cacheDirBase,
	cacheDirChild,
	onCreate,
	onRemove,
	onChange,
	onError,
} : LayerBitmapTileProps ) => {

	// @ts-ignore
	const [random, setRandom] = useState<number>( 0 );
	const [uuid, setUuid] = useState<null | false | string>( null );
	const [triggerCreateNew, setTriggerCreateNew] = useState<null | number>( null );

	const createLayer = () => {
		setUuid( false );
        if ( nativeNodeHandle && undefined !== reactTreeIndex ) {
            LayerBitmapTileModule.createLayer( {
                nativeNodeHandle,
                reactTreeIndex,
                ...( url && { url } ),
                ...( alpha && { alpha } ),	// java side will ensure it is between 0 and 1.
                ...( zoomMin && { zoomMin: Math.round( zoomMin ) } ),
                ...( zoomMax && { zoomMax: Math.round( zoomMax ) } ),
                ...( enabledZoomMin && { enabledZoomMin: Math.round( enabledZoomMin ) } ),
                ...( enabledZoomMax && { enabledZoomMax: Math.round( enabledZoomMax ) } ),
                ...( cacheSize && { cacheSize: Math.round( cacheSize ) } ),
                ...( cacheDirBase && { cacheDirBase: cacheDirBase.trim() } ),
                ...( cacheDirChild && { cacheDirChild: cacheDirChild.trim() } ),
            } ).then( ( uuid: string ) => {
                setUuid( uuid );
                setRandom( Math.random() );
                ( null === triggerCreateNew
                	? onCreate ? onCreate( { nativeNodeHandle, uuid } ) : null
                	: onChange ? onChange( { nativeNodeHandle, uuid } ) : null
                );
            } ).catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
        }
	};

	useEffect( () => {
		if ( uuid === null && nativeNodeHandle ) {
			createLayer();
		}
		return () => {
			if ( uuid && nativeNodeHandle ) {
				LayerBitmapTileModule.removeLayer( {
					nativeNodeHandle,
					uuid
				} ).then( ( uuid: string ) => {
					onRemove ? onRemove( { nativeNodeHandle, uuid } ) : null;
				} ).catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
			}
		};
	}, [
		nativeNodeHandle,
		!! uuid,
		triggerCreateNew,
	] );

	// enabledZoomMin enabledZoomMax changed.
	useEffect( () => {
		if ( nativeNodeHandle && uuid ) {
			LayerBitmapTileModule.updateEnabledZoomMinMax( {
				nativeNodeHandle,
				uuid,
                ...( enabledZoomMin && { enabledZoomMin: Math.round( enabledZoomMin ) } ),
                ...( enabledZoomMax && { enabledZoomMax: Math.round( enabledZoomMax ) } ),
			} )
			.catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
		}
	}, [
		enabledZoomMin,
		enabledZoomMax,
	] );

	useEffect( () => {
		if ( nativeNodeHandle && uuid ) {
			LayerBitmapTileModule.setAlpha( {
				nativeNodeHandle,
				uuid,
                ...( alpha && { alpha } ),	// java side will ensure it is between 0 and 1.
			} )
			.catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
		}
	}, [alpha] );

	useEffect( () => {
		if ( nativeNodeHandle && uuid ) {
			LayerBitmapTileModule.removeLayer( {
				nativeNodeHandle,
				uuid
			} ).then( () => {
				setUuid( null );
				setTriggerCreateNew( Math.random() );
			} ).catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
		}
	}, [
		url,
		zoomMin,
		zoomMax,
		cacheSize,
		cacheDirBase,
		cacheDirChild,
	] );

	return null;
};

LayerBitmapTile.isMapLayer = true;

LayerBitmapTile.defaults = LayerBitmapTileModule.getConstants();

export default LayerBitmapTile;
