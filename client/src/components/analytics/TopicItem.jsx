import React, { useContext } from 'react';
import AuthContext from '../../context/AuthContext'; // Потрібен для перевірки прав адміна

// onDeleteTopic буде передаватися з AnalyticsPage
function TopicItem({ topic, onSelectTopic, isSelected, onDeleteTopic }) { 
  const { user, isLoggedIn } = useContext(AuthContext);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Зупиняємо спливання події, щоб не викликати onSelectTopic
    if (window.confirm(`Ви впевнені, що хочете видалити тему "${topic.title}" та всі її пости?`)) {
      onDeleteTopic(topic.id);
    }
  };

  return (
    <div 
      className={`topic-item ${isSelected ? 'selected' : ''}`} 
      onClick={() => onSelectTopic(topic)} // Клік на сам елемент теми
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if(e.key === 'Enter') onSelectTopic(topic);}}
    >
      <div className="topic-item-content">
        <h4>{topic.title}</h4>
        <p className="topic-meta">
          Створено: {topic.authorUsername} ({formatDate(topic.createdAt)})
        </p>
        <p className="topic-meta">Постів: {topic.postCount || 0}</p>
      </div>
      {isLoggedIn && user && user.isAdmin && (
        <div className="topic-actions">
          <button 
            onClick={handleDeleteClick} 
            className="delete-topic-btn"
            title="Видалити тему"
          >
            Видалити Тему
          </button>
        </div>
      )}
    </div>
  );
}

export default TopicItem;