import { useEffect, useState } from 'react';

export const useLoadingTimeout = (loading: boolean, timeout: number = 8000) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      if (loading) {
        setTimedOut(true);
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [loading, timeout]);

  return timedOut;
};