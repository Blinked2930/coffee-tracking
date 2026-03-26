import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'sq';

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    welcomeBack: 'Welcome Back',
    selectName: 'Select your name...',
    enterPin: 'Enter your 4-digit PIN',
    loggingIn: 'Logging in...',
    enter: 'Enter',
    tapToLog: 'Tap to log',
    selectType: 'Select Type',
    ratingOpt: 'Rating (Optional)',
    addDetails: 'Add Details',
    closeDetails: 'Close Details',
    lokalDetails: 'Lokal Details',
    done: 'Done',
    cafeName: 'Cafe Name or Location',
    uploadPhoto: 'Upload Photo',
    photoAttached: 'Photo Attached',
    notes: 'Notes',
    rateKafe: 'Rate this Kafe (1-8)',
    home: 'Home',
    feed: 'Feed',
    rankings: 'Rankings',
    editKafe: 'Edit Kafe',
    save: 'Save Changes',
    delete: 'Delete Kafe',
    recentKafes: 'Recent Kafes',
    emptyFeed: 'No Kafes yet!',
    beFirst: 'Be the first to log a coffee date.',
    leaderboard: 'Leaderboard',
    leaderboardSub: 'Who is vibrating the most?'
  },
  sq: {
    welcomeBack: 'Mirë se vjen',
    selectName: 'Zgjidh emrin tënd...',
    enterPin: 'Vendos PIN-in (4 shifra)',
    loggingIn: 'Duke hyrë...',
    enter: 'Hyr',
    tapToLog: 'Shtyp për të shtuar',
    selectType: 'Zgjidh Llojin',
    ratingOpt: 'Vlerësimi (Opsional)',
    addDetails: 'Shto Detaje',
    closeDetails: 'Mbyll Detajet',
    lokalDetails: 'Detajet e Lokaliti',
    done: 'Gati',
    cafeName: 'Emri i Kafenesë ose Vendi',
    uploadPhoto: 'Ngarko Foto',
    photoAttached: 'Foto u ngarkua',
    notes: 'Shënime',
    rateKafe: 'Vlerëso këtë Kafe (1-8)',
    home: 'Kreu',
    feed: 'Historiku',
    rankings: 'Renditja',
    editKafe: 'Modifiko',
    save: 'Ruaj',
    delete: 'Fshi',
    recentKafes: 'Kafet e Fundit',
    emptyFeed: 'Nuk ka Kafe akoma!',
    beFirst: 'Bëhu i pari që shton një kafe.',
    leaderboard: 'Tabela e Liderëve',
    leaderboardSub: 'Kush po dridhet më shumë?'
  }
};

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  toggleLang: () => {},
  t: () => ''
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('kafe_lang');
    if (saved === 'sq' || saved === 'en') {
      setLang(saved as Language);
    }
  }, []);

  const toggleLang = () => {
    const newLang = lang === 'en' ? 'sq' : 'en';
    setLang(newLang);
    localStorage.setItem('kafe_lang', newLang);
  };

  const t = (key: string) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
