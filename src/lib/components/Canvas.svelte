<script lang="ts">
    import { onMount } from 'svelte';
    import { cursor, controls } from '../store';
    import type { Image, Actions, Controls } from '../types';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    let selectedIndex: number | null = null;

    let images: Image[] = [];

    let actions: Actions = { panning: false, dragging: false, resizing: false };
    let draggingOffset = { x: 0, y: 0 };

    let cursorStyle: string;
    cursor.subscribe(value => cursorStyle = value);

    let controlsState: Controls;
    controls.subscribe(value => controlsState = value);

    let resizeHandle: string | null = null;
    const resizeRadius = 6;

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
        // check for image panning
        if (controlsState.pan) {
            cursor.update(() => "cursor-grabbing");
            actions = { panning: true, dragging: false, resizing: false };
            return;
        }

        // check for image resize
        if (selectedIndex !== null) {
            const image = images[selectedIndex];
            if (
                event.clientX >= image.x - resizeRadius && event.clientX <= image.x + resizeRadius &&
                event.clientY >= image.y - resizeRadius && event.clientY <= image.y + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "nw";
                return;
            } else if (
                event.clientX >= image.x + image.width - resizeRadius && event.clientX <= image.x + image.width + resizeRadius &&
                event.clientY >= image.y - resizeRadius && event.clientY <= image.y + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "ne";
                return;
            } else if (
                event.clientX >= image.x - resizeRadius && event.clientX <= image.x + resizeRadius &&
                event.clientY >= image.y + image.height - resizeRadius && event.clientY <= image.y + image.height + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "sw";
                return;
            } else if (
                event.clientX >= image.x + image.width - resizeRadius && event.clientX <= image.x + image.width + resizeRadius &&
                event.clientY >= image.y + image.height - resizeRadius && event.clientY <= image.y + image.height + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "se";
                return;
            }
        }

        // check for image drag
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
                actions = { panning: false, dragging: true, resizing: false };
                draggingOffset = { x: event.clientX - image.x, y: event.clientY - image.y };
                break;
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

        if (actions.resizing) {
            if (selectedIndex === null || resizeHandle === null) return;
            const image = images[selectedIndex];
            const updatedImages = [...images];
            switch (resizeHandle) {
                case "nw":
                    updatedImages[selectedIndex] = {
                        ...image,
                        x: event.clientX,
                        y: event.clientY,
                        width: image.x + image.width - event.clientX,
                        height: image.y + image.height - event.clientY
                    };
                    break;
                case "ne":
                    updatedImages[selectedIndex] = {
                        ...image,
                        y: event.clientY,
                        width: event.clientX - image.x,
                        height: image.y + image.height - event.clientY
                    };
                    break;
                case "sw":
                    updatedImages[selectedIndex] = {
                        ...image,
                        x: event.clientX,
                        width: image.x + image.width - event.clientX,
                        height: event.clientY - image.y
                    };
                    break;
                case "se":
                    updatedImages[selectedIndex] = {
                        ...image,
                        width: event.clientX - image.x,
                        height: event.clientY - image.y
                    };
                    break;
            }
            images = updatedImages;
        }

        // if mouse is over a resize handle, change cursor
        if (selectedIndex !== null && !controlsState.pan) {
            const image = images[selectedIndex];
            if (
                event.clientX >= image.x - resizeRadius && event.clientX <= image.x + resizeRadius &&
                event.clientY >= image.y - resizeRadius && event.clientY <= image.y + resizeRadius
            ) {
                cursor.update(() => "cursor-nwse-resize");
            } else if (
                event.clientX >= image.x + image.width - resizeRadius && event.clientX <= image.x + image.width + resizeRadius &&
                event.clientY >= image.y - resizeRadius && event.clientY <= image.y + resizeRadius
            ) {
                cursor.update(() => "cursor-nesw-resize");
            } else if (
                event.clientX >= image.x - resizeRadius && event.clientX <= image.x + resizeRadius &&
                event.clientY >= image.y + image.height - resizeRadius && event.clientY <= image.y + image.height + resizeRadius
            ) {
                cursor.update(() => "cursor-nesw-resize");
            } else if (
                event.clientX >= image.x + image.width - resizeRadius && event.clientX <= image.x + image.width + resizeRadius &&
                event.clientY >= image.y + image.height - resizeRadius && event.clientY <= image.y + image.height + resizeRadius
            ) {
                cursor.update(() => "cursor-nwse-resize");
            } else {
                cursor.update(() => "cursor-default");
            }
        }
    }

    const handleMouseUp = (event: MouseEvent) => {
        if (controlsState.pan) {
            cursor.update(() => "cursor-grab");
        }
        if (actions.resizing) {
            // fix negative width/height
            if (selectedIndex !== null) {
                const updatedImages = [...images];
                updatedImages.map((img, i) => {
                    if (i === selectedIndex) {
                        if (img.width < 0) { // TODO: maybe also handle flipping image
                            img.x += img.width;
                            img.width = Math.abs(img.width);
                        }
                        if (img.height < 0) {
                            img.y += img.height;
                            img.height = Math.abs(img.height);
                        }
                    }
                    return img;
                });
                images = updatedImages;
            }
        }
        actions = { panning: false, dragging: false, resizing: false };
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
                    width: img.width/2,
                    height: img.height/2
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

        if (selectedIndex !== null) {
            // draw selection box
            const image = images[selectedIndex];
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.strokeRect(image.x, image.y, image.width, image.height);
            // draw resize handles
            const handleSize = 4;
            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.arc(image.x, image.y, handleSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(image.x + image.width, image.y, handleSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(image.x, image.y + image.height, handleSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(image.x + image.width, image.y + image.height, handleSize, 0, 2 * Math.PI);
            ctx.fill();
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