import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

const ProductSearch = ({
  value = '',
  onValueChange,
  onSearch,
  onSuggestionSelect,
  suggestions = [],
  placeholder = 'Search products...',
  className = '',
  debounceMs = 200,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);

  const normalizedSuggestions = useMemo(() => {
    if (!Array.isArray(suggestions)) {
      return [];
    }
    return suggestions.slice(0, 8);
  }, [suggestions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearching(true);
      onSearch(value);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const handleClear = () => {
    onValueChange('');
    onSearch('');
    setIsSuggestionOpen(false);
  };

  const handleSuggestionClick = (suggestion) => {
    const selectedValue = suggestion.name || '';
    onValueChange(selectedValue);
    onSearch(selectedValue);
    onSuggestionSelect?.(suggestion);
    setIsSuggestionOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onValueChange(event.target.value);
            setIsSuggestionOpen(true);
          }}
          onFocus={() => setIsSuggestionOpen(true)}
          onBlur={() => setTimeout(() => setIsSuggestionOpen(false), 120)}
          placeholder={placeholder}
          className="input-field pl-10 pr-10 w-full"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600" />
        </div>
      )}

      {isSuggestionOpen && value.trim() && normalizedSuggestions.length > 0 && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {normalizedSuggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <p className="text-sm font-medium text-gray-900">{suggestion.name}</p>
              <p className="text-xs text-gray-500">{suggestion.category}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
