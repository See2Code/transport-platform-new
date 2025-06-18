import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Box,
  Link,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Prosím zadajte svoj email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Konfigurácia action code settings pre správnu doménu
      const actionCodeSettings = {
        url: 'https://core.aesa.sk/login', // Presmeruje späť na login stránku
        handleCodeInApp: false
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      
      console.log('✅ Email na reset hesla bol úspešne odoslaný na:', email);
      setSuccess(true);
      
    } catch (err: any) {
      console.error('❌ Chyba pri odosielaní reset emailu:', err);
      
      let errorMessage = 'Nastala chyba pri odosielaní emailu';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Používateľ s týmto emailom neexistuje';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Neplatný formát emailu';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Príliš veľa pokusov. Skúste to neskôr';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (success) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8, position: 'relative' }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#4caf50' }}>
            Email bol odoslaný!
          </Typography>
          
          <Alert severity="success" sx={{ mb: 3 }}>
            Inštrukcie na obnovenie hesla boli odoslané na váš email <strong>{email}</strong>
          </Alert>
          
          <Typography variant="body1" align="center" sx={{ mb: 3 }}>
            Skontrolujte si svoju emailovú schránku a kliknite na odkaz pre obnovenie hesla.
          </Typography>

          <Typography variant="body2" align="center" sx={{ mb: 3, color: 'text.secondary' }}>
            Ak nevidíte email, skontrolujte si aj priečinok spam.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate('/login')}
                size="large"
              >
                Späť na prihlásenie
              </Button>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                  setError('');
                }}
                size="large"
              >
                Odoslať znovu
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h4" component="h1" gutterBottom align="center">
          Obnovenie hesla
        </Typography>
        
        <Typography variant="body1" gutterBottom align="center" sx={{ mb: 3 }}>
          Zadajte svoj email a my vám pošleme inštrukcie na obnovenie hesla.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
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
                error={!!error}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                disabled={loading}
              >
                {loading ? 'Odosielam...' : 'Odoslať inštrukcie'}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Link href="/login" color="primary">
                  Späť na prihlásenie
                </Link>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default ForgotPassword; 