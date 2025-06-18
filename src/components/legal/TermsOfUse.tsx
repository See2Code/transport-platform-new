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

const TermsOfUse: React.FC = () => {
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

  const termsSK = {
    title: "Podmienky používania",
    sections: [
      {
        title: "1. Úvod",
        content: [
          "Tieto podmienky používania (ďalej len \"Podmienky\") upravujú používanie webovej platformy AESA Transport Platform (ďalej len \"Platforma\") prevádzkovanej spoločnosťou AESA Group, SE, so sídlom Pekárska 11, 917 01 Trnava, Slovenská republika (IČO: 55361731, DIČ: 2121966220, IČ DPH: SK2121966220, email: development@aesa.sk, telefón: +421 910 970 970, ďalej len \"Prevádzkovateľ\").",
          "",
          "Používaním Platformy vyjadrujete súhlas s týmito Podmienkami."
        ]
      },
      {
        title: "2. Účel a funkcionalita platformy",
        content: [
          "Platforma slúži na správu transportných a logistických služieb pre spedičné firmy a dopravcov. Poskytuje funkcionality ako:",
          "",
          "• Správa objednávok a prepráv (vytváranie, úprava, sledovanie v reálnom čase)",
          "• Riadenie firemných kontaktov (zákazníci, dopravcovia, hodnotenia)",
          "• GPS sledovanie vozidiel (lokalizácia, mapové zobrazenie trás)",
          "• Komunikačný systém (interný chat, push a email notifikácie)",
          "• Správa tímu a používateľov (multi-user prístup, role, pozvánky)"
        ]
      },
      {
        title: "3. Podmienky prístupu",
        content: [
          "3.1 Registrácia a účet:",
          "",
          "• Pre prístup k Platforme je potrebná registrácia s poskytnutím pravdivých údajov (meno, priezvisko, email, telefónne číslo)",
          "• Používateľ je zodpovedný za bezpečnosť svojich prihlasovacích údajov a nesmie ich zdieľať s tretími stranami",
          "• Prevádzkovateľ si vyhradzuje právo zrušiť účet v prípade porušenia Podmienok alebo podozrenia na zneužitie",
          "",
          "3.2 Povolené používanie:",
          "",
          "• Platforma je určená výhradne na profesionálne použitie v oblasti logistiky a transportu",
          "",
          "• Zakázané je:",
          "  - Používať Platformu na nezákonné účely alebo v rozpore s Podmienkami",
          "  - Zasahovať do bezpečnosti alebo funkčnosti Platformy (napr. hacking, DDoS útoky)",
          "  - Vkladať nepravdivé alebo zavádzajúce údaje"
        ]
      },
      {
        title: "4. Práva a povinnosti používateľa",
        content: [
          "4.1 Povinnosti používateľa:",
          "",
          "• Zabezpečiť správnosť a aktuálnosť poskytnutých údajov",
          "• Dodržiavať právne predpisy Slovenskej republiky a EÚ, vrátane GDPR",
          "• Chrániť svoje prihlasovacie údaje a okamžite hlásiť podozrenie na zneužitie účtu",
          "",
          "4.2 Práva používateľa:",
          "",
          "• Prístup k funkcionalitám Platformy v súlade s úrovňou prístupu (role-based access)",
          "• Požadovať podporu od Prevádzkovateľa prostredníctvom kontaktov uvedených v bode 10",
          "• Využívať práva dotknutej osoby podľa GDPR (viď Ochrana osobných údajov)"
        ]
      },
      {
        title: "5. Práva a povinnosti prevádzkovateľa",
        content: [
          "5.1 Záväzky Prevádzkovateľa:",
          "",
          "• Zabezpečiť dostupnosť Platformy na úrovni 99,9 % (SLA), s výnimkou plánovanej údržby alebo vyššej moci",
          "• Poskytovať technickú podporu počas pracovných dní na kontaktoch uvedených v bode 10",
          "• Chrániť osobné údaje v súlade s GDPR a dokumentom Ochrana osobných údajov",
          "",
          "5.2 Práva Prevádzkovateľa:",
          "",
          "• Dočasne obmedziť prístup k Platforme v prípade technických problémov, údržby alebo porušenia Podmienok",
          "• Odmietnuť poskytovanie služieb používateľom, ktorí porušujú Podmienky alebo právne predpisy",
          "• Aktualizovať Podmienky s predchádzajúcim upozornením používateľov"
        ]
      },
      {
        title: "6. Zodpovednosť za škody",
        content: [
          "6.1 Prevádzkovateľ nezodpovedá za:",
          "",
          "• Škody spôsobené nesprávnym používaním Platformy alebo porušením Podmienok",
          "• Nepriame škody (napr. ušlý zisk, prerušenie podnikania)",
          "• Škody vzniknuté v dôsledku vyššej moci (napr. výpadky internetu, prírodné katastrofy)",
          "",
          "6.2 Zodpovednosť Prevádzkovateľa je obmedzená na výšku ročného poplatku za služby Platformy (ak je uplatniteľný).",
          "",
          "6.3 Prevádzkovateľ má uzatvorené poistenie profesionálnej zodpovednosti pre prípad škôd spôsobených chybou služby."
        ]
      },
      {
        title: "7. Platobné služby (plánované)",
        content: [
          "Po implementácii platobnej brány Stripe budú platiť nasledujúce podmienky:",
          "",
          "• Používateľ poskytne platobné údaje (číslo karty, fakturačné údaje) v súlade s PCI DSS",
          "• Automatické predplatné a opakované platby budú spracovávané bezpečne (tokenizácia, 3D Secure)",
          "• Používateľ je povinný zabezpečiť dostatok prostriedkov na účte pre platby"
        ]
      },
      {
        title: "8. Zdieľanie údajov",
        content: [
          "Údaje používateľa sú zdieľané len v nevyhnutnom rozsahu:",
          "",
          "• V rámci firemnej skupiny používateľa (oddelené podľa companyID)",
          "• So subdodávateľmi (Google Cloud Platform, Google Maps, email služby, Stripe)",
          "• Na právne účely (súdny príkaz, zákonné povinnosti)",
          "",
          "Podrobnosti o spracovaní údajov sú uvedené v dokumente Ochrana osobných údajov."
        ]
      },
      {
        title: "9. Ukončenie používania",
        content: [
          "9.1 Zrušenie účtu používateľom:",
          "",
          "• Používateľ môže kedykoľvek požiadať o zrušenie účtu kontaktovaním Prevádzkovateľa",
          "• Po zrušení budú údaje vymazané v súlade s dobou uchovávania uvedenou v dokumente Ochrana osobných údajov",
          "",
          "9.2 Zrušenie účtu Prevádzkovateľom:",
          "",
          "Prevádzkovateľ môže zrušiť účet v prípade:",
          "• Porušenia Podmienok",
          "• Neaktivity účtu dlhšej ako 12 mesiacov",
          "• Podozrenia na zneužitie alebo nezákonné aktivity"
        ]
      },
      {
        title: "10. Kontakt",
        content: [
          "V prípade otázok alebo problémov nás kontaktujte:",
          "",
          "• Email: development@aesa.sk",
          "• Telefón: +421 910 970 970",
          "• Zodpovedná osoba: Róbert Sitár",
          "",
          "Sťažnosti týkajúce sa ochrany údajov môžete podať na:",
          "",
          "• Úrad na ochranu osobných údajov SR",
          "• Adresa: Hraničná 12, 820 07 Bratislava",
          "• Email: statny.dozor@pdp.gov.sk"
        ]
      },
      {
        title: "11. Záverečné ustanovenia",
        content: [
          "• Tieto Podmienky nadobúdajú účinnosť dňom 18. júna 2025",
          "• Prevádzkovateľ si vyhradzuje právo aktualizovať Podmienky s predchádzajúcim upozornením",
          "• Na právne vzťahy sa vzťahujú právne predpisy Slovenskej republiky a EÚ",
          "• Akékoľvek spory budú riešené pred súdmi Slovenskej republiky",
          "",
          "Súhlasom s týmito Podmienkami potvrdzujete, že ste si ich prečítali a rozumiete im."
        ]
      }
    ]
  };

  const termsEN = {
    title: "Terms of Use",
    sections: [
      {
        title: "1. Introduction",
        content: [
          "These Terms of Use (hereinafter \"Terms\") govern the use of the AESA Transport Platform web platform (hereinafter \"Platform\") operated by AESA Group, SE, with its registered office at Pekárska 11, 917 01 Trnava, Slovak Republic (Company ID: 55361731, Tax ID: 2121966220, VAT ID: SK2121966220, email: development@aesa.sk, phone: +421 910 970 970, hereinafter \"Operator\").",
          "",
          "By using the Platform, you agree to these Terms."
        ]
      },
      {
        title: "2. Platform Purpose and Functionality",
        content: [
          "The Platform serves for managing transport and logistics services for freight forwarding companies and carriers. It provides functionalities such as:",
          "",
          "• Order and transport management (creation, editing, real-time tracking)",
          "• Company contact management (customers, carriers, ratings)",
          "• GPS vehicle tracking (location, map route display)",
          "• Communication system (internal chat, push and email notifications)",
          "• Team and user management (multi-user access, roles, invitations)"
        ]
      },
      {
        title: "3. Access Conditions",
        content: [
          "3.1 Registration and Account:",
          "",
          "• Access to the Platform requires registration with provision of truthful data (name, surname, email, phone number)",
          "• User is responsible for the security of their login credentials and must not share them with third parties",
          "• Operator reserves the right to cancel an account in case of Terms violation or suspected abuse",
          "",
          "3.2 Permitted Use:",
          "",
          "• Platform is intended exclusively for professional use in logistics and transport",
          "",
          "• Prohibited activities:",
          "  - Using the Platform for illegal purposes or in violation of Terms",
          "  - Interfering with Platform security or functionality (e.g., hacking, DDoS attacks)",
          "  - Entering false or misleading data"
        ]
      },
      {
        title: "4. User Rights and Obligations",
        content: [
          "4.1 User Obligations:",
          "",
          "• Ensure accuracy and currency of provided data",
          "• Comply with legal regulations of Slovak Republic and EU, including GDPR",
          "• Protect login credentials and immediately report suspected account abuse",
          "",
          "4.2 User Rights:",
          "",
          "• Access to Platform functionalities according to access level (role-based access)",
          "• Request support from Operator through contacts specified in section 10",
          "• Exercise data subject rights under GDPR (see Privacy Policy)"
        ]
      },
      {
        title: "5. Operator Rights and Obligations",
        content: [
          "5.1 Operator Commitments:",
          "",
          "• Ensure Platform availability at 99.9% level (SLA), except for scheduled maintenance or force majeure",
          "• Provide technical support during business days on contacts specified in section 10",
          "• Protect personal data in accordance with GDPR and Privacy Policy document",
          "",
          "5.2 Operator Rights:",
          "",
          "• Temporarily restrict Platform access in case of technical problems, maintenance, or Terms violation",
          "• Refuse service provision to users who violate Terms or legal regulations",
          "• Update Terms with prior user notification"
        ]
      },
      {
        title: "6. Liability for Damages",
        content: [
          "6.1 Operator is not liable for:",
          "",
          "• Damages caused by improper Platform use or Terms violation",
          "• Indirect damages (e.g., lost profit, business interruption)",
          "• Damages arising from force majeure (e.g., internet outages, natural disasters)",
          "",
          "6.2 Operator's liability is limited to the amount of annual Platform service fees (if applicable).",
          "",
          "6.3 Operator has professional liability insurance for damages caused by service errors."
        ]
      },
      {
        title: "7. Payment Services (Planned)",
        content: [
          "After Stripe payment gateway implementation, the following terms will apply:",
          "",
          "• User will provide payment data (card number, billing details) in accordance with PCI DSS",
          "• Automatic subscriptions and recurring payments will be processed securely (tokenization, 3D Secure)",
          "• User is obligated to ensure sufficient funds in account for payments"
        ]
      },
      {
        title: "8. Data Sharing",
        content: [
          "User data is shared only to the necessary extent:",
          "",
          "• Within user's company group (separated by companyID)",
          "• With subcontractors (Google Cloud Platform, Google Maps, email services, Stripe)",
          "• For legal purposes (court order, legal obligations)",
          "",
          "Details about data processing are specified in the Privacy Policy document."
        ]
      },
      {
        title: "9. Termination of Use",
        content: [
          "9.1 Account Cancellation by User:",
          "",
          "• User may request account cancellation at any time by contacting the Operator",
          "• After cancellation, data will be deleted according to retention period specified in Privacy Policy document",
          "",
          "9.2 Account Cancellation by Operator:",
          "",
          "Operator may cancel account in case of:",
          "• Terms violation",
          "• Account inactivity longer than 12 months",
          "• Suspected abuse or illegal activities"
        ]
      },
      {
        title: "10. Contact",
        content: [
          "For questions or problems, contact us:",
          "",
          "• Email: development@aesa.sk",
          "• Phone: +421 910 970 970",
          "• Responsible person: Róbert Sitár",
          "",
          "Data protection complaints can be filed with:",
          "",
          "• Office for Personal Data Protection SR",
          "• Address: Hraničná 12, 820 07 Bratislava",
          "• Email: statny.dozor@pdp.gov.sk"
        ]
      },
      {
        title: "11. Final Provisions",
        content: [
          "• These Terms take effect on June 18, 2025",
          "• Operator reserves the right to update Terms with prior notification",
          "• Legal relationships are governed by Slovak Republic and EU legal regulations",
          "• Any disputes will be resolved before Slovak Republic courts",
          "",
          "By agreeing to these Terms, you confirm that you have read and understand them."
        ]
      }
    ]
  };

  const currentTerms = isEN ? termsEN : termsSK;

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
            {currentTerms.title}
          </Typography>

          <Divider sx={{ mb: 4, backgroundColor: '#ff9f43' }} />

          {currentTerms.sections.map((section, index) => (
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
              {isEN ? 'Questions?' : 'Máte otázky?'}
            </Typography>
            <Typography variant="body1" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
              {isEN 
                ? 'If you have any questions about these Terms of Use, please contact us:'
                : 'Ak máte akékoľvek otázky ohľadom týchto Podmienok používania, kontaktujte nás:'
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

export default TermsOfUse; 