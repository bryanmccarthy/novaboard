import { writable } from 'svelte/store';
import type { CanvasState } from './types';

export const canvasState = writable<CanvasState>({
    images: [],
    selectedIndex: null,
    cursor: 'default',
    panToggle: false,
    isPanning: false,
    isDragging: false,
    draggingOffset: { x: 0, y: 0 },
});