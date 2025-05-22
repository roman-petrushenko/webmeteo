import React from 'react';

function HourlyForecastTable({ hourlyData, characteristicsConfig, optionalCharsVisibility }) {
  if (!hourlyData || hourlyData.length === 0) {
    return null; // Або повідомлення про відсутність даних
  }

  return (
    <div className="hourly-forecast-table-container-react">
      <table id="hourlyForecastTableReact">
        <thead>
          <tr>
            <th>{/* Пуста для назв характеристик */}</th>
            {hourlyData.map(item => (
              <th key={item.dt}>
                {new Date(item.dt * 1000).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {characteristicsConfig.map(char => {
            if (char.optional && !optionalCharsVisibility[char.key]) {
              return null; // Не рендерити рядок, якщо опція вимкнена
            }

            // Перевірка, чи є дані для цієї характеристики (опціонально, але робить таблицю чистішою)
            const hasDataForThisRow = hourlyData.some(item => {
                try {
                    if (char.key === 'weather_icon') return item.weather && item.weather[0];
                    if (char.key === 'weather_description') return item.weather && item.weather[0] && item.weather[0].description;
                    if (char.key.startsWith('wind_')) return item.wind && item.wind[char.key.substring(5)] !== undefined;
                    if (char.key === 'clouds_all') return item.clouds && item.clouds.all !== undefined;
                    if (char.key === 'rain_3h') return (item.rain && item.rain['3h']) || (item.snow && item.snow['3h']);
                    if (char.key === 'pop') return item.pop !== undefined;
                    if (item.main && item.main[char.key] !== undefined) return true;
                    if (item[char.key] !== undefined) return true;
                    return false;
                } catch { return false; }
            });

            if (!hasDataForThisRow && !char.alwaysVisible) return null; // Не показувати порожні опціональні рядки

            return (
              <tr key={char.key}>
                <th>{char.label}</th>
                {hourlyData.map(item => {
                  let value = '-';
                  try {
                    if (char.key === 'weather_icon') {
                        value = char.transform(null, item);
                    } else if (char.key === 'weather_description') {
                        value = char.transform(null, item);
                    } else if (char.key.startsWith('wind_')) {
                         value = item.wind ? char.transform(item.wind[char.key.substring(5)], item) : '-';
                    } else if (char.key === 'clouds_all') {
                        value = item.clouds ? char.transform(item.clouds.all, item) : '-';
                    } else if (char.key === 'rain_3h') {
                        value = char.transform(null, item);
                    } else if (char.key === 'pop') {
                        value = char.transform(item.pop, item);
                    } else {
                        value = item.main && item.main[char.key] !== undefined ? char.transform(item.main[char.key], item) :
                                item[char.key] !== undefined ? char.transform(item[char.key], item) : '-';
                    }
                  } catch (e) { /* console.warn('Error processing cell data', e) */ }
                  
                  if (char.key === 'weather_icon') {
                    return <td key={item.dt} dangerouslySetInnerHTML={{ __html: value }}></td>;
                  }
                  return <td key={item.dt} className={char.cellClass || ''}>{value}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default HourlyForecastTable;