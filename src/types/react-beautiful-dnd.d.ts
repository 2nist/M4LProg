declare module "@hello-pangea/dnd" {
  import { ReactElement, HTMLProps } from "react";

  export interface DraggableLocation {
    droppableId: string;
    index: number;
  }

  export interface DropResult {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    reason: "DROP" | "CANCEL";
    mode: "FLUID" | "SNAP";
    destination?: DraggableLocation;
    combine?: {
      draggableId: string;
      droppableId: string;
    };
  }

  export interface DragStart {
    draggableId: string;
    type: string;
    source: DraggableLocation;
    mode: "FLUID" | "SNAP";
  }

  export interface BeforeCapture {
    draggableId: string;
    mode: "FLUID" | "SNAP";
  }

  export interface DragUpdate extends DragStart {
    destination?: DraggableLocation;
    combine?: {
      draggableId: string;
      droppableId: string;
    };
  }

  export interface DragDropContextProps {
    onBeforeCapture?(before: BeforeCapture): void;
    onBeforeDragStart?(initial: DragStart): void;
    onDragStart?(initial: DragStart): void;
    onDragUpdate?(update: DragUpdate): void;
    onDragEnd(result: DropResult): void;
    children?: React.ReactNode;
  }

  export const DragDropContext: React.FC<DragDropContextProps>;

  export interface DroppableProvided {
    innerRef: (element?: HTMLElement | null) => void;
    droppableProps: HTMLProps<HTMLElement>;
    placeholder?: ReactElement | null;
  }

  export interface DroppableStateSnapshot {
    isDraggingOver: boolean;
    draggingOverWith?: string;
    draggingFromThisWith?: string;
    isUsingPlaceholder: boolean;
  }

  export interface DroppableProps {
    droppableId: string;
    type?: string;
    mode?: "standard" | "virtual";
    isDropDisabled?: boolean;
    isCombineEnabled?: boolean;
    direction?: "horizontal" | "vertical";
    ignoreContainerClipping?: boolean;
    renderClone?: (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
      rubric: any,
    ) => ReactElement;
    getContainerForClone?: () => HTMLElement;
    children: (
      provided: DroppableProvided,
      snapshot: DroppableStateSnapshot,
    ) => ReactElement;
  }

  export const Droppable: React.FC<DroppableProps>;

  export interface DraggableProvided {
    innerRef: (element?: HTMLElement | null) => void;
    draggableProps: HTMLProps<HTMLElement>;
    dragHandleProps?: HTMLProps<HTMLElement> | null;
  }

  export interface DraggableStateSnapshot {
    isDragging: boolean;
    isDropAnimating: boolean;
    isClone: boolean;
    dropAnimation?: {
      duration: number;
      curve: string;
      moveTo: { x: number; y: number };
      opacity?: number;
      scale?: number;
    };
    draggingOver?: string;
    combineWith?: string;
    combineTargetFor?: string;
    mode?: "FLUID" | "SNAP";
  }

  export interface DraggableProps {
    draggableId: string;
    index: number;
    isDragDisabled?: boolean;
    disableInteractiveElementBlocking?: boolean;
    shouldRespectForcePress?: boolean;
    children: (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
    ) => ReactElement;
  }

  export const Draggable: React.FC<DraggableProps>;

  export function resetServerContext(): void;
}
