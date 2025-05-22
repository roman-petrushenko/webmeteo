import React from 'react';

function OptionalDataToggles({ characteristicsConfig, optionalCharsVisibility, onToggle }) {
  const optionalChars = characteristicsConfig.filter(char => char.optional);

  if (optionalChars.length === 0) {
    return null;
  }

  return (
    <div className="optional-data-toggle-container-react">
      <h3>Додаткові параметри:</h3>
      <div className="checkbox-group-react">
        {optionalChars.map(char => (
          <label key={char.key}>
            <input
              type="checkbox"
              checked={!!optionalCharsVisibility[char.key]}
              onChange={() => onToggle(char.key)}
            />
            {char.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default OptionalDataToggles;