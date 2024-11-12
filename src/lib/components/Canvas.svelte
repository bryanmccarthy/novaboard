<script lang="ts">
    import { onMount } from 'svelte';
    import { cursor, controls } from '../store';
    import type { Image, Actions, Controls } from '../types';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    let selectedIndex: number | null = null;

    let images: Image[] = [];

    let actions: Actions = { panning: false, dragging: false };
    let draggingOffset = { x: 0, y: 0 };

    let cursorStyle: string;
    cursor.subscribe(value => cursorStyle = value);

    let controlsState: Controls;
    controls.subscribe(value => controlsState = value);

    onMount(() => {
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2d context');
        }
        
        handleSize();
    });

    // ------------------------------
    // TODO: remove test image
    const testImg = new Image();
    testImg.src = "src/assets/lain.png";

    testImg.onload = () => {
        const newImage: Image = {
            src: testImg.src,
            img: testImg,
            x: 50,
            y: 50,
            width: testImg.width/4,
            height: testImg.height/4
        }
        images.push(newImage);
    }
    // ------------------------------

    const handleMouseDown = (event: MouseEvent) => {
        if (controlsState.pan) {
            cursor.update(() => "cursor-grabbing");
            actions = { panning: true, dragging: false };
            return;
        }

        let found = false;
        for (let i = images.length - 1; i >= 0; i--) {
            const image = images[i];
            if (
                event.clientX >= image.x &&
                event.clientX <= image.x + image.width &&
                event.clientY >= image.y &&
                event.clientY <= image.y + image.height
            ) {
                found = true;
                selectedIndex = i;
                actions = { panning: false, dragging: true };
                draggingOffset = { x: event.clientX - image.x, y: event.clientY - image.y };
            }
        }

        if (!found) {
            selectedIndex = null;
        }
    }

    const handleMouseMove = (event: MouseEvent) => {
        if (actions.panning) {
            images.map(img => {
                img.x += event.movementX;
                img.y += event.movementY;
            });
        }

        if (actions.dragging) {
            if (selectedIndex === null) return;
            const image = images[selectedIndex];
            const updatedImages = [...images];
            updatedImages[selectedIndex] = {
                ...image,
                x: event.clientX - draggingOffset.x,
                y: event.clientY - draggingOffset.y
            };
            images = updatedImages;
        }
    }

    const handleMouseUp = (event: MouseEvent) => {
        if (controlsState.pan) {
            cursor.update(() => "cursor-grab");
        }
        actions = { panning: false, dragging: false };
    }

    const handleSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    } 

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
    }

    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (files === undefined || files?.length === 0) return;

        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const newImage: Image = {
                    src: img.src,
                    img: img,
                    x: 50,
                    y: 50,
                    width: img.width,
                    height: img.height
                }
                images.push(newImage);
            }
        }
        reader.readAsDataURL(file);
    }
    
    const draw = () => {
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw images
        images.forEach(image => {
            ctx?.drawImage(image.img, image.x, image.y, image.width, image.height);
        });

        // draw selection box
        if (selectedIndex !== null) {
            const image = images[selectedIndex];
            ctx.strokeStyle = '#4f46e5';
            ctx.lineWidth = 1;
            ctx.strokeRect(image.x, image.y, image.width, image.height);
        }

        requestAnimationFrame(draw);
    }
</script>

<svelte:window on:resize={handleSize} />

<canvas
    class="relative bg-neutral-50 {cursorStyle}"
    id="canvas" 
    bind:this={canvas}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    ondragover={handleDragOver}
    ondrop={handleDrop}
>
</canvas>