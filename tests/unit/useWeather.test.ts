import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { getWeather, searchCities } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/weatherService')>()),
  getWeather: vi.fn(),
  searchCities: vi.fn(),
}));

const CITY: City = {
  id: 1,
  name: 'Lisboa',
  country: 'Portugal',
  latitude: 38.72,
  longitude: -9.14,
};

const OTHER_CITY: City = {
  id: 2,
  name: 'Porto',
  country: 'Portugal',
  latitude: 41.15,
  longitude: -8.61,
};

function weatherFor(city: City, temperature: number): WeatherData {
  return {
    city,
    current: {
      time: '2026-06-16T12:00',
      temperature,
      weatherCode: 1,
      humidity: 52,
      windSpeed: 13,
      pressure: 1018,
      precipitation: 0,
    },
    forecast: [
      { date: '2026-06-16', min: 17, max: 24, weatherCode: 1, precipitationProbability: 0 },
      { date: '2026-06-17', min: 18, max: 25, weatherCode: 0, precipitationProbability: 0 },
      { date: '2026-06-18', min: 18, max: 26, weatherCode: 2, precipitationProbability: 5 },
      { date: '2026-06-19', min: 17, max: 23, weatherCode: 3, precipitationProbability: 10 },
      { date: '2026-06-20', min: 16, max: 22, weatherCode: 61, precipitationProbability: 45 },
    ],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.mocked(searchCities).mockReset();
    vi.mocked(getWeather).mockReset();
  });

  it('keeps search and weather states separate until a city is selected', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(weatherFor(CITY, 24));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search(' Lisboa '));

    expect(result.current.searchStatus).toBe('success');
    expect(result.current.cities).toEqual([CITY]);
    expect(result.current.weatherStatus).toBe('idle');
    expect(getWeather).not.toHaveBeenCalled();

    await act(async () => result.current.selectCity(CITY));

    expect(result.current.weatherStatus).toBe('success');
    expect(result.current.data?.city).toEqual(CITY);
  });

  it('ignores a weather response from an earlier city selection', async () => {
    const first = deferred<WeatherData>();
    const second = deferred<WeatherData>();
    vi.mocked(getWeather).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useWeather());

    let firstRequest!: Promise<void>;
    let secondRequest!: Promise<void>;
    act(() => {
      firstRequest = result.current.selectCity(CITY);
      secondRequest = result.current.selectCity(OTHER_CITY);
    });

    await act(async () => second.resolve(weatherFor(OTHER_CITY, 19)));
    await secondRequest;
    await act(async () => first.resolve(weatherFor(CITY, 24)));
    await firstRequest;

    expect(result.current.selectedCity).toEqual(OTHER_CITY);
    expect(result.current.data?.city).toEqual(OTHER_CITY);
    expect(result.current.data?.current.temperature).toBe(19);
  });

  it('changes the display unit without requesting weather again', async () => {
    vi.mocked(getWeather).mockResolvedValue(weatherFor(CITY, 24));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.selectCity(CITY));
    act(() => result.current.setUnit('fahrenheit'));

    expect(result.current.unit).toBe('fahrenheit');
    expect(getWeather).toHaveBeenCalledOnce();
  });
});
