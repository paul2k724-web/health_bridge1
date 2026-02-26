import { useState, useEffect, useRef } from 'react'
import { FiMapPin, FiLoader, FiX } from 'react-icons/fi'
import { searchAddress } from '../../utils/geocoding'

const AddressSearch = ({
  onAddressSelect,
  placeholder = 'Search for an address...',
  value = '',
  onChange,
  error,
  className = '',
}) => {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setSelectedIndex(-1)
      
      try {
        const results = await searchAddress(query)
        setSuggestions(results)
        setShowDropdown(results.length > 0)
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleInputChange = (e) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    if (onChange) {
      onChange(newQuery)
    }
  }

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.displayName)
    setShowDropdown(false)
    setSuggestions([])
    
    if (onAddressSelect) {
      onAddressSelect({
        address: suggestion.displayName,
        addressData: suggestion.address,
        coordinates: suggestion.coordinates,
      })
    }
    
    if (onChange) {
      onChange(suggestion.displayName)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
    
    if (onChange) {
      onChange('')
    }
  }

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
            error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
          }`}
        />
        {loading && (
          <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                selectedIndex === index
                  ? 'bg-teal-50 dark:bg-teal-900/30'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <FiMapPin className="w-4 h-4 mt-0.5 text-teal-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                    {suggestion.address.road || suggestion.address.city || 'Unknown location'}
                    {suggestion.address.houseNumber && ` ${suggestion.address.houseNumber}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {suggestion.address.city && `${suggestion.address.city}, `}
                    {suggestion.address.state && `${suggestion.address.state}, `}
                    {suggestion.address.country}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query.length >= 3 && !loading && suggestions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            No addresses found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  )
}

export default AddressSearch
