import { getApiBaseUrl } from '../config/apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

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
  const safeText = escapeForSvg(text).slice(0, 60);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#E2E8F0" />
          <stop offset="100%" stop-color="#CBD5E1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <text
        x="50%"
        y="50%"
        fill="#334155"
        font-family="Inter, Arial, sans-serif"
        font-size="20"
        font-weight="600"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${safeText}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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
