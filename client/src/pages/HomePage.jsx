import React, { useState, useEffect, useCallback } from 'react';
import WeatherSearch from '../components/weather/WeatherSearch';
import CurrentLocation from '../components/weather/CurrentLocation';
import DailyForecastContainer from '../components/weather/DailyForecastContainer';
import HourlyForecast from '../components/weather/HourlyForecast';
// Стилі для погоди будуть в App.css або окремому HomePage.css
// import './HomePage.css';

// Конфігурація характеристик (як була в script.js)
// 3) Одиниці виміру в transform. 4) Порядок змінено. 5) Об'єднано опади.
const characteristicsConfig = [
    { key: 'weather_icon', label: '', transform: (val, item) => `<img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}" style="width:30px; height:30px; display:block; margin:auto;">`, alwaysVisible: true },
    { key: 'weather_description', label: 'Опис', transform: (val, item) => item.weather[0] ? item.weather[0].description : '-', alwaysVisible: true, cellClass: 'description-cell' },
    { key: 'temp', label: 'Температура', transform: val => `${Math.round(val)}°C`, alwaysVisible: true },
    { key: 'feels_like', label: 'Відчувається як', transform: val => `${Math.round(val)}°C`, alwaysVisible: true },
    { key: 'humidity', label: 'Вологість', transform: val => `${val}%`, alwaysVisible: true },
    { key: 'clouds_all', label: 'Хмарність', transform: (val, item) => `${item.clouds.all}%`, alwaysVisible: true },
    { key: 'pop', label: 'Ймовірн. опадів', transform: val => `${Math.round(val * 100)}%`, alwaysVisible: true },
    {
        key: 'rain_3h',
        label: 'Опади у рідк. екв.', // Змінено для компактності
        transform: (val, item) => {
            const rain = item.rain && item.rain['3h'];
            const snow = item.snow && item.snow['3h'];
            if (rain && snow) return `${(parseFloat(rain) + parseFloat(snow)).toFixed(1)} мм`;
            if (rain) return `${parseFloat(rain).toFixed(1)} мм`;
            if (snow) return `${parseFloat(snow).toFixed(1)} мм`;
            return '-';
        },
        alwaysVisible: true
    },
    { key: 'wind_speed', label: 'Швидкість вітру', transform: (val, item) => item.wind && item.wind.speed !== undefined ? `${item.wind.speed.toFixed(1)} м/с` : '-', alwaysVisible: true },
    { key: 'wind_deg', label: 'Напрям вітру', transform: (val, item) => item.wind && item.wind.deg !== undefined ? `${item.wind.deg}°` : '-', optional: true },
    { key: 'wind_gust', label: 'Пориви вітру', transform: (val, item) => item.wind && item.wind.gust ? `${item.wind.gust.toFixed(1)} м/с` : '-', optional: true },
    { key: 'pressure', label: 'Тиск', transform: val => `${val} гПа`, optional: true },
    { key: 'visibility', label: 'Видимість', transform: val => `${val} м`, optional: true },
];


function HomePage() {
  const apiKey = 'c88ce927f804587eaf478db1fbb3d1b8';

  const [cityQuery, setCityQuery] = useState('Київ'); // Початкове місто для пошуку
  const [currentCityName, setCurrentCityName] = useState('');
  const [fiveDayData, setFiveDayData] = useState([]); // Повний список з API
  const [dailyAggregatedData, setDailyAggregatedData] = useState([]); // Агреговані дані по днях
  const [selectedDayKey, setSelectedDayKey] = useState(null);
  const [hourlyDataForSelectedDay, setHourlyDataForSelectedDay] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Стан для видимості опціональних характеристик
  const initialOptionalCharsVisibility = {};
  characteristicsConfig.forEach(char => {
    if (char.optional) {
      initialOptionalCharsVisibility[char.key] = false; // За замовчуванням вимкнені
    }
  });
  const [optionalCharsVisibility, setOptionalCharsVisibility] = useState(initialOptionalCharsVisibility);

  const processWeatherData = useCallback((apiDataList) => {
    const dailyData = {};
    apiDataList.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().split('T')[0];

      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          temps: [],
          weatherDescriptions: [],
          icons: [],
          fullData: [] // Для погодинного прогнозу
        };
      }
      dailyData[dayKey].temps.push(item.main.temp);
      if (item.weather && item.weather[0]) {
        dailyData[dayKey].weatherDescriptions.push(item.weather[0].description);
        dailyData[dayKey].icons.push(item.weather[0].icon);
      } else {
        dailyData[dayKey].weatherDescriptions.push('н/д');
        dailyData[dayKey].icons.push('unknown');
      }
      dailyData[dayKey].fullData.push(item);
    });

    const aggregated = [];
    let dayCount = 0;
    for (const dayKey in dailyData) {
      if (dayCount >= 5) break;
      const dayInfo = dailyData[dayKey];
      const minTemp = Math.min(...dayInfo.temps);
      const maxTemp = Math.max(...dayInfo.temps);
      const midIdx = Math.floor(dayInfo.weatherDescriptions.length / 2);
      aggregated.push({
        dayKey,
        dateObj: new Date(dayKey + "T00:00:00Z"),
        minTemp,
        maxTemp,
        description: dayInfo.weatherDescriptions[midIdx] || dayInfo.weatherDescriptions[0] || 'н/д',
        icon: dayInfo.icons[midIdx] || dayInfo.icons[0] || 'unknown',
      });
      dayCount++;
    }
    setDailyAggregatedData(aggregated);
  }, []);


  const getWeatherData = useCallback(async (city) => {
    if (!apiKey || apiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
      setError('Будь ласка, вставте ваш API ключ OpenWeatherMap.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentCityName('');
    setDailyAggregatedData([]);
    setFiveDayData([]);
    setSelectedDayKey(null);
    setHourlyDataForSelectedDay([]);

    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=uk`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        if (response.status === 404) throw new Error(`Місто "${city}" не знайдено.`);
        if (response.status === 401) throw new Error('Помилка авторизації. Перевірте API ключ.');
        throw new Error(`Помилка отримання даних: ${response.statusText} (код: ${response.status})`);
      }
      const data = await response.json();
      setCurrentCityName(data.city.name);
      setFiveDayData(data.list);
      processWeatherData(data.list);
    } catch (err) {
      setError(err.message);
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, processWeatherData]);

  useEffect(() => {
    getWeatherData(cityQuery); // Початкове завантаження для Києва (або останнього cityQuery)
  }, [getWeatherData]); // Залежність від getWeatherData (яка залежить від apiKey, processWeatherData)

  const handleSearch = (city) => {
    setCityQuery(city); // Зберегти для можливого повторного пошуку при зміні apiKey, наприклад
    getWeatherData(city);
  };

  const handleDaySelect = (dayKey) => {
    setSelectedDayKey(dayKey);
    const hourlyForDay = fiveDayData.filter(item => new Date(item.dt * 1000).toISOString().split('T')[0] === dayKey);
    setHourlyDataForSelectedDay(hourlyForDay);
  };

  const handleToggleOptionalChar = (charKey) => {
    setOptionalCharsVisibility(prev => ({
      ...prev,
      [charKey]: !prev[charKey]
    }));
  };

  return (
    <div>
      <WeatherSearch onSearch={handleSearch} isLoading={isLoading} initialCity={cityQuery}/>
      <CurrentLocation cityName={currentCityName} />

      {error && <p className="error-message" style={{color: 'red', textAlign: 'center'}}>{error}</p>}
      
      <DailyForecastContainer
        dailyData={dailyAggregatedData}
        onDaySelect={handleDaySelect}
        selectedDayKey={selectedDayKey}
      />
      <HourlyForecast
        selectedDayKey={selectedDayKey}
        hourlyData={hourlyDataForSelectedDay}
        characteristicsConfig={characteristicsConfig}
        optionalCharsVisibility={optionalCharsVisibility}
        onToggleOptionalChar={handleToggleOptionalChar}
        cityName={currentCityName}
      />
    </div>
  );
}

export default HomePage;