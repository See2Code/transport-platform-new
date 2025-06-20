import { styled } from '@mui/material/styles';
import { Stepper, Card, Autocomplete, alpha } from '@mui/material';

// Custom styled components
export const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root .Mui-completed': {
    color: '#ff9f43',
  },
  '& .MuiStepLabel-root .Mui-active': {
    color: '#ff9f43',
  },
  '& .MuiStepLabel-label.Mui-active': {
    color: '#ff9f43',
    fontWeight: 600,
  },
  '& .MuiStepLabel-label.Mui-completed': {
    color: '#ff9f43',
    fontWeight: 500,
  },
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  },
  '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
    borderColor: '#ff9f43',
  },
  '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
    borderColor: '#ff9f43',
  },
}));

export const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 16,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 25px rgba(0, 0, 0, 0.3)'
      : '0 8px 25px rgba(0, 0, 0, 0.15)',
  }
}));

export const StyledAutocomplete = styled(Autocomplete)(() => ({
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ff9f43',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#ff9f43',
  },
}));

export const LocationCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha('#f8f9fa', 0.8),
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: alpha('#ff9f43', 0.5),
  }
})); 