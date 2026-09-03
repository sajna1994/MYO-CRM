const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2020,
    },
    baseSalary: {
      type: Number,
      required: [true, 'Base salary is required'],
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    netPay: {
      type: Number,
      required: [true, 'Net pay is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processed', 'paid'],
        message: 'Status must be pending, processed, or paid',
      },
      default: 'pending',
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent duplicate payroll for same employee+month+year
PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayrollSchema.index({ status: 1 });
PayrollSchema.index({ year: -1, month: -1 });

module.exports = mongoose.model('Payroll', PayrollSchema);
