import { useState, useEffect } from 'react';
import PillNav from './components/PillNav';
import './App.css';

const API_BASE = "https://api.open-meteo.com/v1/forecast";

function SunTimes({ sunTimes }) {
  const sunrise = new Date(sunTimes.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunset  = new Date(sunTimes.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunriseMs = new Date(sunTimes.sunrise).getTime();
  const sunsetMs  = new Date(sunTimes.sunset).getTime();
  const nowMs     = Date.now();
  const progress  = Math.min(Math.max((nowMs - sunriseMs) / (sunsetMs - sunriseMs), 0), 1);
  const cx = 10 + progress * 80;
  const cy = 50 - Math.sin(progress * Math.PI) * 35;

  return (
    <div className="sun-times">
      <p className="sun-title">🌅 Sunrise & Sunset</p>

      <div className="sun-times-grid">

        <div className="sun-card">
          <p style={{ fontSize: '2rem' }}>🌅</p>
          <p className="sun-label">Sunrise</p>
          <p className="sun-value">{sunrise}</p>
        </div>

        <div className="sun-arc-container">
          <svg viewBox="0 0 100 70" style={{ width: '100%', height: '140px' }}>
            {/* background arc */}
            <path d="M 10 55 Q 50 10 90 55" fill="none" stroke="#e0e0e0" strokeWidth="2.5" strokeLinecap="round" />
            {/* progress arc */}
            <path d="M 10 55 Q 50 10 90 55" fill="none" stroke="#f5a623" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${progress * 110} 110`} />
            {/* horizon */}
            <line x1="5" y1="55" x2="95" y2="55" stroke="#ddd" strokeWidth="1" />
            {/* sun glow */}
            <circle cx={cx} cy={cy} r="6" fill="#f5a623" opacity="0.3" />
            {/* sun */}
            <circle cx={cx} cy={cy} r="4" fill="#f5a623" />
            {/* sunrise label */}
            <text x="10" y="65" textAnchor="middle" fontSize="7" fill="#888">Rise</text>
            {/* sunset label */}
            <text x="90" y="65" textAnchor="middle" fontSize="7" fill="#888">Set</text>
          </svg>
        </div>

        <div className="sun-card">
          <p style={{ fontSize: '2rem' }}>🌇</p>
          <p className="sun-label">Sunset</p>
          <p className="sun-value">{sunset}</p>
        </div>

      </div>

      <div className="sun-daylight">
        <p>☀️ Daylight: {Math.round((sunsetMs - sunriseMs) / 3600000)} hrs {Math.round(((sunsetMs - sunriseMs) % 3600000) / 60000)} mins</p>
      </div>

    </div>
  );
}

function TempGraph({ slots }) {
  const temps = slots.map(s => s.temp);
  const times = slots.map(s =>
    new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const padding = { top: 30, bottom: 40, left: 40, right: 20 };
  const svgWidth = 600;
  const svgHeight = 200;
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const getX = (i) => padding.left + (i / (temps.length - 1)) * chartWidth;
  const getY = (t) => {
    if (maxTemp === minTemp) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((t - minTemp) / (maxTemp - minTemp)) * chartHeight;
  };
  const points = temps.map((t, i) => `${getX(i)},${getY(t)}`).join(' ');
  const fillPath = `M ${getX(0)},${getY(temps[0])} ` +
    temps.map((t, i) => `L ${getX(i)},${getY(t)}`).join(' ') +
    ` L ${getX(temps.length - 1)},${svgHeight - padding.bottom} L ${getX(0)},${svgHeight - padding.bottom} Z`;

  return (
    <div className="temp-graph">
      <p style={{ color: '#1e4a6e', fontWeight: '600', marginBottom: '0.5rem', fontSize: '1rem' }}>
        🌡️ Temperature Over Time
      </p>
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '180px' }}>
        <defs>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c5f8a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2c5f8a" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padding.top + p * chartHeight;
          const temp = Math.round(maxTemp - p * (maxTemp - minTemp));
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4,4" />
              <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#666">{temp}°</text>
            </g>
          );
        })}
        <path d={fillPath} fill="url(#tempGradient)" />
        <polyline points={points} fill="none" stroke="#2c5f8a" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {temps.map((t, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(t)} r="4" fill="#ffffff" stroke="#2c5f8a" strokeWidth="2" />
            <text x={getX(i)} y={getY(t) - 10} textAnchor="middle" fontSize="10" fill="#1e4a6e" fontWeight="600">{t}°</text>
            <text x={getX(i)} y={svgHeight - padding.bottom + 16} textAnchor="middle" fontSize="10" fill="#666">{times[i]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function App() {
  const [city, setCity] = useState('');
  const [cityName, setCityName] = useState('');
  const [weather, setWeather] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [activeDay, setActiveDay] = useState('#today');
  const [coords, setCoords] = useState(null);
  const [sunTimes, setSunTimes] = useState(null);

  const dayItems = [
    { label: 'Today', href: '#today', onClick: () => handleDayChange('#today', 0) },
    { label: 'Mon',   href: '#mon',   onClick: () => handleDayChange('#mon', 1) },
    { label: 'Tue',   href: '#tue',   onClick: () => handleDayChange('#tue', 2) },
    { label: 'Wed',   href: '#wed',   onClick: () => handleDayChange('#wed', 3) },
    { label: 'Thu',   href: '#thu',   onClick: () => handleDayChange('#thu', 4) },
    { label: 'Fri',   href: '#fri',   onClick: () => handleDayChange('#fri', 5) },
    { label: 'Sat',   href: '#sat',   onClick: () => handleDayChange('#sat', 6) },
  ];

  function getWeatherClass(code) {
    if (code === 0 || code === 1) return 'sunny';
    if (code <= 3)                return 'cloudy';
    return 'rainy';
  }

  function getWeatherEmoji(code) {
    if (code === 0 || code === 1) return '☀️';
    if (code <= 3)                return '⛅';
    if (code <= 48)               return '🌫️';
    if (code <= 67)               return '🌧️';
    if (code <= 77)               return '❄️';
    return '⛈️';
  }

  async function getWeather(latitude, longitude, dayIndex = 0) {
    const response = await fetch(`${API_BASE}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_sum,weather_code,sunrise,sunset&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`);
    const data = await response.json();

    if (dayIndex === 0) {
      setWeather({
        temperature: data.current.temperature_2m,
        windSpeed:   data.current.wind_speed_10m,
        humidity:    data.current.relative_humidity_2m,
        weatherCode: data.current.weather_code,
        isDaily:     false,
      });
    } else {
      setWeather({
        tempMax:       data.daily.temperature_2m_max[dayIndex],
        tempMin:       data.daily.temperature_2m_min[dayIndex],
        windSpeed:     data.daily.wind_speed_10m_max[dayIndex],
        precipitation: data.daily.precipitation_sum[dayIndex],
        weatherCode:   data.daily.weather_code[dayIndex],
        isDaily:       true,
      });
    }

    // ← inside getWeather now
    setSunTimes({
      sunrise: data.daily.sunrise[dayIndex],
      sunset:  data.daily.sunset[dayIndex],
    });

    const startIndex = dayIndex * 24;
    const slots = [];
    for (let i = 0; i < 7; i++) {
      const idx = startIndex + i * 3;
      slots.push({
        time: data.hourly.time[idx],
        temp: data.hourly.temperature_2m[idx],
        rain: data.hourly.precipitation_probability[idx],
        code: data.hourly.weather_code[idx],
      });
    }
    setHourly(slots);
  }

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const geoData = await geoResponse.json();
        const name = geoData?.address?.city ?? geoData?.address?.town ?? 'Your Location';
        setCoords({ lat, lon });
        setCityName(name);
        getWeather(lat, lon, 0);
      },
      () => {
        setCityName('Berlin');
        setCoords({ lat: 52.52, lon: 13.41 });
        getWeather(52.52, 13.41, 0);
      }
    );
  }, []);

  async function handleDayChange(href, dayIndex) {
    setActiveDay(href);
    if (coords) getWeather(coords.lat, coords.lon, dayIndex);
  }

  async function handleSearch() {
    if (!city) return;
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      alert('City not found');
      return;
    }
    const lat = geoData.results[0].latitude;
    const lon = geoData.results[0].longitude;
    const name = geoData.results[0].name;
    setCoords({ lat, lon });
    setCityName(name);
    getWeather(lat, lon, 0);
  }

  return (
    <div className="wrapper">
      <div className="navbar">
        <h1>Weather Dashboard</h1>
        <div className="search">
          <input
            type="text"
            placeholder="Enter city name"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button onClick={handleSearch}>Search</button>
          <span>{cityName ? `📍 ${cityName}` : ''}</span>
        </div>
      </div>

      <PillNav
        items={dayItems}
        activeHref={activeDay}
        baseColor="#ffffff"
        pillColor="#2c5f8a"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#ffffff"
      />

      <div className={`weather-info ${weather ? getWeatherClass(weather.weatherCode) : ''}`}>
        {weather ? (
          <div>
            <h2>Weather in {cityName}</h2>
            {weather.isDaily ? (
              <>
                <p>High: {weather.tempMax}°C</p>
                <p>Low: {weather.tempMin}°C</p>
                <p>Wind Speed: {weather.windSpeed} km/h</p>
                <p>Precipitation: {weather.precipitation} mm</p>
              </>
            ) : (
              <>
                <p>Temperature: {weather.temperature}°C</p>
                <p>Wind Speed: {weather.windSpeed} km/h</p>
                <p>Humidity: {weather.humidity}%</p>
              </>
            )}
          </div>
        ) : (
          <p>Loading weather...</p>
        )}
      </div>

      {hourly.length > 0 && (
        <>
          <div className="hourly-strip">
            {hourly.map((slot, i) => (
              <div className="hourly-card" key={i}>
                <p className="hourly-time">
                  {new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="hourly-emoji">{getWeatherEmoji(slot.code)}</p>
                <p className="hourly-rain">💧 {slot.rain}%</p>
                <p className="hourly-temp">{slot.temp}°C</p>
              </div>
            ))}
          </div>
          <TempGraph slots={hourly} />
        </>
      )}

      {sunTimes && <SunTimes sunTimes={sunTimes} />}
    </div>
  );
}

export default App;