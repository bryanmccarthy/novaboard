<script lang="ts">
    import { onMount } from 'svelte';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    onMount(() => {
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2d context');
        }
        
        handleSize();
    });

    type Image = {
        src: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }

    const images: Image[] = [];

    // TODO: remove test image
    const img = new Image();
    img.src = "src/assets/lain.png";

    img.onload = () => {
        const newImage: Image = {
            src: img.src,
            x: 0,
            y: 0,
            width: img.width/4,
            height: img.height/4
        }
        images.push(newImage);
    }
    
    const draw = () => {
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        images.forEach(image => {
            ctx?.drawImage(img, image.x, image.y, image.width, image.height);
        });

        requestAnimationFrame(draw);
    }

    const handleSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
    }
</script>

<svelte:window on:resize={handleSize} />

<canvas
    class="bg-neutral-100" 
    id="canvas" 
    bind:this={canvas}
></canvas>