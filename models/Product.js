const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      trim: true,
      default: 'Pcs',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: stock status
ProductSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Auto-generate SKU if not provided
ProductSchema.pre('save', async function (next) {
  if (this.isNew && !this.sku) {
    const count = await mongoose.model('Product').countDocuments();
    this.sku = `PRD-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
