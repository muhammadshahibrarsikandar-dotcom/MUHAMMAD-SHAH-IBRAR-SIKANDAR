
import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { Language } from '../types';

interface LanguageDropdownProps {
  selected: string;
  onChange: (code: string) => void;
  excludeDetect?: boolean;
  label: string;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ selected, onChange, excludeDetect, label }) => {
  const options = excludeDetect 
    ? SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto')
    : SUPPORTED_LANGUAGES;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-1">{label}</label>
      <select 
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
      >
        {options.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageDropdown;
