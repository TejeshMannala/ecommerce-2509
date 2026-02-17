const Cart = require('../models/Cart');

const calculateCartTotals = (items, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 5.99;
  const total = subtotal + tax + shipping - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, tax, shipping, total, itemCount };
};

const getOrCreateCart = async (userId, req) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
      metadata: {
        userAgent: req.get('user-agent') || '',
        ipAddress: req.ip,
        sessionId: req.headers['x-session-id'] || '',
      },
    });
  }

  return cart;
};

const syncCartDerivedFields = (cart) => {
  const deduped = [];
  const byProduct = new Map();

  for (const item of cart.items) {
    if (!item || !item.productId) continue;

    const key = String(item.productId);
    if (byProduct.has(key)) {
      byProduct.get(key).quantity += item.quantity;
    } else {
      byProduct.set(key, {
        productId: key,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        sku: item.sku,
        addedAt: item.addedAt || new Date(),
      });
    }
  }

  for (const value of byProduct.values()) {
    value.quantity = Math.max(1, Math.min(99, parseInt(value.quantity, 10) || 1));
    deduped.push(value);
  }

  cart.items = deduped;
  const totals = calculateCartTotals(cart.items, cart.discount || 0);
  cart.subtotal = totals.subtotal;
  cart.tax = totals.tax;
  cart.shipping = totals.shipping;
  cart.total = totals.total;
  cart.itemCount = totals.itemCount;
  cart.lastUpdated = new Date();
};

const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id, req);
    return res.status(200).json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({
      message: 'Failed to get cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, name, price, image, sku, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const parsedQuantity = Math.max(1, Math.min(99, parseInt(quantity, 10) || 1));
    const parsedPrice = Number(price ?? 0);
    const resolvedName = String(name || `Product ${productId}`);
    const resolvedImage = String(image || '/api/placeholder/100/100');

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number' });
    }

    const cart = await getOrCreateCart(req.user._id, req);

    const existingItem = cart.items.find((item) => String(item.productId) === String(productId));

    if (existingItem) {
      existingItem.quantity = Math.min(99, existingItem.quantity + parsedQuantity);
      existingItem.name = resolvedName;
      existingItem.price = parsedPrice;
      existingItem.image = resolvedImage;
      existingItem.sku = sku ? String(sku) : existingItem.sku;
    } else {
      cart.items.push({
        productId: String(productId),
        name: resolvedName,
        price: parsedPrice,
        quantity: parsedQuantity,
        image: resolvedImage,
        sku: sku ? String(sku) : undefined,
      });
    }

    syncCartDerivedFields(cart);
    await cart.save();

    return res.status(200).json({
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({
      message: 'Failed to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const parsedQuantity = parseInt(quantity, 10);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await getOrCreateCart(req.user._id, req);
    const item = cart.items.find((entry) => String(entry.productId) === String(productId));

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = Math.min(parsedQuantity, 99);

    syncCartDerivedFields(cart);
    await cart.save();

    return res.status(200).json({
      message: 'Cart item updated',
      cart,
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    return res.status(500).json({
      message: 'Failed to update cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await getOrCreateCart(req.user._id, req);
    cart.items = cart.items.filter((item) => String(item.productId) !== String(productId));

    syncCartDerivedFields(cart);
    await cart.save();

    return res.status(200).json({
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({
      message: 'Failed to remove item from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id, req);
    cart.items = [];

    syncCartDerivedFields(cart);
    await cart.save();

    return res.status(200).json({
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({
      message: 'Failed to clear cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getCartTotal = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id, req);
    return res.status(200).json({
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      discount: cart.discount,
      total: cart.total,
      itemCount: cart.itemCount,
    });
  } catch (error) {
    console.error('Get cart total error:', error);
    return res.status(500).json({
      message: 'Failed to get cart total',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartTotal,
};
