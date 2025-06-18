import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  useTheme
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  color: '#ff9f43',
}));

const ContactBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 159, 67, 0.1)' 
    : 'rgba(255, 159, 67, 0.05)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 159, 67, 0.3)' 
    : 'rgba(255, 159, 67, 0.2)'}`,
  borderRadius: 8,
  padding: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

const COOKIE_PREFERENCES_KEY = 'cookiePreferences';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const CookiePolicy: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isEN = i18n.language === 'en';

  const [showSettings, setShowSettings] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Load saved preferences
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs);
      setPreferences({ necessary: true, ...parsed });
    }
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  const handleAcceptAll = () => {
    const newPrefs = { necessary: true, analytics: true, marketing: true };
    setPreferences(newPrefs);
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPrefs));
    localStorage.setItem('cookieConsent', 'accepted');
    
    // Spustiť event pre aktualizáciu bannera
    window.dispatchEvent(new Event('cookieConsentChanged'));
    
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleSaveSettings = () => {
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
    localStorage.setItem('cookieConsent', 'customized');
    
    // Spustiť event pre aktualizáciu bannera
    window.dispatchEvent(new Event('cookieConsentChanged'));
    
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
    setShowSettings(false);
  };

  const handlePreferenceChange = (type: keyof CookiePreferences, checked: boolean) => {
    if (type === 'necessary') return; // Cannot change necessary cookies
    setPreferences(prev => ({ ...prev, [type]: checked }));
  };

  const cookiesSK = {
    title: "Zásady používania súborov cookies",
    sections: [
      {
        title: "1. Úvod",
        content: [
          "Tieto zásady používania súborov cookies (ďalej len \"Zásady cookies\") vysvetľujú, ako spoločnosť AESA Group, SE, so sídlom Pekárska 11, 917 01 Trnava, Slovenská republika (IČO: 55361731, email: development@aesa.sk, telefón: +421 910 970 970, ďalej len \"Prevádzkovateľ\") používa súbory cookies a podobné technológie na webovej platforme AESA Transport Platform (ďalej len \"Platforma\").",
          "",
          "Používaním Platformy vyjadrujete súhlas s používaním cookies v súlade s týmito Zásadami."
        ]
      },
      {
        title: "2. Čo sú súbory cookies?",
        content: [
          "Súbory cookies sú malé textové súbory, ktoré sa ukladajú do vášho zariadenia (počítač, tablet, mobil) pri návšteve Platformy. Umožňujú nám zlepšovať funkčnosť Platformy, analyzovať jej používanie a poskytovať personalizované služby."
        ]
      },
      {
        title: "3. Typy používaných cookies",
        content: [
          "Na Platforme používame nasledujúce kategórie cookies:",
          "",
          "3.1 Technické (nevyhnutné) cookies",
          "",
          "• Účel: Zabezpečujú základnú funkčnosť Platformy, ako je prihlásenie, správa relácií (session management), autentifikácia a jazykové preferencie",
          "• Príklady: Cookies na ukladanie prihlasovacích údajov, výber jazyka",
          "• Doba uchovávania: Zvyčajne do ukončenia relácie alebo krátkodobo (max. 30 dní)",
          "• Súhlas: Tieto cookies sú nevyhnutné, a preto nevyžadujú váš súhlas",
          "",
          "3.2 Analytické cookies",
          "",
          "• Účel: Pomáhajú nám analyzovať, ako používate Platformu, aby sme mohli zlepšovať jej výkon a používateľskú skúsenosť. Zhromažďujú údaje o počte návštev, čase strávenom na stránke či chybách",
          "• Príklady: Štatistiky používania, monitorovanie výkonu, sledovanie chýb",
          "• Doba uchovávania: Až 2 roky",
          "• Súhlas: Vyžadujú váš súhlas, ktorý môžete udeliť alebo odmietnuť v nastaveniach cookies",
          "",
          "3.3 Marketingové cookies (plánované)",
          "",
          "• Účel: Slúžia na personalizáciu obsahu a reklám, behaviorálne cielenie a retargetingové kampane",
          "• Príklady: Sledovanie preferencií pre cielené reklamy",
          "• Doba uchovávania: Až 2 roky",
          "• Súhlas: Vyžadujú váš výslovný súhlas. Tieto cookies zatiaľ nie sú implementované, ale môžu byť pridané v budúcnosti"
        ]
      },
      {
        title: "4. Právny základ používania cookies",
        content: [
          "• Technické cookies: Oprávnený záujem Prevádzkovateľa (čl. 6 ods. 1 písm. f GDPR) na zabezpečení funkčnosti Platformy",
          "• Analytické a marketingové cookies: Váš súhlas (čl. 6 ods. 1 písm. a GDPR), ktorý môžete kedykoľvek odvolať"
        ]
      },
      {
        title: "5. Správa cookies",
        content: [
          "• Pri prvej návšteve Platformy vás vyzveme na udelenie súhlasu s používaním cookies. Súhlas môžete spravovať v nastaveniach cookies na Platforme",
          "• Cookies môžete kedykoľvek vymazať alebo zakázať v nastaveniach vášho prehliadača. Upozorňujeme, že zakázanie technických cookies môže obmedziť funkčnosť Platformy"
        ]
      },
      {
        title: "6. Služby tretích strán",
        content: [
          "Niektoré cookies pochádzajú od tretích strán, ktoré nám poskytujú služby:",
          "",
          "• Google Cloud Platform: Analytické nástroje a hostingové služby",
          "• Google Maps API: Mapové služby a geolokalizácia",
          "• Stripe (plánované): Spracovanie platieb a súvisiace analytické cookies",
          "",
          "Tieto služby môžu ukladať svoje vlastné cookies, na ktoré sa vzťahujú ich zásady ochrany osobných údajov."
        ]
      },
      {
        title: "7. Bezpečnosť a uchovávanie údajov",
        content: [
          "• Cookies sú šifrované (TLS/SSL) a chránené pred neoprávneným prístupom",
          "• Údaje z analytických a marketingových cookies uchovávame maximálne 2 roky, pokiaľ nie je uvedené inak",
          "• Po odvolaní súhlasu alebo vymazaní cookies budú príslušné údaje anonymizované alebo vymazané"
        ]
      },
      {
        title: "8. Vaše práva",
        content: [
          "V súvislosti s používaním cookies máte práva podľa GDPR:",
          "",
          "• Právo na informácie o spracovaní údajov (čl. 13-14)",
          "• Právo na prístup k údajom z cookies (čl. 15)",
          "• Právo na opravu nesprávnych údajov (čl. 16)",
          "• Právo na vymazanie údajov (čl. 17)",
          "• Právo na obmedzenie spracovania (čl. 18)",
          "• Právo namietať proti spracovaniu (čl. 21)",
          "• Právo podať sťažnosť na Úrad na ochranu osobných údajov SR (čl. 77):",
          "  - Adresa: Hraničná 12, 820 07 Bratislava",
          "  - Email: statny.dozor@pdp.gov.sk"
        ]
      },
      {
        title: "9. Kontakt",
        content: [
          "Ak máte otázky týkajúce sa používania cookies, kontaktujte nás:",
          "",
          "• Email: development@aesa.sk",
          "• Telefón: +421 910 970 970",
          "• Zodpovedná osoba: Róbert Sitár"
        ]
      },
      {
        title: "10. Záverečné ustanovenia",
        content: [
          "• Tieto Zásady cookies sú účinné od 18. júna 2025",
          "• Prevádzkovateľ si vyhradzuje právo aktualizovať Zásady s predchádzajúcim upozornením",
          "• Na právne vzťahy sa vzťahujú predpisy Slovenskej republiky a EÚ",
          "",
          "Používaním Platformy potvrdzujete, že ste si prečítali a porozumeli týmto Zásadám cookies."
        ]
      }
    ]
  };

  const cookiesEN = {
    title: "Cookie Usage Policy",
    sections: [
      {
        title: "1. Introduction",
        content: [
          "This Cookie Usage Policy (\"Cookie Policy\") explains how AESA Group, SE, with registered office at Pekárska 11, 917 01 Trnava, Slovak Republic (Company ID: 55361731, email: development@aesa.sk, phone: +421 910 970 970, hereinafter \"Operator\") uses cookies and similar technologies on the AESA Transport Platform web platform (\"Platform\").",
          "",
          "By using the Platform, you consent to the use of cookies in accordance with this Policy."
        ]
      },
      {
        title: "2. What are cookies?",
        content: [
          "Cookies are small text files that are stored on your device (computer, tablet, mobile) when you visit the Platform. They allow us to improve Platform functionality, analyze its usage, and provide personalized services."
        ]
      },
      {
        title: "3. Types of cookies used",
        content: [
          "We use the following categories of cookies on the Platform:",
          "",
          "3.1 Technical (necessary) cookies",
          "",
          "• Purpose: Ensure basic Platform functionality such as login, session management, authentication, and language preferences",
          "• Examples: Cookies for storing login credentials, language selection",
          "• Storage period: Usually until session ends or short-term (max. 30 days)",
          "• Consent: These cookies are necessary and therefore do not require your consent",
          "",
          "3.2 Analytical cookies",
          "",
          "• Purpose: Help us analyze how you use the Platform so we can improve its performance and user experience. They collect data about visit counts, time spent on pages, and errors",
          "• Examples: Usage statistics, performance monitoring, error tracking",
          "• Storage period: Up to 2 years",
          "• Consent: Require your consent, which you can grant or refuse in cookie settings",
          "",
          "3.3 Marketing cookies (planned)",
          "",
          "• Purpose: Used for content and advertising personalization, behavioral targeting, and retargeting campaigns",
          "• Examples: Tracking preferences for targeted advertising",
          "• Storage period: Up to 2 years",
          "• Consent: Require your explicit consent. These cookies are not yet implemented but may be added in the future"
        ]
      },
      {
        title: "4. Legal basis for cookie usage",
        content: [
          "• Technical cookies: Legitimate interest of the Operator (Art. 6(1)(f) GDPR) to ensure Platform functionality",
          "• Analytical and marketing cookies: Your consent (Art. 6(1)(a) GDPR), which you can withdraw at any time"
        ]
      },
      {
        title: "5. Cookie management",
        content: [
          "• On your first visit to the Platform, we will ask for your consent to use cookies. You can manage consent in the cookie settings on the Platform",
          "• You can delete or disable cookies at any time in your browser settings. Please note that disabling technical cookies may limit Platform functionality"
        ]
      },
      {
        title: "6. Third-party services",
        content: [
          "Some cookies come from third parties that provide us with services:",
          "",
          "• Google Cloud Platform: Analytics tools and hosting services",
          "• Google Maps API: Map services and geolocation",
          "• Stripe (planned): Payment processing and related analytical cookies",
          "",
          "These services may store their own cookies, which are subject to their privacy policies."
        ]
      },
      {
        title: "7. Security and data retention",
        content: [
          "• Cookies are encrypted (TLS/SSL) and protected from unauthorized access",
          "• Data from analytical and marketing cookies are retained for a maximum of 2 years, unless otherwise specified",
          "• After consent withdrawal or cookie deletion, relevant data will be anonymized or deleted"
        ]
      },
      {
        title: "8. Your rights",
        content: [
          "Regarding cookie usage, you have rights under GDPR:",
          "",
          "• Right to information about data processing (Art. 13-14)",
          "• Right to access cookie data (Art. 15)",
          "• Right to correction of incorrect data (Art. 16)",
          "• Right to data deletion (Art. 17)",
          "• Right to restriction of processing (Art. 18)",
          "• Right to object to processing (Art. 21)",
          "• Right to file a complaint with the Office for Personal Data Protection SR (Art. 77):",
          "  - Address: Hraničná 12, 820 07 Bratislava",
          "  - Email: statny.dozor@pdp.gov.sk"
        ]
      },
      {
        title: "9. Contact",
        content: [
          "If you have questions regarding cookie usage, contact us:",
          "",
          "• Email: development@aesa.sk",
          "• Phone: +421 910 970 970",
          "• Responsible person: Róbert Sitár"
        ]
      },
      {
        title: "10. Final provisions",
        content: [
          "• This Cookie Policy is effective from June 18, 2025",
          "• The Operator reserves the right to update the Policy with prior notification",
          "• Legal relationships are governed by Slovak Republic and EU regulations",
          "",
          "By using the Platform, you confirm that you have read and understood this Cookie Policy."
        ]
      }
    ]
  };

  const currentPolicy = isEN ? cookiesEN : cookiesSK;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackClick}
        sx={{
          mb: 3,
          color: '#ff9f43',
          '&:hover': {
            backgroundColor: 'rgba(255, 159, 67, 0.1)',
          },
        }}
      >
        {isEN ? 'Back to Home' : 'Späť na domovskú stránku'}
      </Button>

      {/* Cookie Settings Panel */}
      <StyledPaper sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 600,
            textAlign: 'center',
            mb: 3,
            color: '#ff9f43',
          }}
        >
          {isEN ? 'Cookie Settings' : 'Nastavenia súborov cookies'}
        </Typography>

        {savedMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {isEN ? 'Your preferences have been saved!' : 'Vaše preferencie boli uložené!'}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Quick Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleAcceptAll}
              sx={{
                backgroundColor: '#ff9f43',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#e68a28',
                },
              }}
            >
              {isEN ? 'Accept All Cookies' : 'Akceptovať všetky cookies'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowSettings(!showSettings)}
              sx={{
                borderColor: '#ff9f43',
                color: '#ff9f43',
                '&:hover': {
                  borderColor: '#e68a28',
                  backgroundColor: 'rgba(255, 159, 67, 0.1)',
                },
              }}
            >
              {isEN ? 'Customize Settings' : 'Vlastné nastavenia'}
            </Button>
          </Box>

          {/* Detailed Settings */}
          <Accordion expanded={showSettings} onChange={() => setShowSettings(!showSettings)}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(255, 159, 67, 0.05)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)',
                },
              }}
            >
              <Typography variant="h6" sx={{ color: '#ff9f43' }}>
                {isEN ? 'Cookie Categories' : 'Kategórie cookies'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Necessary Cookies */}
                <Box sx={{ p: 2, border: '1px solid rgba(255, 159, 67, 0.3)', borderRadius: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.necessary}
                        disabled={true}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ff9f43',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ff9f43',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {isEN ? 'Necessary Cookies' : 'Nevyhnutné cookies'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#e0e0e0' : '#666' }}>
                          {isEN 
                            ? 'Essential for basic website functionality. Cannot be disabled.'
                            : 'Nevyhnutné pre základnú funkčnosť webstránky. Nemožno zakázať.'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                {/* Analytics Cookies */}
                <Box sx={{ p: 2, border: '1px solid rgba(255, 159, 67, 0.3)', borderRadius: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.analytics}
                        onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ff9f43',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ff9f43',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {isEN ? 'Analytics Cookies' : 'Analytické cookies'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#e0e0e0' : '#666' }}>
                          {isEN 
                            ? 'Help us analyze website usage and improve user experience.'
                            : 'Pomáhajú nám analyzovať používanie webstránky a zlepšovať používateľskú skúsenosť.'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                {/* Marketing Cookies */}
                <Box sx={{ p: 2, border: '1px solid rgba(255, 159, 67, 0.3)', borderRadius: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.marketing}
                        onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ff9f43',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ff9f43',
                          },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {isEN ? 'Marketing Cookies (Planned)' : 'Marketingové cookies (plánované)'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#e0e0e0' : '#666' }}>
                          {isEN 
                            ? 'Used for personalized advertising and marketing campaigns. Not yet implemented.'
                            : 'Používané pre personalizované reklamy a marketingové kampane. Zatiaľ nie sú implementované.'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                {/* Save Button */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveSettings}
                    sx={{
                      backgroundColor: '#ff9f43',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: '#e68a28',
                      },
                    }}
                  >
                    {isEN ? 'Save Settings' : 'Uložiť nastavenia'}
                  </Button>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </StyledPaper>

      {/* Cookie Policy Information */}
      <StyledPaper>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            textAlign: 'center',
            mb: 4,
            color: '#ff9f43',
          }}
        >
          {isEN ? 'Cookie Policy Information' : 'Informácie o zásadách cookies'}
        </Typography>

        <Divider sx={{ mb: 4, borderColor: '#ff9f43' }} />

        {currentPolicy.sections.map((section, index) => (
          <Box key={index} sx={{ mb: 4 }}>
            <SectionTitle variant="h5" component="h2">
              {section.title}
            </SectionTitle>
            {section.content.map((paragraph, pIndex) => {
              if (paragraph === '') {
                return <Box key={pIndex} sx={{ height: '16px' }} />;
              }
              
              return (
                <Typography
                  key={pIndex}
                  variant="body1"
                  paragraph
                  sx={{
                    lineHeight: 1.7,
                    color: isDarkMode ? '#e0e0e0' : '#333333',
                    fontSize: '1rem',
                    mb: paragraph.startsWith('•') ? 1 : 2,
                    pl: paragraph.startsWith('•') ? 2 : 0,
                    textAlign: 'justify',
                  }}
                >
                  {paragraph}
                </Typography>
              );
            })}
          </Box>
        ))}

        <Divider sx={{ my: 4, borderColor: '#ff9f43' }} />

        <ContactBox>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ color: '#ff9f43', fontWeight: 600 }}
          >
            {isEN ? 'Contact Information' : 'Kontaktné informácie'}
          </Typography>
          <Typography variant="body2" sx={{ color: isDarkMode ? '#e0e0e0' : '#333333' }}>
            <strong>AESA Group, SE</strong><br />
            {isEN ? 'Registered office: ' : 'Sídlo: '}Pekárska 11, 917 01 Trnava<br />
            {isEN ? 'Operations: ' : 'Prevádzka: '}Palánok 4605/5, 949 01 Nitra<br />
            Email: development@aesa.sk<br />
            {isEN ? 'Phone: ' : 'Telefón: '}+421 910 970 970<br />
            {isEN ? 'DPO: ' : 'Zodpovedná osoba: '}Róbert Sitár
          </Typography>
        </ContactBox>
      </StyledPaper>
    </Container>
  );
};

export default CookiePolicy; 