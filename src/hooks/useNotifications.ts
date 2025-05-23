import { useEffect, useRef, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  onClick?: () => void;
  playSound?: boolean;
}

export const useNotifications = () => {
  const originalTitle = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializácia
  useEffect(() => {
    originalTitle.current = document.title;
    
    // Vytvorenie audio elementu pre notifikačný zvuk
    audioRef.current = new Audio();
    audioRef.current.volume = 0.3; // Stlmené
    
    // Môžete použiť vlastný zvuk alebo systémový
    // audioRef.current.src = '/notification-sound.mp3'; // Ak máte vlastný zvuk
    
    return () => {
      // Cleanup pri unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Žiadosť o povolenie notifikácií
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Tento prehliadač nepodporuje desktop notifikácie');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Desktop notifikácie sú zakázané');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Chyba pri žiadosti o povolenie notifikácií:', error);
      return false;
    }
  }, []);

  // Zobrazenie desktop notifikácie
  const showNotification = useCallback(async (options: NotificationOptions): Promise<void> => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const notificationOptions: any = {
        body: options.body,
        icon: options.icon || '/favicon.png',
        badge: options.badge || '/favicon.png',
        tag: options.tag || 'default',
        data: options.data,
        requireInteraction: true,
        silent: false,
        timestamp: Date.now()
      };

      // Pridáme vibrate len ak je podporované (mobilné zariadenia)
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        notificationOptions.vibrate = [200, 100, 200];
      }

      const notification = new Notification(options.title, notificationOptions);

      // Kliknutie na notifikáciu
      notification.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      // Automatické zatvorenie po 10 sekundách
      setTimeout(() => {
        notification.close();
      }, 10000);

      // Prehranie zvuku ak je požadované
      if (options.playSound && audioRef.current) {
        try {
          // Použitie Web Audio API pre systémový zvuk
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
          console.warn('Nemožno prehrať notifikačný zvuk:', error);
        }
      }

    } catch (error) {
      console.error('Chyba pri zobrazovaní notifikácie:', error);
    }
  }, [requestPermission]);

  // Aktualizácia title stránky s počtom neprečítaných správ
  const updatePageTitle = useCallback((unreadCount: number) => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${originalTitle.current}`;
      
      // Animácia favicon-u (blikanie)
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        let isRed = false;
        const originalHref = favicon.href;
        
        const interval = setInterval(() => {
          if (unreadCount === 0) {
            clearInterval(interval);
            favicon.href = originalHref;
            return;
          }
          
          isRed = !isRed;
          // Môžete vytvoriť červený favicon pre upozornenie
          // favicon.href = isRed ? '/favicon-notification.png' : originalHref;
        }, 1000);
        
        // Zastavenie animácie po 10 sekundách
        setTimeout(() => {
          clearInterval(interval);
          if (favicon) {
            favicon.href = originalHref;
          }
        }, 10000);
      }
    } else {
      document.title = originalTitle.current;
    }
  }, []);

  // Kontrola, či sú notifikácie podporované
  const isSupported = 'Notification' in window;

  // Kontrola aktuálneho povolenia
  const getPermission = () => {
    if (!isSupported) return 'unsupported';
    return Notification.permission;
  };

  return {
    showNotification,
    updatePageTitle,
    requestPermission,
    isSupported,
    permission: getPermission()
  };
}; 