import { expect, test, type Page } from '@playwright/test';

const GEOCODING_ROUTE = /https:\/\/geocoding-api\.open-meteo\.com\/v1\/search(?:\?.*)?$/;
const FORECAST_ROUTE = /https:\/\/api\.open-meteo\.com\/v1\/forecast(?:\?.*)?$/;

const cities = {
  Seattle: {
    id: 1,
    name: 'Seattle',
    country: 'Estados Unidos',
    admin1: 'Washington',
    latitude: 47.6,
    longitude: -122.33,
  },
  Portland: {
    id: 2,
    name: 'Portland',
    country: 'Estados Unidos',
    admin1: 'Oregon',
    latitude: 45.52,
    longitude: -122.68,
  },
};

function forecastResponse(temperature: number) {
  return {
    current: {
      time: '2026-06-16T12:00',
      temperature_2m: temperature,
      relative_humidity_2m: 65,
      wind_speed_10m: 10,
      surface_pressure: 1015,
      precipitation: 0,
      weather_code: 2,
    },
    daily: {
      time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
      weather_code: [2, 61, 80, 1, 0],
      temperature_2m_max: [20, 19, 22, 24, 25],
      temperature_2m_min: [12, 11, 13, 14, 15],
      precipitation_probability_max: [20, 90, 70, 10, 0],
    },
  };
}

function isCityName(value: string | null): value is keyof typeof cities {
  return value !== null && Object.hasOwn(cities, value);
}

test.beforeEach(async ({ page }) => {
  await page.route(GEOCODING_ROUTE, async (route) => {
    const query = new URL(route.request().url()).searchParams.get('name');
    const city = isCityName(query) ? cities[query] : undefined;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(city ? { results: [city] } : {}),
    });
  });

  await page.route(FORECAST_ROUTE, async (route) => {
    const latitude = new URL(route.request().url()).searchParams.get('latitude');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse(latitude === '45.52' ? 11 : 18)),
    });
  });
});

async function searchAndSelect(page: Page, cityName: keyof typeof cities) {
  await page.getByLabel(/buscar cidade/i).fill(cityName);
  await page.getByRole('button', { name: /buscar/i }).click();
  await page
    .getByRole('button', { name: new RegExp(`selecionar ${cityName}`, 'i') })
    .click();
}

test('fluxo completo: buscar, selecionar, conferir cinco dias e trocar unidade', async ({ page }) => {
  await page.goto('/');
  await searchAndSelect(page, 'Seattle');

  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  const forecast = page.getByRole('region', { name: /previsão de 5 dias/i });
  const days = forecast.getByRole('listitem');
  await expect(forecast).toBeVisible();
  await expect(days).toHaveCount(5);
  await expect(page.getByText('18°C').first()).toBeVisible();

  await page.getByRole('button', { name: '°F' }).click();
  await expect(page.getByText('64°F').first()).toBeVisible();
  for (const day of await days.all()) {
    await expect(day).toContainText('°F');
    await expect(day).not.toContainText('°C');
  }
});

test('estado vazio distingue uma busca sem resultados de erro ou carregamento', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/buscar cidade/i).fill('xyzxyz');
  await page.getByRole('button', { name: /buscar/i }).click();

  await expect(page.getByText(/nenhuma cidade encontrada/i)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText(/buscando cidades/i)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Seattle' })).toHaveCount(0);
});

test('falha na busca oferece retry e permite selecionar o resultado', async ({ page }) => {
  let attempts = 0;
  await page.route(GEOCODING_ROUTE, async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [cities.Seattle] }),
    });
  });
  await page.goto('/');

  await page.getByLabel(/buscar cidade/i).fill('Seattle');
  await page.getByRole('button', { name: /buscar/i }).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText(/não foi possível buscar cidades/i);

  await alert.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByRole('button', { name: /selecionar seattle/i })).toBeVisible();
  expect(attempts).toBe(2);
});

test('falha ao carregar o clima oferece retry sem mostrar valores inventados', async ({ page }) => {
  let attempts = 0;
  await page.route(FORECAST_ROUTE, async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse(18)),
    });
  });
  await page.goto('/');
  await searchAndSelect(page, 'Seattle');

  const alert = page.getByRole('alert');
  await expect(alert).toContainText(/não foi possível carregar o clima/i);
  await expect(page.getByRole('region', { name: /clima atual/i })).toHaveCount(0);
  await expect(page.getByRole('region', { name: /previsão de 5 dias/i })).toHaveCount(0);

  await alert.getByRole('button', { name: /tentar novamente/i }).click();
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  expect(attempts).toBe(2);
});

test('não associa a resposta anterior à nova cidade durante o carregamento', async ({ page }) => {
  await page.route(FORECAST_ROUTE, async (route) => {
    const latitude = new URL(route.request().url()).searchParams.get('latitude');
    if (latitude === '45.52') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(forecastResponse(11)),
      });
      return;
    }

    await route.fallback();
  });
  await page.goto('/');
  await searchAndSelect(page, 'Seattle');
  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();

  await searchAndSelect(page, 'Portland');
  await expect(page.getByRole('status')).toContainText(/carregando o clima/i);
  await expect(page.getByRole('region', { name: /clima atual/i })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Seattle' })).toHaveCount(0);

  await expect(page.getByRole('heading', { name: 'Portland' })).toBeVisible();
  await expect(page.getByRole('region', { name: /clima atual/i }).getByText('11°C')).toBeVisible();
});

test('fluxo principal funciona em tela móvel sem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.goto('/');
  await searchAndSelect(page, 'Seattle');
  await page.getByRole('button', { name: '°F' }).click();

  await expect(page.getByRole('heading', { name: 'Seattle' })).toBeVisible();
  await expect(page.getByRole('region', { name: /previsão de 5 dias/i }).getByRole('listitem')).toHaveCount(5);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
  ).toBe(true);
});

test('resposta parcial exibe indisponibilidade sem inventar medidas', async ({ page }) => {
  await page.route(FORECAST_ROUTE, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: { temperature_2m: null, weather_code: 3 },
        daily: {
          time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
          temperature_2m_max: [null, 19, 22, 24, 25],
          temperature_2m_min: [12, 11, 13, 14, 15],
        },
      }),
    });
  });
  await page.goto('/');
  await searchAndSelect(page, 'Seattle');

  const current = page.getByRole('region', { name: /clima atual/i });
  await expect(current.getByText('Temperatura indisponível')).toBeVisible();
  await expect(current.getByRole('status')).toContainText(/dados atuais estão indisponíveis/i);

  const forecast = page.getByRole('region', { name: /previsão de 5 dias/i });
  await expect(forecast.getByRole('listitem')).toHaveCount(5);
  await expect(forecast.getByText('Temperatura máxima indisponível')).toBeVisible();
  await expect(forecast.getByText('Probabilidade de precipitação indisponível').first()).toBeVisible();
});
