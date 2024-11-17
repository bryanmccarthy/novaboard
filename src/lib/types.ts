export type Image = {
    src: string;
    img: HTMLImageElement;
    imageData: ImageData;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    aspectRatio: number;
    x: number;
    y: number;
    width: number;
    height: number;
    flipped: boolean;
};

export type Actions = {
    panning: boolean;
    dragging: boolean;
    resizing: boolean;
    erasing: boolean;
};

// toggable controls
export type Controls = {
    drag: boolean;
    pan: boolean;
}

export type ImageControls = {
    rotate: boolean;
    erase: boolean;
}