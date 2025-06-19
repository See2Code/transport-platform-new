import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { useThemeMode } from '../../../contexts/ThemeContext';

interface PdfLoadingDialogProps {
  open: boolean;
  message: string;
}

const PdfLoadingDialog: React.FC<PdfLoadingDialogProps> = ({
  open,
  message
}) => {
  const { isDarkMode } = useThemeMode();

  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: { 
          background: 'none', 
          boxShadow: 'none', 
          margin: { xs: '8px', sm: '16px' }, 
          borderRadius: '24px',
          minWidth: '320px'
        }
      }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.6)' }
      }}
    >
      <Box
        sx={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(28, 28, 45, 0.95) 0%, rgba(42, 42, 75, 0.95) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          padding: '32px',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px'
        }}
      >
        <CircularProgress 
          size={48} 
          sx={{ 
            color: '#ff9f43',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: isDarkMode ? '#ffffff' : '#000000',
            fontWeight: 600,
            fontSize: '1.1rem'
          }}
        >
          {message}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            fontSize: '0.9rem'
          }}
        >
          Prosím čakajte, generujeme váš dokument...
        </Typography>
      </Box>
    </Dialog>
  );
};

export default PdfLoadingDialog; 