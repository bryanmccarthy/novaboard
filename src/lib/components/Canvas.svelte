<script lang="ts">
    import { onMount } from 'svelte';
    import { selectedIndex, images, cursor, controls, imageControls, camera, zoom, eraserSize } from '../store';
    import type { Image, Actions } from '../types';
    import { createNewImage } from '../utils/createImage';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    selectedIndex.subscribe(value => value);
    images.subscribe(value => value);
    camera.subscribe(value => value);
    cursor.subscribe(value => value);
    controls.subscribe(value => value);
    imageControls.subscribe(value => value);
    zoom.subscribe(value => value);
    eraserSize.subscribe(value => value);

    let actions: Actions = { panning: false, dragging: false, resizing: false, erasing: false };
    let draggingOffset: { x: number, y: number } = { x: 0, y: 0 };
    let lastEraser: { x: number | null, y: number | null } = { x: null, y: null };
    let resizeHandle: string | null = null;
    let resizeRadius = 10;
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
        let canvasX = event.clientX / $zoom + $camera.x;
        let canvasY = event.clientY / $zoom + $camera.y;

        // check for image erasing
        if ($imageControls.erase) {
            actions = { panning: false, dragging: false, resizing: false, erasing: true };
            eraseAt(canvasX, canvasY, lastEraser);
            return;
        }

        // check for image panning
        if ($controls.pan) {
            cursor.update(() => "cursor-grabbing");
            actions = { panning: true, dragging: false, resizing: false, erasing: false };
            return;
        }

        // check for image resize
        if ($selectedIndex !== null) {
            const image = $images[$selectedIndex];
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
        for (let i = $images.length - 1; i >= 0; i--) {
            const image = $images[i];
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
        let canvasX = event.clientX / $zoom + $camera.x;
        let canvasY = event.clientY / $zoom + $camera.y;

        if (actions.erasing) {
            eraseAt(canvasX, canvasY, lastEraser);
            lastEraser = { x: canvasX, y: canvasY };
        }

        if (actions.panning) {
            camera.update(value => ({ x: value.x - event.movementX / $zoom, y: value.y - event.movementY / $zoom }));
        }

        if (actions.dragging) {
            if ($selectedIndex === null) return;
            const image = $images[$selectedIndex];
            const updatedImages = [...$images];
            updatedImages[$selectedIndex] = {
                ...image,
                x: canvasX - draggingOffset.x,
                y: canvasY - draggingOffset.y
            };
            images.update(() => updatedImages);
        }

        if (actions.resizing) {
            if ($selectedIndex === null) return;
            const image = $images[$selectedIndex];
            const updatedImages = [...$images];
            let newX = image.x;
            let newY = image.y;
            let newWidth = image.width;
            let newHeight = image.height;

            switch (resizeHandle) {
                case "nw":
                newWidth = Math.max(image.x + image.width - canvasX, 30);
                // newHeight = Math.max(image.y + image.height - canvasY, 30);
                newHeight = newWidth / image.aspectRatio;
                newX = image.x + image.width - newWidth;
                newY = image.y + image.height - newHeight;
                break;
                case "ne":
                newWidth = Math.max(canvasX - image.x, 30);
                // newHeight = Math.max(image.y + image.height - canvasY, 30);
                newHeight = newWidth / image.aspectRatio;
                newY = image.y + image.height - newHeight;
                break;
                case "sw":
                newWidth = Math.max(image.x + image.width - canvasX, 30);
                // newHeight = Math.max(canvasY - image.y, 30);
                newHeight = newWidth / image.aspectRatio;
                newX = image.x + image.width - newWidth;
                break;
                case "se":
                newWidth = Math.max(canvasX - image.x, 30);
                // newHeight = Math.max(canvasY - image.y, 30);
                newHeight = newWidth / image.aspectRatio;
                break;
            }

            updatedImages[$selectedIndex] = {
                ...image,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
            };
            images.update(() => updatedImages);
        }

        // if mouse is over a resize handle, change cursor
        if ($selectedIndex !== null && !$controls.pan && !$imageControls.erase) {
            const image = $images[$selectedIndex];
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
                if (!$imageControls.erase) cursor.update(() => "cursor-default");
            }
        }
    }

    const handleMouseUp = (event: MouseEvent) => {
        if ($controls.pan) {
            cursor.update(() => "cursor-grab");
        }

        if (actions.erasing) {
            lastEraser = { x: null, y: null };
        }

        actions = { panning: false, dragging: false, resizing: false, erasing: false };
    }

    const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        camera.update(value => ({ x: value.x + event.deltaX / $zoom, y: value.y + event.deltaY / $zoom }));
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
            createNewImage(e.target?.result as string, event.clientX / $zoom + $camera.x, event.clientY / $zoom + $camera.y);
        }
        reader.readAsDataURL(file);
    }

    const adjustCameraForZoom = (from: number, to: number) => {
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;
        const canvasCenterX = canvasWidth / 2;
        const canvasCenterY = canvasHeight / 2;
        const worldCenterX = $camera.x + canvasCenterX / from;
        const worldCenterY = $camera.y + canvasCenterY / from;
        const newCameraX = worldCenterX - canvasCenterX / to;
        const newCameraY = worldCenterY - canvasCenterY / to;
        camera.update(() => ({ x: newCameraX, y: newCameraY }));
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'c' && event.ctrlKey) {
            copyImageToClipboard();
        }

        if (event.key === 'ArrowUp') {
            if ($zoom >= 2) return;
            adjustCameraForZoom($zoom, $zoom + 0.1);
            zoom.update(value => value + 0.1);
        } else if (event.key === 'ArrowDown') {
            if ($zoom <= 0.2) return;
            adjustCameraForZoom($zoom, $zoom - 0.1);
            zoom.update(value => value - 0.1);
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            if ($selectedIndex === null) return;
            images.update(value => value.filter((_, i) => i !== $selectedIndex));
            selectedIndex.update(() => null);
            imageControls.update(() => ({ rotate: false, erase: false }));
        }
    }

    // TODO: fix copy to clipboard -- check with https 
    const copyImageToClipboard = async () => {
        if ($selectedIndex !== null && navigator.clipboard && navigator.clipboard.write) {
            const image = $images[$selectedIndex];

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

    const eraseAt = (x: number, y: number, lastEraser: { x: number | null; y: number | null }) => {
        if ($selectedIndex === null) return;
        const image = $images[$selectedIndex];

        const imgX = image.x;
        const imgY = image.y;
        const imgWidth = image.width;
        const imgHeight = image.height;

        if (x >= imgX && x <= imgX + imgWidth && y >= imgY && y <= imgY + imgHeight) {
            // Convert canvas coordinates to image coordinates
            const scaleX = image.canvas.width / imgWidth;
            const scaleY = image.canvas.height / imgHeight;

            let imageCoordX = (x - imgX) * scaleX;
            if (image.flipped) imageCoordX = image.canvas.width - imageCoordX;
            let imageCoordY = (y - imgY) * scaleY;

            let lastImageCoordX = lastEraser.x !== null ? (lastEraser.x - imgX) * scaleX : null;
            if (image.flipped) lastImageCoordX = lastImageCoordX !== null ? image.canvas.width - lastImageCoordX : null;
            let lastImageCoordY = lastEraser.y !== null ? (lastEraser.y - imgY) * scaleY : null;

            const ctx = image.ctx;

            ctx.save();

            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = $eraserSize * scaleX; 
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();

            if (lastImageCoordX !== null && lastImageCoordY !== null) {
                ctx.moveTo(lastImageCoordX, lastImageCoordY);
                ctx.lineTo(imageCoordX, imageCoordY);
                ctx.stroke();
            } else {
                ctx.arc(imageCoordX, imageCoordY, ($eraserSize * scaleX) / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            lastEraser.x = x;
            lastEraser.y = y;
        } else {
            lastEraser.x = null;
            lastEraser.y = null;
        }

        // After modifying the canvas, update the imageData
        const updatedImageData = image.ctx.getImageData(0, 0, image.canvas.width, image.canvas.height);
        image.imageData = updatedImageData;

        images.update((imgs) => {
            const newImages = [...imgs];
            newImages[$selectedIndex as number] = image;
            return newImages;
        });
    }

    const isImageUrl = (url: string) => {
        return /\.(jpeg|jpg|gif|png|svg|webp)$/.test(url);
    }

    const exportImageAsDataURL = (image: Image): string => {
        return image.canvas.toDataURL('image/png');
    };

    const exportImageAsBlob = (image: Image): Promise<Blob | null> => {
        return new Promise((resolve) => {
            image.canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    };

    const downloadSelectedImage = () => {
        if ($selectedIndex === null) return;
        const image = $images[$selectedIndex];
        exportImageAsBlob(image).then((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'exported-image.png';
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    }

    const exportCanvasAsImage = () => {
        if (!canvas) {
            console.warn('Canvas element is not available.');
            return;
        }

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'novaboard.png';
                a.click();
                URL.revokeObjectURL(url);
            } else {
                console.error('Failed to export canvas as image.');
            }
        }, 'image/png');
    };

    const drawSelectionBorder = (image: Image, ctx: CanvasRenderingContext2D) => {
        ctx.save();
        const centerX = image.x + image.width / 2;
        const centerY = image.y + image.height / 2;
        ctx.translate(centerX, centerY);

        // Draw selection rectangle centered at (0, 0)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2 / $zoom;
        ctx.strokeRect(-image.width / 2 - 2, -image.height / 2 - 2, image.width + 4, image.height + 4);

        ctx.restore();
    };

    const draw = () => {
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.scale($zoom, $zoom);
        ctx.translate(-$camera.x, -$camera.y);

        // draw images
        $images.forEach(image => {
            if (!ctx) return;
            ctx.save();
            // ctx.translate(image.x, image.y);

            // Move to the center of the image
            const centerX = image.x + image.width / 2;
            const centerY = image.y + image.height / 2;
            ctx.translate(centerX, centerY);

            if (image.flipped) {
                ctx.scale(-1, 1);
                // ctx.translate(-image.width, 0);
            }

            // ctx.drawImage(image.canvas, 0, 0, image.width, image.height);
            // Draw the image centered at (0, 0)
            ctx.drawImage(image.canvas, -image.width / 2, -image.height / 2, image.width, image.height);

            ctx.restore();
        });

        if ($selectedIndex !== null) {
            const image = $images[$selectedIndex];
            drawSelectionBorder(image, ctx);
        }

        if ($imageControls.erase) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(
                (mouseX / $zoom + $camera.x),
                (mouseY / $zoom + $camera.y),
                $eraserSize / 2,
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
    class="relative bg-neutral-50 {$cursor}"
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

<!-- TODO: experiment with backgrounds -->
 <!-- style:--dot-size={$zoom <= 0.6 ? '1.6px' : $zoom >= 1.3 ? '0.8px' : `${1/$zoom}px`} -->

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
