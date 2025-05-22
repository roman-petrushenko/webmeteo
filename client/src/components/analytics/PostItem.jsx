import React, { useContext, useState } from 'react';
import AuthContext from '../../context/AuthContext';
import { deletePost as apiDeletePost, updatePost as apiUpdatePost } from '../../services/api';

const RENDER_UPLOADS_URL = 'https://webmeteo.onrender.com'; 

const UPLOADS_BASE_URL = process.env.NODE_ENV === 'production' 
    ? RENDER_UPLOADS_URL // Для розгорнутого backend на Render 
    : 'http://localhost:3001' ; // Для локального backend      

function PostItem({ post, onPostDeleted, onPostUpdated }) {
  const { user, isLoggedIn } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editError, setEditError] = useState(null);

  // Стан для модального вікна зображення
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  const openImageModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl('');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  const handleDelete = async () => {
    if (window.confirm('Ви впевнені, що хочете видалити цей пост?')) {
      try {
        await apiDeletePost(post.id);
        onPostDeleted(post.id);
      } catch (err) {
        alert(`Помилка видалення поста: ${err.message}`);
      }
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setEditedContent(post.content);
    setEditError(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editedContent.trim()) {
        setEditError('Вміст поста не може бути порожнім.');
        return;
    }
    setEditError(null);
    try {
        const updatedPostData = await apiUpdatePost(post.id, { content: editedContent });
        onPostUpdated(updatedPostData);
        setIsEditing(false);
    } catch (err) {
        setEditError(err.message || 'Помилка оновлення поста.');
    }
  };

  const canModify = isLoggedIn && user && (user.isAdmin || user.id === post.authorId);

  let mainImageAttachment = null;
  const otherAttachments = [];

  if (post.attachments && post.attachments.length > 0) {
    const mainImgIndex = post.attachments.findIndex(att => att.fieldname === 'postImage' && att.type === 'image');
    
    if (mainImgIndex !== -1) {
        mainImageAttachment = post.attachments[mainImgIndex];
        post.attachments.forEach((att, index) => {
            if (index !== mainImgIndex) {
                otherAttachments.push(att);
            }
        });
    } else {
        otherAttachments.push(...post.attachments);
    }
  }

  return (
    <div className="post-item">
      <div className="post-meta">
        <strong>{post.authorUsername}</strong> - <span className="post-date">{formatDate(post.createdAt)}</span>
        {post.createdAt !== post.updatedAt && <span className="post-date i-edited"> (ред. {formatDate(post.updatedAt)})</span>}
      </div>
      
      {!isEditing ? (
        <div className="post-content">
            {post.content.split('\n').map((line, index) => (
                <React.Fragment key={index}>{line}<br /></React.Fragment>
            ))}
        </div>
      ) : (
        <form onSubmit={handleEditSubmit} className="edit-post-form">
            {editError && <p className="form-message error">{editError}</p>}
            <textarea 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)}
                rows="3"
                required
            />
            <div className="edit-actions">
                <button type="submit">Зберегти</button>
                <button type="button" onClick={handleEditToggle}>Скасувати</button>
            </div>
        </form>
      )}

      {mainImageAttachment && (
        <div className="post-main-image">
          <img 
            src={`${UPLOADS_BASE_URL}${mainImageAttachment.path}`} 
            alt={mainImageAttachment.filename} 
            className="main-image-preview"
            onClick={() => openImageModal(`${UPLOADS_BASE_URL}${mainImageAttachment.path}`)}
          />
        </div>
      )}

      {otherAttachments.length > 0 && (
        <div className="post-attachments">
          <strong>Додаткові файли:</strong>
          <ul>
            {otherAttachments.map((att, index) => (
              <li key={index}>
                <a href={`${UPLOADS_BASE_URL}${att.path}`} target="_blank" rel="noopener noreferrer">
                  {att.filename} {/* Тільки ім'я файлу */}
                </a>
                 ({(att.size / 1024).toFixed(1)} KB)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {canModify && !isEditing && (
        <div className="post-actions">
          <button onClick={handleEditToggle} className="edit-btn">Редагувати</button>
          <button onClick={handleDelete} className="delete-btn">Видалити</button>
        </div>
      )}

      {/* Модальне вікно для зображення */}
      {showImageModal && (
        <div className="image-modal-backdrop" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="image-modal-close" onClick={closeImageModal}>&times;</span>
            <img src={modalImageUrl} alt="Розширене зображення" />
          </div>
        </div>
      )}
    </div>
  );
}

export default PostItem;