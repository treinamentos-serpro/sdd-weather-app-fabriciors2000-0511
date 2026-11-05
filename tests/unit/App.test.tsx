import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
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

const WEATHER: WeatherData = {
  city: CITY,
  current: {
    time: '2026-06-16T12:00',
    temperature: 24,
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(searchCities).mockReset();
    vi.mocked(getWeather).mockReset();
  });

  it('starts without weather data and shows the search and unit controls', () => {
    render(<App />);

    expect(screen.getByText('WeatherView')).toBeInTheDocument();
    expect(screen.getByLabelText(/buscar cidade/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /unidade de temperatura/i })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /clima atual/i })).not.toBeInTheDocument();
  });

  it('searches real cities and loads weather only after explicit selection', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByRole('button', { name: /selecionar lisboa, portugal/i })).toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Lisboa' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /selecionar lisboa, portugal/i }));

    expect(await screen.findByRole('heading', { name: 'Lisboa' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /previsão de 5 dias/i })).toBeInTheDocument();
    expect(getWeather).toHaveBeenCalledWith(CITY, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('supports searching and selecting a city with the keyboard', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const user = userEvent.setup();
    render(<App />);

    await user.tab();
    expect(screen.getByLabelText(/buscar cidade/i)).toHaveFocus();
    await user.keyboard('Lisboa');
    await user.tab();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('button', { name: /selecionar lisboa, portugal/i })).toBeInTheDocument();
    await user.tab();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('region', { name: /clima atual/i })).toBeInTheDocument();
  });

  it('shows an empty state when no city matches', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'xyzxyz');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(await screen.findByText(/nenhuma cidade encontrada/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lisboa' })).not.toBeInTheDocument();
  });

  it('converts current and all forecast temperatures without requesting weather again', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.click(await screen.findByRole('button', { name: /selecionar lisboa, portugal/i }));
    await screen.findByRole('region', { name: /clima atual/i });

    const forecast = screen.getByRole('region', { name: /previsão de 5 dias/i });
    expect(within(forecast).getAllByRole('listitem')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(within(screen.getByRole('region', { name: /clima atual/i })).getByText('75°F')).toBeInTheDocument();
    for (const day of within(forecast).getAllByRole('listitem')) {
      expect(day).toHaveTextContent('°F');
      expect(day).not.toHaveTextContent('°C');
    }
    expect(getWeather).toHaveBeenCalledOnce();
  });

  it('shows em dashes and announces when measurements are missing', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue({
      ...WEATHER,
      current: { ...WEATHER.current, temperature: null, humidity: null },
      forecast: WEATHER.forecast.map((day, index) =>
        index === 0 ? { ...day, max: null, precipitationProbability: null } : day,
      ),
    });
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.click(await screen.findByRole('button', { name: /selecionar lisboa, portugal/i }));

    const current = await screen.findByRole('region', { name: /clima atual/i });
    expect(within(current).getByText('Temperatura indisponível')).toBeInTheDocument();
    expect(within(current).getByText('Umidade indisponível')).toBeInTheDocument();
    expect(within(current).getByRole('status')).toHaveTextContent(/dados atuais estão indisponíveis/i);

    const firstForecastDay = within(screen.getByRole('region', { name: /previsão de 5 dias/i }))
      .getAllByRole('listitem')[0];
    expect(within(firstForecastDay).getByText('Temperatura máxima indisponível')).toBeInTheDocument();
    expect(within(firstForecastDay).getByText('Probabilidade de precipitação indisponível')).toBeInTheDocument();
  });

  it('announces weather loading and retries a failed request without showing invented values', async () => {
    const pendingWeather = deferred<WeatherData>();
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather)
      .mockReturnValueOnce(pendingWeather.promise)
      .mockResolvedValueOnce(WEATHER);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.click(await screen.findByRole('button', { name: /selecionar lisboa, portugal/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/carregando o clima/i);
    await act(async () => pendingWeather.reject(new Error('offline')));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/tente novamente/i);
    expect(screen.queryByRole('region', { name: /clima atual/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /previsão de 5 dias/i })).not.toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: /tentar novamente/i }));
    expect(await screen.findByRole('region', { name: /clima atual/i })).toBeInTheDocument();
    expect(getWeather).toHaveBeenCalledTimes(2);
  });

  it('clears the previous city data while the newly selected city is loading', async () => {
    const pendingWeather = deferred<WeatherData>();
    vi.mocked(searchCities).mockResolvedValueOnce([CITY]).mockResolvedValueOnce([OTHER_CITY]);
    vi.mocked(getWeather)
      .mockResolvedValueOnce(WEATHER)
      .mockReturnValueOnce(pendingWeather.promise);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.click(await screen.findByRole('button', { name: /selecionar lisboa, portugal/i }));
    await screen.findByRole('region', { name: /clima atual/i });

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Porto');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    await user.click(await screen.findByRole('button', { name: /selecionar porto, portugal/i }));

    expect(screen.getByRole('status')).toHaveTextContent(/carregando o clima/i);
    expect(screen.queryByRole('region', { name: /clima atual/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /previsão de 5 dias/i })).not.toBeInTheDocument();

    await act(async () => pendingWeather.resolve({ ...WEATHER, city: OTHER_CITY }));
    expect(await screen.findByRole('heading', { name: 'Porto' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lisboa' })).not.toBeInTheDocument();
  });

  it('allows retrying a failed search without fetching weather', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([CITY]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    const alert = await screen.findByRole('alert');
    await user.click(within(alert).getByRole('button', { name: /tentar novamente/i }));

    expect(await screen.findByRole('button', { name: /selecionar lisboa, portugal/i })).toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
    expect(searchCities).toHaveBeenCalledTimes(2);
  });
});
