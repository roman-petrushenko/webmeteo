import React from 'react';

function DayWidget({ dayData, onDaySelect, isSelected }) {
  const { dayKey, dateObj, minTemp, maxTemp, description, icon } = dayData;

  const dayName = dateObj.toLocaleDateString('uk-UA', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
  const shortDate = dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const iconSrc = icon === 'unknown' ? '#' : `https://openweathermap.org/img/wn/${icon}@2x.png`;

  return (
    <div
      className={`day-widget-react ${isSelected ? 'selected' : ''}`}
      onClick={() => onDaySelect(dayKey)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onDaySelect(dayKey)}
    >
      <h3>{dayName}</h3>
      <p className="date-day">{shortDate}</p>
      <img src={iconSrc} alt={description} />
      <p className="temp-range">
        <span className="temp-min" title="Мін.">{Math.round(minTemp)}°</span>/
        <span className="temp-max" title="Макс.">{Math.round(maxTemp)}°</span>
      </p>
      <p className="description">{description}</p>
    </div>
  );
}

export default DayWidget;