import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom'; // useParams для отримання topicId, useLocation для state
import AuthContext from '../context/AuthContext';
import { getPostsForTopic as apiGetPostsForTopic, getTopicById as apiGetTopicById } from '../services/api';
import PostList from '../components/analytics/PostList';
import CreatePostForm from '../components/analytics/CreatePostForm';
import PaginationControls from '../components/common/PaginationControls';

function TopicPostsPage() {
  const { topicId } = useParams(); // Отримуємо ID теми з URL
  const location = useLocation(); // Отримуємо state, переданий з попередньої сторінки
  const { isLoggedIn } = useContext(AuthContext);

  const [topicDetails, setTopicDetails] = useState(null); // Для назви теми та postCount
  const [postsData, setPostsData] = useState({
    items: [], currentPage: 1, totalPages: 1, totalItems: 0
  });
  const [postsLimit] = useState(10); // Кількість постів на сторінці

  const [isLoadingTopicDetails, setIsLoadingTopicDetails] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [errorTopicDetails, setErrorTopicDetails] = useState(null);
  const [errorPosts, setErrorPosts] = useState(null);
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);

  // Завантаження деталей теми (назва, postCount)
  const fetchTopicDetails = useCallback(async () => {
    // Якщо дані передані через location.state, використовуємо їх
    if (location.state?.topicTitle && location.state?.postCount !== undefined) {
        setTopicDetails({ 
            id: topicId, 
            title: location.state.topicTitle, 
            postCount: location.state.postCount 
        });
        return { postCount: location.state.postCount }; // Повертаємо для використання в fetchPosts
    }
    // Інакше - запит до API
    setIsLoadingTopicDetails(true);
    setErrorTopicDetails(null);
    try {
      const data = await apiGetTopicById(topicId);
      setTopicDetails(data);
      return { postCount: data.postCount };
    } catch (err) {
      setErrorTopicDetails(err.message || 'Не вдалося завантажити деталі теми.');
      return { postCount: 0 };
    } finally {
      setIsLoadingTopicDetails(false);
    }
  }, [topicId, location.state]);

  // Завантаження постів
  const fetchPosts = useCallback(async (page = 1) => {
    setIsLoadingPosts(true);
    setErrorPosts(null);
    try {
      const response = await apiGetPostsForTopic(topicId, page, postsLimit);
      setPostsData({
        items: response.data,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems
      });
    } catch (err) {
      setErrorPosts(err.message || 'Не вдалося завантажити пости.');
      setPostsData({ items: [], currentPage: 1, totalPages: 1, totalItems: 0 });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [topicId, postsLimit]);

  // Ефект для початкового завантаження деталей теми та постів (останньої сторінки)
  useEffect(() => {
    const initialLoad = async () => {
        const { postCount } = await fetchTopicDetails(); // Отримуємо деталі теми (включаючи postCount)
        
        // Розраховуємо останню сторінку
        const totalCalculatedPages = Math.ceil((postCount || 0) / postsLimit);
        const targetPage = Math.max(1, totalCalculatedPages); // Якщо постів немає, буде стор. 1
        
        // Встановлюємо поточну сторінку для постів (це викличе наступний useEffect для завантаження)
        setPostsData(prev => ({ ...prev, currentPage: targetPage }));
    };
    initialLoad();
  }, [fetchTopicDetails, postsLimit]); // Залежність від topicId вже є в fetchTopicDetails

  // Ефект для завантаження постів при зміні сторінки
  useEffect(() => {
    if (topicDetails) { // Завантажуємо пости, тільки якщо деталі теми вже є
        fetchPosts(postsData.currentPage);
    }
  // Не додаємо postsData сюди повністю, щоб уникнути циклу, тільки postsData.currentPage
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [topicDetails, postsData.currentPage, fetchPosts]);


  const handlePostCreated = (newPost) => {
    // 3. Поведінка при створенні: залишаємося на поточній сторінці, оновлюємо дані
    // Щоб побачити новий пост, якщо він на останній сторінці, потрібно перейти на неї
    // Або, якщо сортування "нові спочатку", то на першу.
    // Поки що, для "місце не змінюється" - оновлюємо поточну сторінку.
    // І оновлюємо лічильник постів в topicDetails
    setTopicDetails(prev => ({ ...prev, postCount: (prev.postCount || 0) + 1 }));
    // Якщо новий пост додається в кінець, і ми хочемо його побачити:
    const newTotalPages = Math.ceil(((topicDetails?.postCount || 0) + 1) / postsLimit);
    setPostsData(prev => ({ ...prev, currentPage: newTotalPages })); // Це викличе fetchPosts для останньої сторінки
    setShowCreatePostForm(false);
  };

  const handlePostDeleted = (deletedPostId) => {
    setTopicDetails(prev => ({ ...prev, postCount: Math.max(0, (prev.postCount || 0) - 1) }));
    // Перезавантажуємо поточну сторінку постів. Якщо вона стала порожньою,
    // можна додати логіку переходу на попередню.
    // Поки що просто перезавантажуємо поточну.
    fetchPosts(postsData.currentPage);
  };
  
  const handlePostUpdated = (updatedPost) => {
    setPostsData(prev => ({
        ...prev,
        items: prev.items.map(p => p.id === updatedPost.id ? updatedPost : p)
    }));
  };

  const handlePostPageChange = (newPage) => {
    if (newPage !== postsData.currentPage) {
        setPostsData(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  if (isLoadingTopicDetails) {
    return <p>Завантаження інформації про тему...</p>;
  }
  if (errorTopicDetails) {
    return (
        <div>
            <p className="error-message">{errorTopicDetails}</p>
            <Link to="/analytics">Повернутися до списку тем</Link>
        </div>
    );
  }
  if (!topicDetails) {
    return <p>Тему не знайдено. <Link to="/analytics">Повернутися до списку тем</Link></p>;
  }

  return (
    <div className="topic-posts-page-container">
      <Link to="/analytics" className="back-to-topics-link">← Повернутися до списку тем</Link>
      <h2>Тема: {topicDetails.title}</h2>
      
      {isLoadingPosts && <p>Завантаження постів...</p>}
      {errorPosts && <p className="error-message">{errorPosts}</p>}
      
      {!isLoadingPosts && !errorPosts && postsData.items.length === 0 && (
        <p>У цій темі ще немає постів.</p>
      )}
      {!isLoadingPosts && !errorPosts && postsData.items.length > 0 && (
        <>
            <PostList posts={postsData.items} onPostDeleted={handlePostDeleted} onPostUpdated={handlePostUpdated}/>
            <PaginationControls
                currentPage={postsData.currentPage}
                totalPages={postsData.totalPages}
                onPageChange={handlePostPageChange}
                itemsName={`постів (всього ${postsData.totalItems})`}
            />
        </>
      )}

      {/* 3. Кнопка додавання нового посту в цій темі має бути в кінці сторінки постів */}
      {isLoggedIn && (
        <div className="create-post-section">
            <hr className="section-divider"/>
            <button 
                onClick={() => setShowCreatePostForm(!showCreatePostForm)}  
                className="toggle-form-button add-post-button-bottom"
            >
              {showCreatePostForm ? 'Скасувати написання поста' : 'Написати новий пост'}
            </button>
            {showCreatePostForm && <CreatePostForm topicId={topicId} onPostCreated={handlePostCreated} />}
        </div>
      )}
    </div>
  );
}

export default TopicPostsPage;