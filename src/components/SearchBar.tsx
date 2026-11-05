import { useRef, useState, type FormEvent } from 'react';
import type { City } from '../types/weather';

interface SearchBarProps {
  onSearch: (city: string) => void;
  onSelect?: (city: City) => void;
  results?: City[];
  disabled?: boolean;
}

/** Barra de busca de cidade. Bloqueia submit com input vazio. */
export default function SearchBar({
  onSearch,
  onSelect,
  results = [],
  disabled,
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setValidationMessage('Informe um termo de busca.');
      return;
    }
    setValidationMessage('');
    onSearch(trimmed);
  }

  return (
    <form
      role="search"
      aria-label="Pesquisa de cidades"
      aria-busy={disabled}
      onSubmit={handleSubmit}
      className="relative min-w-0 w-full flex-1 sm:max-w-md sm:flex-none"
    >
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md focus-within:border-accent-500">
        <span aria-hidden="true" className="text-white/70">
          🔍
        </span>
        <label htmlFor="city-search" className="sr-only">
          Buscar cidade
        </label>
        <input
          ref={inputRef}
          id="city-search"
          type="text"
          required
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setValidationMessage('');
          }}
          placeholder="Buscar cidade…"
          autoComplete="off"
          aria-controls={results.length > 0 ? 'city-search-results' : undefined}
          aria-invalid={validationMessage ? true : undefined}
          aria-describedby={validationMessage ? 'city-search-error' : undefined}
          className="min-w-0 flex-1 rounded-sm bg-transparent text-white placeholder-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        />
        <button
          type="submit"
          disabled={disabled}
          className="shrink-0 rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {results.length > 0 && (
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {results.length === 1
            ? '1 cidade encontrada.'
            : `${results.length} cidades encontradas.`}
        </p>
      )}
      {results.length > 0 && (
        <ul
          id="city-search-results"
          aria-label="Resultados da busca"
          className="absolute left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-night-800 p-2 text-white shadow-glass backdrop-blur-md"
        >
          {results.map((city) => {
            const details = [city.admin1, city.country].filter(Boolean).join(', ');
            return (
              <li key={city.id}>
                <button
                  type="button"
                  aria-label={`Selecionar ${city.name}${details ? `, ${details}` : ''}`}
                  onClick={() => {
                    onSelect?.(city);
                    setValue('');
                    inputRef.current?.focus();
                  }}
                  className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-400"
                >
                  <span className="block font-medium">{city.name}</span>
                  {details && <span className="block text-sm text-white/60">{details}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {validationMessage && (
        <p id="city-search-error" role="alert" className="mt-2 text-sm text-red-300">
          {validationMessage}
        </p>
      )}
    </form>
  );
}
