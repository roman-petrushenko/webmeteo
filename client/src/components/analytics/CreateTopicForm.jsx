import React, { useState, useContext } from 'react';
import AuthContext from '../../context/AuthContext';
import { createTopic } from '../../services/api';

function CreateTopicForm({ onTopicCreated }) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Назва теми не може бути порожньою.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const newTopic = await createTopic({ title });
      onTopicCreated(newTopic); // Передаємо створену тему батьківському компоненту
      setTitle(''); // Очищаємо поле
    } catch (err) {
      setError(err.message || 'Не вдалося створити тему.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <p>Щоб створити тему, будь ласка, <a href="/auth">увійдіть</a> або зареєструйтеся.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="create-form">
      <h4>Створити нову тему</h4>
      {error && <p className="form-message error">{error}</p>}
      <div className="form-group">
        <label htmlFor="topicTitle">Назва теми:</label>
        <input
          type="text"
          id="topicTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Створення...' : 'Створити тему'}
      </button>
    </form>
  );
}

export default CreateTopicForm;