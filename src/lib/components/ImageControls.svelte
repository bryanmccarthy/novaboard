<script lang="ts">
    import { images, selectedIndex, camera, zoom, imageControls, eraserSize, cursor } from '../store';
    import type { Image, ImageControls } from '../types';

    let s: number | null;
    selectedIndex.subscribe(value => s = value);

    let imagesState: Image[];
    images.subscribe(value => imagesState = value);

    let cameraState: { x: number, y: number };
    camera.subscribe(value => cameraState = value);

    let zoomLevel: number;
    zoom.subscribe(value => zoomLevel = value);

    let imageControlsState: ImageControls;
    imageControls.subscribe(value => imageControlsState = value);

    let eraserSizeState: number;
    eraserSize.subscribe(value => eraserSizeState = value);

    let cursorState: string;
    cursor.subscribe(value => cursorState = value);

    let posX = 0;
    let posY = 0;

    $: if (s !== null && imagesState[s]) {
        const image = imagesState[s];
        const imageScreenX = (image.x - cameraState.x) * zoomLevel;
        const imageScreenY = (image.y - cameraState.y) * zoomLevel;
        const imageScreenWidth = image.width * zoomLevel;

        posX = imageScreenX + imageScreenWidth / 2 - 100;
        posY = imageScreenY - 35;
    }

    const handleDuplicate = () => {
        if (s === null) return;
        if (imageControlsState.erase) return;

        const image = imagesState[s];
        const mask = document.createElement('canvas');
        mask.width = image.width;
        mask.height = image.height;
        const maskCtx = mask.getContext('2d');
        if (maskCtx) {
            maskCtx.fillStyle = 'white';
            maskCtx.fillRect(0, 0, mask.width, mask.height);
        }
        images.update(value => value.concat({ ...image, x: image.x + 20, y: image.y + 20, mask: mask }));
        selectedIndex.update(value => imagesState.length - 1);
    }

    const handleFlip = () => {
        if (s === null) return;
        if (imageControlsState.erase) return;

        images.update(value => {
            const image = value[s as number];
            return value.map((img, index) => {
                if (index === s) {
                    return { ...img, flipped: !img.flipped };
                }
                return img;
            });
        });
    }

    const handleRotate = () => {
        if (s === null) return;
        if (imageControlsState.erase) return;
    }

    const handleBringToFront = () => {
        if (s === null) return;
        if (imageControlsState.erase) return;

        images.update(value => {
            const image = value[s as number];
            return value.filter((_, index) => index !== s).concat(image);
        });
        selectedIndex.update(value => imagesState.length - 1);
    }

    const handleSendToBack = () => {
        if (s === null) return;
        if (imageControlsState.erase) return;

        images.update(value => {
            const image = value[s as number];
            return [image].concat(value.filter((_, index) => index !== s));
        });
        selectedIndex.update(value => 0);
    }

    const handleEraser = () => {
        imageControls.update(value => ({ rotate: false, erase: !imageControlsState.erase }));
    }

    const handleEraserSize = (e: Event) => {
        eraserSize.update(value => parseInt((e.target as HTMLInputElement).value));
    }

    const handleDelete = () => {
        if (s === null) return;
        if (imageControlsState.erase) return;

        images.update(value => value.filter((_, index) => index !== s));
        selectedIndex.update(value => null);
        imageControls.update(value => ({ rotate: false, erase: false }));
    }
</script>

{#if s !== null && imagesState[s]}
<main 
    class="absolute z-10 w-[200px] flex items-center justify-center border-2 border-black bg-neutral-900 rounded-full"
    style="
        left: {posX}px;
        top: {posY}px;
    "
>
    <button
        class="bg-neutral-900 text-neutral-50 p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => handleDuplicate()}
        aria-label="Copy"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
    </button>
    <button
        class="bg-neutral-900 text-neutral-50 p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => handleRotate()}
        aria-label="Rotate"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-ccw"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
    </button>
    <button
        class="bg-neutral-900 text-neutral-50 p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => handleFlip()}
        aria-label="Flip"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flip-horizontal"><path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 20v2"/><path d="M12 14v2"/><path d="M12 8v2"/><path d="M12 2v2"/></svg>
    </button>
    <button
        class="bg-neutral-900 text-neutral-50 p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => handleBringToFront()}
        aria-label="Bring to Front"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bring-to-front"><rect x="8" y="8" width="8" height="8" rx="2"/><path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2"/><path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2"/></svg>
    </button>
    <button
        class="bg-neutral-900 text-neutral-50 p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => handleSendToBack()}
        aria-label="Send to Back"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send-to-back"><rect x="14" y="14" width="8" height="8" rx="2"/><rect x="2" y="2" width="8" height="8" rx="2"/><path d="M7 14v1a2 2 0 0 0 2 2h1"/><path d="M14 7h1a2 2 0 0 1 2 2v1"/></svg>
    </button>
    <button
        class={`p-1.5 rounded-full hover:bg-neutral-50 hover:text-black ${imageControlsState.erase ? 'bg-neutral-50 text-neutral-900' : 'bg-neutral-900 text-neutral-50'}`}
        onclick={() => handleEraser()}
        aria-label="Eraser"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eraser"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
    </button>
    <button
        class="bg-neutral-900 text-neutral-50 p-1.5 rounded-full hover:bg-neutral-50 hover:text-black"
        onclick={() => handleDelete()}
        aria-label="Delete"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    </button>
    <!-- Eraser Slider -->
    {#if imageControlsState.erase}
    <input
        class="absolute"
        id="slider"
        style="left: {77}px; top: {-20}px;"
        type="range" 
        min="1" 
        max="100" 
        value={eraserSizeState} 
        oninput={(e) => handleEraserSize(e)} 
    />
    {/if}
</main>
{/if}

<style>
    #slider {
    -webkit-appearance: none;
    appearance: none; 
    width: 120px;
    cursor: pointer;
    outline: none;
    overflow: hidden;
    border-radius: 16px;
    }

    #slider::-webkit-slider-runnable-track {
    height: 15px;
    background: #0a0a0a;
    border-radius: 16px;
    }

    #slider::-moz-range-track {
    height: 15px;
    background: #0a0a0a;
    border-radius: 16px;
    }

    #slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none; 
    height: 15px;
    width: 15px;
    background-color: #0a0a0a;
    border-radius: 50%;
    border: 2px solid #fafafa;
    box-shadow: -407px 0 0 400px #0a0a0a;
    }

    #slider::-moz-range-thumb {
    height: 15px;
    width: 15px;
    background-color: #fff;
    border-radius: 50%;
    border: 1px solid #fafafa;
    box-shadow: -407px 0 0 400px #0a0a0a;
    }
</style>