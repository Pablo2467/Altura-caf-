import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="flex rounded-full bg-cafe/10 p-1 text-sm font-semibold">
      {(['es', 'en'] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          className={`rounded-full px-3 py-1 transition ${
            current === lang ? 'bg-cafe text-white' : 'text-cafe'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}