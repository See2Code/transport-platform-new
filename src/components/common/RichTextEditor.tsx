import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Typography,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  Grid,
  Button
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatSize,
  TableChart as TableIcon,
  Undo,
  Redo
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  rows?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Zadajte text...",
  helperText,
  maxLength = 30000,
  rows = 8
}) => {
  const { isDarkMode } = useThemeMode();
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<string>('14');
  const [alignment, setAlignment] = useState<string>('left');
  const [tableMenuAnchor, setTableMenuAnchor] = useState<null | HTMLElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Funkcia na konverziu plain textu na HTML pri inicializácii
  const getInitialContent = useCallback((value: string): string => {
    if (!value) return '';
    // Ak už obsahuje HTML tagy, vráť ako je
    if (value.includes('<') && value.includes('>')) {
      return value;
    }
    // Ak je to plain text, konvertuj na HTML s preservovanými riadkami
    return value.replace(/\n/g, '<br>');
  }, []);

  // Funkcia na získanie aktuálnej veľkosti písma na pozícii kurzora
  const getCurrentFontSize = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return '14';
    
    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Ak je to text node, získaj parent element
    if (element.nodeType === Node.TEXT_NODE && element.parentNode) {
      element = element.parentNode;
    }
    
    // Prejdi hierarchiu nahor a hľadaj font-size
    while (element && element !== editorRef.current) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const computedStyle = window.getComputedStyle(element as Element);
        const fontSize = computedStyle.fontSize;
        
        // Ak má element explicitne nastavenú font-size
        if ((element as HTMLElement).style.fontSize) {
          const size = (element as HTMLElement).style.fontSize;
          return size.replace('px', '');
        }
        
        // Ak má computed font-size inú ako predvolenú
        if (fontSize && fontSize !== '14px') {
          return fontSize.replace('px', '');
        }
      }
      if (element.parentNode) {
        element = element.parentNode;
      } else {
        break;
      }
    }
    
    return '14'; // Predvolená veľkosť
  }, []);

  // Funkcia na získanie aktuálneho zarovnania
  const getCurrentAlignment = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'left';
    
    const range = selection.getRangeAt(0);
    let element = range.startContainer;
    
    // Ak je to text node, získaj parent element
    if (element.nodeType === Node.TEXT_NODE && element.parentNode) {
      element = element.parentNode;
    }
    
    // Prejdi hierarchiu nahor a hľadaj text-align
    while (element && element !== editorRef.current) {
      if (element.nodeType === Node.ELEMENT_NODE) {
        const computedStyle = window.getComputedStyle(element as Element);
        const textAlign = computedStyle.textAlign;
        
        if (textAlign && ['left', 'center', 'right'].includes(textAlign)) {
          return textAlign;
        }
      }
      if (element.parentNode) {
        element = element.parentNode;
      } else {
        break;
      }
    }
    
    return 'left'; // Predvolené zarovnanie
  }, []);

  // Funkcia na aktualizáciu toolbar stavov
  const updateToolbarStates = useCallback(() => {
    const currentFontSize = getCurrentFontSize();
    const currentAlignment = getCurrentAlignment();
    
    setFontSize(currentFontSize);
    setAlignment(currentAlignment);
  }, [getCurrentFontSize, getCurrentAlignment]);

  // Event listener pre zmeny kurzora
  const handleSelectionChange = useCallback(() => {
    // Skontroluj či je selection v našom editore
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        updateToolbarStates();
      }
    }
  }, [updateToolbarStates]);

  // Pridanie event listenerov
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Aktualizácia toolbar stavov pri zmene obsahu
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      // Aktualizuj toolbar stavy po malej pauze
      setTimeout(updateToolbarStates, 10);
    }
  };

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  const handleFontSizeChange = (event: SelectChangeEvent<string>) => {
    const size = event.target.value;
    setFontSize(size);
    executeCommand('fontSize', '3'); // Najprv nastavíme základnú veľkosť
    // Potom aplikujeme vlastnú veľkosť cez CSS
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      try {
        range.surroundContents(span);
      } catch {
        // Ak sa nepodarí obaliť obsah, skúsime iný prístup
        span.innerHTML = range.toString();
        range.deleteContents();
        range.insertNode(span);
      }
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  const handleAlignmentChange = (event: React.MouseEvent<HTMLElement>, newAlignment: string | null) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment);
      executeCommand(`justify${newAlignment.charAt(0).toUpperCase() + newAlignment.slice(1)}`);
    }
  };

  const insertTable = (rows: number, cols: number) => {
    let tableHTML = `<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">`;
    
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += `<td style="padding: 8px; border: 1px solid #ccc;">Bunka ${i * cols + j + 1}</td>`;
      }
      tableHTML += '</tr>';
    }
    
    tableHTML += '</table>';
    
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createRange().createContextualFragment(tableHTML));
        onChange(editorRef.current.innerHTML);
      }
    }
    
    setTableMenuAnchor(null);
  };

  const handleTableMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setTableMenuAnchor(event.currentTarget);
  };

  const handleTableMenuClose = () => {
    setTableMenuAnchor(null);
  };

  const getPlainTextLength = (html: string): number => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.length || 0;
  };

  // Inicializácia obsahu len raz
  useEffect(() => {
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = getInitialContent(value);
      setIsInitialized(true);
    }
  }, [value, isInitialized, getInitialContent]);

  return (
    <Box sx={{ border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Nástrojová lišta */}
      <Paper
        elevation={0}
        sx={{
          p: 1,
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        {/* Základné formátovanie */}
        <Tooltip title="Tučné">
          <IconButton
            size="small"
            onClick={() => executeCommand('bold')}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <FormatBold />
          </IconButton>
        </Tooltip>

        <Tooltip title="Kurzíva">
          <IconButton
            size="small"
            onClick={() => executeCommand('italic')}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <FormatItalic />
          </IconButton>
        </Tooltip>

        <Tooltip title="Podčiarknuté">
          <IconButton
            size="small"
            onClick={() => executeCommand('underline')}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <FormatUnderlined />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Veľkosť písma */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormatSize sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', fontSize: '1rem' }} />
          <FormControl size="small" sx={{ minWidth: 60 }}>
            <Select
              value={fontSize}
              onChange={handleFontSizeChange}
              sx={{
                fontSize: '12px',
                '& .MuiSelect-select': {
                  py: 0.5,
                  color: isDarkMode ? '#fff' : '#000'
                }
              }}
            >
              <MenuItem value="10">10px</MenuItem>
              <MenuItem value="12">12px</MenuItem>
              <MenuItem value="14">14px</MenuItem>
              <MenuItem value="16">16px</MenuItem>
              <MenuItem value="18">18px</MenuItem>
              <MenuItem value="20">20px</MenuItem>
              <MenuItem value="24">24px</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider orientation="vertical" flexItem />

        {/* Zarovnanie */}
        <ToggleButtonGroup
          value={alignment}
          exclusive
          onChange={handleAlignmentChange}
          size="small"
        >
          <ToggleButton value="left" sx={{ color: isDarkMode ? '#fff' : '#000' }}>
            <FormatAlignLeft />
          </ToggleButton>
          <ToggleButton value="center" sx={{ color: isDarkMode ? '#fff' : '#000' }}>
            <FormatAlignCenter />
          </ToggleButton>
          <ToggleButton value="right" sx={{ color: isDarkMode ? '#fff' : '#000' }}>
            <FormatAlignRight />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Zoznamy */}
        <Tooltip title="Odrážkový zoznam">
          <IconButton
            size="small"
            onClick={() => executeCommand('insertUnorderedList')}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <FormatListBulleted />
          </IconButton>
        </Tooltip>

        <Tooltip title="Číslovaný zoznam">
          <IconButton
            size="small"
            onClick={() => executeCommand('insertOrderedList')}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <FormatListNumbered />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Tabuľka */}
        <Tooltip title="Vložiť tabuľku">
          <IconButton
            size="small"
            onClick={handleTableMenuOpen}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <TableIcon />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem />

        {/* Späť/Vpred */}
        <Tooltip title="Späť">
          <IconButton
            size="small"
            onClick={() => executeCommand('undo')}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <Undo />
          </IconButton>
        </Tooltip>

        <Tooltip title="Vpred">
          <IconButton
            size="small"
            onClick={() => executeCommand('redo')}
            sx={{ color: isDarkMode ? '#fff' : '#000' }}
          >
            <Redo />
          </IconButton>
        </Tooltip>
      </Paper>

      {/* Editor */}
      <Box
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleContentChange}
        sx={{
          minHeight: `${rows * 1.5}rem`,
          maxHeight: '400px',
          overflow: 'auto',
          p: 2,
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#fff',
          color: isDarkMode ? '#fff' : '#000',
          fontSize: '14px',
          lineHeight: 1.5,
          outline: 'none',
          '&:focus': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fff',
          },
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
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            fontStyle: 'italic'
          }
        }}
      />

      {/* Helper text */}
      {helperText && (
        <Box sx={{ px: 2, py: 1, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}>
          <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                         {helperText} • {getPlainTextLength(getInitialContent(value))}/{maxLength} znakov
          </Typography>
        </Box>
      )}

      {/* Table size selector menu */}
      <Menu
        anchorEl={tableMenuAnchor}
        open={Boolean(tableMenuAnchor)}
        onClose={handleTableMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            backdropFilter: 'blur(10px)',
            p: 2,
            minWidth: '250px'
          }
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}>
          Vyber veľkosť tabuľky:
        </Typography>
        <Grid container spacing={1}>
          {/* Rýchle možnosti */}
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(2, 2)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              2×2
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(2, 3)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              2×3
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(2, 4)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              2×4
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(3, 2)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              3×2
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(3, 3)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              3×3
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(3, 4)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              3×4
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(4, 2)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              4×2
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(4, 3)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              4×3
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => insertTable(4, 4)}
              sx={{ 
                color: isDarkMode ? '#fff' : '#000',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                fontSize: '12px'
              }}
            >
              4×4
            </Button>
          </Grid>
        </Grid>
      </Menu>
    </Box>
  );
};

export default RichTextEditor; 