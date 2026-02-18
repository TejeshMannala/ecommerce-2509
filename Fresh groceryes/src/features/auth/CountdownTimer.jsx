import React, { useEffect, useState } from 'react';

const CountdownTimer = ({ lockedUntil, onTimerComplete }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (lockedUntil) {
      const endTime = new Date(lockedUntil).getTime();
      const now = Date.now();
      const difference = endTime - now;

      if (difference > 0) {
        setTimeLeft(difference);
        setIsComplete(false);
      } else {
        setIsComplete(true);
        if (onTimerComplete) onTimerComplete();
      }
    }
  }, [lockedUntil, onTimerComplete]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1000) {
          setIsComplete(true);
          if (onTimerComplete) onTimerComplete();
          return 0;
        }
        return prevTime - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimerComplete]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isComplete) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      <p className="text-sm font-medium">
        Account locked due to too many failed attempts. Please try again in:
      </p>
      <p className="text-2xl font-bold text-red-600 mt-2">
        {formatTime(timeLeft)}
      </p>
    </div>
  );
};

export default CountdownTimer;