const Wishlist = require('../models/Wishlist');

const getOrCreateWishlist = async (userId, req) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
      metadata: {
        userAgent: req.get('user-agent') || '',
        ipAddress: req.ip,
        sessionId: req.headers['x-session-id'] || '',
      },
    });
  }

  return wishlist;
};

const normalizeWishlist = (wishlist) => {
  const deduped = [];
  const seen = new Set();

  const sorted = [...wishlist.items].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  for (const item of sorted) {
    const key = String(item.productId);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  wishlist.items = deduped;
  wishlist.itemCount = deduped.length;
  wishlist.lastUpdated = new Date();
};

const getWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id, req);
    return res.status(200).json({ wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({
      message: 'Failed to get wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { productId, name, price, image, sku, notes = '' } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const parsedPrice = Number(price ?? 0);
    const resolvedName = String(name || `Product ${productId}`);
    const resolvedImage = String(image || '/api/placeholder/100/100');
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number' });
    }

    const wishlist = await getOrCreateWishlist(req.user._id, req);
    const existingItem = wishlist.items.find((item) => String(item.productId) === String(productId));

    if (existingItem) {
      existingItem.name = resolvedName;
      existingItem.price = parsedPrice;
      existingItem.image = resolvedImage;
      existingItem.sku = sku ? String(sku) : existingItem.sku;
      existingItem.notes = String(notes || existingItem.notes || '');
      existingItem.addedAt = new Date();
    } else {
      wishlist.items.push({
        productId: String(productId),
        name: resolvedName,
        price: parsedPrice,
        image: resolvedImage,
        sku: sku ? String(sku) : undefined,
        notes: notes ? String(notes) : undefined,
      });
    }

    normalizeWishlist(wishlist);
    await wishlist.save();

    return res.status(200).json({
      message: 'Item added to wishlist',
      wishlist,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({
      message: 'Failed to add item to wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await getOrCreateWishlist(req.user._id, req);
    wishlist.items = wishlist.items.filter((item) => String(item.productId) !== String(productId));

    normalizeWishlist(wishlist);
    await wishlist.save();

    return res.status(200).json({
      message: 'Item removed from wishlist',
      wishlist,
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return res.status(500).json({
      message: 'Failed to remove item from wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id, req);
    wishlist.items = [];

    normalizeWishlist(wishlist);
    await wishlist.save();

    return res.status(200).json({
      message: 'Wishlist cleared',
      wishlist,
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    return res.status(500).json({
      message: 'Failed to clear wishlist',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};
