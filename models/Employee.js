const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      enum: ['engineering', 'sales', 'marketing', 'hr', 'finance', 'operations', 'support', 'management', 'other'],
      default: 'other',
    },
    position: {
      type: String,
      trim: true,
      default: '',
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Employee', EmployeeSchema);
