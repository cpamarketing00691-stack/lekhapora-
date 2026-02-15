export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = 0;

  if (ua.indexOf('Firefox') > -1) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/);
    if (match) version = parseInt(match[1]);
  } else if (ua.indexOf('Chrome') > -1) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/);
    if (match) version = parseInt(match[1]);
  } else if (ua.indexOf('Safari') > -1) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+)/);
    if (match) version = parseInt(match[1]);
  }

  return { name, version, isMobile: /iPhone|iPad|iPod|Android/i.test(ua) };
};

export const isBrowserSupported = () => {
  const { name, version } = getBrowserInfo();
  if (name === 'Chrome' && version < 80) return false;
  if (name === 'Firefox' && version < 75) return false;
  if (name === 'Safari' && version < 13) return false;
  return true;
};