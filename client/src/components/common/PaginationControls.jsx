import React from 'react';

// Додамо itemsName в props, щоб показувати, що саме ми пагінуємо
function PaginationControls({ currentPage, totalPages, onPageChange, itemsName = "елементів" }) { 
  if (!totalPages || totalPages <= 1) { // Змінено умову
    return null; 
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = [];
  // Проста логіка для відображення кнопок сторінок: поточна, +/- 2, перша, остання
  const MAX_VISIBLE_PAGES = 5; // Включаючи "..."
  if (totalPages <= MAX_VISIBLE_PAGES + 2) { // Якщо сторінок мало, показуємо всі
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1); // Завжди показуємо першу сторінку
    let startPage = Math.max(2, currentPage - Math.floor((MAX_VISIBLE_PAGES - 2) / 2));
    let endPage = Math.min(totalPages - 1, currentPage + Math.ceil((MAX_VISIBLE_PAGES - 2) / 2) -1);

    if (currentPage - 1 <= Math.floor((MAX_VISIBLE_PAGES-2)/2) +1) { // Якщо близько до початку
        endPage = MAX_VISIBLE_PAGES-1;
    }
    if (totalPages - currentPage <= Math.floor((MAX_VISIBLE_PAGES-2)/2) +1) { // Якщо близько до кінця
        startPage = totalPages - (MAX_VISIBLE_PAGES-2);
    }
    
    if (startPage > 2) {
      pageNumbers.push('...');
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }
    pageNumbers.push(totalPages); // Завжди показуємо останню сторінку
  }


  return (
    <div className="pagination-controls">
      <button onClick={handlePrevious} disabled={currentPage === 1}>
        « Попередня
      </button>
      {pageNumbers.map((number, index) =>
        number === '...' ? (
          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
        ) : (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={currentPage === number ? 'active' : ''}
            disabled={currentPage === number}
          >
            {number}
          </button>
        )
      )}
      <button onClick={handleNext} disabled={currentPage === totalPages}>
        Наступна »
      </button>
      {/* Інформація про сторінку та загальну кількість */}
      <span className="pagination-info">
         {itemsName} (стор. {currentPage} з {totalPages})
      </span>
    </div>
  );
}

export default PaginationControls;