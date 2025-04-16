import React, { useState } from 'react';
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
  CircularProgress,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function Login() {
  const { login } = useAuth();
  const { isDarkMode } = useThemeMode();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const auth = getAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Nastavte createdAt na aktuálny čas pri každom prihlásení
      await updateDoc(doc(db, 'users', user.uid), {
        createdAt: new Date().toISOString()
      });

      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Nesprávne prihlasovacie údaje');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

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
      <Box 
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.03,
          background: `radial-gradient(circle at 20% 30%, ${isDarkMode ? 'rgba(255, 159, 67, 0.8)' : 'rgba(255, 159, 67, 0.4)'} 0%, transparent 100px),
                      radial-gradient(circle at 80% 40%, ${isDarkMode ? 'rgba(48, 43, 99, 0.8)' : 'rgba(48, 43, 99, 0.4)'} 0%, transparent 200px)`,
          pointerEvents: 'none',
        }}
      />
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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