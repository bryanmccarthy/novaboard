<script lang="ts">
    import { onMount } from 'svelte';
    import { canvasState } from '../store';
    import type { CanvasState, Image } from '../types';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    let state: CanvasState;
    canvasState.subscribe(value => state = value);
    
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
        canvasState.update((state: CanvasState) => {
            state.images.push(newImage);
            return state;
        });
    }
    // ------------------------------

    const handleMouseDown = (event: MouseEvent) => {
        canvasState.update(s => {
            if (s.panToggle) {
                return { ...s, isPanning: true };
            }

            let found = false;
            for (let i = s.images.length - 1; i >= 0; i--) {
                const image = s.images[i];
                if (
                    event.clientX >= image.x &&
                    event.clientX <= image.x + image.width &&
                    event.clientY >= image.y &&
                    event.clientY <= image.y + image.height
                ) {
                    found = true;
                    return {
                        ...s,
                        selectedIndex: i,
                        isDragging: true,
                        draggingOffset: { x: event.clientX - image.x, y: event.clientY - image.y }
                    };
                }
            }
            return { ...s, selectedIndex: null, isDragging: false };
        }); 
    }

    const handleMouseMove = (event: MouseEvent) => {
        canvasState.update(s => {
            if (s.isPanning) {
                return {
                    ...s,
                    cursor: 'cursor-grabbing',
                    images: s.images.map(img => ({
                        ...img,
                        x: img.x + event.movementX,
                        y: img.y + event.movementY
                    }))
                };
            }
            if (s.selectedIndex !== null && s.isDragging) {
                const image = s.images[s.selectedIndex];
                const updatedImages = [...s.images];
                updatedImages[s.selectedIndex] = {
                    ...image,
                    x: event.clientX - s.draggingOffset.x,
                    y: event.clientY - s.draggingOffset.y
                };
                return { ...s, images: updatedImages };
            }
            return s;
        }); 
    }

    const handleMouseUp = (event: MouseEvent) => {
        canvasState.update(s => ({ ...s, cursor: s.isPanning ? 'cursor-grab' : 'default', isPanning: false, isDragging: false }));
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
                canvasState.update(s => ({ ...s, images: [...s.images, newImage] }));
            }
        }
        reader.readAsDataURL(file);
    }
    
    const draw = () => {
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw images
        state.images.forEach(image => {
            ctx?.drawImage(image.img, image.x, image.y, image.width, image.height);
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
    class="relative bg-neutral-50 {state.cursor}"
    id="canvas" 
    bind:this={canvas}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    ondragover={handleDragOver}
    ondrop={handleDrop}
>
</canvas>