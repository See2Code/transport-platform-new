// Rozšírenie typov Material UI komponentov pre aplikačné komponenty
import React from 'react';

// Rozšírenie DialogProps
interface EnhancedDialogProps {
  BackdropProps?: {
    sx?: any;
    [key: string]: any;
  };
  PaperProps?: {
    sx?: any;
    [key: string]: any;
  };
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

// Rozšírenie TextFieldProps
interface EnhancedTextFieldProps {
  margin?: 'none' | 'dense' | 'normal';
  onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
  focused?: boolean;
}

// Rozšírenie AlertProps
interface EnhancedAlertProps {
  children?: React.ReactNode;
  severity?: 'error' | 'info' | 'success' | 'warning';
  onClose?: () => void;
  sx?: Record<string, any>;
  variant?: 'standard' | 'outlined' | 'filled';
}

// Rozšírenie typov pre TablePagination
interface EnhancedTablePaginationProps {
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

declare module '@mui/material' {
  export interface DialogProps extends EnhancedDialogProps {}
  export interface TextFieldProps extends EnhancedTextFieldProps {}
  export interface AlertProps extends EnhancedAlertProps {}
  export interface TablePaginationProps extends EnhancedTablePaginationProps {}
}

export {}; 