/**
 * External dependencies
 */
import {
	Children,
	cloneElement,
	isValidElement,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import type { EventSubscription } from 'react-native';
import { omit, pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import LayerMarkerModule, {
	type LayerMarkerProps,
	type TriggerParams,
} from '../NativeModules/NativeLayerMarker';

import type { ErrorBase, EventError } from '../types';
import useMarkerEventSubscription from '../compose/useMarkerEventSubscription';

const defaultsTrigger = pick(LayerMarkerModule.getConstants(), ['strategy']);

const LayerMarker = ({
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
}: LayerMarkerProps) => {
	const errorSubscription = useRef<null | EventSubscription>(null);

	const [uuid, setUuid] = useState<null | false | string>(null);

	useEffect(() => {
		errorSubscription.current = LayerMarkerModule.onError(
			(error?: EventError) => {
				console.log('debug error', error); // debug ???
			}
		);
		return () => {
			errorSubscription.current?.remove();
			errorSubscription.current = null;
		};
	}, []);

	useEffect(() => {
		const remove = () => {
			if (triggerEvent) {
				triggerEvent.current = null;
			}
		};
		if (uuid) {
			if (triggerEvent) {
				triggerEvent.current = (params: TriggerParams) => {
					LayerMarkerModule.triggerEvent({
						nativeNodeHandle,
						markerLayerUuid: uuid,
						...defaultsTrigger,
						...params,
					});
				};
			}
		} else {
			remove();
		}
		return remove;
	}, [uuid, triggerEvent]);

	useMarkerEventSubscription({
		onEvent: onMarkerEvent,
		onPress: onMarkerPress,
		onLongPress: onMarkerLongPress,
		onTrigger: onMarkerTrigger,
	});

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
			if (nativeNodeHandle && undefined !== reactTreeIndex) {
				LayerMarkerModule.createLayer({
					nativeNodeHandle,
					reactTreeIndex,
					...(symbol && { symbol }),
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
		reactTreeIndex,
		symbol,
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
					LayerMarkerModule.removeLayer({
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
	}, [symbol]);

	const wrappedChildren = useMemo(() => {
		const wrapChildren = (children: ReactNode): null | ReactNode =>
			!children
				? null
				: Children.map(children, (child) => {
						let newChild = child;
						if (!isValidElement<{ children?: ReactNode }>(child)) {
							return newChild;
						}
						newChild = cloneElement(child, {
							...{ markerLayerUuid: uuid },
							...(child?.props?.children && {
								children: wrapChildren(child.props.children),
							}),
						});
						return newChild;
					});
		return wrapChildren(children);
	}, [children, uuid]);

	if (!uuid) {
		return null;
	}

	return wrappedChildren;
};

LayerMarker.isMapLayer = true;

LayerMarker.defaults = omit(LayerMarkerModule.getConstants(), [
	'title',
	'description',
	'position',
	'strategy',
]);

LayerMarker.defaultsTrigger = defaultsTrigger;

export default LayerMarker;
