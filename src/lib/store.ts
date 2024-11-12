import { writable } from 'svelte/store';
import type { Image, Controls } from './types';

export const images = writable<Image[]>([]);
export const selectedIndex = writable<number | null>(null);

export const cursor = writable<string>('default');

export const controls = writable<Controls>({
    drag: true,
    pan: false,
});

export const camera = writable<{ x: number, y: number }>({ x: 0, y: 0 });
export const zoom = writable<number>(1);