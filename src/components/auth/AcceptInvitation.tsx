import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';

interface Invitation {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  status: string;
  companyID: string;
  invitedBy: string;
  invitedAt: string;
  createdAt?: Date;
}

const AcceptInvitation: React.FC = () => {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadInvitation = async () => {
      if (!invitationId) {
        setError('Chýbajúce ID pozvánky.');
        setLoading(false);
        return;
      }

      try {
        console.log('Načítavam pozvánku s ID:', invitationId);
        const invitationRef = doc(db, 'invitations', invitationId);
        const invitationDoc = await getDoc(invitationRef);
        
        if (!invitationDoc.exists()) {
          console.error('Pozvánka neexistuje:', invitationId);
          setError('Pozvánka nebola nájdená.');
          return;
        }

        const invitationData = invitationDoc.data();
        console.log('Načítané dáta pozvánky:', invitationData);

        if (invitationData.status !== 'pending') {
          console.error('Pozvánka už nie je aktívna:', invitationData.status);
          setError('Pozvánka už nie je aktívna.');
          return;
        }

        if (!invitationData.companyID) {
          console.error('Pozvánka nemá nastavené companyID:', invitationData);
          setError('Chýbajúce údaje pozvánky.');
          return;
        }

        setInvitation({
          id: invitationDoc.id,
          email: invitationData.email,
          firstName: invitationData.firstName,
          lastName: invitationData.lastName,
          phone: invitationData.phone,
          role: invitationData.role,
          status: invitationData.status,
          companyID: invitationData.companyID,
          invitedBy: invitationData.invitedBy,
          invitedAt: invitationData.invitedAt,
          createdAt: invitationData.createdAt?.toDate?.() || new Date()
        });
        setLoading(false);
      } catch (err: any) {
        console.error('Chyba pri načítaní pozvánky:', err);
        console.error('Detaily chyby:', {
          code: err.code,
          message: err.message,
          stack: err.stack
        });
        setError('Nepodarilo sa načítať pozvánku. Prosím skúste to znova.');
        setLoading(false);
      }
    };

    loadInvitation();
  }, [invitationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú!');
      return;
    }

    if (!invitation) {
      setError('Chýbajúce údaje pozvánky.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Vytvorenie používateľa v Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        password
      );

      // Vytvorenie používateľa v kolekcii users
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        companyID: invitation.companyID,
        role: invitation.role,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      // Aktualizácia stavu pozvánky
      await updateDoc(doc(db, 'invitations', invitationId!), {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        userId: userCredential.user.uid
      });

      // Presmerovanie na dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Chyba pri registrácii:', err);
      setError(err.message || 'Nepodarilo sa dokončiť registráciu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Paper elevation={3} sx={{ p: 4, width: '100%', bgcolor: '#333', color: '#ffffff' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#ffffff' }}>
            Dokončenie registrácie
          </Typography>
          
          <Typography variant="body1" gutterBottom sx={{ color: '#ffffff' }}>
            Vitajte {invitation?.firstName} {invitation?.lastName}!
          </Typography>
          
          <Typography variant="body2" gutterBottom sx={{ color: '#ffffff' }}>
            Pre dokončenie registrácie prosím nastavte svoje heslo.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Heslo"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputLabelProps={{
                style: { color: '#ffffff' },
              }}
              InputProps={{
                style: { color: '#ffffff' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffffff',
                  },
                },
              }}
            />
            
            <TextField
              fullWidth
              label="Potvrdenie hesla"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              InputLabelProps={{
                style: { color: '#ffffff' },
              }}
              InputProps={{
                style: { color: '#ffffff' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffffff',
                  },
                },
              }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              sx={{ mt: 3, color: '#ffffff' }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Dokončiť registráciu'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AcceptInvitation; 