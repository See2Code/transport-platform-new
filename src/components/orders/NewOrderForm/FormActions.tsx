import React from 'react';
import { Box, Button, CircularProgress, useTheme } from '@mui/material';

interface FormActionsProps {
    isModal: boolean;
    isEdit: boolean;
    isSubmitting: boolean;
    onClose: (() => void) | undefined;
}

const FormActions: React.FC<FormActionsProps> = ({ isModal: _isModal, isEdit, isSubmitting, onClose }) => {
    const theme = useTheme();

    return (
        <Box sx={{ 
            p: 3, 
            borderTop: '1px solid', 
            borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)', 
            display: 'flex',
            justifyContent: 'flex-end',
        }}>
            <Button 
              onClick={onClose} 
              sx={{ 
                mr: 1,
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
              }}
            >
              Zrušiť
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={isSubmitting}
              sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43', 
                color: '#ffffff',
                '&:hover': { 
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.9)' : '#f7b067', 
                } 
              }}
            >
              {isSubmitting ? 
                <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 
                isEdit ? 'Uložiť zmeny' : 'Vytvoriť objednávku'
              }
            </Button>
        </Box>
    );
};

export default FormActions; 