const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);


const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Registered customer is optional
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    // Needed for Walk-in Customer
    customerName: {
      type: String,
      default: 'Walk-in Customer',
      trim: true,
    },

    phone: {
      type: String,
      default: '',
      trim: true,
    },

    items: {
      type: [InvoiceItemSchema],
      required: true,
      validate: {
        validator: (arr) =>
          Array.isArray(arr) && arr.length > 0,
        message: 'At least one item is required',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        'paid',
        'unpaid',
        'partial',
        'overdue',
        'cancelled',
      ],
      default: 'unpaid',
    },

    dueDate: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      default: '',
    },
  },

  {
    timestamps: true,
  }
);


InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ customer: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });


module.exports =
  mongoose.model('Invoice', InvoiceSchema);