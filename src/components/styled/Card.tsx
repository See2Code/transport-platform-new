import { Card } from '@mui/material';
import styled from '@emotion/styled';

interface StyledCardProps {
  isDarkMode: boolean;
}

export const StyledCard = styled(Card)<StyledCardProps>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.23)'}`,
  boxShadow: isDarkMode 
    ? '0 4px 20px rgba(0, 0, 0, 0.25)'
    : '0 4px 20px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: isDarkMode 
      ? '0 8px 24px rgba(255, 159, 67, 0.3)'
      : '0 8px 24px rgba(0, 0, 0, 0.2)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 159, 67, 0.3)' : 'rgba(0, 0, 0, 0.4)'}`,
  },
  '@media (max-width: 600px)': {
    borderRadius: '16px',
  }
})); 