import React from 'react';

function CurrentLocation({ cityName }) {
  return (
    <div className="current-location-display">
      <p>Погода для: <span>{cityName || '-'}</span></p>
    </div>
  );
}

export default CurrentLocation;