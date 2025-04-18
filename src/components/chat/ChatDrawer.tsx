import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
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
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Send as SendIcon,
  KeyboardBackspace as BackIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useChat, Message, Conversation, ChatUser } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';

const DRAWER_WIDTH = 320;

// Štýlované komponenty
const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
}));

const ConversationHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: '16px',
}));

const ConversationList = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: 0,
  margin: 0,
}));

const ChatHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
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
  borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
  display: 'flex',
  alignItems: 'center',
}));

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '0 24px',
  textAlign: 'center',
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const TabPanel = (props: {
  children?: React.ReactNode;
  index: number;
  value: number;
  style?: React.CSSProperties;
  [key: string]: any;
}) => {
  const { children, value, index, style, ...other } = props;

  const mergedStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    ...(style || {}),
  };

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chat-tabpanel-${index}`}
      aria-labelledby={`chat-tab-${index}`}
      {...other}
      style={mergedStyle}
    >
      {value === index && <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: 0, margin: 0 }}>{children}</Box>}
    </div>
  );
};

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ChatDrawer = styled(Drawer)(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
    position: 'fixed',
    top: '64px', // výška navbaru
    height: 'calc(100% - 64px)',
    borderLeft: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    zIndex: theme.zIndex.drawer,
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  '&.MuiDrawer-root': {
    position: 'fixed',
    right: 0,
    top: '64px',
    height: 'calc(100% - 64px)',
    width: DRAWER_WIDTH,
    pointerEvents: 'none',
    '& > *': {
      pointerEvents: 'auto'
    }
  }
}));

const ChatDrawerComponent: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
  const theme = useTheme();
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
  } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll down when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    return {
      name: userInfo?.name || 'Unknown',
      photoURL: userInfo?.photoURL || '',
      companyName: userInfo?.companyName || 'Nezadaná firma'
    };
  };

  return (
    <ChatDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
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
                  {getOtherUserInfo(currentConversation).companyName}
                </Typography>
              </Box>
              <IconButton edge="end" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </ChatHeader>
            
            <MessageContainer>
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={32} />
                </Box>
              ) : messages.length === 0 ? (
                <EmptyStateContainer>
                  <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                    Ešte tu nie sú žiadne správy. Napíšte prvú správu a začnite konverzáciu.
                  </Typography>
                </EmptyStateContainer>
              ) : (
                messages.map((message) => (
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
                ))
              )}
              <div ref={messagesEndRef} />
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '24px',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        color="primary"
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
                focused={!searchTerm}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderWidth: 2,
                    borderColor: 'primary.main',
                    boxShadow: '0 0 5px rgba(99, 102, 241, 0.3)'
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
                    bgcolor: isDarkMode ? 'rgba(45, 45, 60, 0.95)' : 'white' 
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
                  const hasUnread = 
                    conversation.lastMessage?.senderId !== userData?.uid && 
                    conversation.unreadCount && 
                    conversation.unreadCount > 0;
                  
                  return (
                    <ListItem
                      button
                      key={conversation.id}
                      onClick={() => selectConversation(conversation.id)}
                      sx={{
                        bgcolor: hasUnread 
                          ? (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)')
                          : 'transparent',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={photoURL} alt={name}>
                          {name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={hasUnread ? 'bold' : 'normal'}
                              noWrap
                            >
                              {name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography 
                              variant="caption" 
                              color="textSecondary" 
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              {companyName}
                            </Typography>
                            {conversation.lastMessage ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography 
                                  variant="body2" 
                                  color="textSecondary" 
                                  sx={{ 
                                    maxWidth: '180px',
                                    fontWeight: hasUnread ? 'medium' : 'normal',
                                    color: hasUnread ? (isDarkMode ? 'white' : 'black') : 'inherit'
                                  }}
                                  noWrap
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
                              <Typography variant="body2" color="textSecondary">
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