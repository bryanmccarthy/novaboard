export type Image = {
    src: string;
    img: HTMLImageElement;
    aspectRatio: number;
    imgCanvas: HTMLCanvasElement;
    x: number;
    y: number;
    width: number;
    height: number;
    flipped: boolean;
    mask: HTMLCanvasElement;
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