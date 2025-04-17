/**
 * External dependencies
 */
import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type RefObject } from 'react';
import type { EventSubscription } from 'react-native';
import { omit, pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import LayerMarkerModule, {
    type CreateLayerParams,
	type MarkerEvent,
	type TriggerParams,
} from '../NativeModules/NativeLayerMarker';

import type { ErrorBase, EventError, ResponseBase } from '../types';
import useMarkerEventSubscription from '../compose/useMarkerEventSubscription';

export type TriggerEvent = ( typeof LayerMarkerModule )['triggerEvent'];

export type LayerMarkerProps = {
	nativeNodeHandle?: CreateLayerParams['nativeNodeHandle'];
	reactTreeIndex?: CreateLayerParams['reactTreeIndex'];
	children?: React.ReactNode;
	symbol?: CreateLayerParams['symbol'];
	onCreate?: null | ( ( response: ResponseBase ) => void );
	onRemove?: null | ( ( response: ResponseBase ) => void );
	onChange?: null | ( ( response: ResponseBase ) => void );
	onError?: null | ( ( err: ErrorBase ) => void );
	onMarkerEvent?: null | ( ( response: MarkerEvent ) => void );
	onMarkerPress?: null | ( ( response: MarkerEvent ) => void );
	onMarkerLongPress?: null | ( ( response: MarkerEvent ) => void );
	onMarkerTrigger?: null | ( ( response: MarkerEvent ) => void );
	triggerEvent?: RefObject<null | TriggerEvent>;
};


const defaultsTrigger = pick( LayerMarkerModule.getConstants(), [
	'strategy',
] );

const LayerMarker = ( {
	nativeNodeHandle,
	reactTreeIndex,
	children,
	symbol,
	onCreate,
	onRemove,
	onChange,
	onError,
	onMarkerEvent,
	onMarkerPress,
	onMarkerLongPress,
	onMarkerTrigger,
	triggerEvent,
} : LayerMarkerProps ) => {

    const errorSubscription = useRef<null | EventSubscription>( null );

	// @ts-ignore
	const [random, setRandom] = useState<number>( 0 );
	const [uuid, setUuid] = useState<null | false | string>( null );
	const [triggerCreateNew, setTriggerCreateNew] = useState<null | number>( null );

    useEffect( () => {
		errorSubscription.current = LayerMarkerModule.onError( ( error?: EventError ) => {
			console.log( 'debug error', error ); // debug ???
		} );
        return () => {
            errorSubscription.current?.remove();
            errorSubscription.current = null;
        };
    }, [] );

    useEffect( () => {
		const remove = () => {
			if ( triggerEvent ) {
				triggerEvent.current = null;
			}
        };
		if ( uuid ) {
			if ( triggerEvent ) {
				triggerEvent.current = ( params: TriggerParams ) => {
					LayerMarkerModule.triggerEvent( {
						nativeNodeHandle,
						markerLayerUuid: uuid,
						...defaultsTrigger,
						...params,
					} )
				};
			}
		} else {
			remove();
		}
        return remove;
    }, [uuid,triggerEvent] );

	useMarkerEventSubscription( {
		onEvent: onMarkerEvent,
		onPress: onMarkerPress,
		onLongPress: onMarkerLongPress,
		onTrigger: onMarkerTrigger,
	} );

	const createLayer = () => {
		setUuid( false );
        if ( nativeNodeHandle && undefined !== reactTreeIndex ) {
			LayerMarkerModule.createLayer( {
				nativeNodeHandle,
				reactTreeIndex,
                ...( symbol && { symbol } ),
			} ).then( ( uuid: string ) => {
				setUuid( uuid );
				setRandom( Math.random() );
				( null === triggerCreateNew
					? ( onCreate ? onCreate( { nativeNodeHandle, uuid } ) : null )
					: ( onChange ? onChange( { nativeNodeHandle, uuid } ) : null )
				);
			} ).catch( ( err: any ) => { console.log( 'ERROR', err ); onError ? onError( err ) : null } );
		};
	};

	useEffect( () => {
		if ( uuid === null && nativeNodeHandle ) {
			createLayer();
		}
		return () => {
			if ( uuid && nativeNodeHandle ) {
				LayerMarkerModule.removeLayer( {
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

	useEffect( () => {
		if ( nativeNodeHandle ) {
			if ( uuid ) {
				LayerMarkerModule.removeLayer( {
					nativeNodeHandle,
					uuid
				} ).then( () => {
					setUuid( null );
					setTriggerCreateNew( Math.random() );
				} ).catch( ( err: any ) => { console.log( 'ERROR', err ); onError ? onError( err ) : null } );
			} else if ( uuid === null ) {
				setTriggerCreateNew( Math.random() );
			}
		}
	}, [
		symbol ? Object.values( symbol ).join( '' ) : null,
	] );

    if ( ! uuid ) {
        return null;
    }

	const wrapChildren = ( children: React.ReactNode ): null | React.ReactNode => ! children ? null : Children.map( children, child => {
		let newChild = child;
		if ( ! isValidElement<{ children?: React.ReactNode }>( child )) {
			return newChild
		}
		newChild = cloneElement(
			child,
			{
				...( { markerLayerUuid: uuid } ),
				...( child?.props?.children && { children: wrapChildren( child.props.children ) } ),
			},
		);
		return newChild;
	} );

	const wrappedChildren = wrapChildren( children );

    return wrappedChildren;
};

LayerMarker.isMapLayer = true;

LayerMarker.defaults = omit( LayerMarkerModule.getConstants(), [
	'title',
	'description',
	'position',
	'strategy',
] );

LayerMarker.defaultsTrigger = defaultsTrigger;

export default LayerMarker;
