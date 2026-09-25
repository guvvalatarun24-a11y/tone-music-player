import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search songs, artists, albums...',
}) => {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#6B7280]">
        <Search className="h-4 w-4 text-[#00C98B]" />
      </div>
      <input
        id="library-search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-[#E5E7EB] bg-white py-3 pl-11 pr-11 text-sm text-[#111111] placeholder:text-[#6B7280] focus:border-[#00C98B] focus:outline-none focus:ring-2 focus:ring-[#00C98B]/15"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#6B7280] transition hover:text-[#111111]"
          title="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
