// This file contains global type definitions used throughout the application

// Globálne rozšírenie React typov pre prácu s event parametrami a komponentmi Material UI

declare namespace React {
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  interface IntrinsicElements {
    // Pridať typovanie pre elementy, kde je potrebné
  }

  // Event typy
  interface SyntheticEvent<T = Element, E = Event> {
    bubbles: boolean;
    cancelable: boolean;
    currentTarget: T;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    nativeEvent: E;
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget & T;
    timeStamp: number;
    type: string;
  }

  interface MouseEvent<T = Element, E = MouseEvent> extends SyntheticEvent<T, E> {
    altKey: boolean;
    button: number;
    buttons: number;
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    metaKey: boolean;
    movementX: number;
    movementY: number;
    pageX: number;
    pageY: number;
    relatedTarget: EventTarget | null;
    screenX: number;
    screenY: number;
    shiftKey: boolean;
    preventDefault(): void;
    stopPropagation(): void;
  }

  interface KeyboardEvent<T = Element> extends SyntheticEvent<T, globalThis.KeyboardEvent> {
    altKey: boolean;
    charCode: number;
    ctrlKey: boolean;
    key: string;
    keyCode: number;
    locale: string;
    location: number;
    metaKey: boolean;
    repeat: boolean;
    shiftKey: boolean;
    which: number;
    preventDefault(): void;
    stopPropagation(): void;
  }

  interface ChangeEvent<T = Element> extends SyntheticEvent<T, globalThis.Event> {
    target: EventTarget & T;
    preventDefault(): void;
    stopPropagation(): void;
  }
}

// Ďalšie definície typov, ktoré môžu byť potrebné
interface CommonProps {
  children?: React.ReactNode;
}

// Rozšírené typy pre Material UI components
declare module '@mui/material' {
  export interface IconButtonProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  }

  export interface TablePaginationActionsProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
  }
}

// Generické typy pre rôzne event handlery
type MouseEventHandler<T = Element> = (event: React.MouseEvent<T>) => void;
type ChangeEventHandler<T = Element> = (event: React.ChangeEvent<T>) => void;
type KeyboardEventHandler<T = Element> = (event: React.KeyboardEvent<T>) => void;
type PageChangeEventHandler = (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
type RowsPerPageChangeEventHandler = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

export {}; 