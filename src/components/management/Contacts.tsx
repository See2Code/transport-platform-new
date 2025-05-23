import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Grid,
  DialogContentText,
  InputAdornment,
  SelectChangeEvent} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { collection, addDoc, query, deleteDoc, doc, updateDoc, Timestamp, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import styled from '@emotion/styled';
import SearchField from '../common/SearchField';
import { useMediaQuery } from '@mui/material';
import { Phone as PhoneIcon, Email as EmailIcon, Person as PersonIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import {
  PageWrapper,
  PageHeader,
  PageTitle,
  AddButton,
  SearchWrapper
} from '../styled';
import { Contact, ContactFormData, SnackbarState } from '../../types/contact';

const colors = {
  primary: {
    main: '#1a1a2e',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  background: {
    main: 'rgba(28, 28, 45, 0.95)',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    disabled: 'rgba(255, 255, 255, 0.7)',
  },
  secondary: {
    main: '#ff6b6b',
    light: '#ff8787',
    dark: '#fa5252',
  },
  accent: {
    main: '#ff9f43',
    light: '#ffbe76',
    dark: '#f7b067',
  }
};

const MobileContactCard = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: '16px',
  width: '100%'
}));

const MobileContactHeader = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileContactName = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? colors.accent.main : '#000000'
}));

const MobileContactInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& > *': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
}));

const MobileContactDetail = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: colors.accent.main
  }
}));

const MobileContactRole = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    color: colors.accent.main
  }
}));

const MobileContactActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '12px',
});

const StyledTableRow = styled(TableRow)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  '& .MuiTableCell-root': {
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  }
}));

const StyledDialogContent = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '24px',
  borderRadius: '24px',
  backdropFilter: 'blur(20px)',
  boxShadow: 'none',
  maxHeight: '90vh',
  overflowY: 'auto',
  margin: 0,
  '@media (max-width: 600px)': {
    padding: '16px',
    margin: 0,
    maxHeight: '95vh',
  },
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '24px',
    border: 'none',
    outline: 'none'
  },
  '& .MuiBox-root': {
    borderRadius: '24px',
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    backgroundColor: 'transparent',
    borderRadius: '24px 24px 0 0',
    border: 'none',
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiTypography-root': {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (max-width: 600px)': {
        fontSize: '1.25rem',
      }
    }
  },
  '& .MuiDialogContent-root': {
    padding: '16px 24px',
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiFormLabel-root': {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    },
    '& .MuiInputBase-root': {
      color: isDarkMode ? '#ffffff' : '#000000',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? 'rgba(255, 159, 67, 0.5)' : 'rgba(255, 159, 67, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.accent.main,
      }
    },
    '& .MuiInputBase-input': {
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    '& .MuiSelect-select': {
      color: isDarkMode ? '#ffffff' : '#000000',
    }
  }
}));

const countriesWithFlags = [
  { code: 'SK', name: 'Slovensko', prefix: '+421' },
  { code: 'CZ', name: 'Česko', prefix: '+420' },
  { code: 'HU', name: 'Maďarsko', prefix: '+36' },
  { code: 'PL', name: 'Poľsko', prefix: '+48' },
  { code: 'AT', name: 'Rakúsko', prefix: '+43' },
  { code: 'DE', name: 'Nemecko', prefix: '+49' },
  { code: 'FR', name: 'Francúzsko', prefix: '+33' },
  { code: 'IT', name: 'Taliansko', prefix: '+39' },
  { code: 'ES', name: 'Španielsko', prefix: '+34' },
  { code: 'PT', name: 'Portugalsko', prefix: '+351' },
  { code: 'NL', name: 'Holandsko', prefix: '+31' },
  { code: 'BE', name: 'Belgicko', prefix: '+32' },
  { code: 'DK', name: 'Dánsko', prefix: '+45' },
  { code: 'SE', name: 'Švédsko', prefix: '+46' },
  { code: 'FI', name: 'Fínsko', prefix: '+358' },
  { code: 'IE', name: 'Írsko', prefix: '+353' },
  { code: 'GR', name: 'Grécko', prefix: '+30' },
  { code: 'RO', name: 'Rumunsko', prefix: '+40' },
  { code: 'BG', name: 'Bulharsko', prefix: '+359' },
  { code: 'HR', name: 'Chorvátsko', prefix: '+385' },
  { code: 'SI', name: 'Slovinsko', prefix: '+386' },
  { code: 'EE', name: 'Estónsko', prefix: '+372' },
  { code: 'LV', name: 'Lotyšsko', prefix: '+371' },
  { code: 'LT', name: 'Litva', prefix: '+370' },
  { code: 'CY', name: 'Cyprus', prefix: '+357' },
  { code: 'MT', name: 'Malta', prefix: '+356' },
  { code: 'LU', name: 'Luxembursko', prefix: '+352' },
  { code: 'GB', name: 'Veľká Británia', prefix: '+44' },
  { code: 'CH', name: 'Švajčiarsko', prefix: '+41' },
  { code: 'NO', name: 'Nórsko', prefix: '+47' },
  { code: 'UA', name: 'Ukrajina', prefix: '+380' },
  { code: 'RS', name: 'Srbsko', prefix: '+381' },
  { code: 'TR', name: 'Turecko', prefix: '+90' }
];

const Contacts = () => {
  const { userData } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const { isDarkMode } = useThemeMode();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phonePrefix: '+421',
    countryCode: 'SK',
    companyName: '',
    position: '',
    note: '',
    creatorId: currentUser?.uid || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  const fetchContacts = useCallback(() => {
    if (!userData?.companyID) {
      console.log('Contacts: Chýba companyID');
      setContacts([]);
      return () => {}; // Return empty cleanup function
    }

    setLoading(true);
    try {
      const contactsCollection = collection(db, 'contacts');
      const contactsQuery = query(
        contactsCollection, 
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      
      // Používame onSnapshot namiesto getDocs pre real-time aktualizácie
      const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
        console.log('🔄 Real-time aktualizácia kontaktov - počet dokumentov:', snapshot.docs.length);
        console.log('Contacts: CompanyID používateľa:', userData.companyID);
        
        const contactsData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Contacts: Spracovávam dokument:', {
            id: doc.id,
            companyID: data.companyID,
            firstName: data.firstName,
            lastName: data.lastName
          });
          
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt))
          };
        }) as Contact[];
        
        setContacts(contactsData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching contacts:', error);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Nastala chyba pri načítaní kontaktov',
          severity: 'error'
        });
      });
      
      return unsubscribe; // Return cleanup function
    } catch (error) {
      console.error('Error setting up contacts listener:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri načítaní kontaktov',
        severity: 'error'
      });
      return () => {}; // Return empty cleanup function
    }
  }, [userData?.companyID, setContacts, setLoading, setSnackbar]);

  useEffect(() => {
    // Nastavíme real-time listener
    const unsubscribe = fetchContacts();
    
    // Cleanup funkcia pre real-time listener
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [fetchContacts]);

  useEffect(() => {
    if (userData && !editingContact) {
      setFormData(prev => ({
        ...prev,
        createdBy: {
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        }
      }));
    }
  }, [userData, editingContact]);

  const handleCountryChange = (e: SelectChangeEvent) => {
    const countryCode = e.target.value;
    const selectedCountry = countriesWithFlags.find(c => c.code === countryCode);
    if (selectedCountry) {
      setFormData({
        ...formData,
        countryCode,
        phonePrefix: selectedCountry.prefix
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const contactsRef = collection(db, 'contacts');
      
      const contactData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.companyName,
        phoneNumber: formData.phone,
        countryCode: formData.countryCode,
        email: formData.email,
        notes: formData.note,
        position: formData.position,
        createdAt: formData.createdAt,
        updatedAt: formData.updatedAt,
        createdBy: {
          id: formData.creatorId,
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || ''
        }
      };

      if (editingContact) {
        await updateDoc(doc(db, 'contacts', editingContact.id), contactData);
        setSnackbar({
          open: true,
          message: 'Kontakt bol úspešne aktualizovaný',
          severity: 'success'
        });
      } else {
        await addDoc(contactsRef, contactData);
        setSnackbar({
          open: true,
          message: 'Kontakt bol úspešne pridaný',
          severity: 'success'
        });
      }

      setOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        phonePrefix: '+421',
        countryCode: 'SK',
        companyName: '',
        position: '',
        note: '',
        creatorId: currentUser?.uid || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Chyba pri ukladaní kontaktu:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri ukladaní kontaktu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete || loading) return;
    
    try {
      setLoading(true);
      const contactRef = doc(db, 'contacts', contactToDelete.id);
      await deleteDoc(contactRef);
      setSnackbar({
        open: true,
        message: 'Kontakt bol úspešne odstránený',
        severity: 'success'
      });
    } catch (error) {
      console.error('Chyba pri mazaní kontaktu:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri mazaní kontaktu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setContactToDelete(null);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phoneNumber,
      phonePrefix: contact.phonePrefix,
      countryCode: contact.countryCode,
      companyName: contact.company,
      position: contact.notes || '',
      note: contact.notes || '',
      creatorId: contact.createdBy?.id || '',
      createdAt: contact.createdAt,
      updatedAt: Timestamp.now()
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingContact(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phonePrefix: '+421',
      countryCode: 'SK',
      companyName: '',
      position: '',
      note: '',
      creatorId: currentUser?.uid || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  };

  const filteredContacts = contacts.filter(contact =>
    Object.values(contact)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const renderMobileContact = (contact: Contact) => (
    <MobileContactCard key={contact.id} isDarkMode={isDarkMode}>
      <MobileContactHeader isDarkMode={isDarkMode}>
        <Box>
          <MobileContactName isDarkMode={isDarkMode}>{contact.company}</MobileContactName>
          <Typography variant="body2" sx={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' 
          }}>
            {contact.firstName} {contact.lastName}
          </Typography>
        </Box>
      </MobileContactHeader>

      <MobileContactInfo isDarkMode={isDarkMode}>
        <MobileContactDetail isDarkMode={isDarkMode}>
          <PhoneIcon />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img
              loading="lazy"
              width="20"
              src={`https://flagcdn.com/${contact.countryCode}.svg`}
              alt=""
            />
            <Typography variant="body2" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
              {contact.phonePrefix} {contact.phoneNumber}
            </Typography>
          </Box>
        </MobileContactDetail>

        <MobileContactDetail isDarkMode={isDarkMode}>
          <EmailIcon />
          <Typography variant="body2" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
            {contact.email}
          </Typography>
        </MobileContactDetail>

        {contact.notes && (
          <MobileContactDetail isDarkMode={isDarkMode}>
            <Box sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)', 
              fontSize: '0.85rem' 
            }}>
              {contact.notes}
            </Box>
          </MobileContactDetail>
        )}

        {contact.createdBy && (
          <MobileContactDetail isDarkMode={isDarkMode}>
            <PersonIcon />
            <MobileContactRole isDarkMode={isDarkMode}>
              {contact.createdBy.firstName} {contact.createdBy.lastName}
            </MobileContactRole>
          </MobileContactDetail>
        )}

        <MobileContactDetail isDarkMode={isDarkMode}>
          <AccessTimeIcon />
          <Typography variant="body2" sx={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' 
          }}>
            {contact.createdAt?.toDate().toLocaleString('sk-SK', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </MobileContactDetail>
      </MobileContactInfo>

      <MobileContactActions>
        <IconButton 
          onClick={() => handleEdit(contact)}
          sx={{ 
            color: colors.accent.main,
            backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(255, 159, 67, 0.05)',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.2)' : 'rgba(255, 159, 67, 0.1)'
            }
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          onClick={() => contact.id && handleDelete(contact)} 
          sx={{ 
            color: colors.secondary.main,
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 107, 107, 0.05)'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </MobileContactActions>
    </MobileContactCard>
  );

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Kontakty</PageTitle>
        <AddButton
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Pridať kontakt
        </AddButton>
      </PageHeader>

      <SearchWrapper>
        <SearchField
          placeholder="Vyhľadať kontakt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchWrapper>

      {useMediaQuery('(max-width: 600px)') ? (
        <Box>
          {filteredContacts.map(contact => renderMobileContact(contact))}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          borderRadius: '20px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Spoločnosť</TableCell>
                <TableCell>Kontaktná osoba</TableCell>
                <TableCell>Mobil</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Vytvoril</TableCell>
                <TableCell>Dátum vytvorenia</TableCell>
                <TableCell>Poznámka</TableCell>
                <TableCell>Akcie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContacts.map((contact) => (
                <StyledTableRow isDarkMode={isDarkMode} key={contact.id}>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>{contact.firstName} {contact.lastName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img
                        loading="lazy"
                        width="20"
                        src={`https://flagcdn.com/${contact.countryCode}.svg`}
                        alt=""
                      />
                      {contact.phonePrefix} {contact.phoneNumber}
                    </Box>
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.createdBy?.firstName} {contact.createdBy?.lastName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {contact.createdAt?.toDate().toLocaleString('sk-SK', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell sx={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {contact.notes || ''}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        onClick={() => handleEdit(contact)} 
                        sx={{ 
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => contact.id && handleDelete(contact)} 
                        sx={{ 
                          color: colors.secondary.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle sx={{ 
            color: isDarkMode ? '#ffffff' : '#000000',
            fontSize: '1.5rem',
            fontWeight: 600,
            padding: '24px 24px 16px 24px'
          }}>
            {editingContact ? 'Upraviť kontakt' : 'Pridať nový kontakt'}
          </DialogTitle>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Spoločnosť"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Krajina</InputLabel>
                <Select
                  value={formData.countryCode}
                  onChange={handleCountryChange}
                  label="Krajina"
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#ffffff' : '#000000',
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        '& .MuiMenuItem-root': {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          '&:hover': {
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                          }
                        }
                      }
                    }
                  }}
                >
                  {countriesWithFlags.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img 
                          loading="lazy" 
                          width="20" 
                          height="15"
                          src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} 
                          alt={`${country.name} vlajka`} 
                          style={{ borderRadius: '2px', objectFit: 'cover' }}
                        />
                        <span>{country.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Telefónne číslo"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.phonePrefix}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poznámka"
                multiline
                rows={4}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </Grid>
          </Grid>
          <DialogActions sx={{ padding: '24px 24px 24px 24px', borderTop: 'none' }}>
            <Button 
              onClick={handleCloseDialog} 
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              Zrušiť
            </Button>
            <Button 
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                fontWeight: 600,
                padding: '8px 24px',
                '&:hover': {
                  backgroundColor: colors.accent.light,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255, 159, 67, 0.3)',
                  color: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              {editingContact ? 'Upraviť kontakt' : 'Pridať kontakt'}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle>Potvrdiť vymazanie</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
              Ste si istý, že chcete vymazať kontakt {contactToDelete?.firstName} {contactToDelete?.lastName}? Táto akcia je nezvratná.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteConfirmOpen(false)} 
              aria-label="Zrušiť akciu"
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              Zrušiť
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained" 
              disabled={loading}
              aria-label="Vymazať kontakt"
            >
              Vymazať kontakt
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Contacts; 