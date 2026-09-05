const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// ─── Simplified CORS Configuration ──────────────────────────────────────────
// Allow all origins (for testing)
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// ─── Then restrict later after testing ──────────────────────────────────────
// app.use(
//   cors({
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:5173',
//       'https://myo-crm-frontend.onrender.com',
//       'https://*.onrender.com'
//     ],
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//     optionsSuccessStatus: 200
//   })
// );

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health-Check Route ──────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ERP-CRM API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
// ─── Global Middleware ───────────────────────────────────────────────────────
// CORS must come BEFORE routes
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Then JSON middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));

// ─── Error-Handling Middleware ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Connect DB then Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\n🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`   Health check → http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();