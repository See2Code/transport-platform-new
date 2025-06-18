import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  useTheme
} from '@mui/material';
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

const PrivacyPolicy: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isEN = i18n.language === 'en';

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  const privacyPolicySK = {
    title: "Ochrana osobných údajov",
    sections: [
      {
        title: "1. Identifikácia prevádzkovateľa",
        content: [
          "Názov aplikácie: AESA Transport Platform",
          "Verzia: 1.7.4",
          "Prevádzkovateľ: AESA Group, SE",
          "Sídlo: Pekárska 11, 917 01 Trnava, Slovenská republika",
          "Korešpondenčná adresa: Palánok 4605/5, 949 01 Nitra",
          "IČO: 55361731",
          "DIČ: 2121966220",
          "IČ DPH: SK2121966220",
          "",
          "Kontaktné údaje:",
          "• Email: development@aesa.sk",
          "• Telefón: +421 910 970 970",
          "",
          "Zodpovedná osoba pre ochranu údajov:",
          "• Meno: Róbert Sitár",
          "• Email: development@aesa.sk",
          "• Telefón: +421 910 970 970"
        ]
      },
      {
        title: "2. Účel spracovania osobných údajov",
        content: [
          "AESA Transport Platform je webová platforma určená na správu transportných a logistických služieb pre spedičné firmy a dopravcov. Spracovávame osobné údaje na nasledujúce účely:",
          "",
          "• Poskytovanie služieb platformy (správa objednávok, GPS sledovanie, komunikácia)",
          "• Zabezpečenie technickej funkčnosti a bezpečnosti platformy",
          "• Plnenie právnych povinností (napr. účtovníctvo, daňová evidencia)",
          "• Zlepšovanie služieb a analytické účely",
          "• Marketingová komunikácia (len so súhlasom)"
        ]
      },
      {
        title: "3. Kategórie spracovávaných osobných údajov",
        content: [
          "Spracovávame nasledujúce kategórie údajov:",
          "",
          "3.1 Údaje o používateľoch:",
          "• Identifikačné údaje: Meno, priezvisko, email, telefónne číslo",
          "• Autentifikačné údaje: Hashované heslá, session tokeny",
          "• Profilové údaje: Fotografia profilu, preferovaný jazyk",
          "• Pracovné údaje: Pozícia v spoločnosti, pracovné oprávnenia",
          "• Technické údaje: IP adresa, typ zariadenia, prehliadač, jazykové nastavenia",
          "",
          "3.2 Firemné údaje:",
          "• Základné údaje: Názov spoločnosti, IČO, DIČ, IČ DPH",
          "• Kontaktné údaje: Adresa, telefón, email, bankové spojenie",
          "• Dokumenty: Logo firmy, pečiatka, certifikáty",
          "",
          "3.3 Obchodné údaje:",
          "• Zákazníci a dopravcovia: Názvy firiem, kontaktné osoby, hodnotenia, registračné čísla vozidiel",
          "• Objednávky: Detaily prepráv, tovar, trasy, ceny",
          "",
          "3.4 Lokalizačné údaje:",
          "• GPS poloha vozidiel: Súradnice, čas, rýchlosť",
          "• Trasy: Východiskové a cieľové adresy, história pohybu",
          "",
          "3.5 Komunikačné údaje:",
          "• Chat správy: Obsah správ, čas odoslania",
          "• Notifikácie: Typ upozornení, čas doručenia",
          "• Email komunikácia: Korespondencia s kontaktmi"
        ]
      },
      {
        title: "4. Právny základ spracovania údajov",
        content: [
          "Spracovanie osobných údajov je založené na:",
          "",
          "• Plnení zmluvy (čl. 6 ods. 1 písm. b GDPR): Poskytovanie služieb platformy, fakturácia, komunikácia",
          "• Oprávnených záujmoch (čl. 6 ods. 1 písm. f GDPR): Zabezpečenie funkčnosti platformy, ochrana pred podvodmi, analytika",
          "• Súhlase (čl. 6 ods. 1 písm. a GDPR): GPS sledovanie, marketingová komunikácia, push notifikácie, cookies",
          "• Plnení právnych povinností (čl. 6 ods. 1 písm. c GDPR): Účtovníctvo, archivačné povinnosti"
        ]
      },
      {
        title: "5. Zdieľanie osobných údajov",
        content: [
          "Osobné údaje zdieľame:",
          "",
          "• V rámci firemnej skupiny používateľa: Údaje sú oddelené podľa companyID",
          "",
          "• So subdodávateľmi:",
          "  - Google Cloud Platform (hosting, databáza)",
          "  - Google Maps (mapové služby)",
          "  - Email poskytovatelia (Gmail SMTP)",
          "  - Stripe (plánované platby, spracovanie platieb)",
          "",
          "• Pre právne účely: Na základe súdneho príkazu alebo zákonných povinností"
        ]
      },
      {
        title: "6. Bezpečnostné opatrenia",
        content: [
          "Zabezpečujeme ochranu údajov prostredníctvom:",
          "",
          "• Technických opatrení: Šifrovanie (TLS/SSL), viacúrovňová autentifikácia, firewall, pravidelné zálohy",
          "• Organizačných opatrení: Role-based prístup, audit logy, školenie zamestnancov, plán reakcie na incidenty"
        ]
      },
      {
        title: "7. Doba uchovávania údajov",
        content: [
          "• Aktívne účty: Počas trvania služby + 30 dní po zrušení",
          "• Obchodné údaje: 10 rokov (účtovné predpisy)",
          "• GPS údaje: 2 roky",
          "• Chat správy: 5 rokov",
          "• Audit logy: 6 rokov",
          "",
          "Údaje vymažeme automaticky po uplynutí doby alebo na žiadosť používateľa."
        ]
      },
      {
        title: "8. Cookies a sledovacie technológie",
        content: [
          "Používame:",
          "",
          "• Technické cookies: Session management, autentifikácia, jazykové preferencie",
          "• Analytické cookies: Štatistiky používania, performance monitoring",
          "• Marketingové cookies (plánované): Behaviorálne cielenie, retargeting",
          "",
          "Súhlas s cookies je možné spravovať v nastaveniach platformy."
        ]
      },
      {
        title: "9. Práva dotknutých osôb",
        content: [
          "Podľa GDPR máte právo:",
          "",
          "• Na informácie o spracovaní údajov (čl. 13-14)",
          "• Na prístup k vašim údajom (čl. 15)",
          "• Na opravu nesprávnych údajov (čl. 16)",
          "• Na vymazanie údajov (čl. 17)",
          "• Na obmedzenie spracovania (čl. 18)",
          "• Na prenosnosť údajov (čl. 20)",
          "• Namietať proti spracovaniu (čl. 21)",
          "• Podať sťažnosť na Úrad na ochranu osobných údajov SR (čl. 77)",
          "",
          "Kontaktné údaje úradu:",
          "• Úrad na ochranu osobných údajov SR",
          "• Adresa: Hraničná 12, 820 07 Bratislava",
          "• Email: statny.dozor@pdp.gov.sk"
        ]
      },
      {
        title: "10. Plánované platobné služby",
        content: [
          "Po implementácii Stripe budeme spracovávať:",
          "",
          "• Čísla platobných kariet (PCI DSS)",
          "• Fakturačné adresy, históriu transakcií",
          "• Zabezpečenie: Tokenizácia, 3D Secure, fraud detection"
        ]
      },
      {
        title: "11. Kontakt",
        content: [
          "Ak máte otázky alebo požiadavky týkajúce sa ochrany údajov, kontaktujte nás:",
          "",
          "• Email: development@aesa.sk",
          "• Telefón: +421 910 970 970",
          "",
          "Tento dokument je aktuálny k dátumu 18. júna 2025. Vyhrádzame si právo na jeho aktualizáciu."
        ]
      }
    ]
  };

  const privacyPolicyEN = {
    title: "Privacy Policy",
    sections: [
      {
        title: "1. Data Controller Identification",
        content: [
          "Application Name: AESA Transport Platform",
          "Version: 1.7.4",
          "Data Controller: AESA Group, SE",
          "Headquarters: Pekárska 11, 917 01 Trnava, Slovak Republic",
          "Correspondence Address: Palánok 4605/5, 949 01 Nitra",
          "Company Registration Number: 55361731",
          "Tax ID: 2121966220",
          "VAT ID: SK2121966220",
          "",
          "Contact Information:",
          "• Email: development@aesa.sk",
          "• Phone: +421 910 970 970",
          "",
          "Data Protection Officer:",
          "• Name: Róbert Sitár",
          "• Email: development@aesa.sk",
          "• Phone: +421 910 970 970"
        ]
      },
      {
        title: "2. Purpose of Personal Data Processing",
        content: [
          "AESA Transport Platform is a web platform designed for managing transport and logistics services for freight forwarding companies and carriers. We process personal data for the following purposes:",
          "",
          "• Providing platform services (order management, GPS tracking, communication)",
          "• Ensuring technical functionality and platform security",
          "• Fulfilling legal obligations (e.g., accounting, tax records)",
          "• Service improvement and analytical purposes",
          "• Marketing communication (only with consent)"
        ]
      },
      {
        title: "3. Categories of Personal Data Processed",
        content: [
          "We process the following categories of data:",
          "",
          "3.1 User Data:",
          "• Identification data: Name, surname, email, phone number",
          "• Authentication data: Hashed passwords, session tokens",
          "• Profile data: Profile picture, preferred language",
          "• Work data: Position in company, work permissions",
          "• Technical data: IP address, device type, browser, language settings",
          "",
          "3.2 Company Data:",
          "• Basic data: Company name, registration numbers, tax IDs",
          "• Contact data: Address, phone, email, banking details",
          "• Documents: Company logo, stamp, certificates",
          "",
          "3.3 Business Data:",
          "• Customers and carriers: Company names, contact persons, ratings, vehicle registration numbers",
          "• Orders: Transport details, goods, routes, prices",
          "",
          "3.4 Location Data:",
          "• GPS vehicle position: Coordinates, time, speed",
          "• Routes: Origin and destination addresses, movement history",
          "",
          "3.5 Communication Data:",
          "• Chat messages: Message content, sending time",
          "• Notifications: Alert types, delivery time",
          "• Email communication: Correspondence with contacts"
        ]
      },
      {
        title: "4. Legal Basis for Data Processing",
        content: [
          "Personal data processing is based on:",
          "",
          "• Contract fulfillment (Art. 6(1)(b) GDPR): Providing platform services, billing, communication",
          "• Legitimate interests (Art. 6(1)(f) GDPR): Ensuring platform functionality, fraud protection, analytics",
          "• Consent (Art. 6(1)(a) GDPR): GPS tracking, marketing communication, push notifications, cookies",
          "• Legal obligations (Art. 6(1)(c) GDPR): Accounting, archival duties"
        ]
      },
      {
        title: "5. Personal Data Sharing",
        content: [
          "We share personal data:",
          "",
          "• Within the user's company group: Data is separated by companyID",
          "",
          "• With subprocessors:",
          "  - Google Cloud Platform (hosting, database)",
          "  - Google Maps (mapping services)",
          "  - Email providers (Gmail SMTP)",
          "  - Stripe (planned payments, payment processing)",
          "",
          "• For legal purposes: Based on court orders or legal obligations"
        ]
      },
      {
        title: "6. Security Measures",
        content: [
          "We ensure data protection through:",
          "",
          "• Technical measures: Encryption (TLS/SSL), multi-level authentication, firewall, regular backups",
          "• Organizational measures: Role-based access, audit logs, employee training, incident response plan"
        ]
      },
      {
        title: "7. Data Retention Period",
        content: [
          "• Active accounts: During service duration + 30 days after cancellation",
          "• Business data: 10 years (accounting regulations)",
          "• GPS data: 2 years",
          "• Chat messages: 5 years",
          "• Audit logs: 6 years",
          "",
          "Data will be automatically deleted after the retention period expires or upon user request."
        ]
      },
      {
        title: "8. Cookies and Tracking Technologies",
        content: [
          "We use:",
          "",
          "• Technical cookies: Session management, authentication, language preferences",
          "• Analytical cookies: Usage statistics, performance monitoring",
          "• Marketing cookies (planned): Behavioral targeting, retargeting",
          "",
          "Cookie consent can be managed in platform settings."
        ]
      },
      {
        title: "9. Data Subject Rights",
        content: [
          "According to GDPR, you have the right to:",
          "",
          "• Information about data processing (Art. 13-14)",
          "• Access to your data (Art. 15)",
          "• Rectification of incorrect data (Art. 16)",
          "• Erasure of data (Art. 17)",
          "• Restriction of processing (Art. 18)",
          "• Data portability (Art. 20)",
          "• Object to processing (Art. 21)",
          "• Lodge a complaint with the Slovak Data Protection Authority (Art. 77)",
          "",
          "Authority contact details:",
          "• Office for Personal Data Protection of the Slovak Republic",
          "• Address: Hraničná 12, 820 07 Bratislava",
          "• Email: statny.dozor@pdp.gov.sk"
        ]
      },
      {
        title: "10. Planned Payment Services",
        content: [
          "After Stripe implementation, we will process:",
          "",
          "• Payment card numbers (PCI DSS)",
          "• Billing addresses, transaction history",
          "• Security: Tokenization, 3D Secure, fraud detection"
        ]
      },
      {
        title: "11. Contact",
        content: [
          "If you have questions or requests regarding data protection, contact us:",
          "",
          "• Email: development@aesa.sk",
          "• Phone: +421 910 970 970",
          "",
          "This document is current as of June 18, 2025. We reserve the right to update it."
        ]
      }
    ]
  };

  const currentPolicy = isEN ? privacyPolicyEN : privacyPolicySK;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: isDarkMode 
        ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243e 100%)' 
        : '#ffffff',
      py: 4
    }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackClick}
            sx={{
              color: isDarkMode ? '#fff' : '#333',
              '&:hover': {
                backgroundColor: 'rgba(255, 159, 67, 0.1)',
              }
            }}
          >
            {isEN ? 'Back to Home' : 'Späť na domovskú stránku'}
          </Button>
        </Box>

        <StyledPaper>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#000000',
              textAlign: 'center',
              mb: 4
            }}
          >
            {currentPolicy.title}
          </Typography>

          <Divider sx={{ mb: 4, backgroundColor: '#ff9f43' }} />

          {currentPolicy.sections.map((section, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <SectionTitle variant="h5" component="h2">
                {section.title}
              </SectionTitle>
              
              {section.content.map((paragraph, pIndex) => (
                <Typography
                  key={pIndex}
                  variant="body1"
                  sx={{
                    mb: paragraph === '' ? 1 : 0.5,
                    color: isDarkMode ? '#ffffff' : '#000000',
                    lineHeight: 1.6,
                    fontSize: '1rem'
                  }}
                >
                  {paragraph}
                </Typography>
              ))}
            </Box>
          ))}

          <ContactBox>
            <Typography variant="h6" sx={{ color: '#ff9f43', mb: 2, fontWeight: 600 }}>
              {isEN ? 'Need Help?' : 'Potrebujete pomoc?'}
            </Typography>
            <Typography variant="body1" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
              {isEN 
                ? 'If you have any questions about this privacy policy, please contact us:'
                : 'Ak máte akékoľvek otázky ohľadom tejto politiky ochrany údajov, kontaktujte nás:'
              }
            </Typography>
            <Typography variant="body1" sx={{ color: isDarkMode ? '#ffffff' : '#000000', mt: 1 }}>
              <strong>Email:</strong> development@aesa.sk<br />
              <strong>{isEN ? 'Phone' : 'Telefón'}:</strong> +421 910 970 970
            </Typography>
          </ContactBox>
        </StyledPaper>
      </Container>
    </Box>
  );
};

export default PrivacyPolicy; 