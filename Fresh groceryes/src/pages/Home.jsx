import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Truck,
  BadgeDollarSign,
  Heart,
  Star,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../utils/image';
import { productAPI } from '../api/productAPI';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/helpers';

const featureItems = [
  {
    id: 'organic',
    title: 'Organic Produce',
    description: 'Hand-picked fruits and vegetables from trusted farms.',
    icon: Leaf,
    iconClassName: 'text-green-600',
    bgClassName: 'bg-green-100',
  },
  {
    id: 'delivery',
    title: 'Delivery in 24h',
    description: 'Quick dispatch and doorstep delivery in your area.',
    icon: Truck,
    iconClassName: 'text-blue-600',
    bgClassName: 'bg-blue-100',
  },
  {
    id: 'pricing',
    title: 'Fair Pricing',
    description: 'Daily offers and low prices on all essential groceries.',
    icon: BadgeDollarSign,
    iconClassName: 'text-amber-600',
    bgClassName: 'bg-amber-100',
  },
];

const heroSlides = [
  {
    id: 'fruits',
    badge: 'Fresh Fruits',
    title: 'Seasonal fruits',
    highlight: 'picked for freshness',
    description: 'Sweet, juicy, and naturally fresh fruits delivered to your doorstep.',
    imageUrl:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'vegetables',
    badge: 'Fresh Vegetables',
    title: 'Farm vegetables',
    highlight: 'for healthy meals',
    description: 'Green and colorful vegetables sourced from trusted local growers.',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'daily-grocery',
    badge: 'Daily Grocery',
    title: 'Everyday grocery items',
    highlight: 'for your home needs',
    description: 'Get pantry staples, dairy, and daily essentials in one place.',
    imageUrl:
      'https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=1600&q=80',
  },
];

const preferredShowcaseCategories = [
  'Fruits',
  'Bakery',
  'Vegetables',
  'Seafood',
  'Household Essentials',
  'Snacks',
];

const showcaseVariants = [
  'Fresh Pick',
  'Family Pack',
  'Chef Choice',
  'Value Pack',
  'Premium Select',
];

const offerCards = [
  {
    key: 'highly-consumed',
    title: 'Highly Consumed Products',
    description: 'Most ordered everyday essentials selected for your home.',
  },
  {
    key: 'weekly-trending',
    title: 'Weekly Trending Picks',
    description: 'Fast-moving trending products picked from current shopper demand.',
  },
];

const getSalePercent = (product, index) =>
  60 + ((String(product?.id || product?.name || index).length + index * 3) % 11);

const pickRandomProducts = (source, count) => {
  const list = Array.isArray(source) ? [...source] : [];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[randomIndex]] = [list[randomIndex], list[index]];
  }
  return list.slice(0, Math.min(count, list.length));
};

const Home = () => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [products, setProducts] = useState([]);
  const [activeOfferKey, setActiveOfferKey] = useState(null);
  const [randomOfferProducts, setRandomOfferProducts] = useState([]);
  const activeSlide = heroSlides[activeSlideIndex];
  const heroBackgroundStyle = {
    backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.66) 0%, rgba(30, 41, 59, 0.52) 45%, rgba(6, 95, 70, 0.44) 100%), url('${activeSlide.imageUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const buildSectionProductsFromList = (category, limit = 10) => {
    const categoryItems = products.filter((product) => product.category === category);
    if (!categoryItems.length) {
      return [];
    }

    return Array.from({ length: limit }, (_, index) => {
      const base = categoryItems[index % categoryItems.length];
      const cycle = Math.floor(index / categoryItems.length);
      const variant = showcaseVariants[(index + cycle) % showcaseVariants.length];

      return {
        ...base,
        displayId: `${base.id || base._id}-showcase-${category}-${index}`,
        productId: base.id || base._id,
        displayName: cycle > 0 ? `${base.name} - ${variant}` : base.name,
      };
    });
  };

  const sectionProducts = useMemo(
    () => {
      const availableCategories = Array.from(
        new Set(products.map((product) => product.category).filter(Boolean))
      );
      const orderedCategories = [
        ...preferredShowcaseCategories.filter((category) => availableCategories.includes(category)),
        ...availableCategories.filter(
          (category) => !preferredShowcaseCategories.includes(category)
        ),
      ].slice(0, 6);

      return orderedCategories.map((category) => ({
        key: category,
        title: category,
        items: buildSectionProductsFromList(category, 10),
      }));
    },
    [products]
  );

  const topSaleProducts = useMemo(() => {
    return [...products]
      .sort((first, second) => {
        const firstScore = Number(first.rating || 0) * 100 + Number(first.reviews || 0);
        const secondScore = Number(second.rating || 0) * 100 + Number(second.reviews || 0);
        return secondScore - firstScore;
      })
      .slice(0, 10)
      .map((product, index) => {
        const salePercent = getSalePercent(product, index);
        const originalPrice = Number((product.price / (1 - salePercent / 100)).toFixed(2));
        return {
          ...product,
          salePercent,
          originalPrice,
        };
      });
  }, [products]);

  const activeOffer = useMemo(
    () => offerCards.find((item) => item.key === activeOfferKey) || null,
    [activeOfferKey]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  // Load cart from API when user is authenticated
  const { loadCartFromAPI } = useCart();
  useEffect(() => {
    loadCartFromAPI();
  }, [loadCartFromAPI]);

  useEffect(() => {
    let isMounted = true;
    productAPI
      .getProducts({ limit: 200, status: 'active' })
      .then((response) => {
        if (isMounted) {
          const normalizedProducts = (Array.isArray(response?.products) ? response.products : []).map(
            (product) => ({
              ...product,
              id: product.id || product._id,
              image:
                product.image ||
                (Array.isArray(product.images) && product.images[0]?.url) ||
                (typeof product.images?.[0] === 'string' ? product.images[0] : ''),
            })
          );
          setProducts(normalizedProducts);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProducts([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOfferCardClick = (cardKey) => {
    setActiveOfferKey(cardKey);
    setRandomOfferProducts(pickRandomProducts(products, 50));
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <section className="relative text-white home-hero-bg-image" style={heroBackgroundStyle}>
        <div className="home-hero-orb home-hero-orb-one" />
        <div className="home-hero-orb home-hero-orb-two" />
        <div className="home-hero-orb home-hero-orb-three" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid grid-cols-1 gap-12 items-center">
            <div className="home-fade-up">
              <div key={activeSlide.id} className="home-slide-content">
                <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium mb-6">
                  {activeSlide.badge}
                </p>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                  {activeSlide.title}
                  <span className="block text-yellow-300">{activeSlide.highlight}</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-100 max-w-xl mb-8">
                  {activeSlide.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-600" />
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Top Sale</h2>
              </div>
              <p className="text-xs font-semibold text-red-700 sm:text-sm">60% to 70% OFF</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
              {topSaleProducts.map((product) => (
                <Link
                  key={`topsale-${product.id}`}
                  to={`/product/${product.id}`}
                  className="block min-w-[160px] sm:min-w-[210px] lg:min-w-[240px] flex-shrink-0"
                >
                  <article className="home-product-card group border border-red-100 bg-white">
                    <div className="relative">
                      <img
                        src={resolveImageUrl(product.image, {
                          width: 420,
                          height: 260,
                          text: product.name || 'Top Sale Product',
                        })}
                        alt={product.name}
                        onError={(event) =>
                          applyImageFallback(event, {
                            width: 420,
                            height: 260,
                            text: product.name || 'Top Sale Product',
                          })
                        }
                        className="h-20 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-40"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white sm:text-xs">
                        {product.salePercent}% OFF
                      </span>
                    </div>
                    <div className="p-1.5 sm:p-2">
                      <h3 className="line-clamp-1 text-sm font-semibold text-gray-900 sm:text-base">
                        {product.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-base font-extrabold text-red-700 sm:text-lg">
                          {formatPrice(product.price, 'INR')}
                        </span>
                        <span className="text-xs text-gray-500 line-through sm:text-sm">
                          {formatPrice(product.originalPrice, 'INR')}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {offerCards.map((card) => (
                <div
                  key={card.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOfferCardClick(card.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleOfferCardClick(card.key);
                    }
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition-all sm:p-5 ${
                    activeOfferKey === card.key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 sm:text-lg">{card.title}</h3>
                      <p className="mt-1 text-xs text-gray-600 sm:text-sm">{card.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary-700 sm:h-5 sm:w-5" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              {!activeOffer || randomOfferProducts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-5 text-center text-sm text-gray-600">
                  Click any offer card to load random 50 products.
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
                      {activeOffer.title}
                    </h3>
                    <p className="text-xs font-medium text-gray-600 sm:text-sm">
                      Showing random {randomOfferProducts.length} products
                    </p>
                  </div>
                  <p className="mb-4 text-xs text-gray-600 sm:text-sm">{activeOffer.description}</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                    {randomOfferProducts.map((product) => (
                      <Link key={`random-${activeOffer.key}-${product.id}`} to={`/product/${product.id}`} className="block">
                        <article className="home-product-card group">
                          <div className="relative">
                            <img
                              src={resolveImageUrl(product.image, {
                                width: 420,
                                height: 260,
                                text: product.name || 'Product',
                              })}
                              alt={product.name}
                              onError={(event) =>
                                applyImageFallback(event, {
                                  width: 420,
                                  height: 260,
                                  text: product.name || 'Product',
                                })
                              }
                              className="h-20 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-40"
                            />
                          </div>
                          <div className="p-1.5 sm:p-2">
                            <h4 className="line-clamp-1 text-sm font-semibold text-gray-900 sm:text-base">
                              {product.name}
                            </h4>
                            <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                            <p className="mt-1 text-base font-extrabold text-gray-900 sm:text-lg">
                              {formatPrice(product.price, 'INR')}
                            </p>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {sectionProducts.map((section) => (
            <div key={section.key}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                <Link
                  to={`/products?category=${encodeURIComponent(section.key)}`}
                  className="text-sm font-medium text-primary-700 hover:text-primary-800"
                >
                  View all
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {section.items.map((product) => {
                  const rating = Number(product.rating || 4.2).toFixed(1);
                  const reviews = product.reviews || 120;

                  return (
                    <Link
                      key={product.displayId}
                      to={`/product/${product.productId}`}
                      className="block"
                    >
                      <article className="home-product-card group">
                        <div className="relative">
                          <img
                            src={resolveImageUrl(product.image, {
                              width: 420,
                              height: 260,
                              text: product.displayName || 'Product',
                            })}
                            alt={product.displayName}
                            onError={(event) =>
                              applyImageFallback(event, {
                                width: 420,
                                height: 260,
                                text: product.displayName || 'Product',
                              })
                            }
                            className="w-full h-20 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute right-2 top-2 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm ring-1 ring-gray-200">
                            <Heart className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="p-1.5 sm:p-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            {section.title}
                          </p>
                          <h3 className="line-clamp-1 text-sm sm:text-base font-semibold text-gray-900 mb-1.5">
                            {product.displayName}
                          </h3>
                          <div className="flex items-center gap-1 mb-1.5 text-xs text-gray-500">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold text-gray-700">{rating}</span>
                            <span>({reviews})</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
                              {formatPrice(product.price, 'INR')}
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 home-fade-up">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Customers Choose Us</h2>
            <p className="text-gray-600">High-quality groceries with a simple buying experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className={`card p-6 home-fade-up home-delay-${index + 1}`}>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${item.bgClassName}`}
                  >
                    <Icon className={`h-6 w-6 ${item.iconClassName}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
