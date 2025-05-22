import React from 'react';
import TopicItem from './TopicItem';

// Додаємо onDeleteTopic до props
function TopicList({ topics, onSelectTopic, selectedTopicId, onDeleteTopic }) { 
  if (!topics || topics.length === 0) {
    return <p>Тем для обговорення ще немає.</p>; // Це повідомлення тепер в AnalyticsPage
  }

  return (
    <div className="topics-list">
      {topics.map(topic => (
        <TopicItem 
          key={topic.id} 
          topic={topic} 
          onSelectTopic={onSelectTopic}
          isSelected={selectedTopicId === topic.id} // selectedTopicId тут вже не використовується, але можна залишити для майбутнього
          onDeleteTopic={onDeleteTopic} // Передаємо далі
        />
      ))}
    </div>
  );
}

export default TopicList;