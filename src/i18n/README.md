# Lokalizácia (i18n)

Tento priečinok obsahuje všetky súbory potrebné pre viacjazyčnú podporu aplikácie. Momentálne podporujeme dva jazyky:

- Slovenčina (SK) - predvolený jazyk
- Angličtina (EN)

## Štruktúra priečinkov

```
i18n/
  ├── i18n.ts           # Konfiguračný súbor pre i18next
  ├── en/               # Anglické preklady
  │    └── translation.json
  ├── sk/               # Slovenské preklady
  │    └── translation.json
  └── README.md         # Táto dokumentácia
```

## Ako používať preklady v komponentoch

### 1. Importujte hook useTranslation v komponente

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('auth.login')}</h1> {/* Vypíše "Prihlásenie" alebo "Login" */}
      <button>{t('common.save')}</button> {/* Vypíše "Uložiť" alebo "Save" */}
    </div>
  );
}
```

### 2. Prepínanie jazykov

```tsx
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <button onClick={() => changeLanguage('sk')}>SK</button>
      <button onClick={() => changeLanguage('en')}>EN</button>
    </div>
  );
}
```

### 3. Keď pridávate nové texty, vždy aktualizujte obidva jazykové súbory

Všetky texty v aplikácii by mali byť definované v `translation.json` súboroch. Keď pridávate nový text:

1. Najprv pridajte kľúč a text do `sk/translation.json`
2. Potom pridajte rovnaký kľúč s anglickým prekladom do `en/translation.json`

## Inštalácia závislostí

Ak ešte nemáte nainštalované potrebné závislosti, pridajte ich pomocou:

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

## Inicializácia v aplikácii

Uistite sa, že ste importovali konfiguračný súbor v hlavnom súbore aplikácie:

```tsx
// V src/index.tsx alebo App.tsx
import './i18n/i18n';
``` 