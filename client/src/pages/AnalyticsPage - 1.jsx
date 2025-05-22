import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Для переходу на сторінку постів
import AuthContext from '../context/AuthContext';
import { getTopics as apiGetTopics } from '../services/api';
import TopicList from '../components/analytics/TopicList';
import CreateTopicForm from '../components/analytics/CreateTopicForm';
import PaginationControls from '../components/common/PaginationControls';

function AnalyticsPage() {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate(); // Ініціалізуємо useNavigate

  const [topicsData, setTopicsData] = useState({
    items: [], currentPage: 1, totalPages: 1, totalItems: 0
  });
  const [topicsLimit] = useState(5); 
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [currentTopicSearchQuery, setCurrentTopicSearchQuery] = useState('');
  
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [errorTopics, setErrorTopics] = useState(null);
  const [showCreateTopicForm, setShowCreateTopicForm] = useState(false);

  const fetchTopics = useCallback(async (page = 1, searchQuery = '') => {
    setIsLoadingTopics(true);
    setErrorTopics(null);
    try {
      const response = await apiGetTopics(page, topicsLimit, searchQuery);
      setTopicsData({
        items: response.data,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems
      });
    } catch (err) {
      setErrorTopics(err.message || 'Не вдалося завантажити теми.');
      setTopicsData({ items: [], currentPage: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setIsLoadingTopics(false);
    }
  }, [topicsLimit]);

  useEffect(() => {
    fetchTopics(topicsData.currentPage, currentTopicSearchQuery);
  }, [fetchTopics, topicsData.currentPage, currentTopicSearchQuery]);

  const handleTopicSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentTopicSearchQuery(topicSearchTerm);
    setTopicsData(prev => ({ ...prev, currentPage: 1 }));
  };

  // При кліку на тему, переходимо на сторінку постів цієї теми
  const handleSelectTopic = (topic) => {
    // Передаємо postCount через state, щоб уникнути зайвого запиту деталей теми на новій сторінці
    navigate(`/analytics/topics/${topic.id}`, { 
        state: { 
            topicTitle: topic.title, 
            postCount: topic.postCount 
        } 
    });
  };

  const handleTopicCreated = (newTopic) => {
    setCurrentTopicSearchQuery('');
    setTopicSearchTerm('');
    setTopicsData(prev => ({ ...prev, currentPage: 1 })); 
    setShowCreateTopicForm(false);
    // Одразу переходимо на сторінку новоствореної теми
    navigate(`/analytics/topics/${newTopic.id}`, { 
        state: { 
            topicTitle: newTopic.title, 
            postCount: newTopic.postCount 
        } 
    });
  };

  const handleTopicPageChange = (newPage) => {
    if (newPage !== topicsData.currentPage) {
      setTopicsData(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  return (
    <div className="analytics-page-container">
      <h2>Відділ аналітики та обговорень</h2>

      {isLoggedIn && (
        <button onClick={() => setShowCreateTopicForm(!showCreateTopicForm)} className="toggle-form-button">
          {showCreateTopicForm ? 'Скасувати створення теми' : 'Створити нову тему'}
        </button>
      )}
      {showCreateTopicForm && <CreateTopicForm onTopicCreated={handleTopicCreated} />}

      <hr className="section-divider" />

      <div className="topics-section">
        <h3>Теми обговорень</h3>
        <form onSubmit={handleTopicSearchSubmit} className="topic-search-form">
          <input
            type="text"
            placeholder="Пошук за назвою теми..."
            value={topicSearchTerm}
            onChange={(e) => setTopicSearchTerm(e.target.value)}
          />
          <button type="submit">Знайти</button>
          {currentTopicSearchQuery && (
            <button 
                type="button" 
                onClick={() => { 
                    setTopicSearchTerm(''); 
                    setCurrentTopicSearchQuery('');
                    setTopicsData(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="clear-search-button"
            >Очистити пошук</button>
          )}
        </form>

        {isLoadingTopics && <p>Завантаження тем...</p>}
        {errorTopics && <p className="error-message">{errorTopics}</p>}
        {!isLoadingTopics && !errorTopics && topicsData.items.length === 0 && currentTopicSearchQuery && (
            <p>За вашим запитом "{currentTopicSearchQuery}" нічого не знайдено.</p>
        )}
        {!isLoadingTopics && !errorTopics && topicsData.items.length === 0 && !currentTopicSearchQuery && (
            <p>Тем для обговорення ще немає.</p>
        )}

        {!isLoadingTopics && !errorTopics && topicsData.items.length > 0 && (
          <>
            <TopicList 
              topics={topicsData.items} 
              onSelectTopic={handleSelectTopic} // Ця функція тепер буде навігувати
              // selectedTopicId більше не потрібен тут, бо теми не "виділяються" на цій сторінці
            />
            <PaginationControls
              currentPage={topicsData.currentPage}
              totalPages={topicsData.totalPages}
              onPageChange={handleTopicPageChange}
              itemsName={`тем (всього ${topicsData.totalItems})`}
            />
          </>
        )}
      </div>
      {/* Секція для постів тут більше не потрібна */}
    </div>
  );
}

export default AnalyticsPage;