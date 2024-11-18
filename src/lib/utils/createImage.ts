import { images } from '../store';
import type { Image } from '../types';

images.subscribe(value => value);

export const createNewImage = (src: string, x: number, y: number): void => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        console.log('Image loaded:', imageData);

        const newImage: Image = {
            src: src,
            img: img,
            imageData: imageData,
            canvas: canvas,
            ctx: ctx,
            aspectRatio: img.width / img.height,
            x: x,
            y: y,
            width: img.width > 1400 ? img.width / 4 : img.width > 1000 ? img.width / 2 : img.width,
            height: img.width > 1400 ? img.height / 4 : img.width > 1000 ? img.height / 2 : img.height,
            flipped: false,
        };

        images.update(value => [...value, newImage]);
    };
}