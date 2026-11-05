import type { CurrentWeather as CurrentWeatherType, City, Unit } from '../types/weather';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherType;
  unit: Unit;
}

interface MetricProps {
  icon: string;
  label: string;
  value: string;
}

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
      <span aria-hidden="true" className="text-xl">
        {icon}
      </span>
      <div>
        <p className="text-xs text-white/70">{label}</p>
        <p className="font-semibold">
          {value === '—' ? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">{label} indisponível</span>
            </>
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );
}

/** Seção "hero" com as condições atuais da cidade selecionada. */
export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const location = [city.admin1, city.country].filter(Boolean).join(', ');
  const observationTime = current.time?.split('T')[1]?.slice(0, 5);
  const hasUnavailableData = [
    current.temperature,
    current.weatherCode,
    current.humidity,
    current.windSpeed,
    current.pressure,
    current.precipitation,
  ].some((value) => value === null);

  return (
    <section
      aria-label="Clima atual"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glass md:p-8"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">{city.name}</h2>
          {location && <p className="text-white/70">{location}</p>}

          <div className="mt-6 flex items-center gap-4">
            <span aria-hidden="true" className="text-6xl">
              {current.weatherCode === null ? '—' : getWeatherIcon(current.weatherCode)}
            </span>
            <span className="text-6xl font-light md:text-7xl">
              {current.temperature === null ? (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">Temperatura indisponível</span>
                </>
              ) : (
                formatTemperature(current.temperature, unit)
              )}
            </span>
          </div>
          <p className="mt-2 text-white/80">
            {current.weatherCode === null ? 'Condição indisponível' : getWeatherLabel(current.weatherCode)}
          </p>
          {hasUnavailableData && (
            <p role="status" className="mt-2 text-sm text-white/70">
              Alguns dados atuais estão indisponíveis.
            </p>
          )}
          {observationTime && (
            <p className="mt-2 text-sm text-white/70">
              Horário do registro: {observationTime}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric
            icon="💧"
            label="Umidade"
            value={current.humidity === null ? '—' : `${Math.round(current.humidity)}%`}
          />
          <Metric
            icon="💨"
            label="Vento"
            value={current.windSpeed === null ? '—' : `${Math.round(current.windSpeed)} km/h`}
          />
          <Metric
            icon="🌧️"
            label="Precipitação"
            value={current.precipitation === null ? '—' : `${current.precipitation} mm`}
          />
          <Metric
            icon="📊"
            label="Pressão"
            value={current.pressure === null ? '—' : `${Math.round(current.pressure)} hPa`}
          />
        </div>
      </div>
    </section>
  );
}
