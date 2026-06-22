import type { Position } from 'react-native-mapsforge-vtm';

export const randomNumber = (min: number, max: number): number =>
	Math.random() * (max - min) + min;
