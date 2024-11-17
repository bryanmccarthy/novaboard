<script lang="ts">
    import { cursor, controls, imageControls, camera, zoom } from '../store';

    cursor.subscribe(value =>  value);
    controls.subscribe(value => value);
    imageControls.subscribe(value => value);
    camera.subscribe(value => value);
    zoom.subscribe(value => value);

    const toggleDrag = () => {
        if (!$controls.drag) {
            cursor.update(() => "cursor-default");
            controls.update(() => ({ drag: true, pan: false }));
        }
    }

    const togglePan = () => {
        if ($imageControls.erase) return;

        if ($controls.pan) {
            cursor.update(() => "cursor-default");
            controls.update(() => ({ drag: false, pan: false }));
        } else {
            cursor.update(() => "cursor-grab");
            controls.update(() => ({ drag: false, pan: true }));
        }
    }

    const adjustCameraForZoom = (from: number, to: number) => {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        const worldCenterX = $camera.x + canvasCenterX / from;
        const worldCenterY = $camera.y + canvasCenterY / from;
        const newCameraX = worldCenterX - canvasCenterX / to;
        const newCameraY = worldCenterY - canvasCenterY / to;
        camera.update(() => ({ x: newCameraX, y: newCameraY }));
    }

    const zoomIn = () => {
        if ($zoom >= 2) return;
        adjustCameraForZoom($zoom, $zoom + 0.1);
        zoom.update(value => value + 0.1);
    }

    const zoomOut = () => {
        if ($zoom <= 0.2) return;
        adjustCameraForZoom($zoom, $zoom - 0.1);
        zoom.update(value => value - 0.1);
    }

    const undo = () => {

    }

    const redo = () => {

    }

</script>

<main class="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-1 border-2 border-black bg-neutral-900 m-4 rounded-full">
    <button
        class={ $controls.drag? "bg-neutral-50 p-1.5 rounded-full" : "bg-neutral-900 text-white p-1.5 rounded-full hover:bg-neutral-50 hover:text-black" }
        onclick={() => toggleDrag()}
        aria-label="Toggle Drag"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mouse-pointer-2"><path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/></svg>
    </button>
    <button 
        class={ $controls.pan? "bg-white p-1.5 rounded-full" : "bg-neutral-900 text-white p-1.5 rounded-full hover:bg-neutral-50 hover:text-black" }
        onclick={() => togglePan()}
        aria-label="Toggle Pan"
    >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hand"><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>    
    </button>
    <!-- divider -->
    <div class="border border-neutral-50 h-6 rounded m-1"></div>
    <button
        class="bg-neutral-900 text-white p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => zoomOut()}
        aria-label="Undo"
    >
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><path d="M5 12h14"/></svg>
    </button>
    <div class="bg-neutral-900 text-white text-m">
        {$zoom.toFixed(1)}x
    </div>
    <button
        class="bg-neutral-900 text-white p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => zoomIn()}
        aria-label="Undo"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    </button>
    <button
        class="bg-neutral-900 text-white p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => undo()}
        aria-label="Undo"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-undo"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
    </button>
    <button
        class="bg-neutral-900 text-white p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => redo()}
        aria-label="Redo"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-redo"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
    </button>   
</main>