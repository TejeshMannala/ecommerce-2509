const API_BASE_URL =
  String(import.meta.env.VITE_API_URL || '').trim() ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const getApiOrigin = (apiUrl) => {
  try {
    return new URL(apiUrl).origin;
  } catch {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return '';
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

const gradients = [
  ['#FCA5A5', '#EF4444'],
  ['#FDBA74', '#F97316'],
  ['#FCD34D', '#F59E0B'],
  ['#86EFAC', '#22C55E'],
  ['#93C5FD', '#3B82F6'],
  ['#C4B5FD', '#8B5CF6'],
  ['#F9A8D4', '#EC4899'],
  ['#E2E8F0', '#94A3B8'],
];

const getGradientForText = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const buildPlaceholderUrl = (width, height, text) => {
  const safeText = escapeForSvg(text).slice(0, 60);
  const colors = getGradientForText(text);
  const color1 = colors[0];
  const color2 = colors[1];
  const parts = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">',
    '<defs>',
    '<linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">',
    '<stop offset="0%" stop-color="' + color1 + '" />',
    '<stop offset="100%" stop-color="' + color2 + '" />',
    '</linearGradient>',
    '</defs>',
    '<rect width="' + width + '" height="' + height + '" fill="url(#bg)" />',
    '<text x="50%" y="50%" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" text-anchor="middle" dominant-baseline="middle">',
    safeText,
    '</text>',
    '</svg>',
  ];
  const svg = parts.join('');
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
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
    const matchWidth = placeholderMatch[1];
    const matchHeight = placeholderMatch[2];
    return buildPlaceholderUrl(matchWidth, matchHeight, text);
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return API_ORIGIN + '/' + trimmed.replace(/^\/+/, '');
  }

  if (trimmed.startsWith('/api/')) {
    return API_ORIGIN + trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return API_ORIGIN + '/' + trimmed;
};

export const applyImageFallback = (event, options = {}) => {
  const imageElement = event.currentTarget;
  const fallbackUrl = getFallbackImageUrl(options);
  if (imageElement.src !== fallbackUrl) {
    imageElement.onerror = null;
    imageElement.src = fallbackUrl;
  }
};
