import React, { useState, useContext } from 'react';
import { createPostInTopic } from '../../services/api';
import AuthContext from '../../context/AuthContext';

function CreatePostForm({ topicId, onPostCreated }) {
  const [content, setContent] = useState('');
  const [postImage, setPostImage] = useState(null); // Для головного зображення
  const [attachmentFiles, setAttachmentFiles] = useState([]); // Для додаткових файлів (масив)
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn } = useContext(AuthContext);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setPostImage(e.target.files[0]);
    } else {
      setPostImage(null);
    }
  };

  const handleAttachmentFilesChange = (e) => {
    // e.target.files - це FileList, перетворюємо його на масив
    // Обмежуємо до 4 файлів, як на backend (або скільки ви встановили в maxCount)
    const files = Array.from(e.target.files).slice(0, 4); 
    setAttachmentFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Вміст поста не може бути порожнім.');
      return;
    }
    // Перевірка на загальну кількість файлів, якщо потрібно (напр., не більше 5 разом)
    // const totalFiles = (postImage ? 1 : 0) + attachmentFiles.length;
    // if (totalFiles > 5) {
    //   setError('Можна прикріпити максимум 5 файлів (1 головне зображення + 4 додаткових).');
    //   return;
    // }

    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('content', content.trim());
    if (postImage) {
      formData.append('postImage', postImage);
    }
    attachmentFiles.forEach((file) => {
      // Важливо, щоб ім'я поля ('attachmentFiles') тут співпадало з тим,
      // що очікує multer на backend для масиву файлів
      formData.append('attachmentFiles', file); 
    });

    try {
      const newPost = await createPostInTopic(topicId, formData); // Надсилаємо formData
      onPostCreated(newPost);
      setContent('');
      setPostImage(null);
      setAttachmentFiles([]);
      // Очищаємо значення input type="file" програмно
      if(document.getElementById('postImageInput')) document.getElementById('postImageInput').value = null;
      if(document.getElementById('attachmentFilesInput')) document.getElementById('attachmentFilesInput').value = null;

    } catch (err) {
      setError(err.message || 'Не вдалося створити пост.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <p>Щоб написати пост, будь ласка, <a href="/auth">увійдіть</a>.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="create-form post-form">
      <h5>Написати новий пост</h5>
      {error && <p className="form-message error">{error}</p>}
      <div className="form-group">
        <label htmlFor="postContent">Ваше повідомлення:</label>
        <textarea
          id="postContent"
          rows="4"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="postImageInput">Головне зображення (JPG, PNG, GIF):</label>
        <input
          type="file"
          id="postImageInput"
          accept="image/jpeg,image/png,image/gif" // Фільтр на стороні клієнта
          onChange={handleImageChange}
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        {/* Дозволяємо вибір декількох файлів з атрибутом multiple */}
        <label htmlFor="attachmentFilesInput">Додаткові файли (до 4-х: PDF, DOC, TXT, зображення):</label>
        <input
          type="file"
          id="attachmentFilesInput"
          multiple 
          accept=".pdf,.doc,.docx,.txt,image/jpeg,image/png,image/gif" // Фільтр на стороні клієнта
          onChange={handleAttachmentFilesChange}
          disabled={isLoading}
        />
        {attachmentFiles.length > 0 && (
            <ul style={{fontSize: '0.8em', listStyleType: 'none', paddingLeft: 0}}>
                {attachmentFiles.map((file, index) => <li key={index}>{file.name}</li>)}
            </ul>
        )}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Відправка...' : 'Надіслати'} 
      </button>
    </form>
  );
}

export default CreatePostForm;