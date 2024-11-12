export type Image = {
    src: string;
    img: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
};

export type Actions = {
    panning: boolean;
    dragging: boolean;
};

export type Controls = {
    drag: boolean;
    pan: boolean;
}