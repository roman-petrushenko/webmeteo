import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>404 - Сторінку не знайдено</h2>
      <p>Вибачте, сторінка, яку ви шукаєте, не існує.</p>
      <Link to="/">Повернутися на Головну</Link>
    </div>
  );
}

export default NotFoundPage;