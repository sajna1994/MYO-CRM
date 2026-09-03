import { Outlet } from 'react-router-dom';
import {
  BarChartOutlined,
  FileTextOutlined,
  TagOutlined,
  InboxOutlined
} from '@ant-design/icons';

import gymImage from '../images/gym.png';
import bgImage from '../images/background.jpeg';

const features = [
  [InboxOutlined, <>Stock<br />Management</>],
  [FileTextOutlined, <>Sales<br />Billing</>],
  [TagOutlined, <>Price<br />Display</>],
  [BarChartOutlined, <>Reports &amp;<br />Analytics</>],
];

const AuthLayout = () => (
  <div className="auth-shell">

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

        <h1>MYO</h1>
        <h2>FITNESS STUDIO</h2>

        <span className="auth-brand-rule" />

        <p className="auth-tagline">
          SUPPLEMENT INVENTORY &amp; BILLING SOFTWARE
        </p>

        <div className="auth-features">
          {features.map(([Icon, label]) => (
            <div key={Icon.displayName || Icon.name}>
              <Icon />
              <span>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </aside>

    <main className="auth-panel">
      <div className="auth-card">
        <Outlet />
      </div>

      <p className="auth-copyright">
        © {new Date().getFullYear()} MYO Fitness Studio
      </p>
    </main>

  </div>
);

export default AuthLayout;