const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');

// ✅ FIX: Correct the import path
// Change from: require('../config/db')
// To: require('./config/db')
const connectDB = require('./config/db');

// ✅ FIX: Correct the middleware path
// Change from: require('./middleware/errorHandler')
// To: require('./middleware/errorHandler') - this is correct if middleware is inside server folder
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ─── Load Environment Variables ──────────────────────────────────────────────
dotenv.config();

// ─── Initialise Express ──────────────────────────────────────────────────────
const app = express();

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow local frontend (development)
      if (origin === "http://localhost:3000") {
        return callback(null, true);
      }
      
      // Allow configured frontend origin
      if (origin === process.env.CLIENT_ORIGIN) {
        return callback(null, true);
      }
      
      // Allow Render deployments
      if (origin && origin.includes(".onrender.com")) {
        return callback(null, true);
      }
      
      // Allow Vercel deployments
      if (origin && origin.includes(".vercel.app")) {
        return callback(null, true);
      }
      
      // Allow Netlify deployments
      if (origin && origin.includes(".netlify.app")) {
        return callback(null, true);
      }
      
      // In production, be more restrictive
      // For development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // Log blocked origins for debugging
      console.log(`Blocked CORS request from: ${origin}`);
      return callback(new Error("Blocked by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/users',       require('./routes/userRoutes'));
app.use('/api/leads',       require('./routes/leadRoutes'));
app.use('/api/customers',   require('./routes/customerRoutes'));
app.use('/api/quotes',      require('./routes/quoteRoutes'));
app.use('/api/invoices',    require('./routes/invoiceRoutes'));
app.use('/api/payments',    require('./routes/paymentRoutes'));
app.use('/api/purchases',   require('./routes/purchaseRoutes'));
app.use('/api/products',    require('./routes/productRoutes'));
app.use('/api/categories',  require('./routes/categoryRoutes'));
app.use('/api/orders',      require('./routes/orderRoutes'));
app.use('/api/employees',   require('./routes/employeeRoutes'));
app.use('/api/payroll',     require('./routes/payrollRoutes'));
app.use('/api/dashboard',   require('./routes/dashboardRoutes'));
app.use('/api/reports',     require('./routes/reportsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/suppliers',   require('./routes/supplierRoutes'));

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