export type Image = {
    src: string;
    x: number;
    y: number;
    width: number;
    height: number;
};

export type State = {
    images: Image[];
    selectedIndex: number | null;
    isDragging: boolean;
    draggingOffset: { x: number; y: number };
};