import { productsData } from '../../data/data.js';

const categoryImageUrls = {
  Fruits:
    'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80',
  Vegetables:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  Dairy:
    'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=900&q=80',
  Bakery:
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
  'Meat & Poultry':
    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=900&q=80',
  Seafood:
    'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=900&q=80',
  Beverages:
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80',
  Snacks:
    'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=900&q=80',
  'Frozen Foods':
    'https://images.unsplash.com/photo-1584473457493-17c4c24290c8?auto=format&fit=crop&w=900&q=80',
  'Pantry Staples':
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80',
  'Household Essentials':
    'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=900&q=80',
  'Personal Care':
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80',
  'Breakfast & Cereal':
    'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=900&q=80',
};

const isDummyImage = (value = '') => String(value).includes('dummyimage.com');

const toDiscountPercent = (price, discountPrice) => {
  const parsedPrice = Number(price);
  const parsedDiscountPrice = Number(discountPrice);

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return 0;
  if (!Number.isFinite(parsedDiscountPrice) || parsedDiscountPrice >= parsedPrice) return 0;

  return Math.max(0, Math.round(((parsedPrice - parsedDiscountPrice) / parsedPrice) * 100));
};

const withDefaults = (product) => {
  const image =
    !product.image || isDummyImage(product.image)
      ? categoryImageUrls[product.category] || categoryImageUrls.Fruits
      : product.image;
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
