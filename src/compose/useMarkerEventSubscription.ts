import { useRef, useEffect } from "react";
import type { EventSubscription } from "react-native";
import LayerMarkerModule, { type MarkerEvent, type MarkerProps } from "../NativeModules/NativeLayerMarker";

const useMarkerEventSubscription = ( {
	uuid,
	onEvent,
	onPress,
	onLongPress,
	onTrigger,
} : {
	uuid?: null | false | string;
	onEvent: MarkerProps['onEvent'];
	onPress: MarkerProps['onPress'];
	onLongPress: MarkerProps['onLongPress'];
	onTrigger: MarkerProps['onTrigger'];
} ) => {
    const markerEventSubscription = useRef<null | EventSubscription>( null );
	useEffect( () => {
		const removeSubscription = () => {
			markerEventSubscription.current?.remove();
			markerEventSubscription.current = null;
		};
		if ( onEvent || onPress || onLongPress || onTrigger ) {
			markerEventSubscription.current = LayerMarkerModule.onMarkerEvent( ( response?: MarkerEvent ) => {
				if ( response && ( ! uuid || response?.uuid === uuid ) ) {
					onEvent && onEvent( response );
					'itemSingleTapUp' === response?.event && onPress && onPress( response );
					'itemLongPress' === response?.event && onLongPress && onLongPress( response );
					'itemTrigger' === response?.event && onTrigger && onTrigger( response );
				}
			} );
		} else {
			removeSubscription();
		}
		return removeSubscription;
	}, [
		uuid,
		onEvent,
		onPress,
		onLongPress,
		onTrigger,
	] );
};

export default useMarkerEventSubscription;