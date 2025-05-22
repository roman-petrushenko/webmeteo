import React from 'react';
import DayWidget from './DayWidget';

function DailyForecastContainer({ dailyData, onDaySelect, selectedDayKey }) {
  if (!dailyData || dailyData.length === 0) {
    return <p style={{textAlign: 'center', margin: '20px'}}>Дані про погоду завантажуються або відсутні...</p>;
  }

  return (
    <div className="daily-forecast-react-container"> {/* Використовуємо новий клас, щоб не конфліктувати зі старими стилями */}
      {dailyData.map((day) => (
        <DayWidget
          key={day.dayKey}
          dayData={day}
          onDaySelect={onDaySelect}
          isSelected={selectedDayKey === day.dayKey}
        />
      ))}
    </div>
  );
}

export default DailyForecastContainer;