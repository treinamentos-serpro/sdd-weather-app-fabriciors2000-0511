import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const CITY: City = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  admin1: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
};

const FORECAST_RESPONSE = {
  current: {
    time: '2026-06-16T12:00',
    temperature_2m: 18,
    relative_humidity_2m: 80,
    wind_speed_10m: 10,
    surface_pressure: 1015,
    precipitation: 0,
    weather_code: 3,
  },
  daily: {
    time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
    weather_code: [3, 61, 80, 1, 0],
    temperature_2m_max: [20, 19, 22, 24, 25],
    temperature_2m_min: [12, 11, 13, 14, 15],
    precipitation_probability_max: [20, 90, 70, 10, null],
  },
};

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('weatherService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('searchCities', () => {
    it('does not request the API for a blank query', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);

      await expect(searchCities('   ')).resolves.toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('encodes the normalized query and maps Open-Meteo cities', async () => {
      const fetchSpy = mockFetchOnce({
        results: [
          {
            id: 1,
            name: 'São Paulo',
            country: 'Brasil',
            admin1: 'São Paulo',
            latitude: -23.55,
            longitude: -46.63,
          },
        ],
      });
      vi.stubGlobal('fetch', fetchSpy);

      await expect(searchCities('  São Paulo  ')).resolves.toEqual([CITY]);
      const requestedUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(requestedUrl.searchParams.get('name')).toBe('São Paulo');
      expect(requestedUrl.searchParams.get('count')).toBe('5');
      expect(requestedUrl.searchParams.get('language')).toBe('pt');
      expect(requestedUrl.searchParams.get('format')).toBe('json');
    });

    it('returns an empty list for a valid response without results', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}));
      await expect(searchCities('No City')).resolves.toEqual([]);
    });

    it('rejects malformed city results instead of returning partial data', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({ results: [{ name: 'Unknown' }] }));
      await expect(searchCities('Unknown')).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it.each([
      { latitude: -90.01, longitude: 0 },
      { latitude: 90.01, longitude: 0 },
      { latitude: 0, longitude: -180.01 },
      { latitude: 0, longitude: 180.01 },
    ])('rejects coordinates outside geographic bounds: %o', async (coordinates) => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          results: [{ id: 1, name: 'Unknown', country: 'Nowhere', ...coordinates }],
        }),
      );

      await expect(searchCities('Unknown')).rejects.toMatchObject({ kind: 'invalid-response' });
    });

    it('rejects non-OK responses', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(searchCities('São Paulo')).rejects.toMatchObject({
        kind: 'http',
        message: expect.stringContaining('buscar cidades'),
      });
    });

    it('accepts an AbortSignal and propagates intentional cancellation', async () => {
      const fetchSpy = vi.fn((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
      );
      vi.stubGlobal('fetch', fetchSpy);
      const controller = new AbortController();

      const request = searchCities('São Paulo', { signal: controller.signal });
      controller.abort();

      await expect(request).rejects.toMatchObject({ name: 'AbortError' });
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it('reports a timeout distinctly from an intentional cancellation', async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        'fetch',
        vi.fn(
          (_url: string, init?: RequestInit) =>
            new Promise<Response>((_resolve, reject) => {
              init?.signal?.addEventListener('abort', () => {
                reject(new DOMException('Aborted', 'AbortError'));
              });
            }),
        ),
      );
      const request = searchCities('São Paulo');
      const expectation = expect(request).rejects.toMatchObject({ kind: 'timeout' });

      await vi.advanceTimersByTimeAsync(10_000);
      await expectation;
    });
  });

  describe('getWeather', () => {
    it('requests current conditions and five days and maps the response', async () => {
      const fetchSpy = mockFetchOnce(FORECAST_RESPONSE);
      vi.stubGlobal('fetch', fetchSpy);

      const data = await getWeather(CITY);
      const requestedUrl = new URL(fetchSpy.mock.calls[0][0]);
      expect(requestedUrl.searchParams.get('latitude')).toBe('-23.55');
      expect(requestedUrl.searchParams.get('longitude')).toBe('-46.63');
      expect(requestedUrl.searchParams.get('forecast_days')).toBe('5');
      expect(requestedUrl.searchParams.get('timezone')).toBe('auto');
      expect(requestedUrl.searchParams.get('current')).toContain('temperature_2m');
      expect(requestedUrl.searchParams.get('daily')).toContain('temperature_2m_min');
      expect(data.city).toEqual(CITY);
      expect(data.current.temperature).toBe(18);
      expect(data.forecast).toHaveLength(5);
      expect(data.forecast[4].precipitationProbability).toBeNull();
    });

    it('rejects an incomplete current or five-day forecast payload', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...FORECAST_RESPONSE,
          daily: { ...FORECAST_RESPONSE.daily, time: ['2026-06-16'] },
        }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('rejects a malformed current measurement', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...FORECAST_RESPONSE,
          current: { ...FORECAST_RESPONSE.current, temperature_2m: '18' },
        }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('preserves missing or null measurements as unavailable without losing five days', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { temperature_2m: null, weather_code: 3 },
          daily: {
            ...FORECAST_RESPONSE.daily,
            temperature_2m_max: [20, null, 22, 24, 25],
            temperature_2m_min: [12, 11, 13, 14, 15],
            precipitation_probability_max: [20, 90, 70, 10, null],
          },
        }),
      );

      const data = await getWeather(CITY);
      expect(data.current.temperature).toBeNull();
      expect(data.current.humidity).toBeNull();
      expect(data.current.weatherCode).toBe(3);
      expect(data.forecast[1].max).toBeNull();
      expect(data.forecast[4].precipitationProbability).toBeNull();
      expect(data.forecast).toHaveLength(5);
    });

    it('keeps forecast dates required when every optional measurement is absent', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          daily: { time: FORECAST_RESPONSE.daily.time },
        }),
      );

      const data = await getWeather(CITY);
      expect(data.current.temperature).toBeNull();
      expect(data.forecast.every((day) => day.max === null && day.min === null)).toBe(true);
    });

    it('rejects invalid calendar dates in daily forecast data', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          ...FORECAST_RESPONSE,
          daily: {
            ...FORECAST_RESPONSE.daily,
            time: ['2026-02-31', ...FORECAST_RESPONSE.daily.time.slice(1)],
          },
        }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('wraps invalid JSON and network failures as service errors', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: true, json: async () => Promise.reject(new Error('bad json')) }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);

      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });
  });
});
