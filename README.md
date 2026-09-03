# 🚀 MERN-Based ERP & CRM System for Integrated Business Management

A comprehensive, full-stack Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) platform built to streamline business operations, sales pipelines, and employee management.

![Dashboard Preview](https://img.shields.io/badge/MERN-Full_Stack-6c5ce7?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

## ✨ Features

- **🔐 Secure Authentication:** Role-based access control with JSON Web Tokens (JWT) and Bcrypt password hashing.
- **📊 Interactive Dashboard:** Live metrics, business statistics, and beautiful data visualization using Recharts.
- **🤝 CRM & Leads Management:** Track your sales pipeline, assign sales reps, and seamlessly convert leads into lifelong customers.
- **💸 Sales & Finance:** Generate automated quotes, create formal invoices, process orders, and record incoming payments.
- **📦 Inventory Control:** Manage product details, track available stock levels, and automatically deplete stock upon new orders.
- **💼 HRM & Payroll:** Maintain employee directories, track base salaries, and auto-generate monthly payrolls with accurate deductions and net pay calculation.
- **🔔 Notifications:** Integrated smart notification system to keep users alerted on important platform activities.

## 🛠️ Technology Stack

**Frontend:**
- React 18 (Vite)
- Redux Toolkit (State Management)
- Ant Design (UI Component Library)
- React Router v6
- Recharts (Data Visualization)
- Axios (API Communication)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (ODM)
- JSON Web Tokens (JWT)
- CORS & Dotenv

## 🚀 Live Demo

- **Frontend (Vercel):** https://mern-based-erp-and-crm-system-for-i.vercel.app
- **Backend API (Render):** https://mern-based-erp-and-crm-system-for.onrender.com

## ⚙️ Local Installation

### 1. Clone the repository
```bash
git clone https://github.com/Pavalika26/MERN-Based-ERP-and-CRM-System-for-Integrated-Business-Management.git
cd MERN-Based-ERP-and-CRM-System-for-Integrated-Business-Management
```

### 2. Set up the Backend
```bash
# Install backend dependencies
npm install

# Create a .env file in the root directory and add:
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
PORT=5000

# Start the Node.js server
npm run dev
```

### 3. Set up the Frontend
```bash
# Navigate to the client folder
cd client

# Install frontend dependencies
npm install

# Create a .env file inside the /client directory and add:
VITE_API_URL=http://localhost:5000/api

# Start the Vite development server
npm run dev
```

## 📈 Order-To-Cash Workflow Mapping
This system operates on a logical, real-world business pipeline:
1. Acquire a **Lead** → Convert to a **Customer**.
2. Supply a **Quote** using available **Products**.
3. Process an **Order** (auto-deducting Inventory).
4. Generate an **Invoice** against the completed Order.
5. Record a **Payment** to seal the transaction, which actively reflects on the main Sales **Dashboard**!

## 📄 License
This project is for educational and demonstrative purposes. Feel free to fork, customize, and use it as a foundation for your own business management systems!
