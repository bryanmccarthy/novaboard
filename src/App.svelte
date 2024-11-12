<script lang="ts">
    import { canvasState } from './lib/store';
    import type { CanvasState } from './lib/types';
    import Canvas from './lib/components/Canvas.svelte';
    import Controls from './lib/components/Controls.svelte';

    let state: CanvasState;
    canvasState.subscribe(value => state = value);

</script>

<main>
    <Canvas />
    <Controls />
</main>