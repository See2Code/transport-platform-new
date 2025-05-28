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
  CircularProgress,
  Paper,
  Collapse,
  Grid
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Description as DescriptionIcon, 
  Edit as EditIcon,
  Cancel as CancelIcon 
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  TransportNotes, 
  TransportNotesFormData 
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

// Použijem SVG vlajky z flagcdn.com ako v ostatných komponentoch
const SUPPORTED_LANGUAGES = [
  { code: 'sk', name: 'Slovenčina', flag: 'https://flagcdn.com/sk.svg' },
  { code: 'en', name: 'Angličtina', flag: 'https://flagcdn.com/gb.svg' },
  { code: 'de', name: 'Nemčina', flag: 'https://flagcdn.com/de.svg' },
  { code: 'cs', name: 'Čeština', flag: 'https://flagcdn.com/cz.svg' }
] as const;

interface TransportNotesCardProps {
  companyID: string;
}

const TransportNotesCard: React.FC<TransportNotesCardProps> = ({ companyID }) => {
  const { isDarkMode } = useThemeMode();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<Map<string, TransportNotesFormData>>(new Map());
  const [editingLanguage, setEditingLanguage] = useState<string | null>(null);

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

  const handleSave = async (language: string) => {
    if (!userData) {
      setError('Nie ste prihlásený');
      return;
    }

    setSaving(language);
    setError('');
    setSuccess('');

    try {
      const currentNotes = notes.get(language);
      if (!currentNotes) return;

      const noteData: Omit<TransportNotes, 'id'> = {
        companyID,
        language: currentNotes.language,
        title: currentNotes.title,
        content: currentNotes.content,
        isActive: currentNotes.isActive,
        lastUpdated: Timestamp.now(),
        updatedBy: userData.uid,
        createdAt: Timestamp.now(),
        createdBy: userData.uid
      };

      // Použijeme kombinovaný ID z companyID a jazyka
      const docId = `${companyID}_${language}`;
      await setDoc(doc(db, 'transportNotes', docId), noteData);

      setSuccess('Poznámky boli úspešne uložené');
      setEditingLanguage(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Chyba pri ukladaní poznámok:', err);
      setError('Chyba pri ukladaní poznámok');
    } finally {
      setSaving(null);
    }
  };

  const handleFieldChange = (language: string, field: keyof TransportNotesFormData, value: any) => {
    const currentNotes = notes.get(language);
    if (!currentNotes) return;

    const updatedNotes = new Map(notes);
    updatedNotes.set(language, {
      ...currentNotes,
      [field]: value
    });
    setNotes(updatedNotes);
  };

  const handleEdit = (language: string) => {
    setEditingLanguage(language);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingLanguage(null);
    setError('');
    setSuccess('');
    // Reload original data
    loadTransportNotes();
  };

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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Správy */}
            {success && (
              <Alert severity="success">
                {success}
              </Alert>
            )}

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* Grid kartičiek vedľa seba */}
            <Grid container spacing={2}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const currentNotes = notes.get(lang.code);
                const isEditing = editingLanguage === lang.code;
                const isSaving = saving === lang.code;

                return (
                  <Grid item xs={12} sm={6} md={3} key={lang.code}>
                    <Paper
                      sx={{
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        height: 'fit-content'
                      }}
                    >
                      {/* Kompaktný header kartičky */}
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <img 
                              loading="lazy" 
                              width="20" 
                              height="15"
                              src={lang.flag} 
                              alt={`${lang.name} vlajka`} 
                              style={{ borderRadius: '2px', objectFit: 'cover' }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {lang.name}
                            </Typography>
                          </Box>
                          {currentNotes?.isActive && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#4caf50'
                              }}
                            />
                          )}
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(lang.code)}
                          sx={{
                            borderColor: '#ff9f43',
                            color: '#ff9f43',
                            fontSize: '0.75rem',
                            py: 0.5,
                            '&:hover': {
                              borderColor: '#f7b067',
                              backgroundColor: 'rgba(255, 159, 67, 0.1)'
                            }
                          }}
                        >
                          Upraviť
                        </Button>
                      </Box>

                      {/* Kompaktný obsah kartičky */}
                      <Box sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Switch
                            checked={currentNotes?.isActive || false}
                            disabled
                            size="small"
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#ff9f43',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#ff9f43',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                            {currentNotes?.isActive ? 'Aktívne' : 'Neaktívne'}
                          </Typography>
                        </Box>

                        {currentNotes?.title && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              display: 'block',
                              fontWeight: 500,
                              mb: 0.5,
                              fontSize: '0.75rem',
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}
                          >
                            {currentNotes.title}
                          </Typography>
                        )}

                        {currentNotes?.content ? (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.7rem',
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {currentNotes.content}
                          </Typography>
                        ) : (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.7rem',
                              color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                              fontStyle: 'italic'
                            }}
                          >
                            Žiadne poznámky
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Editačný formulár pod kartičkami */}
            {editingLanguage && (
              <Collapse in={!!editingLanguage}>
                <Paper
                  sx={{
                    mt: 2,
                    p: 3,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    border: `2px solid #ff9f43`,
                    borderRadius: '12px'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <img 
                      loading="lazy" 
                      width="24" 
                      height="18"
                      src={SUPPORTED_LANGUAGES.find(l => l.code === editingLanguage)?.flag} 
                      alt="Vlajka" 
                      style={{ borderRadius: '3px', objectFit: 'cover' }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Úprava poznámok - {SUPPORTED_LANGUAGES.find(l => l.code === editingLanguage)?.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notes.get(editingLanguage)?.isActive || false}
                          onChange={(e) => handleFieldChange(editingLanguage, 'isActive', e.target.checked)}
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
                          Pridávať do PDF dokumentov
                        </Typography>
                      }
                    />

                    <TextField
                      fullWidth
                      label="Nadpis sekcie"
                      value={notes.get(editingLanguage)?.title || ''}
                      onChange={(e) => handleFieldChange(editingLanguage, 'title', e.target.value)}
                      placeholder="napr. Všeobecné obchodné podmienky"
                      helperText="Nadpis, ktorý sa zobrazí v PDF dokumente"
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      label="Obsah poznámok"
                      value={notes.get(editingLanguage)?.content || ''}
                      onChange={(e) => handleFieldChange(editingLanguage, 'content', e.target.value)}
                      placeholder="Zadajte text poznámok, ktoré sa majú pridať do PDF dokumentov..."
                      helperText={`${(notes.get(editingLanguage)?.content || '').length}/20000 znakov`}
                      inputProps={{ maxLength: 20000 }}
                      sx={{
                        '& .MuiInputBase-inputMultiline': {
                          fontSize: '14px',
                          lineHeight: 1.5,
                          fontFamily: 'monospace'
                        }
                      }}
                    />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={saving === editingLanguage ? <CircularProgress size={16} /> : <SaveIcon />}
                        onClick={() => handleSave(editingLanguage)}
                        disabled={saving === editingLanguage || !notes.get(editingLanguage)?.title.trim()}
                        sx={{
                          backgroundColor: '#ff9f43',
                          color: '#ffffff',
                          '&:hover': { backgroundColor: '#f7b067' }
                        }}
                      >
                        {saving === editingLanguage ? 'Ukladám...' : 'Uložiť'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancel}
                        disabled={saving === editingLanguage}
                        sx={{
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }}
                      >
                        Zrušiť
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Collapse>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TransportNotesCard; 