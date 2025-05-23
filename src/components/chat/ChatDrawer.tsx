import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  styled,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  InputAdornment,
  Paper,
  CircularProgress,
  Badge,
  Drawer} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Send as SendIcon,
  KeyboardBackspace as BackIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useChat, Conversation, ChatUser } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const DRAWER_WIDTH = 320;

// Definujeme konštantu pre dobu trvania animácie
const TRANSITION_DURATION = '0.3s';

// Štýlované komponenty
const ChatContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: `all ${TRANSITION_DURATION} ease-in-out`,
});

const ConversationHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
  transition: `all ${TRANSITION_DURATION} ease-in-out`,
}));

const SearchContainer = styled(Box)(({ _theme }) => ({
  padding: '16px',
  transition: `all ${TRANSITION_DURATION} ease-in-out`,
}));

const ConversationList = styled(List)(({ _theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  overflowY: 'auto',
  padding: 0,
  margin: 0,
  '&::-webkit-scrollbar': {
    width: '6px',
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 159, 67, 0.3)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(255, 159, 67, 0.5)',
  }
}));

const ChatHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '12px 16px',
  paddingTop: '20px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
  margin: 0,
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  flexShrink: 0,
}));

const MessageContainer = styled(Box)(({ _theme }) => ({
  flexGrow: 1,
  overflow: 'hidden',
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  minHeight: '200px',
  height: '100%',
  '&::-webkit-scrollbar': {
    width: '6px',
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 159, 67, 0.3)',
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(255, 159, 67, 0.5)',
  },
  '@media (max-width: 600px)': {
    paddingBottom: '100px',
    paddingTop: '16px',
    maxHeight: 'calc(100dvh - 200px)',
    overflowX: 'hidden',
    overflowY: 'auto',
    '-webkit-overflow-scrolling': 'touch',
  }
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isOwn' && prop !== 'isDarkMode',
})<{ isOwn: boolean; isDarkMode: boolean }>(({ isOwn, isDarkMode }) => ({
  maxWidth: '75%',
  padding: '10px 16px',
  borderRadius: '16px',
  marginBottom: '8px',
  wordBreak: 'break-word',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  backgroundColor: isOwn
    ? isDarkMode
      ? 'rgba(99, 102, 241, 0.8)'
      : 'rgba(99, 102, 241, 0.7)'
    : isDarkMode
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)',
  color: isOwn ? '#ffffff' : isDarkMode ? '#ffffff' : '#000000',
}));

const InputContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
  zIndex: 1000,
  width: '100%',
  flexShrink: 0,
  '@media (max-width: 600px)': {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
    zIndex: 1001,
    backdropFilter: 'blur(10px)',
    transform: 'translateZ(0)',
    boxShadow: isDarkMode 
      ? '0 -2px 20px rgba(0, 0, 0, 0.3)' 
      : '0 -2px 20px rgba(0, 0, 0, 0.1)',
  }
}));

const EmptyStateContainer = styled(Box)(({ _theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '0 24px',
  textAlign: 'center',
}));

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ChatDrawer = styled(Drawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  zIndex: 1300,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    position: 'fixed',
    top: 0,
    left: 'auto',
    right: 0,
    bottom: 0,
    height: '100vh',
    borderLeft: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    transform: 'none !important',
    margin: 0,
    padding: 0,
    transition: `all ${TRANSITION_DURATION} ease-in-out`,
    visibility: 'visible',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0px 0px 15px rgba(0, 0, 0, 0.3)' 
      : '0px 0px 15px rgba(0, 0, 0, 0.1)',
    '@media (max-width: 600px)': {
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: '100dvh',
      minHeight: '100vh',
    }
  },
  '&.MuiDrawer-root': {
    position: 'fixed',
    top: 0,
    left: 'auto',
    right: 0,
    bottom: 0,
    height: '100vh',
    width: DRAWER_WIDTH,
    margin: 0,
    padding: 0,
    pointerEvents: 'none',
    transition: `all ${TRANSITION_DURATION} ease-in-out`,
    '& > *': {
      pointerEvents: 'auto'
    },
    '@media (max-width: 600px)': {
      top: 0,
      width: '100%',
      left: 0,
      height: '100vh',
    }
  }
}));

const ChatDrawerComponent: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  const { isDarkMode } = useThemeMode();
  const { userData } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    searchedUsers,
    loadingConversations,
    loadingMessages,
    searchUsersByName,
    searchUsersByEmail,
    createConversation,
    sendMessage,
    selectConversation,
    closeConversation,
    markConversationAsRead
  } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [_isOpenFromNotification, setIsOpenFromNotification] = useState(false);
  const [_isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Zjednodušená funkcia pre scrollovanie
  const scrollToBottom = (force: boolean = false) => {
    // Zrušíme predchádzajúce timeout-y
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!messagesEndRef.current || !messageContainerRef.current) return;
      
      const container = messageContainerRef.current;
      const scrollEnd = messagesEndRef.current;
      
      // Kontrolujeme či je kontajner viditeľný a má správnu výšku
      if (container.offsetHeight === 0 || container.scrollHeight === 0) return;
      
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (force || isNearBottom) {
        scrollEnd.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    }, force ? 20 : 50); // Kratšie timeout-y pre rýchlejšiu odozvu
  };

  // Reset search term when drawer is closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSearchTerm('');
      }, 300);
    }
  }, [open]);

  // Zjednodušené scrollovanie - jeden centrálny useEffect
  useEffect(() => {
    // Scrollujeme len ak je chat otvorený, máme konverzáciu a správy sú načítané (nie loading)
    if (!open || !currentConversation || loadingMessages) {
      return;
    }

    // Ak máme správy, scrollneme
    if (messages.length > 0) {
      scrollToBottom(true); // Vždy vynútime scroll pri načítaní nových správ
    }
  }, [messages, open, currentConversation, loadingMessages]);

  // Cleanup timeout pri unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Vylepšené mobile viewport handling pre klávesnicu
  useEffect(() => {
    if (typeof window !== 'undefined' && open) {
      let initialHeight = window.visualViewport?.height || window.innerHeight;
      let isInputFocused = false;
      
      const handleViewportChange = () => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        // Klávesnica je zobrazená ak sa výška zmenila o viac ako 150px
        const keyboardVisible = heightDiff > 150;
        setIsKeyboardVisible(keyboardVisible);
        
        if (keyboardVisible && currentConversation) {
          // Klávesnica sa zobrazila - scroll na spodok s miernym oneskorením
          setTimeout(() => {
            scrollToBottom(true);
            // Ak je input fokusovaný, zabezpečíme že je viditeľný
            if (isInputFocused && inputRef.current) {
              inputRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
              });
            }
          }, 100);
        }
      };

      const handleInputFocus = () => {
        isInputFocused = true;
        // Na iOS môže trvať chvíľu kým sa klávesnica zobrazí
        setTimeout(() => {
          scrollToBottom(true);
        }, 300);
      };

      const handleInputBlur = () => {
        isInputFocused = false;
      };

      // Pridáme event listenery
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
      } else {
        window.addEventListener('resize', handleViewportChange);
      }

      const inputElement = inputRef.current;
      if (inputElement) {
        inputElement.addEventListener('focus', handleInputFocus);
        inputElement.addEventListener('blur', handleInputBlur);
      }

      return () => {
        // Cleanup
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
        } else {
          window.removeEventListener('resize', handleViewportChange);
        }
        
        if (inputElement) {
          inputElement.removeEventListener('focus', handleInputFocus);
          inputElement.removeEventListener('blur', handleInputBlur);
        }
      };
    }
  }, [open, currentConversation]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.includes('@')) {
      searchUsersByEmail(value);
    } else {
      searchUsersByName(value);
    }
  };

  // Start a new conversation
  const handleStartConversation = async (user: ChatUser) => {
    try {
      await createConversation(user.uid);
      setSearchTerm('');
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      await sendMessage(messageText);
      setMessageText('');
      // Vždy scrollneme na spodok po odoslaní vlastnej správy
      scrollToBottom(true);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle message input keypress (send on Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format the timestamp
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: sk });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Get other user's info from conversation
  const getOtherUserInfo = (conversation: Conversation) => {
    if (!userData?.uid) return { name: 'Unknown', photoURL: '', companyName: '' };
    
    const otherUserId = conversation.participants.find(id => id !== userData.uid);
    if (!otherUserId) return { name: 'Unknown', photoURL: '', companyName: '' };
    
    const userInfo = conversation.participantsInfo[otherUserId];
    
    // Ak má používateľ nastavenú firmu v konverzácii (nie je prázdna ani "Nezadaná firma")
    if (userInfo?.companyName && userInfo.companyName !== 'Nezadaná firma') {
      return {
        name: userInfo.name || 'Unknown',
        photoURL: userInfo.photoURL || '',
        companyName: userInfo.companyName
      };
    }
    
    // Ak používateľ nemá nastavenú firmu v konverzácii, skúsime získať názov firmy cez companyID
    // Najprv vrátime to čo máme - kvôli optimalizácii UI, a potom nastavíme aktualizáciu
    setTimeout(async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          const userDataFromDb = userDoc.data();
          if (userDataFromDb.companyID) {
            const companyDoc = await getDoc(doc(db, 'companies', userDataFromDb.companyID));
            if (companyDoc.exists()) {
              const companyData = companyDoc.data();
              if (companyData.companyName) {
                // Aktualizujeme konverzáciu s názvom firmy
                if (conversation.id) {
                  await updateDoc(doc(db, 'conversations', conversation.id), {
                    [`participantsInfo.${otherUserId}.companyName`]: companyData.companyName
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Chyba pri aktualizácii názvu firmy:', error);
      }
    }, 100);
    
    return {
      name: userInfo?.name || 'Unknown',
      photoURL: userInfo?.photoURL || '',
      companyName: userInfo?.companyName || ''
    };
  };

  // Event listener pre otvorenie chatu z notifikácie
  useEffect(() => {
    const handleOpenChatDrawer = (event: CustomEvent) => {
      const { conversationId } = event.detail;
      if (conversationId) {
        setIsOpenFromNotification(true);
        selectConversation(conversationId);
        
        // Ak drawer nie je otvorený, môžeme poslať event na jeho otvorenie
        if (!open) {
          // Tu by sme mohli volať parent funkciu na otvorenie drawer-a
          // Ale keďže nemáme prístup k nej, použijeme state
          window.dispatchEvent(new CustomEvent('forceOpenChatDrawer'));
        }
      }
    };

    window.addEventListener('openChatDrawer', handleOpenChatDrawer as EventListener);
    return () => {
      window.removeEventListener('openChatDrawer', handleOpenChatDrawer as EventListener);
    };
  }, [open, selectConversation]);

  // Reset isOpenFromNotification keď sa drawer zatvorí
  useEffect(() => {
    if (!open) {
      setIsOpenFromNotification(false);
    }
  }, [open]);

  return (
    <ChatDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          transition: `all ${TRANSITION_DURATION} ease-in-out`,
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          display: open ? 'block' : 'none'
        }
      }}
    >
      <ChatContainer>
        {currentConversation ? (
          // Conversation view
          <>
            <ChatHeader isDarkMode={isDarkMode}>
              <IconButton edge="start" onClick={closeConversation} sx={{ mr: 2 }}>
                <BackIcon />
              </IconButton>
              <Avatar 
                src={getOtherUserInfo(currentConversation).photoURL} 
                alt={getOtherUserInfo(currentConversation).name}
                sx={{ mr: 2 }}
              >
                {getOtherUserInfo(currentConversation).name.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium" noWrap>
                  {getOtherUserInfo(currentConversation).name}
                </Typography>
                <Typography variant="caption" color="textSecondary" noWrap>
                  {getOtherUserInfo(currentConversation).companyName && 
                   getOtherUserInfo(currentConversation).companyName !== 'Nezadaná firma' 
                    ? getOtherUserInfo(currentConversation).companyName 
                    : ''}
                </Typography>
              </Box>
              <IconButton edge="end" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </ChatHeader>
            
            <MessageContainer ref={messageContainerRef}>
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative'
                }}
              >
                {/* Loading overlay - zobrazuje sa len keď skutočne načítavame */}
                {loadingMessages && (
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                      zIndex: 10,
                      backdropFilter: 'blur(2px)'
                    }}
                  >
                    <CircularProgress size={32} />
                  </Box>
                )}

                {/* Obsah správ - zobrazuje sa vždy */}
                {!loadingMessages && messages.length === 0 ? (
                  <EmptyStateContainer>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                      Ešte tu nie sú žiadne správy. Napíšte prvú správu a začnite konverzáciu.
                    </Typography>
                  </EmptyStateContainer>
                ) : !loadingMessages && messages.length > 0 ? (
                  <>
                    {messages.map((message) => (
                      <MessageBubble 
                        key={message.id} 
                        isOwn={message.senderId === userData?.uid}
                        isDarkMode={isDarkMode}
                      >
                        <Typography variant="body1">{message.text}</Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block', 
                            mt: 0.5, 
                            textAlign: message.senderId === userData?.uid ? 'right' : 'left',
                            opacity: 0.7 
                          }}
                        >
                          {formatTime(message.timestamp)}
                        </Typography>
                      </MessageBubble>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : null}
              </Box>
            </MessageContainer>
            
            <InputContainer isDarkMode={isDarkMode}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Napíšte správu..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={4}
                inputRef={inputRef}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '24px !important',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05) !important' : 'rgba(0,0,0,0.03) !important',
                    border: 'none !important',
                    outline: 'none !important',
                    boxShadow: 'none !important',
                    overflow: 'hidden !important',
                    '& fieldset': {
                      border: 'none !important',
                      outline: 'none !important',
                      display: 'none !important',
                    },
                    '&:hover fieldset': {
                      border: 'none !important',
                      outline: 'none !important',
                      display: 'none !important',
                    },
                    '&.Mui-focused fieldset': {
                      border: `2px solid ${isDarkMode ? '#ff9f43' : '#6366f1'} !important`,
                      outline: 'none !important',
                      display: 'block !important',
                      borderRadius: '24px !important',
                      boxShadow: `0 0 8px ${isDarkMode ? 'rgba(255, 159, 67, 0.3)' : 'rgba(99, 102, 241, 0.3)'} !important`,
                    },
                    '&.Mui-focused': {
                      border: 'none !important',
                      '& fieldset': {
                        border: `2px solid ${isDarkMode ? '#ff9f43' : '#6366f1'} !important`,
                        borderRadius: '24px !important',
                        display: 'block !important',
                      }
                    }
                  },
                  '& .MuiInputBase-root': {
                    border: 'none !important',
                    outline: 'none !important',
                    borderRadius: '24px !important',
                    backgroundColor: 'transparent !important',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none !important',
                    display: 'none !important',
                  },
                  '& .MuiInputBase-input': {
                    borderRadius: '24px !important',
                    backgroundColor: 'transparent !important',
                  }
                }}
                InputProps={{
                  sx: {
                    border: 'none !important',
                    outline: 'none !important',
                    borderRadius: '24px !important',
                    backgroundColor: 'transparent !important',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none !important',
                      display: 'none !important',
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: `2px solid ${isDarkMode ? '#ff9f43' : '#6366f1'} !important`,
                        borderRadius: '24px !important',
                        display: 'block !important',
                        boxShadow: `0 0 8px ${isDarkMode ? 'rgba(255, 159, 67, 0.3)' : 'rgba(99, 102, 241, 0.3)'} !important`,
                      }
                    }
                  },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        color="primary"
                        sx={{
                          backgroundColor: messageText.trim() ? (isDarkMode ? '#ff9f43' : '#6366f1') : 'transparent',
                          color: messageText.trim() ? '#ffffff' : 'inherit',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: messageText.trim() ? (isDarkMode ? '#f7b067' : '#5a5fcf') : 'transparent',
                            transform: messageText.trim() ? 'scale(1.1)' : 'none',
                          },
                          '&.Mui-disabled': {
                            backgroundColor: 'transparent',
                            color: 'rgba(255, 255, 255, 0.3)',
                          },
                        }}
                      >
                        <SendIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </InputContainer>
          </>
        ) : (
          // Conversations list view
          <>
            <ConversationHeader isDarkMode={isDarkMode}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Správy
              </Typography>
              <IconButton edge="end" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </ConversationHeader>
            
            <SearchContainer>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2, 
                  px: 0.5, 
                  fontWeight: 'bold',
                  color: '#6366f1'
                }}
              >
                Pre vytvorenie novej konverzácie:
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2, px: 0.5 }}>
                1. Zadajte meno (min. 2 znaky) alebo email (min. 3 znaky) používateľa
                <br />
                2. Vyberte osobu zo zobrazeného zoznamu
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Zadajte meno alebo email..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
                focused={!searchTerm && open}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    boxShadow: '0 0 5px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              {searchTerm && searchTerm.length < 2 && (
                <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                  Zadajte aspoň 2 znaky pre vyhľadávanie podľa mena
                </Typography>
              )}
              
              {searchTerm && (
                <Paper 
                  elevation={3} 
                  sx={{ 
                    mt: 1, 
                    maxHeight: '300px', 
                    overflow: 'auto',
                    bgcolor: isDarkMode ? 'rgba(45, 45, 60, 0.95)' : 'white',
                    transition: `all ${TRANSITION_DURATION} ease-in-out`,
                    visibility: open ? 'visible' : 'hidden',
                    opacity: open ? 1 : 0,
                    position: 'relative',
                    zIndex: 10
                  }}
                >
                  {searchedUsers.length > 0 ? (
                    <List dense>
                      {searchedUsers.map((user) => (
                        <ListItem button key={user.uid} onClick={() => handleStartConversation(user)}>
                          <ListItemAvatar>
                            <Avatar src={user.photoURL}>
                              {(user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={`${user.firstName} ${user.lastName}`} 
                            secondary={user.email}
                            primaryTypographyProps={{ noWrap: true }}
                            secondaryTypographyProps={{ noWrap: true }}
                          />
                          <ArrowIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                        Žiadni používatelia nenájdení
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Skúste:
                        <ul style={{ textAlign: 'left', paddingLeft: '20px', margin: '8px 0' }}>
                          <li>Zadať meno bez diakritiky (napr. "kristian")</li>
                          <li>Skrátiť hľadaný výraz (napr. len "kris")</li>
                          <li>Zadať priezvisko (napr. "lencses")</li>
                          <li>Zadať celý alebo časť emailu</li>
                        </ul>
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </SearchContainer>
            
            {loadingConversations ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexGrow: 1 }}>
                <CircularProgress size={32} />
              </Box>
            ) : conversations.length === 0 ? (
              <EmptyStateContainer sx={{ flexGrow: 1 }}>
                <Typography variant="body1" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Nemáte žiadne konverzácie.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Použite vyhľadávacie pole vyššie, zadajte meno alebo email používateľa a vytvorte novú konverzáciu.
                </Typography>
              </EmptyStateContainer>
            ) : (
              <ConversationList sx={{ flexGrow: 1 }}>
                {conversations.map((conversation) => {
                  const { name, photoURL, companyName } = getOtherUserInfo(conversation);
                  
                  // Použijeme novú logiku pre získanie počtu neprečítaných správ
                  const userUnreadCount = userData?.uid ? (
                    // Ak je to naša vlastná posledná správa, nemáme žiadne neprečítané správy
                    conversation.lastMessage?.senderId === userData.uid ? 0 : (
                      // Nová štruktúra: unreadMessages objektu
                      (conversation.unreadMessages && typeof conversation.unreadMessages === 'object') 
                        ? (conversation.unreadMessages[userData.uid] || 0)
                        : (
                            // Backward compatibility: starý unreadCount (ak je posledná správa nie od nás)
                            (conversation.unreadCount && 
                             conversation.lastMessage && 
                             conversation.lastMessage.senderId !== userData.uid) 
                              ? conversation.unreadCount 
                              : 0
                          )
                    )
                  ) : 0;
                  
                  const hasUnread = userUnreadCount > 0;
                  
                  return (
                    <ListItem
                      button
                      key={conversation.id}
                      onClick={() => {
                        selectConversation(conversation.id);
                        if (hasUnread) {
                          markConversationAsRead(conversation.id);
                        }
                      }}
                      sx={{
                        bgcolor: hasUnread 
                          ? (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                          : 'transparent',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="primary"
                          badgeContent={hasUnread ? userUnreadCount : undefined}
                          overlap="circular"
                          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          <Avatar src={photoURL} alt={name}>
                            {name.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} component="span">
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={hasUnread ? 'bold' : 'normal'}
                              noWrap
                              component="span"
                            >
                              {name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <Typography 
                              variant="caption" 
                              color="textSecondary" 
                              sx={{ display: 'block', mb: 0.5 }}
                              component="span"
                            >
                              {companyName && companyName !== 'Nezadaná firma' ? companyName : ''}
                            </Typography>
                            {conversation.lastMessage ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }} component="span">
                                <Typography 
                                  variant="body2" 
                                  color="textSecondary" 
                                  sx={{ 
                                    maxWidth: '180px',
                                    fontWeight: hasUnread ? 'medium' : 'normal',
                                    color: hasUnread ? (isDarkMode ? 'white' : 'black') : 'inherit'
                                  }}
                                  noWrap
                                  component="span"
                                >
                                  {conversation.lastMessage.text}
                                </Typography>
                                {hasUnread && (
                                  <Box 
                                    component="span" 
                                    sx={{ 
                                      ml: 1,
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      bgcolor: 'primary.main',
                                      display: 'inline-block'
                                    }} 
                                  />
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="textSecondary" component="span">
                                Začnite konverzáciu
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </ConversationList>
            )}
          </>
        )}
      </ChatContainer>
    </ChatDrawer>
  );
};

export default ChatDrawerComponent; 