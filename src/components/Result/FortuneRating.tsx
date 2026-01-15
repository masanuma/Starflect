import React from 'react';

interface FortuneRatingProps {
  rating: number;
  fortuneType?: 'overall' | 'love' | 'work' | 'health' | 'money' | 'growth';
}

const FortuneRating: React.FC<FortuneRatingProps> = ({ rating }) => {
  const stars = [];
  const fullStars = Math.round(rating);
  
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span 
        key={i} 
        style={{ 
          color: i <= fullStars ? 'var(--ethereal-gold)' : 'rgba(255, 255, 255, 0.1)',
          fontSize: '1.2rem',
          marginLeft: '2px',
          filter: i <= fullStars ? 'drop-shadow(0 0 5px rgba(253, 224, 71, 0.5))' : 'none'
        }}
      >
        ★
      </span>
    );
  }

  return <div className="fortune-rating" style={{ display: 'inline-flex', alignItems: 'center' }}>{stars}</div>;
};

export default FortuneRating;
