import { useWeather } from './hooks/useWeather';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';

export default function App() {
  const {
    searchStatus,
    weatherStatus,
    data,
    cities,
    searchError,
    weatherError,
    query,
    unit,
    setUnit,
    search,
    selectCity,
    retrySearch,
    retryWeather,
  } = useWeather();

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl text-sun">
              ☀️
            </span>
            <span className="text-lg font-bold">WeatherView</span>
            <span className="rounded-full border border-accent-400/30 bg-accent-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-400">
              Open-Meteo
            </span>
          </div>
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
            <SearchBar
              onSearch={search}
              onSelect={selectCity}
              results={cities}
              disabled={searchStatus === 'loading'}
            />
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
          {searchStatus === 'loading' && (
            <p role="status" aria-live="polite" aria-atomic="true" className="text-sm text-white/70">
              Buscando cidades…
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <h1 className="sr-only">Previsão do tempo</h1>
        {searchStatus === 'empty' && (
          <EmptyState
            title={`Nenhuma cidade encontrada para "${query}"`}
            hint="Tente outro nome de cidade."
          />
        )}

        {searchStatus === 'success' && cities.length > 0 && (
          <EmptyState
            title="Selecione uma cidade"
            hint="Escolha um resultado da busca para ver a previsão."
          />
        )}

        {searchStatus === 'error' && searchError && (
          <ErrorState message={searchError} onRetry={retrySearch} />
        )}

        {weatherStatus === 'loading' && <LoadingState />}

        {weatherStatus === 'error' && weatherError && (
          <ErrorState message={weatherError} onRetry={retryWeather} />
        )}

        {weatherStatus === 'success' && data && (
          <>
            <CurrentWeather city={data.city} current={data.current} unit={unit} />
            <ForecastList forecast={data.forecast} unit={unit} />
          </>
        )}
      </main>

      <footer className="py-8 text-center text-sm text-white/70">
        Dados meteorológicos por{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="text-white/80 underline hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
        >
          Open-Meteo
        </a>
        .
      </footer>
    </div>
  );
}
