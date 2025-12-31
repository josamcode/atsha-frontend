import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaCheck, FaSearch } from 'react-icons/fa';

const CustomSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = ''
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && options.length > 5 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, options.length]);

  const handleSelect = (optionValue) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div ref={selectRef} className={`relative ${className}`} style={{ zIndex: isOpen ? 1000 : 'auto' }}>
      {/* Select Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full px-4 py-2.5 ${isRTL ? 'text-right' : 'text-left'} bg-white border rounded-lg transition-all duration-200 flex items-center justify-between group ${
          isOpen
            ? 'border-primary ring-2 ring-primary/20 shadow-sm'
            : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
        } ${value ? 'text-gray-900 font-medium' : 'text-gray-500'}`}
      >
        <span className="truncate flex-1">{displayText}</span>
        <FaChevronDown
          className={`text-gray-400 group-hover:text-primary transition-all duration-200 flex-shrink-0 ${isRTL ? 'mr-2' : 'ml-2'} ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-[9999] w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl animate-slideUp ${
          isRTL ? 'right-0' : 'left-0'
        }`}
        style={{ maxHeight: 'none', overflow: 'visible' }}
        >
          {/* Search Input - Show only if there are many options */}
          {options.length > 5 && (
            <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
              <div className="relative">
                <FaSearch className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 text-sm`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar rounded-b-lg">
            {filteredOptions.length > 0 ? (
              <>
                {/* "All" option if value is empty */}
                {!value && placeholder && (
                  <div className={`px-4 py-2.5 bg-primary/5 ${isRTL ? 'text-right' : 'text-left'} border-b border-gray-100`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-primary truncate">{placeholder}</span>
                      <FaCheck className="text-primary flex-shrink-0 text-sm" />
                    </div>
                  </div>
                )}
                
                {/* Options */}
                {filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-2.5 ${isRTL ? 'text-right' : 'text-left'} transition-all flex items-center justify-between group ${
                      option.value === value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } ${index === filteredOptions.length - 1 ? '' : 'border-b border-gray-50'}`}
                  >
                    <span className="truncate flex-1">{option.label}</span>
                    {option.value === value && (
                      <FaCheck className="text-primary flex-shrink-0 text-sm animate-fadeIn" />
                    )}
                  </button>
                ))}
              </>
            ) : (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                <p className="font-medium">No options found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;

