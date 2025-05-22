// client/src/services/api.js
// ... (API_BASE_URL та request залишаються без змін) ...
const API_BASE_URL = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3001/api' 
    : '/api';

const request = async (endpoint, method = 'GET', body = null, includeAuth = false) => {
    const headers = {};
    if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    if (includeAuth) {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.warn(`Запит на ${endpoint} вимагає авторизації, але токен не знайдено.`);
        }
    }
    const config = { method, headers };
    if (body) {
        config.body = (body instanceof FormData) ? body : JSON.stringify(body);
    }
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json(); 
        if (!response.ok) {
            throw new Error(data.message || `Помилка ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error(`API Error (${method} ${API_BASE_URL}${endpoint}):`, error.message);
        throw error; 
    }
};

// --- Авторизація ---
export const loginUser = (credentials) => request('/auth/login', 'POST', credentials);
export const registerUser = (userData) => request('/auth/register', 'POST', userData);
export const checkAuthStatus = () => request('/auth/status', 'GET', null, true);

// --- Відділ Аналітики (Теми) ---
export const getTopics = (page = 1, limit = 10, searchQuery = '') => {
    let endpoint = `/analytics/topics?page=${page}&limit=${limit}`;
    if (searchQuery && searchQuery.trim() !== '') {
        endpoint += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }
    return request(endpoint, 'GET');
};
export const createTopic = (topicData) => request('/analytics/topics', 'POST', topicData, true);
export const getTopicById = (topicId) => request(`/analytics/topics/${topicId}`, 'GET');
export const deleteTopic = (topicId) => request(`/analytics/topics/${topicId}`, 'DELETE', null, true); // <-- Нова функція

// --- Відділ Аналітики (Пости) ---
export const getPostsForTopic = (topicId, page = 1, limit = 10) => 
    request(`/analytics/topics/${topicId}/posts?page=${page}&limit=${limit}`, 'GET');
export const createPostInTopic = (topicId, formData) => 
    request(`/analytics/topics/${topicId}/posts`, 'POST', formData, true); 
export const updatePost = (postId, postData) => request(`/analytics/posts/${postId}`, 'PUT', postData, true);
export const deletePost = (postId) => request(`/analytics/posts/${postId}`, 'DELETE', null, true);

export default request;