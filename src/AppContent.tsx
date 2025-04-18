import React, { useState, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import Box from '@mui/material/Box';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Team from './components/Team';
import Contacts from './components/Contacts';
import Settings from './components/Settings';
import TrackedTransports from './components/TrackedTransports';
import BusinessCases from './components/BusinessCases';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';
import RegisterUser from './components/RegisterUser';
import OrdersForm from './components/Orders';
import NewOrderForm from './components/NewOrderForm';
import InvoicesPage from './components/Invoices';
import VehicleMap from './components/VehicleMap';
import Notifications from './components/Notifications';
import { useThemeMode } from './contexts/ThemeContext';
import ChatDrawer from './components/chat/ChatDrawer';
import { useChat } from './contexts/ChatContext';

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

type AppContainerProps = {
  isDarkMode: boolean;
  children: React.ReactNode;
};

type PageContentProps = {
  isDarkMode: boolean;
  children: React.ReactNode;
  sx?: Record<string, any>;
};

const AppContainer = ({ isDarkMode, children }: AppContainerProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      background: isDarkMode ? 'transparent' : '#ffffff',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {children}
  </Box>
);

const PageContent = ({ isDarkMode, children, sx = {} }: PageContentProps) => (
  <Box
    sx={{
      flexGrow: 1,
      marginTop: '48px',
      padding: '24px 16px',
      background: isDarkMode ? 'transparent' : '#ffffff',
      position: 'relative',
      zIndex: 1,
      minHeight: 'calc(100vh - 48px)',
      overflowX: 'hidden',
      '@media (max-width: 600px)': {
        marginTop: '40px',
        padding: '16px',
        minHeight: 'calc(100vh - 40px)',
      },
      ...sx
    }}
  >
    {isDarkMode && (
      <Box 
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.03,
          background: `radial-gradient(circle at 20% 30%, rgba(255, 159, 67, 0.8) 0%, transparent 100px),
                      radial-gradient(circle at 80% 40%, rgba(48, 43, 99, 0.8) 0%, transparent 200px)`,
          pointerEvents: 'none',
        }}
      />
    )}
    {children}
  </Box>
);

const AppContent: React.FC = () => {
  const { isDarkMode } = useThemeMode();
  const [chatOpen, setChatOpen] = useState(false);

  const toggleChat = () => setChatOpen(prev => !prev);
  const closeChat = () => setChatOpen(false);

  const { unreadConversationsCount, hasNewMessages } = useChat();

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
        <AppContainer isDarkMode={isDarkMode}>
          <Routes>
            {/* Verejné cesty */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-user" element={<RegisterUser />} />
            <Route path="/accept-invitation/:invitationId" element={<RegisterUser />} />
            
            {/* Chránené cesty */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <Dashboard />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/team" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <Team />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/contacts" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <Contacts />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/settings" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <Settings />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/tracked-transports" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <TrackedTransports />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/business-cases" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <BusinessCases />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/orders" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <OrdersForm />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/nova-objednavka" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <NewOrderForm />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/invoices" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <InvoicesPage />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/vehicle-map" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <VehicleMap />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
            <Route path="/notifications" element={
              <PrivateRoute>
                <PageContent isDarkMode={isDarkMode} sx={{ marginRight: chatOpen ? '320px' : 0, transition: 'margin-right 0.3s ease-in-out' }}>
                  <Navbar />
                  <Notifications />
                </PageContent>
                <ChatDrawer open={chatOpen} onClose={closeChat} />
              </PrivateRoute>
            } />
          </Routes>
        </AppContainer>
      </ChatUIContext.Provider>
    </MuiThemeProvider>
  );
};

export default AppContent; 