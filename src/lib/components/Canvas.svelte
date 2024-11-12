<script lang="ts">
    import { onMount } from 'svelte';
    import { selectedIndex, images, cursor, controls, camera, zoom } from '../store';
    import type { Image, Actions, Controls } from '../types';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    let s: number | null;
    selectedIndex.subscribe(value => s = value);

    let imagesState: Image[];
    images.subscribe(value => imagesState = value);

    let cameraState: { x: number, y: number };
    camera.subscribe(value => cameraState = value);

    let actions: Actions = { panning: false, dragging: false, resizing: false };
    let draggingOffset: { x: number, y: number } = { x: 0, y: 0 };

    let cursorStyle: string;
    cursor.subscribe(value => cursorStyle = value);

    let controlsState: Controls;
    controls.subscribe(value => controlsState = value);

    let zoomLevel: number;
    zoom.subscribe(value => zoomLevel = value);

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
            height: testImg.height/4,
        }
        images.update(value => [...value, newImage]);
    }

    const testImg2 = new Image();
    testImg2.src = "src/assets/frieren.jpg";

    testImg2.onload = () => {
        const newImage: Image = {
            src: testImg2.src,
            img: testImg2,
            x: 200,
            y: 200,
            width: testImg2.width/2,
            height: testImg2.height/2,
        }
        images.update(value => [...value, newImage]);
    }
    // ------------------------------

    const handleMouseDown = (event: MouseEvent) => {
        let canvasX = event.clientX / zoomLevel + cameraState.x;
        let canvasY = event.clientY / zoomLevel + cameraState.y;

        // check for image panning
        if (controlsState.pan) {
            cursor.update(() => "cursor-grabbing");
            actions = { panning: true, dragging: false, resizing: false };
            return;
        }

        // check for image resize
        if (s !== null) {
            const image = imagesState[s];
            if (
                canvasX >= image.x - resizeRadius && canvasX <= image.x + resizeRadius &&
                canvasY >= image.y - resizeRadius && canvasY <= image.y + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "nw";
                return;
            } else if (
                canvasX >= image.x + image.width - resizeRadius && canvasX <= image.x + image.width + resizeRadius &&
                canvasY >= image.y - resizeRadius && canvasY <= image.y + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "ne";
                return;
            } else if (
                canvasX >= image.x - resizeRadius && canvasX <= image.x + resizeRadius &&
                canvasY >= image.y + image.height - resizeRadius && canvasY <= image.y + image.height + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "sw";
                return;
            } else if (
                canvasX >= image.x + image.width - resizeRadius && canvasX <= image.x + image.width + resizeRadius &&
                canvasY >= image.y + image.height - resizeRadius && canvasY <= image.y + image.height + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true };
                resizeHandle = "se";
                return;
            }
        }

        // check for image drag
        let found = false;
        for (let i = imagesState.length - 1; i >= 0; i--) {
            const image = imagesState[i];
            if (
                canvasX >= image.x &&
                canvasX <= image.x + image.width &&
                canvasY >= image.y &&
                canvasY <= image.y + image.height
            ) {
                found = true;
                selectedIndex.update(() => i);
                actions = { panning: false, dragging: true, resizing: false };
                draggingOffset = { x: canvasX - image.x, y: canvasY - image.y };
                break;
            }
        }

        if (!found) {
            selectedIndex.update(() => null);
        }
    }

    const handleMouseMove = (event: MouseEvent) => {
        let canvasX = event.clientX / zoomLevel + cameraState.x;
        let canvasY = event.clientY / zoomLevel + cameraState.y;

        if (actions.panning) {
            // images.map(img => {
            //     img.x += event.movementX;
            //     img.y += event.movementY;
            // });
            camera.update(value => ({ x: value.x - event.movementX / zoomLevel, y: value.y - event.movementY / zoomLevel }));
        }

        if (actions.dragging) {
            if (s === null) return;
            const image = imagesState[s];
            const updatedImages = [...imagesState];
            updatedImages[s] = {
                ...image,
                x: canvasX - draggingOffset.x,
                y: canvasY - draggingOffset.y
            };
            images.update(() => updatedImages);
        }

        if (actions.resizing) {
            if (s === null || resizeHandle === null) return;
            const image = imagesState[s];
            const updatedImages = [...imagesState];
            switch (resizeHandle) {
                case "nw":
                    updatedImages[s] = {
                        ...image,
                        x: canvasX,
                        y: canvasY,
                        width: image.x + image.width - canvasX,
                        height: image.y + image.height - canvasY
                    };
                    break;
                case "ne":
                    updatedImages[s] = {
                        ...image,
                        y: canvasY,
                        width: canvasX - image.x,
                        height: image.y + image.height - canvasY 
                    };
                    break;
                case "sw":
                    updatedImages[s] = {
                        ...image,
                        x: canvasX,
                        width: image.x + image.width - canvasX,
                        height: canvasY - image.y
                    };
                    break;
                case "se":
                    updatedImages[s] = {
                        ...image,
                        width: canvasX - image.x,
                        height: canvasY - image.y
                    };
                    break;
            }
            images.update(() => updatedImages);
        }

        // if mouse is over a resize handle, change cursor
        if (s !== null && !controlsState.pan) {
            const image = imagesState[s];
            if (
                canvasX >= image.x - resizeRadius && canvasX <= image.x + resizeRadius &&
                canvasY >= image.y - resizeRadius && canvasY <= image.y + resizeRadius
            ) {
                cursor.update(() => "cursor-nwse-resize");
            } else if (
                canvasX >= image.x + image.width - resizeRadius && canvasX <= image.x + image.width + resizeRadius &&
                canvasY >= image.y - resizeRadius && canvasY <= image.y + resizeRadius
            ) {
                cursor.update(() => "cursor-nesw-resize");
            } else if (
                canvasX >= image.x - resizeRadius && canvasX <= image.x + resizeRadius &&
                canvasY >= image.y + image.height - resizeRadius && canvasY <= image.y + image.height + resizeRadius
            ) {
                cursor.update(() => "cursor-nesw-resize");
            } else if (
                canvasX >= image.x + image.width - resizeRadius && canvasX <= image.x + image.width + resizeRadius &&
                canvasY >= image.y + image.height - resizeRadius && canvasY <= image.y + image.height + resizeRadius
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
                const updatedImages = [...imagesState];
                updatedImages.map((img, i) => {
                    if (i === s) {
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
                images.update(() => updatedImages);
            }
        }
        actions = { panning: false, dragging: false, resizing: false };
    }

    const handleWheel = (event: WheelEvent) => {
        event.preventDefault();

        if (controlsState.pan) {
            camera.update(value => ({ x: value.x + event.deltaX / zoomLevel, y: value.y + event.deltaY / zoomLevel }));
            return;
        }
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
                    x: event.clientX / zoomLevel + cameraState.x - img.width/4,
                    y: event.clientY / zoomLevel + cameraState.y - img.height/4,
                    width: img.width/2,
                    height: img.height/2,
                }
                images.update(value => [...value, newImage]);
            }
        }
        reader.readAsDataURL(file);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'c' && event.ctrlKey) {
            copyImageToClipboard();
        }

        // if (event.key === 'Delete' && selectedIndex !== null) {
        //     images.splice(selectedIndex, 1);
        //     selectedIndex = null;
        // }
    }

    // TODO: fix copy to clipboard -- check with https 
    const copyImageToClipboard = async () => {
        if (s !== null && navigator.clipboard && navigator.clipboard.write) {
            const image = imagesState[s];

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = image.width;
            offscreenCanvas.height = image.height;
            const offscreenCtx = offscreenCanvas.getContext('2d');

            if (offscreenCtx) {
                offscreenCtx.drawImage(image.img, 0, 0, image.width, image.height);
                offscreenCanvas.toBlob(async (blob) => {
                    if (blob) {
                        const item = new ClipboardItem({ [blob.type]: blob });
                        try {
                            await navigator.clipboard.write([item]);
                            console.log('Image copied to system clipboard');
                        } catch (error) {
                            console.error('Failed to copy image to clipboard', error);
                        }
                    }
                });
            }
        } else {
            console.warn('Clipboard API not available or no image selected');
        }
    }

    const handlePaste = (event: ClipboardEvent) => {
        console.log(event.clipboardData?.items);
        event.preventDefault();
        const items = event.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                if (blob) {
                    const img = new Image();
                    const url = URL.createObjectURL(blob);
                    img.src = url;
                    img.onload = () => {
                        const newImage: Image = {
                            src: url,
                            img: img,
                            x: 50,
                            y: 50,
                            width: img.width / 2,
                            height: img.height / 2,
                        };
                        images.update(value => [...value, newImage]);
                    };
                }
            } else if (item.type === 'text/plain') {
                item.getAsString((text) => {
                    if (isImageUrl(text)) {
                        const img = new Image();
                        img.crossOrigin = 'Anonymous'; // Handle CORS
                        img.src = text;
                        img.onload = () => {
                            const newImage: Image = {
                                src: text,
                                img: img,
                                x: 50,
                                y: 50,
                                width: img.width / 2,
                                height: img.height / 2,
                            };
                            images.update(value => [...value, newImage]);
                        };
                        img.onerror = () => {
                            console.error('Failed to load image from URL:', text);
                        };
                    }
                });
            }
        }
    }

    const isImageUrl = (url: string) => {
        return /\.(jpeg|jpg|gif|png|svg|webp)$/.test(url);
    }
    
    const draw = () => {
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(zoomLevel, zoomLevel);

        // draw images
        imagesState.forEach(image => {
            ctx?.drawImage(image.img, image.x - cameraState.x, image.y - cameraState.y, image.width, image.height);
        });

        if (s !== null) {
            // draw selected image border 
            const image = imagesState[s];
            ctx.strokeStyle = '#000';
            if (zoomLevel <= 0.8) ctx.lineWidth = 3;
            else if (zoomLevel >= 1.2) ctx.lineWidth = 1;
            else ctx.lineWidth = 2;
            ctx.strokeRect(image.x - cameraState.x, image.y - cameraState.y, image.width, image.height);
        }

        // draw (0,0) center point
        ctx.beginPath();
        ctx.arc(0 - cameraState.x, 0 - cameraState.y, 5, 0, 2 * Math.PI);
        ctx.fill();


        ctx.restore(); // restore scale
        requestAnimationFrame(draw);
    }
</script>

<svelte:window on:resize={handleSize} on:paste={handlePaste} on:keydown={handleKeyDown} />

<canvas
    class="relative bg-neutral-50 {cursorStyle}"
    id="canvas" 
    bind:this={canvas}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    onwheel={handleWheel}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    style:--dot-size={zoomLevel <= 0.6 ? '1.6px' : zoomLevel >= 1.3 ? '0.8px' : `${1/zoomLevel}px`}
>
</canvas>

<style>
    #canvas {
        --dot-bg: #fafafa;
        --dot-color: #000000;
        --dot-space: 20px;
        background:
        linear-gradient(90deg, var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%) center / var(--dot-space) var(--dot-space),
        linear-gradient(var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%) center / var(--dot-space) var(--dot-space),
        var(--dot-color);
    }
</style>