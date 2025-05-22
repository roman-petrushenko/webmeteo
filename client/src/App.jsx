import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TopicPostsPage from './pages/TopicPostsPage'; // <-- Новий імпорт
import NotFoundPage from './pages/NotFoundPage';
import AuthContext from './context/AuthContext';
import './App.css';

function App() {
  const { isLoadingAuth } = useContext(AuthContext);

  if (isLoadingAuth) {
    return <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '1.5rem' }}>Перевірка авторизації...</div>;
  }

  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          {/* Новий маршрут для відображення постів конкретної теми */}
          <Route path="/analytics/topics/:topicId" element={<TopicPostsPage />} /> 
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;