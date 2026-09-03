const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: [100, 'Supplier name cannot exceed 100 characters'],
    },

    contactPerson: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true,
      maxlength: [100, 'Contact person cannot exceed 100 characters'],
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [
        /^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Invalid email address',
      ],
    },

    landline: {
      type: String,
      trim: true,
      default: '',
    },

    website: {
      type: String,
      trim: true,
      default: '',
    },

    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },

    address: {
      type: String,
      trim: true,
      default: '',
    },

    notes: {
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
  }
);

SupplierSchema.index({ name: 1 });
SupplierSchema.index({ phone: 1 });
SupplierSchema.index({ email: 1 });

module.exports = mongoose.model('Supplier', SupplierSchema);