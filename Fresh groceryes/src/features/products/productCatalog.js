import { productsData } from '../../data/data.js';

const toDiscountPercent = (price, discountPrice) => {
  const parsedPrice = Number(price);
  const parsedDiscountPrice = Number(discountPrice);

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return 0;
  if (!Number.isFinite(parsedDiscountPrice) || parsedDiscountPrice >= parsedPrice) return 0;

  return Math.max(0, Math.round(((parsedPrice - parsedDiscountPrice) / parsedPrice) * 100));
};

const withDefaults = (product) => {
  const image = product.image || 'https://dummyimage.com/600x400/ddd/333.jpg';
  const discount = toDiscountPercent(product.price, product.discountPrice);

  return {
    ...product,
    images: Array.isArray(product.images) && product.images.length ? product.images : [image, image, image],
    image,
    discount,
    inStock: product.inStock !== false,
    rating: Number(product.rating || 4.2),
    reviews: Number(product.reviews || 40),
    stock: Number(product.stock || 50),
    specifications: product.specifications || {
      Weight: '1 unit',
      Origin: 'Local Suppliers',
      'Shelf Life': '5-7 days',
      Storage: 'Store in cool and dry place',
    },
    nutritionalInfo: product.nutritionalInfo || {
      Calories: '120 per serving',
      Protein: '4g',
      Fiber: '3g',
      Sugar: '8g',
    },
  };
};

export const productCatalog = productsData.map(withDefaults);

export const productCategories = Array.from(new Set(productCatalog.map((product) => product.category)));

export const getProductById = (id) =>
  productCatalog.find((product) => String(product.id) === String(id));

export const getProductsByCategory = (category) => {
  if (!category) {
    return productCatalog;
  }

  return productCatalog.filter((product) => product.category === category);
};

export const getFeaturedProducts = (limit = 8) => {
  const normalizedLimit = Math.max(1, Math.min(50, Number(limit) || 8));
  return [...productCatalog]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, normalizedLimit);
};

export const getRelatedProducts = (targetProduct, limit = 4) => {
  if (!targetProduct) {
    return [];
  }

  const relatedByCategory = productCatalog.filter(
    (product) =>
      product.category === targetProduct.category &&
      String(product.id) !== String(targetProduct.id)
  );

  return relatedByCategory.slice(0, Math.max(1, Math.min(20, Number(limit) || 4)));
};

export default {
  productCatalog,
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  getRelatedProducts,
};
