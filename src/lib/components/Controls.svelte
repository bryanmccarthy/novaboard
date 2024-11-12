<script lang="ts">
    import { cursor, controls } from '../store';
    import type { Controls } from '../types';

    let c: string;
    cursor.subscribe(value => c = value);

    let controlsState: Controls;
    controls.subscribe(value => controlsState = value);

    const toggleDrag = () => {
        if (!controlsState.drag) {
            cursor.update(() => "cursor-default");
            controls.update(() => ({ drag: true, pan: false }));
        }
    }

    const togglePan = () => {
        if (controlsState.pan) {
            cursor.update(() => "cursor-default");
            controls.update(() => ({ drag: false, pan: false }));
        } else {
            cursor.update(() => "cursor-grab");
            controls.update(() => ({ drag: false, pan: true }));
        }
    }
</script>

<main class="absolute bottom-0 left-1/2 flex justify-center items-center border-2 border-black bg-black m-4 rounded-full">
    <button
        class={ controlsState.drag? "bg-white p-1.5 rounded-full" : "bg-black text-white p-1.5 rounded-full" }
        onclick={() => toggleDrag()}
        aria-label="Toggle Drag"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mouse-pointer-2"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/></svg>
    </button>
    <button 
        class={ controlsState.pan? "bg-white p-1.5 rounded-full" : "bg-black text-white p-1.5 rounded-full" }
        onclick={() => togglePan()}
        aria-label="Toggle Pan"
    >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>    
    </button>
</main>