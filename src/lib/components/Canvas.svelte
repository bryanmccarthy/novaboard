<script lang="ts">
    import { onMount } from 'svelte';
    import type { State, Image } from '../types';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    onMount(() => {
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2d context');
        }
        
        handleSize();
    });

    // temporary state 
    const state: State = {
        images: [],
        selectedIndex: null,
        isDragging: false,
        draggingOffset: { x: 0, y: 0 },
    } 

    // ------------------------------
    // TODO: remove test image
    const img = new Image();
    img.src = "src/assets/lain.png";

    img.onload = () => {
        const newImage: Image = {
            src: img.src,
            x: 50,
            y: 50,
            width: img.width/4,
            height: img.height/4
        }
        state.images.push(newImage);
    }
    // ------------------------------

    const handleMouseDown = (event: MouseEvent) => {
        let found = false;
        for (let i = state.images.length - 1; i >= 0; i--) {
            const image = state.images[i];
            if (
                event.clientX >= image.x &&
                event.clientX <= image.x + image.width &&
                event.clientY >= image.y &&
                event.clientY <= image.y + image.height
            ) {
                state.selectedIndex = i;
                state.isDragging = true;
                state.draggingOffset = {
                    x: event.clientX - image.x,
                    y: event.clientY - image.y
                };
                found = true;
                break;
            }
        }

        if (!found) {
            state.selectedIndex = null;
            state.isDragging = false;
        }

        // console.log("selected index: ", state.selectedIndex);
    }

    const handleMouseMove = (event: MouseEvent) => {
        if (state.selectedIndex !== null && state.isDragging) {
            const image = state.images[state.selectedIndex];
            image.x = event.clientX - state.draggingOffset.x;
            image.y = event.clientY - state.draggingOffset.y;
        }

        // console.log("x: ", event.clientX, "y: ", event.clientY);
    }

    const handleMouseUp = (event: MouseEvent) => {
        state.isDragging = false;
    }

    const handleSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }   
    
    const draw = () => {
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw images
        state.images.forEach(image => {
            ctx?.drawImage(img, image.x, image.y, image.width, image.height);
        });

        // draw selection box
        if (state.selectedIndex !== null) {
            const image = state.images[state.selectedIndex];
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 1;
            ctx.strokeRect(image.x, image.y, image.width, image.height);
        }

        requestAnimationFrame(draw);
    }
</script>

<svelte:window on:resize={handleSize} />

<canvas
    class="bg-rose-50" 
    id="canvas" 
    bind:this={canvas}
    on:mousemove={handleMouseMove}
    on:mousedown={handleMouseDown}
    on:mouseup={handleMouseUp}
>
</canvas>