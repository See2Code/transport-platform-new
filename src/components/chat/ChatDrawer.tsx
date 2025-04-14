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
  Button,
  Divider,
  Paper,
  CircularProgress,
  Badge,
  Tabs,
  Tab,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Send as SendIcon,
  KeyboardBackspace as BackIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  ArrowForward as ArrowIcon,
  FiberManualRecord as DotIcon,
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

const TabPanel = ({ children, value, index, ...other }: any) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chat-tabpanel-${index}`}
      aria-labelledby={`chat-tab-${index}`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{children}</Box>}
    </div>
  );
};

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
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
  const [tabValue, setTabValue] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
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
      setShowSearch(false);
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
    if (!userData?.uid) return { name: 'Unknown', photoURL: '' };
    
    const otherUserId = conversation.participants.find(id => id !== userData.uid);
    if (!otherUserId) return { name: 'Unknown', photoURL: '' };
    
    const userInfo = conversation.participantsInfo[otherUserId];
    return {
      name: userInfo?.name || 'Unknown',
      photoURL: userInfo?.photoURL || '',
    };
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          borderLeft: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        },
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
                <Typography variant="subtitle1" fontWeight="medium">
                  {getOtherUserInfo(currentConversation).name}
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
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2, px: 0.5 }}>
                Pre vytvorenie novej konverzácie zadajte meno alebo email používateľa a vyberte ho zo zoznamu.
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Vyhľadajte používateľa..."
                value={searchTerm}
                onChange={handleSearchChange}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              
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
                      <Typography variant="body2" color="textSecondary">
                        Žiadni používatelia nenájdení
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </SearchContainer>
            
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Nedávne" />
              <Tab label="Všetky" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              {loadingConversations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={32} />
                </Box>
              ) : conversations.filter(c => c.lastMessage).length === 0 ? (
                <EmptyStateContainer>
                  <Typography variant="body1" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Nemáte žiadne nedávne konverzácie.
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Použite vyhľadávacie pole vyššie, zadajte meno alebo email používateľa a vytvorte novú konverzáciu.
                  </Typography>
                </EmptyStateContainer>
              ) : (
                <ConversationList>
                  {conversations
                    .filter(conversation => conversation.lastMessage)
                    .map((conversation) => {
                      const { name, photoURL } = getOtherUserInfo(conversation);
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
                                <Typography variant="caption" color="textSecondary">
                                  {formatTime(conversation.lastMessage?.timestamp)}
                                </Typography>
                              </Box>
                            }
                            secondary={
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
                                  {conversation.lastMessage?.text}
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
                            }
                          />
                        </ListItem>
                      );
                    })}
                </ConversationList>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {loadingConversations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress size={32} />
                </Box>
              ) : conversations.length === 0 ? (
                <EmptyStateContainer>
                  <Typography variant="body1" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Nemáte žiadne konverzácie.
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Použite vyhľadávacie pole vyššie, zadajte meno alebo email používateľa a vytvorte novú konverzáciu.
                  </Typography>
                </EmptyStateContainer>
              ) : (
                <ConversationList>
                  {conversations.map((conversation) => {
                    const { name, photoURL } = getOtherUserInfo(conversation);
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
                              {conversation.lastMessage && (
                                <Typography variant="caption" color="textSecondary">
                                  {formatTime(conversation.lastMessage?.timestamp)}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            conversation.lastMessage ? (
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
                            )
                          }
                        />
                      </ListItem>
                    );
                  })}
                </ConversationList>
              )}
            </TabPanel>
          </>
        )}
      </ChatContainer>
    </Drawer>
  );
};

export default ChatDrawer; 