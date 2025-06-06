import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  useTheme,
  styled,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  useMediaQuery,
  Fade,
  Toolbar,
  IconButton,
  AppBar,
  Drawer,
  Card,
  ListItemButton} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LocalShipping,
  People,
  Map,
  Business,
  Payment,
  Speed,
  PhoneAndroid,
  Verified,
  MenuBook,
  QueryStats,
  DataSaverOn,
  Biotech,
  Menu as MenuIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeMode } from '../../contexts/ThemeContext';

// Navigation Menu
const NavbarContainer = styled(AppBar)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  padding: '15px 0',
  transition: 'all 0.3s ease',
  position: 'fixed',
  height: '80px',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 1000,
  '&.scrolled': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(16, 14, 60, 0.9)' 
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '10px 0',
    height: '70px',
  }
}));

const NavButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(2),
  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
  fontSize: '0.95rem',
  fontWeight: 500,
  textTransform: 'none',
  '&:hover': {
    background: 'rgba(255, 159, 67, 0.1)',
  },
  '&.active': {
    color: '#ff9f43',
    fontWeight: 600,
  }
}));

const ScrollToTopButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  bottom: '30px',
  right: '30px',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(16, 14, 60, 0.8)' 
    : 'rgba(255, 255, 255, 0.9)',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
  zIndex: 1000,
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(16, 14, 60, 0.9)' 
      : 'rgba(255, 255, 255, 1)',
  }
}));

// Logo container
const LogoContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px',
  '@media (max-width: 900px)': {
    marginBottom: '10px',
  }
}));

const LogoImage = styled('img', {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  width: '120px',
  height: 'auto',
  filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0)',
  cursor: 'pointer',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

// Section styling
const Section = styled(Box)(() => ({
  padding: '100px 0',
  position: 'relative',
  '@media (max-width: 900px)': {
    padding: '60px 0',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '150px',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 159, 67, 0.5), transparent)',
  }
}));

// Hero section styling
const HeroSection = styled(Box)(() => ({
  minHeight: '100vh',
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '120px 0 80px',
  position: 'relative',
  width: '100vw',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  '@media (max-width: 900px)': {
    padding: '100px 0 60px',
    height: 'auto',
    minHeight: '100vh',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100px',
    background: 'linear-gradient(to top, rgba(16, 14, 60, 0.1), transparent)',
    pointerEvents: 'none',
  }
}));

// Carousel styled components
const CarouselContainer = styled(Box)(({ _theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  position: 'relative',
  padding: '30px 0',
}));

const CarouselNavButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)',
  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
  zIndex: 10,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
  },
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
  width: '40px',
  height: '40px',
}));

// App screenshot box
const ScreenshotBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode, _theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '20px',
  boxShadow: isDarkMode 
    ? '0 20px 80px rgba(0, 0, 0, 0.6)' 
    : '0 20px 80px rgba(0, 0, 0, 0.15)',
  width: '100%',
  minHeight: '400px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: isDarkMode ? '#1a1a2e' : '#f5f7fa',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: isDarkMode
      ? 'linear-gradient(145deg, rgba(48, 43, 99, 0.15) 0%, rgba(36, 36, 62, 0.15) 100%)'
      : 'none',
    pointerEvents: 'none',
    zIndex: 1,
  },
  '& img': {
    width: '100%',
    height: 'auto',
    maxHeight: '600px',
    objectFit: 'contain',
    display: 'block',
    transition: 'transform 0.5s ease',
  },
  '&:hover img': {
    transform: 'scale(1.02)',
  },
}));

// Feature cards
const FeatureCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  height: '100%',
  background: isDarkMode 
    ? 'rgba(28, 28, 45, 0.8)' 
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  overflow: 'hidden',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  boxShadow: isDarkMode
    ? '0 10px 30px rgba(0, 0, 0, 0.3)'
    : '0 10px 30px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: isDarkMode
      ? '0 15px 40px rgba(0, 0, 0, 0.4)'
      : '0 15px 40px rgba(0, 0, 0, 0.12)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 159, 67, 0.3)' : 'rgba(255, 159, 67, 0.3)'}`,
  }
}));

const FeatureIcon = styled(Avatar)(({ _theme }) => ({
  backgroundColor: '#ff9f43',
  width: 56,
  height: 56,
  marginBottom: 16,
  boxShadow: '0 8px 20px rgba(255, 159, 67, 0.3)',
}));

const SectionTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '2.5rem',
  fontWeight: 700,
  marginBottom: '15px',
  position: 'relative',
  display: 'inline-block',
  color: isDarkMode ? '#ffffff' : '#333333',
  '@media (max-width: 900px)': {
    fontSize: '2rem',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80px',
    height: '4px',
    background: 'linear-gradient(90deg, #ff9f43, #ff6b6b)',
    borderRadius: '2px',
  }
}));

const SectionSubtitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.2rem',
  fontWeight: 400,
  maxWidth: '700px',
  margin: '0 auto 40px',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  '@media (max-width: 900px)': {
    fontSize: '1rem',
    marginBottom: '30px',
  }
}));

// CTA buttons
const GradientButton = styled(Button)(({ _theme }) => ({
  padding: '12px 35px',
  fontSize: '1.1rem',
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)',
  },
  '@media (max-width: 900px)': {
    padding: '10px 30px',
    fontSize: '1rem',
  }
}));

const PrimaryButton = styled(GradientButton)({
  background: 'linear-gradient(45deg, #00b894 0%, #55efc4 100%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(45deg, #00a382 0%, #4bd4af 100%)',
  }
});

const SecondaryButton = styled(GradientButton)({
  background: 'linear-gradient(45deg, #ff9f43 0%, #ffbe76 100%)',
  color: 'white',
  '&:hover': {
    background: 'linear-gradient(45deg, #f39839 0%, #f2b56e 100%)',
  }
});

// Testimonial section
const TestimonialCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '30px',
  backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.7)' : 'rgba(255, 255, 255, 0.9)',
  borderRadius: '16px',
  boxShadow: isDarkMode 
    ? '0 10px 30px rgba(0, 0, 0, 0.25)' 
    : '0 10px 30px rgba(0, 0, 0, 0.05)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '5px',
    background: 'linear-gradient(90deg, #ff9f43, #ff6b6b)',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
  },
  minHeight: '250px'
}));

// Benefit list
const StyledListItem = styled(ListItem)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '10px 0',
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: '#ff9f43',
  },
  '& .MuiListItemText-primary': {
    fontSize: '1.1rem',
    fontWeight: 500,
    color: isDarkMode ? '#ffffff' : '#333333',
  },
  '& .MuiListItemText-secondary': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
  }
}));

// Animation variants for framer-motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { currentUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { toggleTheme } = useThemeMode();

  // Screenshot carousel
  const [activeIndex, setActiveIndex] = useState(0);
  const screenshots = [
    { src: "/Images/dashboard-preview.jpg", alt: "CORE Dashboard", themeSpecific: 'dark' },
    { src: "/Images/whiteview.jpg", alt: "Svetlý motív aplikácie", themeSpecific: 'light' },
    { src: "/Images/tracked-transports.jpg", alt: "Sledovanie prepráv" },
    { src: "/Images/mapview.jpg", alt: "Pohľad na mapu" },
    { src: "/Images/orders.jpg", alt: t('navigation.orders') },
    { src: "/Images/businesscases.jpg", alt: "Obchodné prípady" },
    { src: "/Images/contacs.jpg", alt: "Kontakty" },
    { src: "/Images/team.jpg", alt: "Tímová spolupráca" },
    { src: "/Images/setttings.jpg", alt: "Nastavenia" }
  ];

  // Nastavenie prvého obrázka podľa témy
  useEffect(() => {
    if (isDarkMode) {
      // Tmavá téma - zobrazíme dashboard-preview.jpg (index 0)
      setActiveIndex(0);
    } else {
      // Svetlá téma - zobrazíme whiteview.jpg (index 1)
      setActiveIndex(1);
    }
  }, [isDarkMode]);

  const handlePrevImage = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === 0 ? screenshots.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setActiveIndex((prevIndex) => 
      prevIndex === screenshots.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Handle scroll events for navbar and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 150;
      if (window.scrollY > scrollThreshold) {
        if (!scrolled) {
          setScrolled(true);
        }
        setShowScrollTop(true);
      } else {
        if (scrolled) {
          setScrolled(false);
        }
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Scroll to section functions
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const menuHeight = scrolled ? 70 : 80;
      const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - menuHeight - 20;
      
      window.scrollTo({
        top: sectionTop,
        behavior: 'smooth'
      });
    }
    // Close mobile menu if open
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    if (currentUser) {
      navigate('/dashboard');
    } else {
      scrollToTop();
    }
  };

  // Benefity pre používateľov
  const benefits = [
    { 
      icon: <LocalShipping fontSize="large" />, 
      title: 'Správa vozového parku',
      description: 'Sledujte pohyb, údržbu a náklady všetkých vašich vozidiel v reálnom čase.' 
    },
    { 
      icon: <People fontSize="large" />, 
      title: 'Evidencia vodičov',
      description: 'Kompletná správa vodičov, ich časov jázd a zostatkov dovoleniek.' 
    },
    { 
      icon: <Map fontSize="large" />, 
      title: 'Plánovanie trás',
      description: 'Optimalizujte trasy pre maximálnu efektivitu a minimálne náklady.' 
    },
    { 
      icon: <Business fontSize="large" />, 
      title: 'Správa zákazníkov',
      description: 'Organizovaná databáza všetkých vašich klientov, kontaktov a histórie.' 
    },
    { 
      icon: <Payment fontSize="large" />, 
      title: 'Fakturácia',
      description: 'Automatizované vytváranie a odosielanie faktúr priamo zo systému.' 
    },
    { 
      icon: <QueryStats fontSize="large" />, 
      title: 'Analytické reporty',
      description: 'Podrobné štatistiky a reporty pre informované obchodné rozhodnutia.' 
    },
    { 
      icon: <DataSaverOn fontSize="large" />, 
      title: 'Cloud riešenie',
      description: 'Prístup ku všetkým dátam kedykoľvek a kdekoľvek.' 
    },
    { 
      icon: <PhoneAndroid fontSize="large" />, 
      title: 'Mobilná aplikácia',
      description: 'Pre vodičov a dispečerov - kompletná funkcionalita na cestách.' 
    },
  ];

  const features = [
    {
      icon: <Speed fontSize="large" />,
      title: 'Efektivita prevádzky',
      description: 'Optimalizujte každý aspekt vašich logistických operácií a šetrite až 25% nákladov.'
    },
    {
      icon: <MenuBook fontSize="large" />,
      title: 'Komplexná evidencia',
      description: 'Všetky informácie o objednávkach, zákazkách, vodičoch a vozidlách na jednom mieste.'
    },
    {
      icon: <Verified fontSize="large" />,
      title: 'Jednoduchosť použitia',
      description: 'Intuitívne rozhranie navrhnuté pre rýchlu a efektívnu prácu bez dlhého školenia.'
    },
    {
      icon: <Biotech fontSize="large" />,
      title: 'Špičkové technológie',
      description: 'Moderné technológie a postupy pre maximálnu spoľahlivosť a bezpečnosť vašich dát.'
    }
  ];

  // Menu items for navigation
  const menuItems = [
    { label: 'Domov', id: 'hero' },
    { label: 'Výhody', id: 'features' },
    { label: 'Funkcie', id: 'benefits' },
    { label: 'Referencie', id: 'testimonials' },
    { label: 'Začať', id: 'cta' },
  ];

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' 
          : 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
        color: isDarkMode ? '#ffffff' : '#333333',
        overflow: 'hidden',
        position: 'relative',
        backgroundAttachment: 'fixed',
        '& > *': {
          position: 'relative',
          zIndex: 1,
        }
      }}
    >
      <Box 
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          opacity: 0.03,
          background: `radial-gradient(circle at 20% 30%, ${isDarkMode ? 'rgba(255, 159, 67, 0.8)' : 'rgba(255, 159, 67, 0.4)'} 0%, transparent 100px),
                      radial-gradient(circle at 80% 40%, ${isDarkMode ? 'rgba(48, 43, 99, 0.8)' : 'rgba(48, 43, 99, 0.4)'} 0%, transparent 200px)`,
          pointerEvents: 'none',
        }}
      />

      {/* Fixed Navigation */}
      <NavbarContainer 
        className={scrolled ? 'scrolled' : ''}
        position="fixed"
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LogoImage 
                src="/AESA black.svg" 
                alt="AESA Logo" 
                isDarkMode={isDarkMode} 
                onClick={handleLogoClick}
                sx={{ width: '80px', mr: 2 }}
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: isDarkMode ? '#fff' : '#333',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                CORE
              </Typography>
            </Box>

            {/* Desktop Menu */}
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              {menuItems.map((item) => (
                <NavButton 
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </NavButton>
              ))}
              <NavButton 
                onClick={() => navigate('/login')}
                sx={{ 
                  ml: 3, 
                  color: isDarkMode ? '#ff9f43' : '#ff9f43',
                  fontWeight: 600
                }}
              >
                Prihlásiť sa
              </NavButton>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  ml: 1,
                  color: isDarkMode ? '#fff' : '#333',
                  '&:hover': {
                    background: 'rgba(255, 159, 67, 0.1)',
                  }
                }}
                aria-label="prepnúť tému"
              >
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>

            {/* Mobile Menu Toggle */}
            <IconButton 
              edge="end" 
              color="inherit" 
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </NavbarContainer>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '70%',
            maxWidth: '300px',
            background: isDarkMode 
              ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 100%)' 
              : 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
            boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)',
            padding: '20px',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton 
            onClick={() => setMobileMenuOpen(false)}
            sx={{ color: isDarkMode ? '#fff' : '#333' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItemButton 
              key={item.id} 
              onClick={() => scrollToSection(item.id)}
              sx={{ 
                py: 1.5,
                borderRadius: '8px',
                mb: 1,
                '&:hover': {
                  background: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              <ListItemText
                primary={
                  <Typography 
                    sx={{ 
                      color: isDarkMode ? '#fff' : '#333',
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
          <Divider sx={{ my: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          <ListItemButton 
            onClick={() => {
              navigate('/login');
              setMobileMenuOpen(false);
            }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              background: 'rgba(255, 159, 67, 0.1)',
              '&:hover': {
                background: 'rgba(255, 159, 67, 0.2)',
              }
            }}
          >
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: '#ff9f43',
                    fontWeight: 600,
                  }}
                >
                  Prihlásiť sa
                </Typography>
              }
            />
          </ListItemButton>
          <ListItemButton 
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              '&:hover': {
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {isDarkMode ? 'Svetlý režim' : 'Tmavý režim'}
                </Typography>
              }
              secondary={
                isDarkMode ? <Brightness7Icon sx={{ color: '#fff' }} /> : <Brightness4Icon sx={{ color: '#333' }} />
              }
            />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <Fade in={showScrollTop}>
          <ScrollToTopButton 
            onClick={scrollToTop}
            size="medium"
          >
            <ArrowDownIcon sx={{ transform: 'rotate(180deg)' }} />
          </ScrollToTopButton>
        </Fade>
      )}

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section */}
        <HeroSection id="hero">
          <Fade in={true} timeout={1000}>
            <Box>
              <LogoContainer>
                <LogoImage 
                  src="/AESA black.svg" 
                  alt="AESA Logo" 
                  isDarkMode={isDarkMode} 
                  onClick={handleLogoClick}
                />
              </LogoContainer>
              
              <Typography 
                variant="h1" 
                component="h1" 
                sx={{ 
                  fontSize: { xs: '2.5rem', md: '4rem' }, 
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  mb: 2,
                  bgGradient: 'linear(to-r, #ff9f43, #ff6b6b)',
                  bgClip: 'text',
                  textAlign: 'center'
                }}
              >
                CORE
              </Typography>
              
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '1.5rem', md: '2rem' }, 
                  mb: 3,
                  fontWeight: 600,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
                  maxWidth: '800px',
                  mx: 'auto',
                  textAlign: 'center'
                }}
              >
                Komplexné riešenie pre moderne riadenú špedičnú spoločnosť
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  mb: 5,
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  maxWidth: '700px',
                  mx: 'auto',
                  textAlign: 'center'
                }}
              >
                Optimalizujte logistiku, zefektívnite správu vozidiel a vodičov a zvýšte ziskovosť vašej špedičnej spoločnosti s profesionálnym systémom CORE od AESA.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <PrimaryButton onClick={() => navigate('/login')}>
                  Prihlásiť sa
                </PrimaryButton>
                <SecondaryButton onClick={() => navigate('/register')}>
                  Registrovať firmu
                </SecondaryButton>
              </Box>

              <Box sx={{ mt: 8, textAlign: 'center', opacity: 0.7 }}>
                <ArrowDownIcon 
                  fontSize="large"
                  sx={{ 
                    animation: 'bounce 2s infinite',
                    '@keyframes bounce': {
                      '0%, 20%, 50%, 80%, 100%': {
                        transform: 'translateY(0)',
                      },
                      '40%': {
                        transform: 'translateY(-20px)',
                      },
                      '60%': {
                        transform: 'translateY(-10px)',
                      }
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => scrollToSection('features')}
                />
              </Box>
            </Box>
          </Fade>
        </HeroSection>

        {/* Application Screenshots Carousel */}
        <Box sx={{ 
          mb: 10, 
          mt: { xs: 5, md: 10 },
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Fade in={true} timeout={1500}>
            <CarouselContainer>
              {/* Ľavé navigačné tlačidlo */}
              <CarouselNavButton 
                onClick={handlePrevImage}
                sx={{ left: { xs: '5px', md: '20px' } }}
              >
                <ChevronLeftIcon />
              </CarouselNavButton>

              {/* Hlavný obrázok */}
              <Box sx={{ 
                width: '100%', 
                maxWidth: '900px', 
                mx: 'auto', 
                position: 'relative',
                height: { xs: '400px', md: '600px' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -300 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    style={{ 
                      width: '100%',
                      position: 'absolute',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <ScreenshotBox isDarkMode={isDarkMode} sx={{ width: '100%' }}>
                      <img 
                        src={screenshots[activeIndex].src} 
                        alt={screenshots[activeIndex].alt} 
                        style={{ 
                          width: '100%', 
                          height: 'auto', 
                          maxHeight: '600px', 
                          objectFit: 'contain',
                          borderRadius: '16px',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          
                          // Vytvorenie fallback komponentu
                          const fallbackDiv = document.createElement('div');
                          fallbackDiv.style.width = '100%';
                          fallbackDiv.style.height = isMobile ? '350px' : '400px';
                          fallbackDiv.style.display = 'flex';
                          fallbackDiv.style.alignItems = 'center';
                          fallbackDiv.style.justifyContent = 'center';
                          fallbackDiv.style.flexDirection = 'column';
                          fallbackDiv.style.backgroundColor = isDarkMode ? '#24243e' : '#f5f7fa';
                          fallbackDiv.style.borderRadius = '20px';
                          fallbackDiv.style.backgroundImage = isDarkMode 
                            ? 'linear-gradient(135deg, rgba(16, 14, 60, 0.4) 0%, rgba(48, 43, 99, 0.4) 50%, rgba(36, 36, 62, 0.4) 100%)'
                            : 'linear-gradient(135deg, rgba(245, 247, 250, 0.6) 0%, rgba(228, 229, 230, 0.6) 100%)';
                          
                          // Vytvorenie nadpisu
                          const heading = document.createElement('h2');
                          heading.textContent = screenshots[activeIndex].alt;
                          heading.style.fontWeight = '700';
                          heading.style.color = isDarkMode ? '#ffffff' : '#333333';
                          heading.style.marginBottom = '16px';
                          heading.style.fontSize = '1.5rem';
                          heading.style.textAlign = 'center';
                          
                          // Pridanie elementov do fallbacku
                          fallbackDiv.appendChild(heading);
                          
                          // Nahradenie img elementu s fallbackom
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.appendChild(fallbackDiv);
                          }
                        }}
                      />
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          bottom: '20px', 
                          left: '50%', 
                          transform: 'translateX(-50%)',
                          background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? 'white' : 'black' }}>
                          {screenshots[activeIndex].alt}
                        </Typography>
                      </Box>
                    </ScreenshotBox>
                  </motion.div>
                </AnimatePresence>
              </Box>

              {/* Pravé navigačné tlačidlo */}
              <CarouselNavButton 
                onClick={handleNextImage}
                sx={{ right: { xs: '5px', md: '20px' } }}
              >
                <ChevronRightIcon />
              </CarouselNavButton>
              
              {/* Navigácia pre galériu */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, position: 'absolute', bottom: '-30px', width: '100%' }}>
                {screenshots.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      mx: 0.5,
                      bgcolor: activeIndex === index ? '#ff9f43' : isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.2)',
                        bgcolor: activeIndex === index ? '#ff9f43' : isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
                      }
                    }}
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </Box>
            </CarouselContainer>
          </Fade>
        </Box>

        {/* Features Section */}
        <Section id="features">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <SectionTitle variant="h2">
              Prečo si vybrať CORE?
            </SectionTitle>
            <SectionSubtitle variant="h6">
              Poskytujeme komplexné a moderné riešenie, ktoré zefektívni každý aspekt vašej špedičnej spoločnosti
            </SectionSubtitle>
          </Box>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <motion.div variants={itemVariants}>
                    <FeatureCard isDarkMode={isDarkMode}>
                      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <FeatureIcon>
                          {feature.icon}
                        </FeatureIcon>
                        <Typography variant="h5" gutterBottom sx={{ 
                          fontWeight: 600, 
                          color: isDarkMode ? '#ffffff' : '#333333',
                          mb: 1
                        }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                        }}>
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </FeatureCard>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Section>

        {/* Benefits Section */}
        <Section id="benefits">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <SectionTitle variant="h2">
              Všetko čo potrebujete
            </SectionTitle>
            <SectionSubtitle variant="h6">
              CORE poskytuje funkcionalitu, ktorá pokrýva každý aspekt prevádzky špedičnej spoločnosti
            </SectionSubtitle>
          </Box>

          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Box
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    p: 3,
                    boxShadow: isDarkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.07)',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  }}
                >
                  <List>
                    {benefits.slice(0, 4).map((benefit, index) => (
                      <StyledListItem key={index} isDarkMode={isDarkMode}>
                        <ListItemIcon>
                          {benefit.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit.title} 
                          secondary={benefit.description}
                        />
                      </StyledListItem>
                    ))}
                  </List>
                </Box>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Box
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                    p: 3,
                    boxShadow: isDarkMode ? '0 8px 30px rgba(0, 0, 0, 0.3)' : '0 8px 30px rgba(0, 0, 0, 0.07)',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                  }}
                >
                  <List>
                    {benefits.slice(4, 8).map((benefit, index) => (
                      <StyledListItem key={index} isDarkMode={isDarkMode}>
                        <ListItemIcon>
                          {benefit.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={benefit.title} 
                          secondary={benefit.description}
                        />
                      </StyledListItem>
                    ))}
                  </List>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Section>

        {/* Testimonial */}
        <Section id="testimonials">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <SectionTitle variant="h2">
              Čo o nás hovoria klienti
            </SectionTitle>
            <SectionSubtitle variant="h6">
              Reálne skúsenosti našich zákazníkov
            </SectionSubtitle>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={10} lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <TestimonialCard isDarkMode={isDarkMode}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontSize: '1.2rem', 
                      fontStyle: 'italic', 
                      mb: 3, 
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    "Systém CORE nám umožnil automatizovať značnú časť administratívy a zefektívniť plánovanie prepravy. 
                    Sledovanie vozidiel a vodičov v reálnom čase nám výrazne pomáha pri rozhodovaní a komunikácii s klientmi. 
                    Za rok používania sme znížili náklady o 18% a zvýšili objem prepravy o 23%."
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        mr: 2,
                        bgcolor: '#ff9f43',
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '1.5rem'
                      }}
                    >
                      PN
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#333333' }}>
                        Peter Novák
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                        Riaditeľ, SpeedLogistic s.r.o.
                      </Typography>
                    </Box>
                  </Box>
                </TestimonialCard>
              </motion.div>
            </Grid>
          </Grid>
        </Section>

        {/* CTA Section */}
        <Section id="cta" sx={{ pb: 10, '&::after': { display: 'none' } }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Box 
              sx={{ 
                p: { xs: 4, md: 8 }, 
                borderRadius: '20px',
                background: isDarkMode 
                  ? 'linear-gradient(135deg, rgba(48, 43, 99, 0.95) 0%, rgba(36, 36, 62, 0.95) 100%)' 
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 250, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                boxShadow: isDarkMode 
                  ? '0 25px 50px rgba(0, 0, 0, 0.3)' 
                  : '0 25px 50px rgba(0, 0, 0, 0.07)',
              }}
            >
              <Typography 
                variant="h3" 
                component="h2" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 2,
                  color: isDarkMode ? '#ffffff' : '#333333',
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  textAlign: 'center'
                }}
              >
                Pripravení zmodernizovať vašu špedičnú spoločnosť?
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4, 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  maxWidth: '700px',
                  mx: 'auto',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  textAlign: 'center'
                }}
              >
                Začnite už dnes a získajte náskok pred konkurenciou. Prvých 30 dní zadarmo, bez záväzkov.
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                <PrimaryButton onClick={() => navigate('/register')} size="large">
                  Vyskúšajte CORE na 14 dní úplne zadarmo
                </PrimaryButton>
              </Box>
            </Box>
          </motion.div>
        </Section>

        {/* Footer */}
        <Box component="footer" sx={{ py: 5, textAlign: 'center' }}>
          <Divider sx={{ mb: 4, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
          <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
            © {new Date().getFullYear()} AESA Group, SE. Všetky práva vyhradené.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Home; 