import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Tabs,
  Tab
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
import RichTextEditor from '../common/RichTextEditor';

// Použijem SVG vlajky z flagcdn.com ako v ostatných komponentoch
const SUPPORTED_LANGUAGES = [
  { code: 'sk', name: 'Slovensky', flag: 'https://flagcdn.com/sk.svg' },
  { code: 'en', name: 'Anglicky', flag: 'https://flagcdn.com/gb.svg' },
  { code: 'de', name: 'Nemecky', flag: 'https://flagcdn.com/de.svg' },
  { code: 'cs', name: 'Česky', flag: 'https://flagcdn.com/cz.svg' },
  { code: 'pl', name: 'Polsky', flag: 'https://flagcdn.com/pl.svg' }
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
  const [activeTab, setActiveTab] = useState<string>('sk'); // Aktívny jazyk
  
  // Ref pre editačný formulár
  const editFormRef = useRef<HTMLDivElement>(null);

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
                 lang.code === 'cs' ? 'Všeobecné obchodní podmínky' :
                 'Ogólne warunki handlowe',
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
    setSaving(language);
    try {
      const formData = notes.get(language);
      if (!formData) return;

      const docRef = doc(db, 'transportNotes', `${companyID}_${language}`);
      
      const transportNotesData: Omit<TransportNotes, 'id'> = {
        companyID,
        language: language as 'sk' | 'en' | 'de' | 'cs' | 'pl',
        title: formData.title,
        content: formData.content,
        isActive: formData.isActive,
        lastUpdated: Timestamp.now(),
        updatedBy: userData?.uid || '',
        createdAt: Timestamp.now(),
        createdBy: userData?.uid || ''
      };

      await setDoc(docRef, transportNotesData, { merge: true });
      
      setSuccess('Poznámky boli úspešne uložené');
      setEditingLanguage(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Chyba pri ukladaní poznámok:', err);
      setError('Chyba pri ukladaní poznámok');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(null);
    }
  };

  const handleEdit = (language: string) => {
    setEditingLanguage(language);
    
    // Scroll na editačný formulár po krátkom oneskorení (aby sa Collapse stihol otvoriť)
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 300); // 300ms oneskorenie pre Collapse animáciu
  };

  const handleCancel = () => {
    setEditingLanguage(null);
    loadTransportNotes(); // Obnovenie pôvodných hodnôt
  };

  const handleFieldChange = (language: string, field: keyof TransportNotesFormData, value: any) => {
    setNotes(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(language) || {
        language: language as 'sk' | 'en' | 'de' | 'cs' | 'pl',
        title: '',
        content: '',
        isActive: false
      };
      newMap.set(language, { ...current, [field]: value });
      return newMap;
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    // Ak editujeme a prepneme tab, zrušíme editáciu
    if (editingLanguage && editingLanguage !== newValue) {
      setEditingLanguage(null);
    }
  };

  const currentNotes = notes.get(activeTab);

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

            {/* Záložky jazykov */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ff9f43',
                },
                '& .MuiTab-root': {
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#ff9f43',
                    fontWeight: 600,
                  },
                },
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <Tab 
                  key={lang.code}
                  value={lang.code}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img 
                        loading="lazy" 
                        width="20" 
                        height="15"
                        src={lang.flag} 
                        alt="Vlajka" 
                        style={{ borderRadius: '2px', objectFit: 'cover' }}
                      />
                      {lang.name}
                    </Box>
                  }
                />
              ))}
            </Tabs>

            {/* Náhľad aktívneho jazyka */}
            <Paper
              sx={{
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
                p: 3
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <img 
                    loading="lazy" 
                    width="24" 
                    height="18"
                    src={SUPPORTED_LANGUAGES.find(l => l.code === activeTab)?.flag} 
                    alt="Vlajka" 
                    style={{ borderRadius: '3px', objectFit: 'cover' }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {SUPPORTED_LANGUAGES.find(l => l.code === activeTab)?.name}
                  </Typography>
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(activeTab)}
                  sx={{
                    borderColor: '#ff9f43',
                    color: '#ff9f43',
                    '&:hover': {
                      borderColor: '#f7b067',
                      backgroundColor: 'rgba(255, 159, 67, 0.1)'
                    }
                  }}
                >
                  Upraviť
                </Button>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Switch
                  checked={currentNotes?.isActive || false}
                  disabled
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#ff9f43',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#ff9f43',
                    },
                  }}
                />
                <Typography variant="body2">
                  {currentNotes?.isActive ? 'Aktívne - pridáva sa do PDF' : 'Neaktívne'}
                </Typography>
              </Box>

              {currentNotes?.title && (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                  }}
                >
                  {currentNotes.title}
                </Typography>
              )}

              {currentNotes?.content ? (
                <Box
                  sx={{
                    maxHeight: '400px', // Približne 25 riadkov
                    overflow: 'auto',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: '8px',
                    p: 2,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
                    // Vlastné scrollbar štýly
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      },
                    },
                    // Štýly pre renderovaný HTML obsah
                    '& table': {
                      borderCollapse: 'collapse',
                      width: '100%',
                      margin: '10px 0',
                      '& td, & th': {
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.3)' : '#ccc'}`,
                        padding: '8px',
                        textAlign: 'left'
                      }
                    },
                    '& ul, & ol': {
                      paddingLeft: '20px',
                      margin: '10px 0'
                    },
                    '& li': {
                      marginBottom: '5px'
                    },
                    '& strong': {
                      fontWeight: 'bold'
                    },
                    '& em': {
                      fontStyle: 'italic'
                    },
                    '& u': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {/* Kontrola či je obsah HTML alebo plain text */}
                  {currentNotes.content.includes('<') && currentNotes.content.includes('>') ? (
                    // HTML obsah - renderuj ako HTML
                    <Box
                      dangerouslySetInnerHTML={{ __html: currentNotes.content }}
                      sx={{ 
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        lineHeight: 1.6,
                        fontSize: '14px'
                      }}
                    />
                  ) : (
                    // Plain text obsah - renderuj ako text s preservovanými riadkami
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        fontSize: '14px'
                      }}
                    >
                      {currentNotes.content}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                    fontStyle: 'italic'
                  }}
                >
                  Žiadne poznámky nie sú zadané
                </Typography>
              )}
            </Paper>

            {/* Editačný formulár */}
            {editingLanguage === activeTab && (
              <Collapse in={!!editingLanguage}>
                <Paper
                  ref={editFormRef}
                  sx={{
                    p: 3,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    border: `2px solid #ff9f43`,
                    borderRadius: '12px'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Úprava poznámok - {SUPPORTED_LANGUAGES.find(l => l.code === editingLanguage)?.name}
                  </Typography>

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

                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        Obsah poznámok
                      </Typography>
                      <RichTextEditor
                        value={notes.get(editingLanguage)?.content || ''}
                        onChange={(value) => handleFieldChange(editingLanguage, 'content', value)}
                        placeholder="Zadajte text poznámok, ktoré sa majú pridať do PDF dokumentov..."
                        helperText="Text s formátovaním, ktorý sa pridá do PDF dokumentov"
                        maxLength={30000}
                        rows={8}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        startIcon={<CancelIcon />}
                        sx={{
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }}
                      >
                        Zrušiť
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => handleSave(editingLanguage)}
                        disabled={saving === editingLanguage}
                        startIcon={saving === editingLanguage ? <CircularProgress size={16} /> : <SaveIcon />}
                        sx={{
                          backgroundColor: '#ff9f43',
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: '#f7b067'
                          },
                          '&:disabled': {
                            backgroundColor: 'rgba(255, 159, 67, 0.3)'
                          }
                        }}
                      >
                        {saving === editingLanguage ? 'Ukladá sa...' : 'Uložiť'}
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