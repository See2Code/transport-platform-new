import { styled, Paper, Box, Typography } from '@mui/material';

// Styled komponenty vyčlenené z Orders.tsx
export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.35)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
  '& .MuiTableCell-root, & .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiTab-root, & .MuiSelect-select, & .MuiMenuItem-root, & .MuiFormLabel-root, & input, & .MuiAutocomplete-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiOutlinedInput-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiAutocomplete-option': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),
    margin: 0,
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
    width: '100vw',
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    '&:hover': {
      transform: 'translateX(-50%)',
    }
  }
}));

export const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: 0,
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

export const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(4),
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1.5)
  }
}));

export const PageTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
  }
}));

export const PageDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#000000',
  marginTop: theme.spacing(3)
})); 