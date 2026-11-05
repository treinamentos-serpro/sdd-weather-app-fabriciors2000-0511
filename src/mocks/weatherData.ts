import type { WeatherData } from '../types/weather';

export const mockWeatherData: WeatherData[] = [
  {
    city: {
      id: 1,
      name: 'Seattle',
      country: 'Estados Unidos',
      admin1: 'Washington',
      latitude: 47.6,
      longitude: -122.33,
    },
    current: {
      time: '2026-06-16T12:00',
      temperature: 18,
      weatherCode: 2,
      humidity: 65,
      windSpeed: 10,
      pressure: 1015,
      precipitation: 0,
    },
    forecast: [
      { date: '2026-06-16', min: 12, max: 20, weatherCode: 2, precipitationProbability: 20 },
      { date: '2026-06-17', min: 11, max: 19, weatherCode: 61, precipitationProbability: 90 },
      { date: '2026-06-18', min: 13, max: 22, weatherCode: 80, precipitationProbability: 70 },
      { date: '2026-06-19', min: 14, max: 24, weatherCode: 1, precipitationProbability: 10 },
      { date: '2026-06-20', min: 15, max: 25, weatherCode: 0, precipitationProbability: 0 },
    ],
  },
  {
    city: {
      id: 2,
      name: 'Lisboa',
      country: 'Portugal',
      latitude: 38.72,
      longitude: -9.14,
    },
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
  },
  {
    city: {
      id: 3,
      name: 'São Paulo',
      country: 'Brasil',
      admin1: 'São Paulo',
      latitude: -23.55,
      longitude: -46.63,
    },
    current: {
      time: '2026-06-16T12:00',
      temperature: 21,
      weatherCode: 3,
      humidity: 72,
      windSpeed: 8,
      pressure: 1012,
      precipitation: 0.4,
    },
    forecast: [
      { date: '2026-06-16', min: 15, max: 21, weatherCode: 3, precipitationProbability: 25 },
      { date: '2026-06-17', min: 14, max: 22, weatherCode: 2, precipitationProbability: 15 },
      { date: '2026-06-18', min: 15, max: 23, weatherCode: 61, precipitationProbability: 55 },
      { date: '2026-06-19', min: 16, max: 24, weatherCode: 1, precipitationProbability: 5 },
      { date: '2026-06-20', min: 16, max: 23, weatherCode: 2, precipitationProbability: 20 },
    ],
  },
];
