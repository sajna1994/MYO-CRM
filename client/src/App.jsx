import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages — Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Pages — Dashboard
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import CRM from './pages/CRM';
import Invoices from './pages/Invoices';
import Quotes from './pages/Quotes';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import PurchaseManagement from './pages/PurchaseManagement';
import SalesBilling from './pages/SalesBilling';
import InvoicePreview from './pages/InvoicePreview';
import InvoiceList from './pages/InvoiceList';
const App = () => {
  return (
    <Routes>
      {/* ── Public (Auth) Routes ──────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* ── Protected (Dashboard) Routes ──────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/customers" element={<CRM />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route
  path="/invoiceslist"
  element={<InvoiceList />}
/>
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/payments" element={<Payments />} />
<Route
  path="/purchases"
  element={<PurchaseManagement />}
/>
<Route
  path="/billing"
  element={<SalesBilling />}
/>

<Route
  path="/invoices/:id"
  element={<InvoicePreview />}
/>

        <Route path="/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
};

export default App;
