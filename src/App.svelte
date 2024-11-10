<script lang="ts">
    import { onMount } from 'svelte';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    onMount(() => {
        canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) throw new Error('Canvas not found');
        ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
</script>

<main>
  <canvas id="canvas"></canvas>
</main>