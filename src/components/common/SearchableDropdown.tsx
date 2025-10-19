// src/components/common/SearchableDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import './SearchableDropdown.css';

interface DropdownOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  noResultsText = 'No results found'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.sublabel && option.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      {/* Trigger */}
      <div
        className={`searchable-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleInputClick}
      >
        {!isOpen && selectedOption ? (
          <div className="searchable-dropdown-selected">
            <div className="selected-label">{selectedOption.label}</div>
            {selectedOption.sublabel && (
              <div className="selected-sublabel">{selectedOption.sublabel}</div>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className="searchable-dropdown-input"
            placeholder={isOpen ? searchPlaceholder : placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={handleInputClick}
          />
        )}
        <span className={`searchable-dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="searchable-dropdown-menu">
          {filteredOptions.length === 0 ? (
            <div className="searchable-dropdown-no-results">
              {noResultsText}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className={`searchable-dropdown-option ${option.id === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option.id)}
              >
                <div className="option-label">{option.label}</div>
                {option.sublabel && (
                  <div className="option-sublabel">{option.sublabel}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;