import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useThemeMode } from '../../../contexts/ThemeContext';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
  icon?: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
  icon = '🗑️'
}) => {
  const { isDarkMode } = useThemeMode();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-description"
      PaperProps={{
        sx: {
          background: 'none',
          boxShadow: 'none',
          margin: { xs: '8px', sm: '16px' },
          borderRadius: '24px'
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }
      }}
    >
      <Box sx={{
        backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#000000',
        padding: '0px',
        borderRadius: '24px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: '400px',
        maxWidth: '500px'
      }}>
        <DialogTitle id="confirm-delete-title" 
          sx={{ 
            padding: '24px 24px 16px 24px',
            fontSize: '1.25rem',
            fontWeight: 600
          }}
        >
          {icon} {title}
        </DialogTitle>
        <DialogContent 
          data-delete-dialog="true"
          sx={{ 
            padding: '0 24px 16px 24px !important'
          }}>
          <Typography
            sx={{
              textAlign: 'left !important',
              display: 'block !important',
              lineHeight: 1.6,
              fontSize: '0.95rem',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              margin: '0 !important',
              paddingLeft: '0 !important',
              paddingRight: '0 !important',
              paddingTop: '0 !important',
              paddingBottom: '0 !important'
            }}
          >
            {message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          padding: '0 24px 20px 24px',
          justifyContent: 'space-between'
        }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            sx={{ 
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              color: isDarkMode ? '#ffffff' : '#000000',
              fontWeight: 600,
              borderRadius: '12px',
              paddingX: 3,
              paddingY: 1.2,
              '&:hover': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            Zrušiť
          </Button>
          <Button 
            onClick={onConfirm} 
            variant="contained"
            disabled={loading}
            autoFocus
            sx={{ 
              backgroundColor: '#f44336',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: '12px',
              paddingX: 3,
              paddingY: 1.2,
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Potvrdiť'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default DeleteConfirmDialog; 