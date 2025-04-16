/**
 * External dependencies
 */
import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import type { EventSubscription } from 'react-native';

/**
 * Internal dependencies
 */
import LayerMarkerModule, {
    type CreateLayerParams,
} from '../NativeModules/NativeLayerMarker';

import type { ErrorBase, EventError, ResponseBase } from '../types';

export type LayerMarkerProps = {
	nativeNodeHandle?: CreateLayerParams['nativeNodeHandle'];
	reactTreeIndex?: CreateLayerParams['reactTreeIndex'];
	children?: React.ReactNode;

	symbol?: CreateLayerParams['symbol'];

	onCreate?: null | ( ( response: ResponseBase ) => void );
	onRemove?: null | ( ( response: ResponseBase ) => void );
	onChange?: null | ( ( response: ResponseBase ) => void );
	onError?: null | ( ( err: ErrorBase ) => void );
};

const LayerMarker = ( {
	nativeNodeHandle,
	reactTreeIndex,
	children,
	symbol,
	onCreate,
	onRemove,
	onChange,
	onError,
} : LayerMarkerProps ) => {

    const errorSubscription = useRef<null | EventSubscription>( null );

	// @ts-ignore
	const [random, setRandom] = useState<number>( 0 );
	const [uuid, setUuid] = useState<null | false | string>( null );
	const [triggerCreateNew, setTriggerCreateNew] = useState<null | number>( null );

    useEffect( () => {
		errorSubscription.current = LayerMarkerModule.onError( ( error?: EventError ) => {
			console.log( 'debug error', error ); // debug
		} );
        return () => {
            errorSubscription.current?.remove();
            errorSubscription.current = null;
        };
    }, [] );

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
				...( { layerUuid: uuid } ),
				...( child?.props?.children && { children: wrapChildren( child.props.children ) } ),
			},
		);
		return newChild;
	} );

	const wrappedChildren = wrapChildren( children );

    return wrappedChildren;
};

LayerMarker.isMapLayer = true;

LayerMarker.defaults = LayerMarkerModule.getConstants();

export default LayerMarker;
