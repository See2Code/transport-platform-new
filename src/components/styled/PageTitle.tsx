import { Typography, Box } from '@mui/material';
import styled from '@emotion/styled';
import { colors } from '../../theme/colors';
import React from 'react';

interface PageTitleProps {
  isDarkMode: boolean;
  children: React.ReactNode;
}

// Wrapper box s :after pseudo-elementom
const TitleBox = styled(Box)({
  position: 'relative',
  marginBottom: '8px',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: colors.accent.main,
    borderRadius: '2px',
  }
});

// Exportujeme funkčný komponent namiesto styled komponentu s isDarkMode
export const PageTitle: React.FC<PageTitleProps> = ({ isDarkMode, children }) => {
  return (
    <TitleBox>
      <Typography 
        variant="h1" 
        sx={{ 
          fontSize: '1.75rem',
          fontWeight: 700,
          color: isDarkMode ? '#ffffff' : '#000000',
          '@media (max-width: 600px)': {
            fontSize: '1.5rem'
          }
        }}
      >
        {children}
      </Typography>
    </TitleBox>
  );
}; 