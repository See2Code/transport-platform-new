import React, { useEffect, useState, useCallback } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, Avatar, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/ChatService';
import { Chat as ChatType } from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';

interface Chat extends ChatType {
  otherParticipantId?: string;
}

const ChatList: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const getOtherParticipantId = useCallback((chat: ChatType) => {
    return chat.participants.find(id => id !== currentUser?.uid) || '';
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid || !currentUser?.companyID) return;

    const unsubscribe = chatService.getChatsByUserId(currentUser.uid, (chatList: ChatType[]) => {
      const filteredChats = chatList
        .filter(chat => chat.companyID === currentUser.companyID)
        .map(chat => ({
          ...chat,
          otherParticipantId: getOtherParticipantId(chat)
        }));
      setChats(filteredChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, getOtherParticipantId]);

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Načítavam...</Typography>
      </Box>
    );
  }

  return (
    <List>
      {chats.map((chat, index) => {
        const otherParticipantId = chat.otherParticipantId || '';

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
                    <Typography component="span" variant="body2" color="text.secondary">
                      {chat.lastMessage || 'Začnite konverzáciu...'}
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