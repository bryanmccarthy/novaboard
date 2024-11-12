export type Image = {
    src: string;
    img: HTMLImageElement;
    x: number;
    y: number;
    width: number;
    height: number;
};

export type CanvasState = {
    images: Image[];
    selectedIndex: number | null;
    cursor: string;
    panToggle: boolean;
    isPanning: boolean;
    isDragging: boolean;
    draggingOffset: { x: number; y: number };
};