import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Grid,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';

function Login() {
  const { login, loading: authLoading, currentUser } = useAuth();
  const { isDarkMode } = useThemeMode();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatické presmerovanie prihlásených používateľov
  useEffect(() => {
    if (currentUser && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      
      // NENAVIGUJEME - necháme AuthContext, aby sa postaral o presmerovanie
      // Keď sa currentUser nastaví, PrivateRoute automaticky presmeruje
      // Loading screen zostane aktívny až kým AuthContext nezíska user data
      
    } catch (error: any) {
      // Spracovanie rôznych typov Firebase chýb s používateľsky prívetivými správami
      let errorMessage = 'Zadali ste nesprávny email alebo heslo';
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Zadali ste nesprávny email alebo heslo';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Používateľ s týmto emailom neexistuje';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Zadali ste nesprávne heslo';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Neplatný formát emailu';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Tento účet bol zablokovaný';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Príliš veľa neúspešných pokusov. Skúste to znova neskôr';
      } else if (error.message && error.message.includes('Používateľ neexistuje v systéme')) {
        errorMessage = 'Používateľ neexistuje v systéme';
      }
      
      setError(errorMessage);
      setLoading(false); // Reset loading iba pri chybe
    }
    // Loading zostane true - AuthContext sa postará o presmerovanie po načítaní user data
  };

  const handleClose = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' 
            : 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}
      >
        <CircularProgress size={60} sx={{ color: '#ff9f43', mb: 3 }} />
        <Typography 
          variant="h6" 
          sx={{ 
            color: isDarkMode ? '#ffffff' : '#333333',
            fontWeight: 500 
          }}
        >
          Prihlasovanie...
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            mt: 1
          }}
        >
          Overujeme vaše údaje
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' 
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
        color: isDarkMode ? '#ffffff' : '#333333',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundAttachment: 'fixed',
        '& > *': {
          position: 'relative',
          zIndex: 1,
        }
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            position: 'relative',
            background: isDarkMode 
              ? 'rgba(28, 28, 45, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            boxShadow: isDarkMode
              ? '0 10px 30px rgba(0, 0, 0, 0.3)'
              : '0 10px 30px rgba(0, 0, 0, 0.08)',
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: isDarkMode ? '#ffffff' : '#333333' }}>
            Prihlásenie
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleLogin}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null); // Reset error pri zmene emailu
                  }}
                  required
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff9f43',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#ff9f43',
                    },
                    '& .MuiInputBase-input': {
                      color: isDarkMode ? '#ffffff' : '#000000',
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Heslo"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null); // Reset error pri zmene hesla
                  }}
                  required
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff9f43',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#ff9f43',
                    },
                    '& .MuiInputBase-input': {
                      color: isDarkMode ? '#ffffff' : '#000000',
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(45deg, #ff9f43 0%, #ffbe76 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #f39839 0%, #f2b56e 100%)',
                    },
                    padding: '12px',
                    borderRadius: '12px',
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Prihlásiť sa'}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'}>
                    Nemáte účet?{' '}
                    <Link href="/register" sx={{ 
                      color: '#ff9f43',
                      '&:hover': {
                        color: '#ffbe76'
                      }
                    }}>
                      Zaregistrujte sa
                    </Link>
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'}>
                    <Link href="/forgot-password" sx={{ 
                      color: '#ff9f43',
                      '&:hover': {
                        color: '#ffbe76'
                      }
                    }}>
                      Zabudli ste heslo?
                    </Link>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login; 