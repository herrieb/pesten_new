const UI_TRANSLATIONS = {
  nl: {},
  en: {
    'Kies je profiel en speel mee.': 'Choose your profile and join the game.',
    'Snel gast': 'Quick guest',
    'Inloggen': 'Log in',
    'Registreren': 'Register',
    'Eenmalig een naam en avatar kiezen. Geen account nodig.': 'Choose a name and avatar. No account needed.',
    'Weergavenaam': 'Display name',
    'Kies een avatar': 'Choose an avatar',
    'Verder': 'Continue',
    'Wachtwoord': 'Password',
    'Account aanmaken': 'Create account',
    'Kamer aanmaken': 'Create room',
    'Start een nieuwe tafel en nodig vrienden uit met de code.': 'Start a new table and invite friends with the code.',
    'Kamer deelnemen': 'Join room',
    'Heb je een code? Doe mee.': 'Have a code? Join.',
    'Deelnemen': 'Join',
    'Speel tegen AI': 'Play against AI',
    'Beschikbare spellen': 'Available games',
    'Geen open spellen': 'No open games',
    'Spelregels': 'Game rules',
    'Hoe speel je? →': 'How to play? →'
  },
  tr: {
    'Kies je profiel en speel mee.': 'Profilini seç ve oyuna katıl.',
    'Snel gast': 'Hızlı misafir',
    'Inloggen': 'Giriş yap',
    'Registreren': 'Kayıt ol',
    'Eenmalig een naam en avatar kiezen. Geen account nodig.': 'Bir ad ve avatar seç. Hesap gerekmez.',
    'Weergavenaam': 'Görünen ad',
    'Kies een avatar': 'Avatar seç',
    'Verder': 'Devam et',
    'Wachtwoord': 'Şifre',
    'Account aanmaken': 'Hesap oluştur',
    'Kamer aanmaken': 'Oda oluştur',
    'Kamer deelnemen': 'Odaya katıl',
    'Deelnemen': 'Katıl',
    'Speel tegen AI': 'Yapay zekâya karşı oyna',
    'Beschikbare spellen': 'Açık oyunlar',
    'Geen open spellen': 'Açık oyun yok',
    'Spelregels': 'Oyun kuralları',
    'Hoe speel je? →': 'Nasıl oynanır? →'
  }
};

function applyLanguage(language) {
  const dict = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.nl;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.textContent = dict[key];
  });
}
window.applyLanguage = applyLanguage;
