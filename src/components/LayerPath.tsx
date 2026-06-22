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

	// onTrigger is different, it doesn't require native gesture detection.
	const supportsGestures = !!onPress || !!onLongPress || !!onDoubleTap;

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
					supportsGestures,
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
		supportsGestures,
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

	// Redraw the existing native layer in place when the line itself changes,
	// instead of tearing down and recreating the layer.
	useEffect(() => {
		if (uuid && nativeNodeHandle && coordinates && coordinates.length > 0) {
			LayerPathModule.updateCoordinates({
				nativeNodeHandle,
				uuid,
				coordinates,
				...(style && { style }),
				...(responseInclude && { responseInclude }),
				...(simplificationTolerance && { simplificationTolerance }),
			})
				.then((response: LayerPathResponse) => {
					onChange ? onChange(response) : null;
				})
				.catch((err: ErrorBase) => {
					console.log('ERROR', err.userInfo.errorMsg);
					onError ? onError(err) : null;
				});
		}
	}, [
		uuid,
		nativeNodeHandle,
		coordinates,
		simplificationTolerance,
		style,
		responseInclude,
		onChange,
		onError,
	]);

	// Update gesture detection on the existing native layer when the
	// handlers change, instead of tearing down and recreating the layer.
	useEffect(() => {
		if (uuid && nativeNodeHandle) {
			LayerPathModule.updateSupportsGestures({
				nativeNodeHandle,
				uuid,
				supportsGestures,
			}).catch((err: ErrorBase) => {
				console.log('ERROR', err.userInfo.errorMsg);
				onError ? onError(err) : null;
			});
		}
	}, [
		uuid,
		nativeNodeHandle,
		supportsGestures,
		onError,
	]);

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
