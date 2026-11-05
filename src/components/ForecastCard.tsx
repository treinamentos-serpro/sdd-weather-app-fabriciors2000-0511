import type { ForecastDay, Unit } from '../types/weather';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import { getDayLabel, getShortDate } from '../lib/format';

interface ForecastCardProps {
  day: ForecastDay;
  index: number;
  unit: Unit;
}

/** Card de um dia da previsão. */
export default function ForecastCard({ day, index, unit }: ForecastCardProps) {
  const weatherLabel =
    day.weatherCode === null ? 'Condição indisponível' : getWeatherLabel(day.weatherCode);

  return (
    <li className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-md">
      <p className="font-semibold">{getDayLabel(day.date, index)}</p>
      <p className="text-xs text-white/70">{getShortDate(day.date)}</p>
      <span aria-hidden="true" className="text-3xl">
        {day.weatherCode === null ? '—' : getWeatherIcon(day.weatherCode)}
      </span>
      <span className="sr-only">{weatherLabel}</span>
      <p className="text-sm">
        <span className="font-semibold">
          {day.max === null ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Temperatura máxima indisponível</span>
            </>
          ) : (
            formatTemperature(day.max, unit)
          )}
        </span>{' '}
        <span className="text-white/70">
          {day.min === null ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Temperatura mínima indisponível</span>
            </>
          ) : (
            formatTemperature(day.min, unit)
          )}
        </span>
      </p>
      <p className="text-xs text-accent-400">
        <span aria-hidden="true">
          💧 {day.precipitationProbability === null ? '—' : `${day.precipitationProbability}%`}
        </span>
        <span className="sr-only">
          {day.precipitationProbability === null
            ? 'Probabilidade de precipitação indisponível'
            : `Probabilidade de precipitação ${day.precipitationProbability}%`}
        </span>
      </p>
    </li>
  );
}
