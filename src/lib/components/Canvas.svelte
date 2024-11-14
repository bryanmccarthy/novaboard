<script lang="ts">
    import { onMount } from 'svelte';
    import { selectedIndex, images, cursor, controls, imageControls, camera, zoom, eraserSize } from '../store';
    import type { Image, Actions, Controls, ImageControls } from '../types';
    import { scale } from 'svelte/transition';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    let s: number | null;
    selectedIndex.subscribe(value => s = value);

    let imagesState: Image[];
    images.subscribe(value => imagesState = value);

    let cameraState: { x: number, y: number };
    camera.subscribe(value => cameraState = value);

    let actions: Actions = { panning: false, dragging: false, resizing: false, erasing: false };
    let draggingOffset: { x: number, y: number } = { x: 0, y: 0 };

    let cursorState: string;
    cursor.subscribe(value => cursorState = value);

    let controlsState: Controls;
    controls.subscribe(value => controlsState = value);

    let imageControlsState: ImageControls;
    imageControls.subscribe(value => imageControlsState = value);

    let zoomLevel: number;
    zoom.subscribe(value => zoomLevel = value);

    let lastEraser: { x: number | null, y: number | null } = { x: null, y: null };

    let resizeHandle: string | null = null;
    const resizeRadius = 6;

    let eraserSizeState: number;
    eraserSize.subscribe(value => eraserSizeState = value);

    let mouseX = 0;
    let mouseY = 0;

    onMount(() => {
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2d context');
        }

        createNewImage("src/assets/frieren.jpg", 200, 200); // TODO: remove
        createNewImage("src/assets/lain.png", 50, 50); // TODO: remove

        // event listener for mouseX and mouseY
        window.addEventListener('mousemove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
        });

        handleSize();
    });

    const handleMouseDown = (event: MouseEvent) => {
        let canvasX = event.clientX / zoomLevel + cameraState.x;
        let canvasY = event.clientY / zoomLevel + cameraState.y;

        // check for image erasing
        if (imageControlsState.erase) {
            actions = { panning: false, dragging: false, resizing: false, erasing: true };
            eraseAt(canvasX, canvasY, lastEraser);
            return;
        }

        // check for image panning
        if (controlsState.pan) {
            cursor.update(() => "cursor-grabbing");
            actions = { panning: true, dragging: false, resizing: false, erasing: false };
            return;
        }

        // check for image resize
        if (s !== null) {
            const image = imagesState[s];
            if (
                canvasX >= image.x - resizeRadius && canvasX <= image.x + resizeRadius &&
                canvasY >= image.y - resizeRadius && canvasY <= image.y + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true, erasing: false };
                resizeHandle = "nw";
                return;
            } else if (
                canvasX >= image.x + image.width - resizeRadius && canvasX <= image.x + image.width + resizeRadius &&
                canvasY >= image.y - resizeRadius && canvasY <= image.y + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true, erasing: false };
                resizeHandle = "ne";
                return;
            } else if (
                canvasX >= image.x - resizeRadius && canvasX <= image.x + resizeRadius &&
                canvasY >= image.y + image.height - resizeRadius && canvasY <= image.y + image.height + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true, erasing: false };
                resizeHandle = "sw";
                return;
            } else if (
                canvasX >= image.x + image.width - resizeRadius && canvasX <= image.x + image.width + resizeRadius &&
                canvasY >= image.y + image.height - resizeRadius && canvasY <= image.y + image.height + resizeRadius
            ) {
                actions = { panning: false, dragging: false, resizing: true, erasing: false };
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
                actions = { panning: false, dragging: true, resizing: false, erasing: false };
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

        if (actions.erasing) {
            eraseAt(canvasX, canvasY, lastEraser);
            lastEraser = { x: canvasX, y: canvasY };
        }

        if (actions.panning) {
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
            if (s === null) return;
            const image = imagesState[s];
            const updatedImages = [...imagesState];
            let newX = image.x;
            let newY = image.y;
            let newWidth = image.width;
            let newHeight = image.height;

            switch (resizeHandle) {
                case "nw":
                newWidth = Math.max(image.x + image.width - canvasX, 30);
                newHeight = Math.max(image.y + image.height - canvasY, 30);
                newX = image.x + image.width - newWidth;
                newY = image.y + image.height - newHeight;
                break;
                case "ne":
                newWidth = Math.max(canvasX - image.x, 30);
                newHeight = Math.max(image.y + image.height - canvasY, 30);
                newY = image.y + image.height - newHeight;
                break;
                case "sw":
                newWidth = Math.max(image.x + image.width - canvasX, 30);
                newHeight = Math.max(canvasY - image.y, 30);
                newX = image.x + image.width - newWidth;
                break;
                case "se":
                newWidth = Math.max(canvasX - image.x, 30);
                newHeight = Math.max(canvasY - image.y, 30);
                break;
            }

            updatedImages[s] = {
                ...image,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            };
            images.update(() => updatedImages);
        }

        // if mouse is over a resize handle, change cursor
        if (s !== null && !controlsState.pan && !imageControlsState.erase) {
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
                if (!imageControlsState.erase) cursor.update(() => "cursor-default");
            }
        }
    }

    const handleMouseUp = (event: MouseEvent) => {
        if (controlsState.pan) {
            cursor.update(() => "cursor-grab");
        }

        if (actions.erasing) {
            lastEraser = { x: null, y: null };
        }

        actions = { panning: false, dragging: false, resizing: false, erasing: false };
    }

    const handleWheel = (event: WheelEvent) => {
        event.preventDefault();

        camera.update(value => ({ x: value.x + event.deltaX / zoomLevel, y: value.y + event.deltaY / zoomLevel }));

        // TODO: check if issues
        // if (controlsState.pan) {
        //     camera.update(value => ({ x: value.x + event.deltaX / zoomLevel, y: value.y + event.deltaY / zoomLevel }));
        //     return;
        // }
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
            createNewImage(e.target?.result as string, event.clientX / zoomLevel + cameraState.x, event.clientY / zoomLevel + cameraState.y);
        }
        reader.readAsDataURL(file);
    }

    const adjustCameraForZoom = (from: number, to: number) => {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        const worldCenterX = cameraState.x + canvasCenterX / from;
        const worldCenterY = cameraState.y + canvasCenterY / from;
        const newCameraX = worldCenterX - canvasCenterX / to;
        const newCameraY = worldCenterY - canvasCenterY / to;
        camera.update(() => ({ x: newCameraX, y: newCameraY }));
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'c' && event.ctrlKey) {
            copyImageToClipboard();
        }

        if (event.key === 'ArrowUp') {
            if (zoomLevel >= 2) return;
            adjustCameraForZoom(zoomLevel, zoomLevel + 0.1);
            zoom.update(value => value + 0.1);
        } else if (event.key === 'ArrowDown') {
            if (zoomLevel <= 0.2) return;
            adjustCameraForZoom(zoomLevel, zoomLevel - 0.1);
            zoom.update(value => value - 0.1);
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            if (s === null) return;
            images.update(value => value.filter((_, i) => i !== s));
            selectedIndex.update(() => null);
            imageControls.update(() => ({ rotate: false, erase: false }));
        }
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
                    createNewImage(URL.createObjectURL(blob), 50, 50);
                }
            }
        }
    }

    const isImageUrl = (url: string) => {
        return /\.(jpeg|jpg|gif|png|svg|webp)$/.test(url);
    }

    const createNewImage = (src: string, x: number, y: number) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const newImage: Image = {
                src: src,
                img: img,
                imgCanvas: document.createElement('canvas'),
                x: x,
                y: y,
                width: img.width > 1400 ? img.width / 4 : img.width > 1000 ? img.width / 2 : img.width,
                height: img.width > 1400 ? img.height / 4 : img.width > 1000 ? img.height / 2 : img.height,
                flipped: false,
                mask: document.createElement('canvas'),
            };
            newImage.mask.width = newImage.width;
            newImage.mask.height = newImage.height;
            const maskCtx = newImage.mask.getContext('2d');
            if (maskCtx) {
                maskCtx.fillStyle = 'white';
                maskCtx.fillRect(0, 0, newImage.width, newImage.height);
            }

            images.update(value => [...value, newImage]);
        };
    }

    const eraseAt = (x: number, y: number, lastEraser: { x: number | null; y: number | null }) => {
        if (s === null) return;

        const image = imagesState[s];

        const imgX = image.x;
        const imgY = image.y;
        const imgWidth = image.width;
        const imgHeight = image.height;

        if (x >= imgX && x <= imgX + imgWidth && y >= imgY && y <= imgY + imgHeight) {
            const maskCtx = image.mask.getContext('2d');
            if (!maskCtx) return;

            let imageCoordX = x - imgX;
            let imageCoordY = y - imgY;
            let lastImageCoordX =
                lastEraser.x !== null ? lastEraser.x - imgX : null;
            let lastImageCoordY =
                lastEraser.y !== null ? lastEraser.y - imgY : null;

            if (image.flipped) {
                imageCoordX = imgWidth - imageCoordX;
                if (lastImageCoordX !== null) {
                    lastImageCoordX = imgWidth - lastImageCoordX;
                }
            }

            maskCtx.save();
            maskCtx.globalCompositeOperation = 'destination-out';
            maskCtx.beginPath();
            if (lastImageCoordX !== null && lastImageCoordY !== null) {
                maskCtx.lineWidth = eraserSizeState;
                maskCtx.lineCap = 'round';
                maskCtx.moveTo(lastImageCoordX, lastImageCoordY);
                maskCtx.lineTo(imageCoordX, imageCoordY);
                maskCtx.stroke();
            } else {
                maskCtx.arc(
                    imageCoordX,
                    imageCoordY,
                    eraserSizeState / 2,
                    0,
                    Math.PI * 2
                );
                maskCtx.fill();
            }
            maskCtx.closePath();
            maskCtx.restore();
        }
    }

    const draw = () => {
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-cameraState.x, -cameraState.y);

        // draw images
        imagesState.forEach(image => {
            if (!ctx) return;
            ctx.save();
            ctx.translate(image.x, image.y);

            if (image.flipped) {
                ctx.scale(-1, 1);
                ctx.translate(-image.width, 0);
            }

            image.imgCanvas.width = image.width;
            image.imgCanvas.height = image.height;
            const imgCtx = image.imgCanvas.getContext('2d');
            if (imgCtx) {
                imgCtx.drawImage(image.img, 0, 0, image.width, image.height);
                imgCtx.globalCompositeOperation = 'destination-in';
                imgCtx.drawImage(image.mask, 0, 0, image.width, image.height);
            }
            ctx.drawImage(image.imgCanvas, 0, 0, image.width, image.height);

            ctx.restore();
        });

        if (s !== null) {
            // draw selected image border 
            const image = imagesState[s];
            ctx.strokeStyle = '#000';
            if (zoomLevel <= 0.8) ctx.lineWidth = 3;
            else if (zoomLevel >= 1.2) ctx.lineWidth = 1;
            else ctx.lineWidth = 2;
            ctx.strokeRect(image.x, image.y, image.width, image.height);
        }

        if (imageControlsState.erase) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(
                (mouseX / zoomLevel + cameraState.x),
                (mouseY / zoomLevel + cameraState.y),
                eraserSizeState / 2,
                0,
                Math.PI * 2
            );
            ctx.strokeStyle = '#0a0a0a';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore(); // restore scale
        requestAnimationFrame(draw);
    }
</script>

<svelte:window on:resize={handleSize} on:paste={handlePaste} on:keydown={handleKeyDown} />

<canvas
    class="relative bg-neutral-50 {cursorState}"
    id="canvas" 
    bind:this={canvas}
    onmousemove={handleMouseMove}
    onmousedown={handleMouseDown}
    onmouseup={handleMouseUp}
    onwheel={handleWheel}
    ondragover={handleDragOver}
    ondrop={handleDrop}
>
</canvas>

<!-- TOOD: experiment with backgrounds -->
 <!-- style:--dot-size={zoomLevel <= 0.6 ? '1.6px' : zoomLevel >= 1.3 ? '0.8px' : `${1/zoomLevel}px`} -->

<style>
    /* #canvas {
        --dot-bg: #fafafa;
        --dot-color: #000000;
        --dot-space: 20px;
        background:
        linear-gradient(90deg, var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%) center / var(--dot-space) var(--dot-space),
        linear-gradient(var(--dot-bg) calc(var(--dot-space) - var(--dot-size)), transparent 1%) center / var(--dot-space) var(--dot-space),
        var(--dot-color);
    } */
</style>
