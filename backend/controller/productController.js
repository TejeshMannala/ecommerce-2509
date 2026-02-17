const mongoose = require('mongoose');
const Product = require('../models/Product');

const MIN_PRODUCT_PRICE = 50;
const MAX_PRODUCT_PRICE = 500;

const clampPrice = (value) =>
  Math.min(MAX_PRODUCT_PRICE, Math.max(MIN_PRODUCT_PRICE, Number(value || 0)));

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const toSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const validateDiscountDates = (discount) => {
  if (!discount) return null;
  if (!discount.startDate || !discount.endDate) return null;

  const start = new Date(discount.startDate);
  const end = new Date(discount.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Discount startDate and endDate must be valid dates';
  }

  if (start >= end) {
    return 'Discount end date must be after start date';
  }

  return null;
};

const createProduct = async (req, res) => {
  try {
    const payload = { ...req.body };

    payload.createdBy = req.user?._id || payload.createdBy;
    if (!payload.createdBy) {
      return res.status(400).json({ message: 'createdBy is required' });
    }

    if (!payload.name || !payload.description || payload.price === undefined || !payload.category || !payload.sku) {
      return res.status(400).json({
        message: 'name, description, price, category, and sku are required',
      });
    }
    payload.price = clampPrice(payload.price);

    if (!payload.seo) payload.seo = {};
    if (!payload.seo.slug && payload.name) {
      payload.seo.slug = toSlug(payload.name);
    }

    const discountError = validateDiscountDates(payload.discount);
    if (discountError) {
      return res.status(400).json({ message: discountError });
    }

    const product = await Product.create(payload);

    return res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'SKU or slug already exists' });
    }

    return res.status(500).json({
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      status,
      search,
      minPrice,
      maxPrice,
      isFeatured,
      sortBy = 'createdAt',
      order = 'desc',
      includeDeleted = 'false',
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const query = {};

    if (!toBoolean(includeDeleted)) {
      query.isDeleted = false;
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (isFeatured !== undefined) query.isFeatured = toBoolean(isFeatured);

    if (search) {
      const searchOrConditions = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        searchOrConditions.unshift({ _id: search });
      }

      query.$or = searchOrConditions;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const sortDirection = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortDirection = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const query = { category, isDeleted: false };
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    return res.status(500).json({
      message: 'Failed to fetch products by category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const searchProducts = async (req, res) => {
  try {
    const {
      q = '',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
      status,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortDirection = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const query = { isDeleted: false };
    if (status) query.status = status;
    if (q) {
      const searchOrConditions = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
      ];

      if (mongoose.Types.ObjectId.isValid(q)) {
        searchOrConditions.unshift({ _id: q });
      }

      query.$or = searchOrConditions;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      products,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Search products error:', error);
    return res.status(500).json({
      message: 'Failed to search products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isDeleted: false });
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Get product categories error:', error);
    return res.status(500).json({
      message: 'Failed to fetch product categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findOne({ _id: id, isDeleted: false });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error('Get product by id error:', error);
    return res.status(500).json({
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const existingProduct = await Product.findOne({ _id: id, isDeleted: false });
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (updates.discount) {
      const discountError = validateDiscountDates(updates.discount);
      if (discountError) {
        return res.status(400).json({ message: discountError });
      }
    }

    if (updates.name) {
      if (!updates.seo) updates.seo = { ...(existingProduct.seo || {}) };
      if (!updates.seo.slug) {
        updates.seo.slug = toSlug(updates.name);
      }
    }
    if (updates.price !== undefined) {
      updates.price = clampPrice(updates.price);
    }

    delete updates._id;
    delete updates.createdBy;

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'SKU or slug already exists' });
    }

    return res.status(500).json({
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductsByCategory,
  searchProducts,
  getProductCategories,
  getProductById,
  updateProduct,
  deleteProduct,
};
