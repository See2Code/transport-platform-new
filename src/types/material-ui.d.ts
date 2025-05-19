import React from 'react';

// Rozšírenie Alert komponentu o podporu children
declare module '@mui/material/Alert' {
  interface AlertProps {
    children?: React.ReactNode;
  }
}

// Rozšírenie Dialog komponentu o BackdropProps
declare module '@mui/material/Dialog' {
  interface DialogProps {
    BackdropProps?: {
      sx?: any;
      [key: string]: any;
    };
  }
}

// Rozšírenie TextField komponentu o margin, onKeyPress, focused a fullWidth
declare module '@mui/material/TextField' {
  interface TextFieldProps {
    margin?: 'none' | 'dense' | 'normal';
    onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    focused?: boolean;
    fullWidth?: boolean;
    label?: React.ReactNode;
    value?: any;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }
}

// Rozšírenie pre OutlinedTextFieldProps, FilledTextFieldProps a StandardTextFieldProps
declare module '@mui/material' {
  interface OutlinedTextFieldProps {
    margin?: 'none' | 'dense' | 'normal';
    onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    focused?: boolean;
    fullWidth?: boolean;
    label?: React.ReactNode;
    value?: any;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }
  
  interface FilledTextFieldProps {
    margin?: 'none' | 'dense' | 'normal';
    onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    focused?: boolean;
    fullWidth?: boolean;
    label?: React.ReactNode;
    value?: any;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }
  
  interface StandardTextFieldProps {
    margin?: 'none' | 'dense' | 'normal';
    onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    focused?: boolean;
    fullWidth?: boolean;
    label?: React.ReactNode;
    value?: any;
    disabled?: boolean;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }
  
  // Rozšírenie pre TablePagination
  interface TablePaginationProps {
    onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
    onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  }
} 