import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, Avatar, Divider, Badge } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/ChatService';
import { Chat } from '../../types/chat';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const ChatList: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.uid || !currentUser?.companyID) return;

    const unsubscribe = chatService.getChatsByUserId(currentUser.uid, (chatList: Chat[]) => {
      const filteredChats = chatList.filter(chat => chat.companyID === currentUser.companyID);
      setChats(filteredChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleChatClick = (chatId: string) => {
    navigate(`/chats/${chatId}`);
  };

  const getOtherParticipantId = (chat: Chat) => {
    return chat.participants.find(id => id !== currentUser?.uid) || '';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Načítavanie konverzácií...</Typography>
      </Box>
    );
  }

  if (chats.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Nemáte žiadne konverzácie</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {chats.map((chat, index) => {
        const otherParticipantId = getOtherParticipantId(chat);
        const lastMessageTime = chat.lastMessageTimestamp?.toDate ? 
          formatDistanceToNow(chat.lastMessageTimestamp.toDate(), { addSuffix: true }) : '';

        return (
          <React.Fragment key={chat.id}>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleChatClick(chat.id)}>
                <Avatar sx={{ mr: 2 }}>
                  {otherParticipantId.substring(0, 2).toUpperCase()}
                </Avatar>
                <ListItemText 
                  primary={
                    <Typography component="span" variant="body1">
                      {otherParticipantId}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                      }}
                    >
                      <span style={{ maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.lastMessage}
                      </span>
                      <span>{lastMessageTime}</span>
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
            {index < chats.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default ChatList; 