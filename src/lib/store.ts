import { writable } from 'svelte/store';
import type { Controls, Actions } from './types';

export const cursor = writable<string>('default');

export const controls = writable<Controls>({
    drag: true,
    pan: false,
});

export const camera = writable<{ x: number, y: number }>({ x: 0, y: 0 });
export const zoom = writable<number>(1);