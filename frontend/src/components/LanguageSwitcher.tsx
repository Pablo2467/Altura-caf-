import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div
      className={`flex rounded-full p-1 text-sm font-semibold ${
        dark ? 'bg-white/10' : 'bg-cafe/10'
      }`}
    >
      {(['es', 'en'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          className={`rounded-full px-3 py-1 transition ${
            current === lang
              ? dark
                ? 'bg-caramelo text-zinc-900'
                : 'bg-cafe text-white'
              : dark
                ? 'text-zinc-300'
                : 'text-cafe'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}