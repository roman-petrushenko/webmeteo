import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <p>&copy; {currentYear} WebMeteo. Дані надані OpenWeatherMap (погода).</p>
    </footer>
  );
}

export default Footer;