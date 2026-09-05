const mongoose = require('mongoose');

const QuoteItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const QuoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
    },
    items: {
      type: [QuoteItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one item is required',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'sent', 'accepted', 'declined', 'expired'],
        message: 'Status must be draft, sent, accepted, declined, or expired',
      },
      default: 'draft',
    },
    validUntil: {
      type: Date,
      required: [true, 'Validity date is required'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Auto-generate quote number before save
QuoteSchema.pre('save', async function (next) {
  if (this.isNew && !this.quoteNumber) {
    const count = await mongoose.model('Quote').countDocuments();
    this.quoteNumber = `QT-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

QuoteSchema.index({ quoteNumber: 1 });
QuoteSchema.index({ customer: 1 });
QuoteSchema.index({ status: 1 });

module.exports = mongoose.model('Quote', QuoteSchema);
