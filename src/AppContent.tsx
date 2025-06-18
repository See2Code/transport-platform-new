import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import Box from '@mui/material/Box';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import Navbar from './components/layout/Navbar';
import { 
  LazyDashboard as Dashboard,
  LazyTeam as Team,
  LazySettings as Settings,
  LazyVehicleMap as VehicleMap,
  LazyTrackedTransports as TrackedTransports,
  LazyBusinessCases as BusinessCases, 
  LazyOrdersForm as OrdersForm,
  LazyNewOrderForm as NewOrderForm,
  LazyNotifications as Notifications
} from './lazyComponents';
import Contacts from './components/management/Contacts';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Home from './components/layout/Home';
import PrivateRoute from './components/auth/PrivateRoute';
import RegisterUser from './components/auth/RegisterUser';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsOfUse from './components/legal/TermsOfUse';
import CookiePolicy from './components/legal/CookiePolicy';
import { useThemeMode } from './contexts/ThemeContext';
import ChatDrawer from './components/chat/ChatDrawer';
import NotificationPermission from './components/notifications/NotificationPermission';
import CookieBanner from './components/common/CookieBanner';
import { useChat } from './contexts/ChatContext';
import styled from '@emotion/styled';

// Konštanta pre šírku chat drawera
const DRAWER_WIDTH = 320;

// Vytvoríme kontext pre chat UI
type ChatUIContextType = {
  chatOpen: boolean;
  toggleChat: () => void;
  closeChat: () => void;
  unreadConversationsCount: number;
  hasNewMessages: boolean;
};

const ChatUIContext = createContext<ChatUIContextType | undefined>(undefined);

export const useChatUI = () => {
  const context = useContext(ChatUIContext);
  if (!context) {
    throw new Error('useChatUI musí byť použitý vnútri ChatUIProvider');
  }
  return context;
};

const AppContainer = styled(Box)(({ _theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  background: 'transparent',
  position: 'relative',
  overflow: 'hidden',
  transition: 'margin-right 0.3s ease-in-out',
}));

const ContentWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'chatOpen'
})<{ chatOpen: boolean }>(({ chatOpen }) => ({
  width: '100%',
  transition: 'margin-right 0.3s ease-in-out',
  marginRight: chatOpen ? `${DRAWER_WIDTH}px` : 0,
}));

const PageContent = styled(Box)(({ _theme }) => ({
  flexGrow: 1,
  marginTop: '48px',
  padding: '24px 16px',
  position: 'relative',
  zIndex: 1,
  minHeight: 'calc(100vh - 48px)',
  overflowX: 'hidden',
  transition: 'all 0.3s ease-in-out',
  '@media (max-width: 600px)': {
    marginTop: '48px',
    padding: '16px',
    minHeight: 'calc(100vh - 48px)',
  }
}));

const AppContent: React.FC = () => {
  const { isDarkMode } = useThemeMode();
  const [chatOpen, setChatOpen] = useState(false);

  const toggleChat = () => setChatOpen(prev => !prev);
  const closeChat = useCallback(() => setChatOpen(false), []);

  const { unreadConversationsCount, hasNewMessages } = useChat();

  // Tento useEffect pridáme na zvládanie ESC klávesu pre zatvorenie chatu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && chatOpen) {
        closeChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatOpen, closeChat]);

  // Event listener pre automatické otvorenie chatu z notifikácie
  useEffect(() => {
    const handleForceOpenChat = () => {
      if (!chatOpen) {
        setChatOpen(true);
      }
    };

    window.addEventListener('forceOpenChatDrawer', handleForceOpenChat);
    return () => {
      window.removeEventListener('forceOpenChatDrawer', handleForceOpenChat);
    };
  }, [chatOpen]);

  const chatUIValue = {
    chatOpen,
    toggleChat,
    closeChat,
    unreadConversationsCount,
    hasNewMessages
  };

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? '#0F0C29' : '#ffffff',
        paper: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#f5f5f5',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body': {
            background: isDarkMode 
              ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' 
              : '#ffffff',
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            margin: 0,
            padding: 0,
            minHeight: '100vh',
            width: '100%',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: isDarkMode 
              ? 'rgba(255, 159, 67, 0.5) rgba(0, 0, 0, 0.1)' 
              : 'rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.1)',
            '&::-webkit-scrollbar': {
              width: '8px',
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '4px',
              margin: '4px 0',
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDarkMode 
                ? 'rgba(255, 159, 67, 0.3)' 
                : 'rgba(0, 0, 0, 0.15)',
              borderRadius: '10px',
              border: isDarkMode 
                ? '2px solid rgba(16, 14, 60, 0.5)' 
                : '2px solid rgba(245, 245, 250, 0.5)',
              transition: 'all 0.3s ease-in-out',
              opacity: 0,
            },
            '&:hover::-webkit-scrollbar-thumb': {
              opacity: 1,
            },
            '&::-webkit-scrollbar-thumb:hover, &::-webkit-scrollbar-thumb:active': {
              background: isDarkMode 
                ? 'rgba(255, 159, 67, 0.7)' 
                : 'rgba(0, 0, 0, 0.3)',
              opacity: 1,
            },
          },
          '#root': {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            width: '100%',
            background: 'transparent',
          },
        },
      },
    },
  });

  const globalStyles = {
    '*': {
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
    },
    'html, body': {
      background: isDarkMode 
        ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' 
        : '#ffffff',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      width: '100%',
      overflowX: 'hidden',
    },
    '#root': {
      background: 'transparent',
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  };

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <ChatUIContext.Provider value={chatUIValue}>
        {isDarkMode && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: -1,
              background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)',
            }}
          />
        )}
        <AppContainer>
          <ContentWrapper chatOpen={chatOpen}>
            <Routes>
              {/* Verejné cesty */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-user" element={<RegisterUser />} />
              <Route path="/accept-invitation/:invitationId" element={<RegisterUser />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              
              {/* Chránené cesty */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Dashboard />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/team" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Team />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/contacts" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Contacts />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Settings />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/tracked-transports" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <TrackedTransports />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/tracked-shipments" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <TrackedTransports />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/business-cases" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <BusinessCases />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/orders" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <OrdersForm />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/nova-objednavka" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <NewOrderForm />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/vehicle-map" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <VehicleMap />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
              <Route path="/notifications" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Notifications />
                  </PageContent>
                  <ChatDrawer open={chatOpen} onClose={closeChat} />
                </PrivateRoute>
              } />
            </Routes>
          </ContentWrapper>
        </AppContainer>
        
        {/* Komponenty, ktoré sa zobrazujú globálne */}
        <NotificationPermission />
        <CookieBanner />
      </ChatUIContext.Provider>
    </MuiThemeProvider>
  );
};

export default AppContent; 