const mongoose = require('mongoose');

const PurchaseItemSchema = new mongoose.Schema(
  {
    product: {
      type: String,
      required: [true, 'Product is required'],
      trim: true,
      maxlength: [
        200,
        'Product name cannot exceed 200 characters',
      ],
    },

    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },

    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0.01, 'Unit price must be greater than 0'],
    },

    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0.01, 'Total price must be greater than 0'],
    },
  },
  { _id: false }
);

const PurchaseSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
      maxlength: [
        100,
        'Invoice number cannot exceed 100 characters',
      ],
    },

   supplier: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Supplier',
  required: true,
},

    items: {
      type: [PurchaseItemSchema],
      required: true,
      validate: {
        validator: (items) =>
          Array.isArray(items) && items.length > 0,
        message: 'At least one product is required',
      },
    },

    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0.01, 'Total amount must be greater than 0'],
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    status: {
      type: String,
      enum: [
        'pending',
        'received',
        'cancelled',
      ],
      default: 'received',
    },

    notes: {
      type: String,
      trim: true,
      default: '',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PurchaseSchema.index({ date: -1 });
PurchaseSchema.index({ supplier: 1 });
PurchaseSchema.index({ invoiceNumber: 1 });
PurchaseSchema.index({ status: 1 });

module.exports = mongoose.model(
  'Purchase',
  PurchaseSchema
);