import { useState, useRef, useEffect } from 'react';
import { useCoins } from '../hooks/useCoins';
import type { Coin } from '../types';

interface CoinSearchProps {
  onSelect: (coin: Coin) => void;
  disabled?: boolean;
}

export function CoinSearch({ onSelect, disabled }: CoinSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: coins, isLoading } = useCoins(query);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(coin: Coin) {
    onSelect(coin);
    setQuery(`${coin.name} (${coin.symbol.toUpperCase()})`);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor="coin-search"
        className="block text-sm font-medium text-gray-700"
      >
        Asset
      </label>
      <input
        ref={inputRef}
        id="coin-search"
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (query.length >= 2) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search for a coin..."
        autoComplete="off"
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
      />
      {isOpen && query.length >= 2 && (
        <ul
          role="listbox"
          aria-label="Search results"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5"
        >
          {isLoading && (
            <li className="px-3 py-2 text-gray-500">Searching...</li>
          )}
          {!isLoading && coins && coins.length === 0 && (
            <li className="px-3 py-2 text-gray-500">No coins found</li>
          )}
          {coins?.map((coin) => (
            <li
              key={coin.coingeckoId}
              role="option"
              aria-selected={false}
              tabIndex={0}
              onClick={() => handleSelect(coin)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(coin);
                }
              }}
              className="cursor-pointer px-3 py-2 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-2 focus:outline-indigo-500"
            >
              <span className="font-medium">{coin.name}</span>{' '}
              <span className="text-gray-500">
                ({coin.symbol.toUpperCase()})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
