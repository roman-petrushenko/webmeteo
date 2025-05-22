import React from 'react';
import PostItem from './PostItem';

function PostList({ posts, onPostDeleted, onPostUpdated }) { // Додано onPostUpdated
  if (!posts || posts.length === 0) {
    return <p>У цій темі ще немає постів. Будьте першим!</p>;
  }

  return (
    <div className="posts-list">
      {posts.map(post => (
        <PostItem key={post.id} post={post} onPostDeleted={onPostDeleted} onPostUpdated={onPostUpdated} />
      ))}
    </div>
  );
}

export default PostList;