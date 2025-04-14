import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { routerConfig } from './router/config';
import AppContent from './AppContent';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatProvider } from './contexts/ChatContext';

const App: React.FC = () => {
  return (
    <BrowserRouter future={routerConfig.future}>
      <AuthProvider>
        <ThemeProvider>
          <NotificationsProvider>
            <ChatProvider>
              <AppContent />
            </ChatProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
