/**
 * External dependencies
 */
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import LayerPathModule, {
	type LayerPathProps,
	type LayerPathResponse,
	type TriggerParams,
} from '../NativeModules/NativeLayerPath';
import type { ErrorBase } from '../types';
import useLayerPathEventSubscription from '../compose/useLayerPathEventSubscription';

const moduleDefaults = LayerPathModule.getConstants();

const LayerPath = ({
	nativeNodeHandle,
	coordinates,
	responseInclude: responseIncludeParams,
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
	triggerEvent,
}: LayerPathProps) => {
	const [uuid, setUuid] = useState<null | false | string>(null);

	const responseInclude = useMemo(
		() => ({
			...moduleDefaults.responseInclude,
			...responseIncludeParams,
		}),
		[responseIncludeParams]
	);

	const createLayerRef = useRef<
		| undefined
		| ((options: {
				triggerOnCreate?: boolean;
				triggerOnChange?: boolean;
		  }) => void)
	>(undefined);

	useEffect(() => {
		createLayerRef.current = ({
			triggerOnCreate,
			triggerOnChange,
		}: {
			triggerOnCreate?: boolean;
			triggerOnChange?: boolean;
		}) => {
			setUuid(false);
			if (
				nativeNodeHandle &&
				undefined !== reactTreeIndex &&
				coordinates &&
				coordinates.length > 0
			) {
				LayerPathModule.createLayer({
					nativeNodeHandle,
					reactTreeIndex,
					supportsGestures:
						!!onPress || !!onLongPress || !!onDoubleTap, // onTrigger is different
					...(coordinates && { coordinates }),
					...(style && { style }),
					...(responseInclude && { responseInclude }),
					...(gestureScreenDistance && { gestureScreenDistance }),
					...(simplificationTolerance && { simplificationTolerance }),
				})
					.then((response: LayerPathResponse) => {
						setUuid(response.uuid);
						triggerOnCreate && onCreate ? onCreate(response) : null;
						triggerOnChange && onChange ? onChange(response) : null;
					})
					.catch((err: ErrorBase) => {
						console.log('ERROR', err.userInfo.errorMsg);
						onError ? onError(err) : null;
					});
			}
		};
	}, [
		nativeNodeHandle,
		reactTreeIndex,
		coordinates,
		style,
		responseInclude,
		gestureScreenDistance,
		simplificationTolerance,
		onPress,
		onLongPress,
		onDoubleTap,
		onCreate,
		onChange,
		onError,
	]);

	const removeLayerRef = useRef<
		| undefined
		| ((options: { triggerOnRemove?: boolean }) => Promise<boolean>)
	>(undefined);

	useEffect(() => {
		removeLayerRef.current = ({
			triggerOnRemove,
		}: {
			triggerOnRemove?: boolean;
		}) => {
			return new Promise<boolean>((resolve) => {
				if (uuid && nativeNodeHandle) {
					LayerPathModule.removeLayer({
						nativeNodeHandle,
						uuid,
					})
						.then((uuid: string) => {
							triggerOnRemove && onRemove
								? onRemove({ nativeNodeHandle, uuid })
								: null;
							resolve(true);
						})
						.catch((err: ErrorBase) => {
							console.log('ERROR', err.userInfo.errorMsg);
							onError ? onError(err) : null;
							resolve(false);
						});
				}
			});
		};
	}, [
		nativeNodeHandle,
		uuid,
		onRemove,
		onError,
	]);

	useEffect(() => {
		if (uuid === null && nativeNodeHandle) {
			createLayerRef?.current &&
				createLayerRef?.current({
					triggerOnCreate: true,
					triggerOnChange: false,
				});
		}
		return () => {
			removeLayerRef?.current &&
				removeLayerRef?.current({
					triggerOnRemove: true,
				});
		};
	}, [
		nativeNodeHandle,
		uuid,
	]);

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
	// 	removeLayerRef?.current &&
	// 		removeLayerRef
	// 			?.current( { triggerOnRemove: false } )
	// 			.then( ( success ) => {
	// 				if ( success ) {
	// 					setUuid( null );
	// 					createLayerRef?.current &&
	// 						createLayerRef?.current( {
	// 							triggerOnCreate: false,
	// 							triggerOnChange: true,
	// 						} );
	// 				}
	// 			} );
	// }, [
	// 	( coordinates.length > 0
	// 		? [...coordinates].map( pos => pos.join( ',' ) ).join( '' )
	// 		: null
	// 	),
	// 	simplificationTolerance,
	// 	Object.keys( responseInclude ).map( key => key + responseInclude[key] ).join( '' ),
	// ] );

	useEffect(() => {
		const remove = () => {
			if (triggerEvent) {
				triggerEvent.current = null;
			}
		};
		if (uuid) {
			if (triggerEvent) {
				triggerEvent.current = (params: TriggerParams) => {
					LayerPathModule.triggerEvent({
						...(nativeNodeHandle && { nativeNodeHandle }),
						uuid,
						...params,
					});
				};
			}
		} else {
			remove();
		}
		return remove;
	}, [
		uuid,
		nativeNodeHandle,
		triggerEvent,
	]);

	useLayerPathEventSubscription({
		uuid,
		onPress,
		onLongPress,
		onDoubleTap,
		onTrigger,
	});

	return null;
};
LayerPath.isMapLayer = true;

/// ??? add defaults

export default LayerPath;
