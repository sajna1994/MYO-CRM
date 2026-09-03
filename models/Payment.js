const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    method: {
      type: String,
      enum: {
        values: ['cash', 'card', 'bank', 'upi', 'cheque', 'other'],
        message: 'Method must be cash, card, bank, upi, cheque, or other',
      },
      required: [true, 'Payment method is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ invoice: 1 });
PaymentSchema.index({ date: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
