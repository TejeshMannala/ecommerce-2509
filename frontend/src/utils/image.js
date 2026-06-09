const API_BASE_URL =
  (import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim()) ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const getApiOrigin = (apiUrl) => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'http://localhost:5000';
  }
};

const escapeForSvg = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const API_ORIGIN = getApiOrigin(API_BASE_URL);

const buildPlaceholderUrl = (width, height, text) => {
  const safeText = encodeURIComponent(text.trim() || 'product');
  return `https://loremflickr.com/${width}/${height}/${safeText}`;
};

export const getFallbackImageUrl = (options = {}) => {
  const { width = 400, height = 300, text = 'No Image' } = options;
  return buildPlaceholderUrl(width, height, text);
};

export const resolveImageUrl = (imageUrl, options = {}) => {
  const { width = 400, height = 300, text = 'No Image' } = options;
  const fallback = buildPlaceholderUrl(width, height, text);

  if (!imageUrl || typeof imageUrl !== 'string') {
    return fallback;
  }

  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return fallback;
  }

  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) {
    return trimmed;
  }

  const placeholderMatch = trimmed.match(/^\/api\/placeholder\/(\d+)\/(\d+)$/);
  if (placeholderMatch) {
    const [, matchWidth, matchHeight] = placeholderMatch;
    return buildPlaceholderUrl(matchWidth, matchHeight, text);
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return `${API_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
  }

  if (trimmed.startsWith('/api/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `${API_ORIGIN}/${trimmed}`;
};

export const applyImageFallback = (event, options = {}) => {
  const imageElement = event.currentTarget;
  imageElement.onerror = null;
  imageElement.src = getFallbackImageUrl(options);
};
