export const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

export const isAuthenticatedUser = (authState) => {
  if (authState?.isAuthenticated || authState?.user) {
    return true;
  }

  return Boolean(getStoredUser());
};

export const buildReturnToLocation = (location) => {
  if (!location) {
    return { pathname: '/' };
  }

  return {
    pathname: location.pathname || '/',
    search: location.search || '',
    hash: location.hash || '',
  };
};

export const getRedirectPathFromState = (state, fallback = '/') => {
  const from = state?.from;
  if (!from) {
    return fallback;
  }

  if (typeof from === 'string') {
    return from;
  }

  const pathname = from.pathname || fallback;
  const search = from.search || '';
  const hash = from.hash || '';

  return `${pathname}${search}${hash}`;
};
