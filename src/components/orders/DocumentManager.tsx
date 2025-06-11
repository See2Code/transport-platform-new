import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Chip,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';

// Firebase
import { collection, addDoc, query, where, deleteDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';

// Types
import { OrderDocument, DocumentType, DOCUMENT_TYPE_CONFIG } from '../../types/documents';
import BareTooltip from '../common/BareTooltip';

const StyledDialogContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '0px',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  overflow: 'hidden',
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    fontSize: '1.25rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  '& .MuiDialogContent-root': {
    padding: '16px 24px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    overflowY: 'auto',
    flexGrow: 1,
  },
  '& .MuiDialogActions-root': {
    padding: '16px 24px 24px 24px',
    flexShrink: 0,
  }
}));

const DocumentCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(40, 40, 65, 0.8)' : 'rgba(248, 249, 250, 0.8)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: '12px',
  marginBottom: '12px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    borderColor: '#ff9f43'
  }
}));

const UploadArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode' && prop !== 'isDragOver',
})<{ isDarkMode: boolean; isDragOver: boolean }>(({ isDarkMode, isDragOver }) => ({
  border: `2px dashed ${isDragOver ? '#ff9f43' : (isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)')}`,
  borderRadius: '12px',
  padding: '32px 16px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  backgroundColor: isDragOver ? (isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(255, 159, 67, 0.05)') : 'transparent',
  '&:hover': {
    borderColor: '#ff9f43',
    backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.05)' : 'rgba(255, 159, 67, 0.02)'
  }
}));

interface DocumentManagerProps {
  orderId: string;
  trigger?: React.ReactElement;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ orderId, trigger }) => {
  const { isDarkMode } = useThemeMode();
  const { userData } = useAuth();

  // State
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('customer_order');
  const [error, setError] = useState<string | null>(null);

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<OrderDocument | null>(null);

  // Fetch documents
  useEffect(() => {
    if (!open || !orderId || !userData?.companyID) return;

    setLoading(true);
    const documentsRef = collection(db, 'orderDocuments');
    const q = query(
      documentsRef,
      where('orderId', '==', orderId),
      where('companyID', '==', userData.companyID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrderDocument[];
      
      // Zoradíme podľa dátumu vytvorenia
      docs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
      setDocuments(docs);
      setLoading(false);
    }, (err) => {
      console.error('Chyba pri načítaní dokumentov:', err);
      setError('Nastala chyba pri načítaní dokumentov');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [open, orderId, userData?.companyID]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setShowUploadForm(false);
    setSelectedFile(null);
    setDocumentName('');
    setDocumentType('customer_order');
    setError(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDocumentName(file.name.split('.')[0]); // Automaticky vyplníme názov bez prípony
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setDocumentName(file.name.split('.')[0]);
      setShowUploadForm(true);
    }
  };

  const validateFile = (file: File): string | null => {
    // Maximálna veľkosť 10MB
    if (file.size > 10 * 1024 * 1024) {
      return 'Súbor je príliš veľký. Maximálna veľkosť je 10MB.';
    }

    // Povolené typy súborov
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'Nepodporovaný typ súboru. Povolené sú: PDF, JPG, PNG, DOC, DOCX.';
    }

    return null;
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim() || !userData) {
      setError('Prosím vyplňte všetky povinné polia');
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload do Firebase Storage
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `orders/${orderId}/${Date.now()}_${documentName}.${fileExtension}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Uloženie metadát do Firestore
      const documentData: Omit<OrderDocument, 'id'> = {
        orderId,
        companyID: userData.companyID!,
        name: documentName.trim(),
        type: documentType,
        fileUrl: downloadURL,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        contentType: selectedFile.type,
        uploadedBy: userData.uid,
        uploadedByName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email || 'Neznámy',
        createdAt: Timestamp.fromDate(new Date())
      };

      await addDoc(collection(db, 'orderDocuments'), documentData);

      // Reset formulára
      setSelectedFile(null);
      setDocumentName('');
      setDocumentType('customer_order');
      setShowUploadForm(false);
      
    } catch (err) {
      console.error('Chyba pri nahrávaní dokumentu:', err);
      setError('Nastala chyba pri nahrávaní dokumentu');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (document: OrderDocument) => {
    // Otvoríme súbor v novom okne
    window.open(document.fileUrl, '_blank');
  };

  const handlePreview = (document: OrderDocument) => {
    setPreviewDocument(document);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewDocument(null);
  };

  const handleDelete = async (document: OrderDocument) => {
    if (!window.confirm(`Naozaj chcete vymazať dokument "${document.name}"?`)) {
      return;
    }

    try {
      // Extrakcia cesty z Firebase Storage URL
      const url = new URL(document.fileUrl);
      const pathName = url.pathname;
      // Odstránenie /v0/b/bucket-name/o/ z cesty a dekódovanie
      const storagePath = decodeURIComponent(pathName.split('/o/')[1].split('?')[0]);
      
      // Vymazanie zo Storage
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);

      // Vymazanie z Firestore
      await deleteDoc(doc(db, 'orderDocuments', document.id));
    } catch (err) {
      console.error('Chyba pri mazaní dokumentu:', err);
      setError('Nastala chyba pri mazaní dokumentu');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileType = (document: OrderDocument): 'pdf' | 'image' | 'document' | 'other' => {
    const contentType = document.contentType.toLowerCase();
    if (contentType === 'application/pdf') return 'pdf';
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.includes('word') || contentType.includes('document')) return 'document';
    return 'other';
  };

  const renderPreviewContent = () => {
    if (!previewDocument) return null;

    const fileType = getFileType(previewDocument);
    const config = DOCUMENT_TYPE_CONFIG[previewDocument.type];

    switch (fileType) {
      case 'pdf':
        return (
          <Box sx={{ width: '100%', height: '70vh' }}>
            <iframe
              src={`${previewDocument.fileUrl}#zoom=page-fit&view=Fit&pagemode=none&toolbar=1&navpanes=0`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              title={`Náhľad: ${previewDocument.name}`}
            />
          </Box>
        );

      case 'image':
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start',
            width: '100%',
            minHeight: '70vh',
            overflow: 'auto',
            p: 1
          }}>
            <img
              src={previewDocument.fileUrl}
              alt={previewDocument.name}
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: 'none',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            />
          </Box>
        );

      case 'document':
      case 'other':
      default:
        return (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3
          }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '16px',
                backgroundColor: config.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}
            >
              {config.icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {previewDocument.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Tento typ súboru sa nedá zobraziť v náhľade
              </Typography>
              <Chip
                label={config.label}
                sx={{
                  backgroundColor: config.bgColor,
                  color: config.color,
                  fontWeight: 500,
                  mb: 3
                }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleDownload(previewDocument)}
              sx={{ 
                backgroundColor: '#ff9f43',
                '&:hover': { backgroundColor: '#f7b067' }
              }}
            >
              Stiahnuť súbor
            </Button>
          </Box>
        );
    }
  };

  // Renderovanie triggeru bez počtu dokumentov a oranžovej farby
  const renderTrigger = () => {
    if (trigger) {
      return React.cloneElement(trigger, { onClick: handleOpen });
    }

    return (
      <BareTooltip title="Spravovať dokumenty">
        <IconButton
          onClick={handleOpen}
          size="small"
          sx={{ 
            color: 'text.secondary',
            '&:hover': { 
              backgroundColor: 'rgba(0, 0, 0, 0.1)' 
            } 
          }}
        >
          <DescriptionIcon fontSize="small" />
        </IconButton>
      </BareTooltip>
    );
  };

  return (
    <>
      {renderTrigger()}

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
            maxHeight: '90vh',
            overflow: 'hidden'
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
          <DialogTitle>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ color: '#ff9f43' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Dokumenty objednávky
                </Typography>
                <Chip 
                  label={`${documents.length} dokumentov`}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255, 159, 67, 0.1)',
                    color: '#ff9f43'
                  }}
                />
              </Box>
              <IconButton 
                onClick={handleClose} 
                edge="end" 
                aria-label="close"
                sx={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />

          <DialogContent sx={{ 
            p: '24px', 
            overflow: 'auto',
            flex: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              }
            }
          }}>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Upload sekcia */}
            {!showUploadForm ? (
              <UploadArea 
                isDarkMode={isDarkMode}
                isDragOver={isDragOver}
                onClick={() => setShowUploadForm(true)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <UploadFileIcon sx={{ fontSize: 48, color: '#ff9f43', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, color: '#ff9f43' }}>
                  Pridať nový dokument
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Kliknite sem alebo pretiahnite súbor pre nahranie
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                  Podporované formáty: PDF, JPG, PNG, DOC, DOCX (max. 10MB)
                </Typography>
              </UploadArea>
            ) : (
              <Card sx={{ mb: 3, border: `1px solid #ff9f43` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: '#ff9f43' }}>
                    Nahrať nový dokument
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <input
                        type="file"
                        id="file-upload"
                        hidden
                        onChange={handleFileSelect}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label htmlFor="file-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<UploadFileIcon />}
                          fullWidth
                          sx={{ 
                            borderColor: '#ff9f43',
                            color: '#ff9f43',
                            '&:hover': { 
                              borderColor: '#f7b067',
                              backgroundColor: 'rgba(255, 159, 67, 0.05)'
                            }
                          }}
                        >
                          {selectedFile ? selectedFile.name : 'Vybrať súbor'}
                        </Button>
                      </label>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Názov dokumentu *"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Typ dokumentu</InputLabel>
                        <Select
                          value={documentType}
                          label="Typ dokumentu"
                          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                        >
                          {Object.entries(DOCUMENT_TYPE_CONFIG).map(([key, config]) => (
                            <MenuItem key={key} value={key}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{config.icon}</span>
                                <span>{config.label}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button 
                          onClick={() => setShowUploadForm(false)}
                          disabled={uploading}
                        >
                          Zrušiť
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleUpload}
                          disabled={!selectedFile || !documentName.trim() || uploading}
                          sx={{ 
                            backgroundColor: '#ff9f43',
                            '&:hover': { backgroundColor: '#f7b067' }
                          }}
                        >
                          {uploading ? <CircularProgress size={20} color="inherit" /> : 'Nahrať'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Zoznam dokumentov */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#ff9f43' }} />
              </Box>
            ) : documents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  Žiadne dokumenty
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Pridajte prvý dokument k tejto objednávke
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, color: '#ff9f43' }}>
                  Nahrané dokumenty ({documents.length})
                </Typography>
                
                {documents.map((document) => {
                  const config = DOCUMENT_TYPE_CONFIG[document.type];
                  return (
                    <DocumentCard key={document.id} isDarkMode={isDarkMode}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '8px',
                                backgroundColor: config.bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem'
                              }}
                            >
                              {config.icon}
                            </Box>
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, noWrap: true }}>
                                {document.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  label={config.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: config.bgColor,
                                    color: config.color,
                                    fontWeight: 500
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {formatFileSize(document.fileSize)}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  • {document.createdAt.toDate().toLocaleDateString('sk-SK')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  • {document.uploadedByName}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <BareTooltip title="Náhľad">
                              <IconButton
                                size="small"
                                onClick={() => handlePreview(document)}
                                sx={{ 
                                  color: '#2196f3',
                                  '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </BareTooltip>
                            <BareTooltip title="Stiahnuť">
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(document)}
                                sx={{ 
                                  color: '#4caf50',
                                  '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </BareTooltip>
                            <BareTooltip title="Vymazať">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(document)}
                                sx={{ 
                                  color: '#f44336',
                                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </BareTooltip>
                          </Box>
                        </Box>
                      </CardContent>
                    </DocumentCard>
                  );
                })}
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ flexShrink: 0 }}>
            <Button 
              onClick={handleClose}
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
              }}
            >
              Zavrieť
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
            maxHeight: '95vh',
            overflow: 'hidden'
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
          <DialogTitle>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon sx={{ color: '#2196f3' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Náhľad dokumentu
                </Typography>
                {previewDocument && (
                  <Chip 
                    label={DOCUMENT_TYPE_CONFIG[previewDocument.type].label}
                    size="small"
                    sx={{ 
                      backgroundColor: DOCUMENT_TYPE_CONFIG[previewDocument.type].bgColor,
                      color: DOCUMENT_TYPE_CONFIG[previewDocument.type].color
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {previewDocument && (
                  <>
                    <BareTooltip title="Stiahnuť">
                      <IconButton
                        onClick={() => handleDownload(previewDocument)}
                        sx={{ 
                          color: '#4caf50',
                          '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </BareTooltip>
                    <BareTooltip title="Otvoriť v novom okne">
                      <IconButton
                        onClick={() => window.open(previewDocument.fileUrl, '_blank')}
                        sx={{ 
                          color: '#ff9f43',
                          '&:hover': { backgroundColor: 'rgba(255, 159, 67, 0.1)' }
                        }}
                      >
                        <DescriptionIcon />
                      </IconButton>
                    </BareTooltip>
                  </>
                )}
                <IconButton 
                  onClick={handleClosePreview} 
                  edge="end" 
                  aria-label="close"
                  sx={{
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          
          <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />

          <DialogContent sx={{ 
            p: 2, 
            overflow: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}>
            {previewDocument && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {previewDocument.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Veľkosť: {formatFileSize(previewDocument.fileSize)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Nahral: {previewDocument.uploadedByName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Dátum: {previewDocument.createdAt.toDate().toLocaleDateString('sk-SK')}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {renderPreviewContent()}
          </DialogContent>
        </StyledDialogContent>
      </Dialog>
    </>
  );
};

export default DocumentManager; 