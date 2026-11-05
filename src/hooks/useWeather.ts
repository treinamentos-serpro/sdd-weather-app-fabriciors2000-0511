import { useCallback, useEffect, useRef, useState } from 'react';
import type { City, Unit, WeatherData } from '../types/weather';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error';
export type SearchStatus = WeatherStatus | 'empty';

interface UseWeatherResult {
  searchStatus: SearchStatus;
  weatherStatus: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  selectedCity: City | null;
  searchError: string | null;
  weatherError: string | null;
  query: string;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retrySearch: () => Promise<void>;
  retryWeather: () => Promise<void>;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function toMessage(error: unknown): string {
  if (error instanceof WeatherServiceError) return error.message;
  return 'Algo deu errado. Tente novamente.';
}

/** Coordena busca, seleção, consulta do clima e unidade de apresentação. */
export function useWeather(): UseWeatherResult {
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>('idle');
  const [data, setData] = useState<WeatherData | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState<Unit>('celsius');

  const searchController = useRef<AbortController | null>(null);
  const weatherController = useRef<AbortController | null>(null);
  const searchRequestId = useRef(0);
  const weatherRequestId = useRef(0);

  const search = useCallback(async (name: string) => {
    const trimmed = name.trim();
    setQuery(trimmed);
    if (!trimmed) {
      setCities([]);
      setSearchStatus('idle');
      setSearchError(null);
      return;
    }

    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    const requestId = ++searchRequestId.current;
    setSearchStatus('loading');
    setSearchError(null);
    setCities([]);

    try {
      const results = await searchCities(trimmed, { signal: controller.signal });
      if (requestId !== searchRequestId.current) return;
      setCities(results);
      setSearchStatus(results.length === 0 ? 'empty' : 'success');
    } catch (error) {
      if (requestId !== searchRequestId.current || isAbortError(error)) return;
      setSearchError(toMessage(error));
      setSearchStatus('error');
    }
  }, []);

  const selectCity = useCallback(async (city: City) => {
    searchController.current?.abort();
    searchRequestId.current += 1;
    setCities([]);
    setSearchStatus('idle');
    setSelectedCity(city);

    weatherController.current?.abort();
    const controller = new AbortController();
    weatherController.current = controller;
    const requestId = ++weatherRequestId.current;
    setData(null);
    setWeatherError(null);
    setWeatherStatus('loading');

    try {
      const weather = await getWeather(city, { signal: controller.signal });
      if (requestId !== weatherRequestId.current) return;
      setData(weather);
      setWeatherStatus('success');
    } catch (error) {
      if (requestId !== weatherRequestId.current || isAbortError(error)) return;
      setWeatherError(toMessage(error));
      setWeatherStatus('error');
    }
  }, []);

  const retrySearch = useCallback(async () => {
    if (query) await search(query);
  }, [query, search]);

  const retryWeather = useCallback(async () => {
    if (selectedCity) await selectCity(selectedCity);
  }, [selectedCity, selectCity]);

  useEffect(
    () => () => {
      searchRequestId.current += 1;
      weatherRequestId.current += 1;
      searchController.current?.abort();
      weatherController.current?.abort();
    },
    [],
  );

  return {
    searchStatus,
    weatherStatus,
    data,
    cities,
    selectedCity,
    searchError,
    weatherError,
    query,
    unit,
    setUnit,
    search,
    selectCity,
    retrySearch,
    retryWeather,
  };
}
