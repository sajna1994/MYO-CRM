import { Outlet } from 'react-router-dom';
import {
  BarChartOutlined,
  FileTextOutlined,
  TagOutlined,
  InboxOutlined,
} from '@ant-design/icons';

import gymImage from '../images/gym.png';
import bgImage from '../images/background.jpeg';
import '../styles/AuthLayout.css';

const features = [
  [InboxOutlined, 'Stock'],
  [FileTextOutlined, 'Billing'],
  [TagOutlined, 'Prices'],
  [BarChartOutlined, 'Reports'],
];

const AuthLayout = () => (
  <div className="auth-shell">

    {/* BRAND / APP HEADER */}
    <aside
      className="auth-brand"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="auth-brand-overlay" />

      <div className="auth-brand-content">

        <img
          src={gymImage}
          alt="MYO Fitness Studio"
          className="auth-eyebrow"
        />

        <div className="auth-brand-name">
          <h1>MYO</h1>
          <h2>FITNESS STUDIO</h2>
        </div>

        <span className="auth-brand-rule" />

        <p className="auth-tagline">
          SUPPLEMENT INVENTORY &amp; BILLING SOFTWARE
        </p>

        <div className="auth-features">
          {features.map(([Icon, label], index) => (
            <div
              className="auth-feature"
              key={index}
            >
              <Icon />
              <span>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </aside>

    {/* AUTH AREA */}
    <main className="auth-panel">

      <div className="auth-card">

        {/* Mobile-only brand */}
        <div className="mobile-brand">
          <img
            src={gymImage}
            alt="MYO Fitness Studio"
          />

          <div>
            <strong>MYO</strong>
            <span>FITNESS STUDIO</span>
          </div>
        </div>

        <div className="auth-content">
          <Outlet />
        </div>

      </div>

      <p className="auth-copyright">
        © {new Date().getFullYear()} MYO Fitness Studio
      </p>

    </main>

  </div>
);

export default AuthLayout;