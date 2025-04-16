/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
// import { MarkerHotspotPlaces } from '../constants';
import LayerMarkerModule, {
    type ModuleParams,
	type CreateMarkerParams,
} from '../NativeModules/NativeLayerMarker';
import type { Location, ResponseBase } from '../types';
import { MarkerHotspotPlaces, type MarkerResponse } from '../NativeModules/NativeLayerMarker';


export type MarkerProps = {
	nativeNodeHandle?: CreateMarkerParams['nativeNodeHandle'];
	markerLayerUuid?: CreateMarkerParams['markerLayerUuid'];

	position: CreateMarkerParams['position'];
    title?: CreateMarkerParams['title'];
    description?: CreateMarkerParams['description'];
    symbol?: CreateMarkerParams['symbol'];


	onCreate?: null | ( ( response: MarkerResponse ) => void );
	onRemove?: null | ( ( response: ResponseBase ) => void );
	onChange?: null | ( ( response: MarkerResponse ) => void );
	onError?: null | ( ( err: any ) => void );
	onPress?: null | ( ( response: MarkerResponse ) => void );
	onLongPress?: null | ( ( response: MarkerResponse ) => void );
	onTrigger?: null | ( ( response: MarkerResponse ) => void );
};

const Marker = ( {
	nativeNodeHandle,
	markerLayerUuid,

    title,
    description,
	position,
	symbol,

	onCreate,
	onRemove,
	onChange,
	onError,
	onPress,
	onLongPress,
	onTrigger,
} : MarkerProps ) => {

	// @ts-ignore
	const [random, setRandom] = useState<number>( 0 );
	const [uuid, setUuid] = useState<null | false | string>( null );
	const [triggerCreateNew, setTriggerCreateNew] = useState<null | number>( null );

	const create = () => {
		setUuid( false );
        if ( nativeNodeHandle && markerLayerUuid ) {
			LayerMarkerModule.createMarker( {
				nativeNodeHandle,
				markerLayerUuid,
                ...( title && { title } ),
                ...( description && { description } ),
                ...( position && { position } ),
                ...( symbol && { symbol } ),
			} ).then( ( response: MarkerResponse ) => {
				setUuid( response.uuid );
				setRandom( Math.random() );
				( null === triggerCreateNew
					? ( onCreate ? onCreate( response ) : null )
					: ( onChange ? onChange( response ) : null )
				);
			} ).catch( ( err: any ) => { console.log( 'ERROR', err ); onError ? onError( err ) : null } );
		}
	};

	useEffect( () => {
		if ( uuid === null && nativeNodeHandle && position ) {
			create();
		}
		return () => {
			if ( !! uuid && !! markerLayerUuid && nativeNodeHandle ) {
				LayerMarkerModule.removeMarker( {
					nativeNodeHandle,
					markerLayerUuid,
					uuid,
				} ).then( ( uuid : string ) => {
					onRemove ? onRemove( { uuid, nativeNodeHandle } ) : null;
				} ).catch( ( err: any ) => { console.log( 'ERROR', err ); onError ? onError( err ) : null } );
			}
		};
	}, [
		!! uuid,
		triggerCreateNew,
	] );

	useEffect( () => {
		if ( !! uuid && !! markerLayerUuid && nativeNodeHandle ) {
			LayerMarkerModule.removeMarker( {
				nativeNodeHandle,
				markerLayerUuid,
				uuid,
			} ).then( () => {
				setUuid( null );
				setTriggerCreateNew( Math.random() );
			} ).catch( ( err: any ) => { console.log( 'ERROR', err ); onError ? onError( err ) : null } );
        } else if ( uuid === null && position ) {
            setTriggerCreateNew( Math.random() );
        }
	}, [
		position ? ( position.lng + position.lat ) : null,
		symbol ? Object.values( symbol ).join( '' ) : null,
	] );

	// useEffect( () => {
	// 	const eventEmitter = new NativeEventEmitter();
	// 	let eventListener = eventEmitter.addListener( 'MarkerItemSingleTapUp', ( response : MarkerResponse ) => {
	// 		if ( response.uuid === uuid && onPress ) {
    //             onPress( response );
	// 		}
	// 	} );
	// 	return () => {
	// 		eventListener.remove();
	// 	};
	// }, [
	// 	uuid,
	// 	onPress,
	// ] );

	// useEffect( () => {
	// 	const eventEmitter = new NativeEventEmitter();
	// 	let eventListener = eventEmitter.addListener( 'MarkerItemLongPress', ( response : MarkerResponse ) => {
	// 		if ( response.uuid === uuid && onLongPress ) {
    //             onLongPress( response );
	// 		}
	// 	} );
	// 	return () => {
	// 		eventListener.remove();
	// 	};
	// }, [
	// 	uuid,
	// 	onLongPress,
	// ] );

	// useEffect( () => {
	// 	const eventEmitter = new NativeEventEmitter();
	// 	let eventListener = eventEmitter.addListener( 'MarkerItemTriggerEvent', ( response : MarkerResponse ) => {
	// 		if ( response.uuid === uuid && onTrigger ) {
    //             onTrigger( response );
	// 		}
	// 	} );
	// 	return () => {
	// 		eventListener.remove();
	// 	};
	// }, [
	// 	uuid,
	// 	onTrigger,
	// ] );

	return null;
};

Marker.MarkerHotspotPlaces = MarkerHotspotPlaces;

Marker.defaults = LayerMarkerModule.getConstants();

export default Marker;
