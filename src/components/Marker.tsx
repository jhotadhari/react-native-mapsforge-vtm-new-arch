/**
 * External dependencies
 */
import { useContext, useEffect, useRef, useState } from 'react';
import { omit } from 'lodash-es';

/**
 * Internal dependencies
 */
// import { MarkerHotspotPlaces } from '../constants';
import LayerMarkerModule, {
	type MarkerProps,
} from '../NativeModules/NativeLayerMarker';
import {
	MarkerHotspotPlaces,
	type MarkerResponse,
} from '../NativeModules/NativeLayerMarker';
import type { ErrorBase } from '../types';
import useMarkerEventSubscription from '../compose/useMarkerEventSubscription';
import MapHandleContext from '../context/MapHandleContext';
import MarkerLayerContext from '../context/MarkerLayerContext';

const Marker = ({
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
}: MarkerProps) => {
	const { nativeNodeHandle } = useContext(MapHandleContext);
	const { markerLayerUuid } = useContext(MarkerLayerContext);

	const [uuid, setUuid] = useState<null | false | string>(null);
	const indexRef = useRef<number>(-1);

	const createMarkerRef = useRef<
		| undefined
		| ((options: {
				triggerOnCreate?: boolean;
				triggerOnChange?: boolean;
		  }) => void)
	>(undefined);

	useEffect(() => {
		createMarkerRef.current = ({
			triggerOnCreate,
			triggerOnChange,
		}: {
			triggerOnCreate?: boolean;
			triggerOnChange?: boolean;
		}) => {
			setUuid(false);
			if (nativeNodeHandle && markerLayerUuid && position) {
				LayerMarkerModule.createMarker({
					nativeNodeHandle,
					markerLayerUuid,
					...(title && { title }),
					...(description && { description }),
					...(position && { position }),
					...(symbol && { symbol }),
				})
					.then((response: MarkerResponse) => {
						setUuid(response.uuid);
						indexRef.current = response.index;
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
		markerLayerUuid,
		position,
		title,
		description,
		symbol,
		onCreate,
		onChange,
		onError,
	]);

	const removeMarkerRef = useRef<
		| undefined
		| ((options: { triggerOnRemove?: boolean }) => Promise<boolean>)
	>(undefined);

	useEffect(() => {
		removeMarkerRef.current = ({
			triggerOnRemove,
		}: {
			triggerOnRemove?: boolean;
		}) => {
			return new Promise<boolean>((resolve) => {
				if (uuid && markerLayerUuid && nativeNodeHandle) {
					LayerMarkerModule.removeMarker({
						nativeNodeHandle,
						markerLayerUuid,
						uuid,
					})
						.then((uuid: string) => {
							triggerOnRemove && onRemove
								? onRemove({ uuid, nativeNodeHandle })
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
		markerLayerUuid,
		uuid,
		onRemove,
		onError,
	]);

	useEffect(() => {
		if (uuid === null && nativeNodeHandle) {
			createMarkerRef?.current &&
				createMarkerRef?.current({
					triggerOnCreate: true,
					triggerOnChange: false,
				});
		}
		return () => {
			removeMarkerRef?.current &&
				removeMarkerRef?.current({
					triggerOnRemove: true,
				});
		};
	}, [
		nativeNodeHandle,
		uuid,
	]);

	// Update the existing native marker in place when its position or symbol
	// changes, instead of tearing down and recreating it.
	useEffect(() => {
		if (uuid && markerLayerUuid && nativeNodeHandle) {
			LayerMarkerModule.updateMarker({
				nativeNodeHandle,
				markerLayerUuid,
				uuid,
				...(position && { position }),
				...(symbol && { symbol }),
			})
				.then((updatedUuid: string) => {
					onChange
						? onChange({
								uuid: updatedUuid,
								nativeNodeHandle,
								index: indexRef.current,
							})
						: null;
				})
				.catch((err: ErrorBase) => {
					console.log('ERROR', err.userInfo.errorMsg);
					onError ? onError(err) : null;
				});
		}
	}, [
		uuid,
		markerLayerUuid,
		nativeNodeHandle,
		position,
		symbol,
		onChange,
		onError,
	]);

	useMarkerEventSubscription({
		uuid,
		onEvent,
		onPress,
		onLongPress,
		onTrigger,
	});

	return null;
};

Marker.MarkerHotspotPlaces = MarkerHotspotPlaces;

Marker.defaults = omit(LayerMarkerModule.getConstants(), ['strategy']);

export default Marker;
