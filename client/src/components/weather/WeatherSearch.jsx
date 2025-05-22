import React, { useState } from 'react';

function WeatherSearch({ onSearch, isLoading, initialCity }) {
  const [city, setCity] = useState(initialCity || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch(city.trim());
    } else {
      alert('Будь ласка, введіть назву міста.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="weather-search-container">
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Введіть назву міста..."
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Пошук...' : 'Шукати'}
      </button>
    </form>
  );
}

export default WeatherSearch;