import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { 
    getTopics as apiGetTopics, 
    deleteTopic as apiDeleteTopic // Імпортуємо нову функцію
} from '../services/api';
import TopicList from '../components/analytics/TopicList';
import CreateTopicForm from '../components/analytics/CreateTopicForm';
import PaginationControls from '../components/common/PaginationControls';

function AnalyticsPage() {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const [topicsData, setTopicsData] = useState({
    items: [], currentPage: 1, totalPages: 1, totalItems: 0
  });
  const [topicsLimit] = useState(5); 
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [currentTopicSearchQuery, setCurrentTopicSearchQuery] = useState('');
  
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [errorTopics, setErrorTopics] = useState(null); // Можемо використовувати для помилок видалення
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

  const handleSelectTopic = (topic) => {
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

  // Нова функція для видалення теми
  const handleDeleteTopic = async (topicId) => {
    setErrorTopics(null); // Скидаємо попередні помилки
    setIsLoadingTopics(true); // Можна додати окремий стан isLoadingDeleteTopic
    try {
        await apiDeleteTopic(topicId);
        // Після успішного видалення перезавантажуємо поточну сторінку тем.
        // Якщо видалили останню тему на сторінці, і це не перша сторінка,
        // то краще перейти на попередню.
        if (topicsData.items.length === 1 && topicsData.currentPage > 1) {
            fetchTopics(topicsData.currentPage - 1, currentTopicSearchQuery);
        } else {
            fetchTopics(topicsData.currentPage, currentTopicSearchQuery);
        }
        alert('Тему та всі її пости успішно видалено.');
    } catch (err) {
        setErrorTopics(err.message || 'Не вдалося видалити тему.');
        console.error("Error deleting topic:", err);
    } finally {
        setIsLoadingTopics(false);
    }
  };

  return (
    <div className="analytics-page-container">
      <h2>Відділ аналітики та обговорень</h2>

      {isLoggedIn && (
        <div className="action-button-container"> 
          <button onClick={() => setShowCreateTopicForm(!showCreateTopicForm)} className="toggle-form-button">
            {showCreateTopicForm ? 'Скасувати створення теми' : 'Створити нову тему'}
          </button>
        </div>
      )}
      {showCreateTopicForm && <CreateTopicForm onTopicCreated={handleTopicCreated} />}

      <hr className="section-divider" />

      <div className="topics-section">
        <h3>Теми обговорень</h3>
        <form onSubmit={handleTopicSearchSubmit} className="topic-search-form">
          {/* ... (форма пошуку без змін) ... */}
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
        {/* Тепер errorTopics може показувати і помилки видалення */}
        {errorTopics && <p className="error-message" style={{color: 'red'}}>{errorTopics}</p>} 
        
        {!isLoadingTopics && !errorTopics && topicsData.items.length === 0 && currentTopicSearchQuery && (
            <p>За вашим запитом "{currentTopicSearchQuery}" нічого не знайдено.</p>
        )}
        {!isLoadingTopics && !errorTopics && topicsData.items.length === 0 && !currentTopicSearchQuery && (
            <p>Тем для обговорення ще немає.</p>
        )}

        {!isLoadingTopics && topicsData.items.length > 0 && ( // Прибираємо !errorTopics, щоб список показувався навіть якщо була помилка видалення
          <>
            <TopicList 
              topics={topicsData.items} 
              onSelectTopic={handleSelectTopic}
              onDeleteTopic={handleDeleteTopic} // Передаємо функцію видалення
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
      {/* Секція для постів на цій сторінці більше не потрібна */}
    </div>
  );
}

export default AnalyticsPage;