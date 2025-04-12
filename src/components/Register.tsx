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
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useThemeMode } from '../contexts/ThemeContext';

interface Country {
  code: string;
  name: string;
  prefix: string;
}

const countries: Country[] = [
  { code: 'sk', name: 'Slovensko', prefix: '+421' },
  { code: 'cz', name: 'Česko', prefix: '+420' },
  { code: 'hu', name: 'Maďarsko', prefix: '+36' },
  { code: 'pl', name: 'Poľsko', prefix: '+48' },
  { code: 'at', name: 'Rakúsko', prefix: '+43' },
  { code: 'de', name: 'Nemecko', prefix: '+49' },
  { code: 'fr', name: 'Francúzsko', prefix: '+33' },
  { code: 'it', name: 'Taliansko', prefix: '+39' },
  { code: 'es', name: 'Španielsko', prefix: '+34' },
  { code: 'pt', name: 'Portugalsko', prefix: '+351' },
  { code: 'nl', name: 'Holandsko', prefix: '+31' },
  { code: 'be', name: 'Belgicko', prefix: '+32' },
  { code: 'dk', name: 'Dánsko', prefix: '+45' },
  { code: 'se', name: 'Švédsko', prefix: '+46' },
  { code: 'fi', name: 'Fínsko', prefix: '+358' },
  { code: 'ie', name: 'Írsko', prefix: '+353' },
  { code: 'gr', name: 'Grécko', prefix: '+30' },
  { code: 'ro', name: 'Rumunsko', prefix: '+40' },
  { code: 'bg', name: 'Bulharsko', prefix: '+359' },
  { code: 'hr', name: 'Chorvátsko', prefix: '+385' },
  { code: 'si', name: 'Slovinsko', prefix: '+386' },
  { code: 'ee', name: 'Estónsko', prefix: '+372' },
  { code: 'lv', name: 'Lotyšsko', prefix: '+371' },
  { code: 'lt', name: 'Litva', prefix: '+370' },
  { code: 'cy', name: 'Cyprus', prefix: '+357' },
  { code: 'mt', name: 'Malta', prefix: '+356' },
  { code: 'lu', name: 'Luxembursko', prefix: '+352' },
  { code: 'gb', name: 'Veľká Británia', prefix: '+44' },
  { code: 'ch', name: 'Švajčiarsko', prefix: '+41' },
  { code: 'no', name: 'Nórsko', prefix: '+47' },
  { code: 'ua', name: 'Ukrajina', prefix: '+380' },
  { code: 'rs', name: 'Srbsko', prefix: '+381' },
  { code: 'tr', name: 'Turecko', prefix: '+90' }
];

function generateCompanyID(companyName: string): string {
  // Vytvoríme základný identifikátor z názvu firmy
  const base = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  
  // Pridáme náhodné číslo
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Pridáme timestamp
  const timestamp = Date.now().toString().slice(-4);
  
  return `${base}-${random}-${timestamp}`;
}

function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phonePrefix: '+421',
    phoneNumber: '',
    countryCode: 'sk',
    password: '',
    confirmPassword: '',
    companyName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'SK',
    ico: '',
    icDph: '',
    companyID: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountryChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    const country = countries.find(c => c.code === value);
    if (country) {
      setFormData(prev => ({
        ...prev,
        countryCode: value,
        phonePrefix: country.prefix
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Heslá sa nezhodujú');
      return;
    }

    if (formData.password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const companyID = generateCompanyID(formData.companyName);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phonePrefix: formData.phonePrefix,
        phoneNumber: formData.phoneNumber,
        countryCode: formData.countryCode,
        companyID,
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      await setDoc(doc(db, 'companies', companyID), {
        companyName: formData.companyName,
        street: formData.street,
        zipCode: formData.zipCode,
        city: formData.city,
        country: formData.country,
        ico: formData.ico,
        icDph: formData.icDph,
        createdAt: new Date().toISOString()
      });

      setFormData(prev => ({
        ...prev,
        companyID
      }));
      setRegistrationSuccess(true);
    } catch (err: any) {
      console.error('Chyba pri registrácii:', err);
      setError(err.message || 'Nastala chyba pri registrácii');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (registrationSuccess) {
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

            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#ff9f43' }}>
              Registrácia úspešná!
            </Typography>

            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-icon': {
                  color: '#ff9f43'
                },
                '& .MuiAlert-message': {
                  color: '#ff9f43'
                },
                backgroundColor: 'rgba(255, 159, 67, 0.1)',
              }}
            >
              Vaša firma bola úspešne zaregistrovaná.
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ color: isDarkMode ? '#ffffff' : '#333333' }}>
              Váš Company ID:
            </Typography>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                mb: 3, 
                backgroundColor: '#ff9f43',
                color: 'white',
                textAlign: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                wordBreak: 'break-all'
              }}
            >
              {formData.companyID}
            </Paper>

            <Typography variant="body1" gutterBottom color="warning.main" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
              Prosím, uložte si tento Company ID. Budete ho potrebovať pre:
            </Typography>
            <Box component="ul" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
              <li>Správu zamestnancov</li>
              <li>Pridávanie nových členov tímu</li>
              <li>Administráciu vašej firmy</li>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ 
                mt: 3,
                background: 'linear-gradient(45deg, #ff9f43 0%, #ffbe76 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #f39839 0%, #f2b56e 100%)',
                },
                padding: '12px',
                borderRadius: '12px',
              }}
            >
              Prihlásiť sa
            </Button>
          </Paper>
        </Container>
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
        padding: '40px 0',
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
            Registrácia novej firmy
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="Meno"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  required
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
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="Priezvisko"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  required
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
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
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
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Select
                    value={formData.countryCode}
                    onChange={handleCountryChange}
                    sx={{ width: '200px' }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/${country.code}.svg`}
                            alt={country.name}
                          />
                          <span>{country.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  <TextField
                    name="phoneNumber"
                    label={`Mobil (${formData.phonePrefix})`}
                    placeholder="910 XXX XXX"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    fullWidth
                    required
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
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="password"
                  label="Heslo"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
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
                  name="confirmPassword"
                  label="Potvrdiť heslo"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                  required
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
                <Divider sx={{ my: 2 }}>Údaje o firme</Divider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="companyName"
                  label="Názov firmy"
                  value={formData.companyName}
                  onChange={handleChange}
                  fullWidth
                  required
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
                  name="street"
                  label="Ulica"
                  value={formData.street}
                  onChange={handleChange}
                  fullWidth
                  required
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
              <Grid item xs={12} sm={6}>
                <TextField
                  name="zipCode"
                  label="PSČ"
                  value={formData.zipCode}
                  onChange={handleChange}
                  fullWidth
                  required
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
              <Grid item xs={12} sm={6}>
                <TextField
                  name="city"
                  label="Mesto"
                  value={formData.city}
                  onChange={handleChange}
                  fullWidth
                  required
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
                <FormControl fullWidth>
                  <InputLabel>Krajina</InputLabel>
                  <Select
                    name="country"
                    value={formData.country}
                    onChange={handleSelectChange}
                    label="Krajina"
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code.toUpperCase()}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="ico"
                  label="IČO"
                  value={formData.ico}
                  onChange={handleChange}
                  fullWidth
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
              <Grid item xs={12} sm={6}>
                <TextField
                  name="icDph"
                  label="IČ DPH"
                  value={formData.icDph}
                  onChange={handleChange}
                  fullWidth
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
                  {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Registrovať'}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Link href="/login" variant="body2" sx={{ 
                  display: 'block', 
                  textAlign: 'center',
                  color: '#ff9f43',
                  '&:hover': {
                    color: '#ffbe76'
                  }
                }}>
                  Máte už účet? Prihláste sa
                </Link>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Register; 