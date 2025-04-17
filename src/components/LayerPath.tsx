/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
import { NativeEventEmitter } from 'react-native';

/**
 * Internal dependencies
 */
import LayerPathModule, {
	type GeometryStyle,
	type LayerPathGestureResponse,
	type LayerPathProps,
	type LayerPathResponse,
	type ResponseInclude,
} from '../NativeModules/NativeLayerPath';
import type { ErrorBase } from '../types';


const moduleDefaults = LayerPathModule.getConstants();


console.log( 'debug moduleDefaults', moduleDefaults ); // debug


const LayerPath = ( {
	nativeNodeHandle,
	positions,
	filePath,
	responseInclude,
	gestureScreenDistance,
	reactTreeIndex,
	style,
	simplificationTolerance,

	onCreate,
	onRemove,
	onChange,
	onError,

	onPress,
	onLongPress,
	onDoubleTap,
	onTrigger,
} : LayerPathProps ) => {

	// @ts-ignore
	const [random, setRandom] = useState<number>( 0 );
	const [uuid, setUuid] = useState<null | false | string>( null );
	const [triggerCreateNew, setTriggerCreateNew] = useState<null | number>( null );

	responseInclude = { ...moduleDefaults.responseInclude, ...responseInclude };
	// style = {...defaultStyle, ...style };

	// const supportsGestures = !! onPress || !! onLongPress || !! onDoubleTap;

	const createLayer = () => {
		setUuid( false );
        if ( nativeNodeHandle && undefined !== reactTreeIndex ) {
			LayerPathModule.createLayer( {
				nativeNodeHandle,
				reactTreeIndex,
				supportsGestures: !! onPress || !! onLongPress || !! onDoubleTap,	// onTrigger is different
				...( positions && { positions } ),
				...( filePath && { filePath } ),
				...( style && { style } ),
				...( responseInclude && { responseInclude } ),
				...( gestureScreenDistance && { gestureScreenDistance } ),
				...( simplificationTolerance && { simplificationTolerance } ),
			} ).then( ( response: LayerPathResponse ) => {
				setUuid( response.uuid );
				setRandom( Math.random() );
				( null === triggerCreateNew
					? ( onCreate ? onCreate( response ) : null )
					: ( onChange ? onChange( response ) : null )
				);
			} ).catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
		};
	};

	useEffect( () => {
		if ( uuid === null && nativeNodeHandle && ( filePath || ( positions && positions.length > 0 ) ) ) {
			createLayer();
		}
		return () => {
			if ( uuid && nativeNodeHandle ) {
				LayerPathModule.removeLayer( {
					nativeNodeHandle,
					uuid
				} ).then( ( uuid : string ) => {
					onRemove ? onRemove( { nativeNodeHandle, uuid } ) : null;
				} ).catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
			}
		};
	}, [
		nativeNodeHandle,
		!! uuid,
		triggerCreateNew,
	] );

	// useEffect( () => {
	// 	if ( nativeNodeHandle && uuid ) {
	// 			LayerPathModule.updateStyle(
	// 				nativeNodeHandle,
	// 				uuid,
	// 				style,
	// 				responseInclude
	// 			).then( ( response: LayerPathResponse ) => {
	// 				onChange ? onChange( response ) : null;
	// 			} ).catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
	// 			// } );
	// 		}
	// }, [Object.values( style ).join( '' )] );

	// useEffect( () => {
	// 	if ( nativeNodeHandle ) {
	// 		if ( uuid ) {
	// 			LayerPathModule.removeLayer(
	// 				nativeNodeHandle,
	// 				uuid
	// 			).then( () => {
	// 				setUuid( null );
	// 				setTriggerCreateNew( Math.random() );
	// 			} ).catch( ( err: ErrorBase ) => { console.log( 'ERROR', err.userInfo.errorMsg ); onError ? onError( err ) : null } );
	// 		} else if ( uuid === null && ( filePath || positions.length > 0 ) ) {
	// 			setTriggerCreateNew( Math.random() );
	// 		}
	// 	}
	// }, [
	// 	( positions.length > 0
	// 		? [...positions].map( pos => pos.lng + pos.lat ).join( '' )
	// 		: null
	// 	),
	// 	simplificationTolerance,
	// 	filePath,
	// 	Object.keys( responseInclude ).map( key => key + responseInclude[key] ).join( '' ),
	// ] );

	// useEffect( () => {
	// 	const eventEmitter = new NativeEventEmitter();
	// 	let eventListener = eventEmitter.addListener( 'PathGesture', ( response : LayerPathGestureResponse ) => {
	// 		if ( response.uuid === uuid ) {
	// 			switch( response.type ) {
	// 				case 'doubleTap':
	// 					onDoubleTap ? onDoubleTap( response ) : null;
	// 					break;
	// 				case 'LongPress':
	// 					onLongPress ? onLongPress( response ) : null;
	// 					break;
	// 				case 'press':
	// 					onPress ? onPress( response ) : null;
	// 					break;
	// 				case 'trigger':
	// 					onTrigger ? onTrigger( response ) : null;
	// 					break;
	// 			}
	// 		}
	// 	} );
	// 	return () => {
	// 		eventListener.remove();
	// 	};
	// }, [
	// 	uuid,
	// 	!! supportsGestures,
	// 	onDoubleTap,
	// 	onLongPress,
	// 	onPress,
	// 	onTrigger,
	// ] );

	return null;
};
LayerPath.isMapLayer = true;


/// ??? add defaults

export default LayerPath;
