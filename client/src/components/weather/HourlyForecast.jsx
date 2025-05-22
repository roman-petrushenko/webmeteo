import React from 'react';
import HourlyForecastTable from './HourlyForecastTable';
import OptionalDataToggles from './OptionalDataToggles';

function HourlyForecast({
  selectedDayKey,
  hourlyData,
  characteristicsConfig,
  optionalCharsVisibility,
  onToggleOptionalChar,
  cityName
}) {
  if (!selectedDayKey) {
    return (
      <div className="hourly-forecast-section-react">
        <p id="noDaySelectedMessageReact">Будь ласка, оберіть день для перегляду погодинного прогнозу.</p>
      </div>
    );
  }

  if (hourlyData.length === 0) {
      return (
        <div className="hourly-forecast-section-react">
          <h2 id="hourlyForecastTitleReact">Погодинний прогноз для {cityName}</h2>
          <p>Немає погодинних даних для цього дня.</p>
        </div>
      );
  }


  const dateObj = new Date(selectedDayKey + "T00:00:00Z");
  const formattedDate = dateObj.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const title = `Прогноз на ${formattedDate}`;

  return (
    <div className="hourly-forecast-section-react">
      <h2 id="hourlyForecastTitleReact">{title}</h2>
      <HourlyForecastTable
        hourlyData={hourlyData}
        characteristicsConfig={characteristicsConfig}
        optionalCharsVisibility={optionalCharsVisibility}
      />
      <OptionalDataToggles
        characteristicsConfig={characteristicsConfig}
        optionalCharsVisibility={optionalCharsVisibility}
        onToggle={onToggleOptionalChar}
      />
    </div>
  );
}

export default HourlyForecast;