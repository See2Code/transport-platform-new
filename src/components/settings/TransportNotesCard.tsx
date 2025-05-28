import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Paper
} from '@mui/material';
import { Save as SaveIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TransportNotes, 
  TransportNotesFormData, 
  SUPPORTED_LANGUAGES 
} from '../../types/transportNotes';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

interface TransportNotesCardProps {
  companyID: string;
}

const TransportNotesCard: React.FC<TransportNotesCardProps> = ({ companyID }) => {
  const { isDarkMode } = useThemeMode();
  const { userData } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<'sk' | 'en' | 'de' | 'cs'>('sk');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Map<string, TransportNotesFormData>>(new Map());

  // Načítanie poznámok pre všetky jazyky
  const loadTransportNotes = useCallback(async () => {
    setLoading(true);
    try {
      const notesQuery = query(
        collection(db, 'transportNotes'),
        where('companyID', '==', companyID)
      );
      
      const snapshot = await getDocs(notesQuery);
      const notesMap = new Map<string, TransportNotesFormData>();
      
      // Inicializácia prázdnych poznámok pre všetky jazyky
      SUPPORTED_LANGUAGES.forEach(lang => {
        notesMap.set(lang.code, {
          language: lang.code,
          title: lang.code === 'sk' ? 'Všeobecné obchodné podmienky' : 
                 lang.code === 'en' ? 'General Terms and Conditions' :
                 lang.code === 'de' ? 'Allgemeine Geschäftsbedingungen' :
                 'Všeobecné obchodní podmínky',
          content: '',
          isActive: false
        });
      });
      
      // Nahranie existujúcich poznámok
      snapshot.docs.forEach(doc => {
        const data = doc.data() as TransportNotes;
        notesMap.set(data.language, {
          language: data.language,
          title: data.title,
          content: data.content,
          isActive: data.isActive
        });
      });
      
      setNotes(notesMap);
    } catch (err) {
      console.error('Chyba pri načítaní poznámok:', err);
      setError('Chyba pri načítaní poznámok');
    } finally {
      setLoading(false);
    }
  }, [companyID]);

  useEffect(() => {
    if (companyID) {
      loadTransportNotes();
    }
  }, [companyID, loadTransportNotes]);

  const handleSave = async () => {
    if (!userData) {
      setError('Nie ste prihlásený');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const currentNotes = notes.get(selectedLanguage);
      if (!currentNotes) return;

      const noteData: Omit<TransportNotes, 'id'> = {
        companyID,
        language: selectedLanguage,
        title: currentNotes.title,
        content: currentNotes.content,
        isActive: currentNotes.isActive,
        lastUpdated: Timestamp.now(),
        updatedBy: userData.uid,
        createdAt: Timestamp.now(),
        createdBy: userData.uid
      };

      // Použijeme kombinovaný ID z companyID a jazyka
      const docId = `${companyID}_${selectedLanguage}`;
      await setDoc(doc(db, 'transportNotes', docId), noteData);

      setSuccess('Poznámky boli úspešne uložené');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Chyba pri ukladaní poznámok:', err);
      setError('Chyba pri ukladaní poznámok');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof TransportNotesFormData, value: any) => {
    const currentNotes = notes.get(selectedLanguage);
    if (!currentNotes) return;

    const updatedNotes = new Map(notes);
    updatedNotes.set(selectedLanguage, {
      ...currentNotes,
      [field]: value
    });
    setNotes(updatedNotes);
  };

  const currentNotes = notes.get(selectedLanguage);
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

  return (
    <Card sx={{ 
      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      borderRadius: '16px'
    }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <DescriptionIcon sx={{ color: '#ff9f43' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Poznámky k prepravám
          </Typography>
        </Box>

        {/* Výber jazyka */}
        <Paper 
          sx={{ 
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            mb: 3
          }}
        >
          <Tabs
            value={selectedLanguage}
            onChange={(_event: React.SyntheticEvent, newValue: string) => setSelectedLanguage(newValue as 'sk' | 'en' | 'de' | 'cs')}
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 500
              },
              '& .Mui-selected': {
                color: '#ff9f43 !important'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#ff9f43'
              }
            }}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Tab
                key={lang.code}
                value={lang.code}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {notes.get(lang.code)?.isActive && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#4caf50'
                        }}
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : currentNotes ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Aktivácia */}
            <FormControlLabel
              control={
                <Switch
                  checked={currentNotes.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#ff9f43',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#ff9f43',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Pridávať do PDF dokumentov ({currentLanguage?.name})
                </Typography>
              }
            />

            <Divider />

            {/* Nadpis */}
            <TextField
              fullWidth
              label="Nadpis sekcie"
              value={currentNotes.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="napr. Všeobecné obchodné podmienky"
              helperText="Nadpis, ktorý sa zobrazí v PDF dokumente"
            />

            {/* Obsah */}
            <TextField
              fullWidth
              multiline
              rows={12}
              label="Obsah poznámok"
              value={currentNotes.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              placeholder="Zadajte text poznámok, ktoré sa majú pridať do PDF dokumentov..."
              helperText={`${currentNotes.content.length}/5000 znakov`}
              inputProps={{ maxLength: 5000 }}
              sx={{
                '& .MuiInputBase-inputMultiline': {
                  fontSize: '14px',
                  lineHeight: 1.5,
                  fontFamily: 'monospace'
                }
              }}
            />

            {/* Náhľad */}
            {currentNotes.content && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Náhľad:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8f9fa',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0'}`,
                    fontSize: '11px',
                    lineHeight: 1.4,
                    fontFamily: 'Arial, sans-serif',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, fontSize: '12px' }}>
                    {currentNotes.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '11px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {currentNotes.content}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Správy */}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Tlačidlá */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving || !currentNotes.title.trim()}
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                sx={{
                  backgroundColor: '#ff9f43',
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#f7b067' },
                  '&:disabled': { 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
                  }
                }}
              >
                {saving ? 'Ukladám...' : 'Uložiť poznámky'}
              </Button>
            </Box>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default TransportNotesCard; 