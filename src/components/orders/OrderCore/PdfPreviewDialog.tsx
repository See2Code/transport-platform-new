import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import { useThemeMode } from '../../../contexts/ThemeContext';
import BareTooltip from '../../common/BareTooltip';
import { OrderFormData } from '../../../types/orders';

interface PdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  loadingPdf: boolean;
  pdfUrl: string | null;
  previewOrder: OrderFormData | null;
  t: (key: string) => string;
}

const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  open,
  onClose,
  loadingPdf,
  pdfUrl,
  previewOrder,
  t
}) => {
  const { isDarkMode } = useThemeMode();

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `order_${(previewOrder as any)?.orderNumberFormatted || previewOrder?.id?.substring(0, 8) || 'preview'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          background: 'none',
          boxShadow: 'none',
          margin: {
            xs: '8px',
            sm: '16px'
          },
          maxHeight: '95vh',
          height: '95vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      <Box
        sx={{
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          color: isDarkMode ? '#ffffff' : '#000000',
          maxWidth: '1400px',
          maxHeight: '95vh'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 0, 
          mb: 2, 
          fontWeight: 700, 
          color: isDarkMode ? '#ffffff' : '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          minHeight: '40px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VisibilityIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {t('orders.pdfPreviewTitle') || 'Náhľad PDF objednávky'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {pdfUrl && (
              <BareTooltip title={t('orders.downloadPDF') || 'Stiahnuť PDF'}>
                <IconButton 
                  size="small"
                  onClick={handleDownload}
                  sx={{ 
                    color: '#4caf50',
                    '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                  }}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </BareTooltip>
            )}
            <IconButton 
              size="small"
              onClick={onClose}
              edge="end" 
              aria-label="close"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />

        {/* Content */}
        <Box sx={{ 
          flex: 1,
          overflow: 'hidden',
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          minHeight: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {loadingPdf ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              width: '100%',
              p: 3
            }}>
              <CircularProgress size={60} sx={{ mb: 2, color: '#ff9f43' }} />
              <Typography variant="h6" sx={{ mb: 1, color: isDarkMode ? '#ffffff' : '#000000' }}>
                {t('orders.loadingPdf') || 'Načítavam PDF...'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                {t('orders.processingTime') || 'Prosím čakajte, generuje sa náhľad...'}
              </Typography>
            </Box>
          ) : pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#zoom=100&view=FitH&pagemode=none&toolbar=1&navpanes=0`}
              style={{ 
                width: '100%', 
                height: '100%', 
                border: 'none',
                borderRadius: '8px',
                minHeight: '75vh'
              }}
              title="PDF preview"
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              width: '100%',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h6" sx={{ color: '#e74c3c' }}>
                {t('orders.pdfLoadError') || 'Chyba pri načítaní PDF'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                Skúste to znovu alebo kontaktujte podporu.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default PdfPreviewDialog; 