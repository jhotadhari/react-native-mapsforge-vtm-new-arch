/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
import { omit } from 'lodash-es';

/**
 * Internal dependencies
 */
// import { MarkerHotspotPlaces } from '../constants';
import LayerMarkerModule, {
	type MarkerProps,
} from '../NativeModules/NativeLayerMarker';
import { MarkerHotspotPlaces, type MarkerResponse } from '../NativeModules/NativeLayerMarker';
import useMarkerEventSubscription from '../compose/useMarkerEventSubscription';

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
	onEvent,
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

	useMarkerEventSubscription( {
		uuid,
		onEvent,
		onPress,
		onLongPress,
		onTrigger,
	} );

	return null;
};

Marker.MarkerHotspotPlaces = MarkerHotspotPlaces;

Marker.defaults = omit( LayerMarkerModule.getConstants(), [
	'strategy',
] );

export default Marker;
