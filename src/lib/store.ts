import { writable } from 'svelte/store';
import type { Controls, Actions } from './types';

export const cursor = writable<string>('default');

export const controls = writable<Controls>({
    drag: true,
    pan: false,
});

export const zoom = writable<number>(1);