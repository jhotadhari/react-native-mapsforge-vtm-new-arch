/**
 * External dependencies
 */
import { useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import LayerBitmapTileModule, {
	type LayerBitmapTileProps,
} from '../NativeModules/NativeLayerBitmapTile';
import type { ErrorBase } from '../types';
import useLayerOrder from '../compose/useLayerOrder';

const LayerBitmapTile = ({
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
}: LayerBitmapTileProps) => {
	const [uuid, setUuid] = useState<null | false | string>(null);

	const nativeNodeHandle = useLayerOrder(uuid);

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
			if (nativeNodeHandle) {
				LayerBitmapTileModule.createLayer({
					nativeNodeHandle,
					...(url && { url }),
					...(alpha && { alpha }), // java side will ensure it is between 0 and 1.
					...(zoomMin && { zoomMin: Math.round(zoomMin) }),
					...(zoomMax && { zoomMax: Math.round(zoomMax) }),
					...(enabledZoomMin && {
						enabledZoomMin: Math.round(enabledZoomMin),
					}),
					...(enabledZoomMax && {
						enabledZoomMax: Math.round(enabledZoomMax),
					}),
					...(cacheSize && { cacheSize: Math.round(cacheSize) }),
					...(cacheDirBase && { cacheDirBase: cacheDirBase.trim() }),
					...(cacheDirChild && {
						cacheDirChild: cacheDirChild.trim(),
					}),
				})
					.then((uuid: string) => {
						setUuid(uuid);
						triggerOnCreate && onCreate
							? onCreate({ nativeNodeHandle, uuid })
							: null;
						triggerOnChange && onChange
							? onChange({ nativeNodeHandle, uuid })
							: null;
					})
					.catch((err: ErrorBase) => {
						console.log('ERROR', err.userInfo.errorMsg);
						onError ? onError(err) : null;
					});
			}
		};
	}, [
		nativeNodeHandle,
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
					LayerBitmapTileModule.removeLayer({
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

	// enabledZoomMin enabledZoomMax changed.
	useEffect(() => {
		if (nativeNodeHandle && uuid) {
			LayerBitmapTileModule.updateEnabledZoomMinMax({
				nativeNodeHandle,
				uuid,
				...(enabledZoomMin && {
					enabledZoomMin: Math.round(enabledZoomMin),
				}),
				...(enabledZoomMax && {
					enabledZoomMax: Math.round(enabledZoomMax),
				}),
			}).catch((err: ErrorBase) => {
				console.log('ERROR', err.userInfo.errorMsg);
				onError ? onError(err) : null;
			});
		}
	}, [enabledZoomMin, enabledZoomMax]);

	useEffect(() => {
		if (nativeNodeHandle && uuid) {
			LayerBitmapTileModule.setAlpha({
				nativeNodeHandle,
				uuid,
				...(alpha && { alpha }), // java side will ensure it is between 0 and 1.
			}).catch((err: ErrorBase) => {
				console.log('ERROR', err.userInfo.errorMsg);
				onError ? onError(err) : null;
			});
		}
	}, [alpha]);

	useEffect(() => {
		removeLayerRef?.current &&
			removeLayerRef
				?.current({
					triggerOnRemove: false,
				})
				.then((success) => {
					if (success) {
						setUuid(null);
						createLayerRef?.current &&
							createLayerRef?.current({
								triggerOnCreate: false,
								triggerOnChange: true,
							});
					}
				});
	}, [
		url,
		zoomMin,
		zoomMax,
		cacheSize,
		cacheDirBase,
		cacheDirChild,
	]);

	return null;
};

LayerBitmapTile.isMapLayer = true;

LayerBitmapTile.defaults = LayerBitmapTileModule.getConstants();

export default LayerBitmapTile;
