import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

export type WeatherServiceErrorKind = 'network' | 'timeout' | 'http' | 'invalid-response';

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    readonly kind: WeatherServiceErrorKind,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

interface RequestOptions {
  signal?: AbortSignal;
}

interface CurrentResponse {
  time?: string | null;
  temperature_2m?: number | null;
  relative_humidity_2m?: number | null;
  wind_speed_10m?: number | null;
  surface_pressure?: number | null;
  precipitation?: number | null;
  weather_code?: number | null;
}

interface DailyResponse {
  time: string[];
  weather_code?: (number | null)[];
  temperature_2m_max?: (number | null)[];
  temperature_2m_min?: (number | null)[];
  precipitation_probability_max?: (number | null)[];
}

type ServiceOperation = 'search' | 'weather';

function operationLabel(operation: ServiceOperation): string {
  return operation === 'search' ? 'buscar cidades' : 'carregar o clima';
}

function abortError(signal?: AbortSignal): Error {
  return signal?.reason instanceof Error
    ? signal.reason
    : new DOMException('A requisição foi cancelada.', 'AbortError');
}

async function fetchJson(
  url: string,
  operation: ServiceOperation,
  signal?: AbortSignal,
): Promise<unknown> {
  if (signal?.aborted) throw abortError(signal);

  const controller = new AbortController();
  const action = operationLabel(operation);
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abortRequest = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abortRequest, { once: true });

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new WeatherServiceError(`Não foi possível ${action}. Tente novamente.`, 'http');
    }

    try {
      return await response.json();
    } catch {
      throw new WeatherServiceError(`A API retornou uma resposta inválida ao ${action}.`, 'invalid-response');
    }
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (signal?.aborted) throw abortError(signal);
    if (timedOut) {
      throw new WeatherServiceError(`Tempo limite ao ${action}. Tente novamente.`, 'timeout');
    }
    throw new WeatherServiceError(`Falha de rede ao ${action}. Verifique sua conexão.`, 'network');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalFiniteNumber(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || isFiniteNumber(value);
}

function isOptionalMetricArray(value: unknown): value is (number | null)[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.length === 5 &&
      value.every((item) => item === null || isFiniteNumber(item)))
  );
}

function isCityResult(value: unknown): value is Record<string, unknown> & {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
} {
  return (
    isRecord(value) &&
    isFiniteNumber(value.id) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    (value.country === undefined || typeof value.country === 'string') &&
    (value.admin1 === undefined || typeof value.admin1 === 'string')
  );
}

/**
 * Busca cidades por nome (geocoding). A ausência de resultados é diferente de
 * uma resposta malformada e, portanto, somente a primeira retorna lista vazia.
 */
export async function searchCities(name: string, options: RequestOptions = {}): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'pt',
    format: 'json',
  });
  const payload = await fetchJson(`${GEOCODING_URL}?${params.toString()}`, 'search', options.signal);
  if (!isRecord(payload)) {
    throw new WeatherServiceError('A API retornou uma resposta inválida.', 'invalid-response');
  }

  const results = payload.results;
  if (results === undefined) return [];
  if (!Array.isArray(results) || !results.every(isCityResult)) {
    throw new WeatherServiceError('A API retornou cidades em formato inválido.', 'invalid-response');
  }

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    country: typeof r.country === 'string' ? r.country : '',
    ...(typeof r.admin1 === 'string' ? { admin1: r.admin1 } : {}),
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

function isCurrentWeather(value: unknown): value is CurrentResponse {
  return (
    isRecord(value) &&
    (value.time === undefined ||
      value.time === null ||
      (typeof value.time === 'string' && value.time.length > 0)) &&
    isOptionalFiniteNumber(value.temperature_2m) &&
    isOptionalFiniteNumber(value.relative_humidity_2m) &&
    isOptionalFiniteNumber(value.wind_speed_10m) &&
    isOptionalFiniteNumber(value.surface_pressure) &&
    isOptionalFiniteNumber(value.precipitation) &&
    isOptionalFiniteNumber(value.weather_code)
  );
}

function isDailyWeather(value: unknown): value is DailyResponse {
  if (!isRecord(value)) return false;
  const { time, weather_code, temperature_2m_max, temperature_2m_min, precipitation_probability_max } =
    value;

  return (
    Array.isArray(time) &&
    time.length === 5 &&
    time.every((date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) &&
    isOptionalMetricArray(weather_code) &&
    isOptionalMetricArray(temperature_2m_max) &&
    isOptionalMetricArray(temperature_2m_min) &&
    time.every((_date, index) => {
      const max = temperature_2m_max?.[index];
      const min = temperature_2m_min?.[index];
      return max == null || min == null || max >= min;
    }) &&
    isOptionalMetricArray(precipitation_probability_max) &&
    (precipitation_probability_max ?? []).every(
      (probability) =>
        probability === null ||
        (isFiniteNumber(probability) && probability >= 0 && probability <= 100),
    ) &&
    time.every((date, index) => isIsoDate(date) && (index === 0 || date > time[index - 1]))
  );
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function mapCurrent(c: CurrentResponse): CurrentWeather {
  return {
    time: c.time ?? null,
    temperature: c.temperature_2m ?? null,
    humidity: c.relative_humidity_2m ?? null,
    windSpeed: c.wind_speed_10m ?? null,
    pressure: c.surface_pressure ?? null,
    precipitation: c.precipitation ?? null,
    weatherCode: c.weather_code ?? null,
  };
}

function mapForecast(d: DailyResponse): ForecastDay[] {
  return d.time.map((date, i) => ({
    date,
    weatherCode: d.weather_code?.[i] ?? null,
    max: d.temperature_2m_max?.[i] ?? null,
    min: d.temperature_2m_min?.[i] ?? null,
    precipitationProbability: d.precipitation_probability_max?.[i] ?? null,
  }));
}

/**
 * Busca o clima atual e a previsão de 5 dias para uma cidade.
 * Temperaturas retornam em Celsius (conversão fica na UI).
 */
export async function getWeather(city: City, options: RequestOptions = {}): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '5',
    timezone: 'auto',
  });

  const payload = await fetchJson(`${FORECAST_URL}?${params.toString()}`, 'weather', options.signal);
  if (!isRecord(payload) || !isDailyWeather(payload.daily)) {
    throw new WeatherServiceError('A API retornou dados de clima incompletos ou inválidos.', 'invalid-response');
  }
  const current = payload.current;
  if (current !== undefined && current !== null && !isCurrentWeather(current)) {
    throw new WeatherServiceError('A API retornou dados de clima incompletos ou inválidos.', 'invalid-response');
  }

  return {
    city,
    current: mapCurrent(current ?? {}),
    forecast: mapForecast(payload.daily),
  };
}
