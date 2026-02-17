const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [50, 'Price must be at least 50'],
      max: [500, 'Price cannot exceed 500'],
      validate: {
        validator: function (value) {
          return Number.isFinite(value) && value >= 50 && value <= 500;
        },
        message: 'Price must be between 50 and 500',
      },
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: {
        values: [
          'Fruits',
          'Vegetables',
          'Dairy',
          'Bakery',
          'Meat & Poultry',
          'Seafood',
          'Beverages',
          'Snacks',
          'Frozen Foods',
          'Pantry Staples',
          'Household Essentials',
          'Personal Care',
          'Breakfast & Cereal',
        ],
        message: 'Category must be one of the predefined values',
      },
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand name cannot exceed 50 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'Invalid image URL format',
          },
        },
        alt: {
          type: String,
          maxlength: [100, 'Alt text cannot exceed 100 characters'],
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    inventory: {
      quantity: {
        type: Number,
        required: [true, 'Inventory quantity is required'],
        min: [0, 'Inventory cannot be negative'],
        default: 0,
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
        min: [0, 'Low stock threshold cannot be negative'],
      },
      trackInventory: {
        type: Boolean,
        default: true,
      },
    },
    specifications: {
      weight: {
        value: Number,
        unit: {
          type: String,
          enum: ['g', 'kg', 'oz', 'lb'],
          default: 'g',
        },
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          enum: ['mm', 'cm', 'in'],
          default: 'cm',
        },
      },
      color: String,
      material: String,
      model: String,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'discontinued'],
        default: 'active',
      },
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    ratings: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
        validate: {
          validator: function (v) {
            return v === 0 || (v >= 1 && v <= 5);
          },
          message: 'Rating must be between 0 and 5',
        },
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    discount: {
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      startDate: Date,
      endDate: Date,
    },
    shipping: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      fragile: {
        type: Boolean,
        default: false,
      },
      requiresAssembly: {
        type: Boolean,
        default: false,
      },
    },
    seo: {
      metaTitle: {
        type: String,
        maxlength: [60, 'Meta title cannot exceed 60 characters'],
      },
      metaDescription: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters'],
      },
      slug: {
        type: String,
        lowercase: true,
        trim: true,
        unique: true,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratings: -1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ 'inventory.quantity': 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
