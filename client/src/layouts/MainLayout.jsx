import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Menu, Button, Dropdown, Avatar, Drawer } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  DollarOutlined,
  TeamOutlined,
  BarChartOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/NotificationBell';
import gymImage from '../images/gym.png';
import {
  FileTextOutlined,
} from '@ant-design/icons';
import '../styles/MainLayout.css'; // We'll create this

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      if (mobile) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const logoutUser = () => {
    dispatch(logout());
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    {
      key: '/purchases',
      icon: <ShoppingCartOutlined />,
      label: 'Purchase',
    },
    { key: '/products', icon: <InboxOutlined />, label: 'Products' },
    { key: '/quotes', icon: <UnorderedListOutlined />, label: 'Price List' },
    { key: '/inventory', icon: <AppstoreOutlined />, label: 'Stock' },
    { key: '/billing', icon: <DollarOutlined />, label: 'Sales / Billing' },
    {
      key: '/invoiceslist',
      icon: <FileTextOutlined />,
      label: 'Invoice List',
    },
    { key: '/customers', icon: <TeamOutlined />, label: 'Suppliers' },
    { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
  ];

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        danger: true,
        onClick: logoutUser,
      },
    ],
  };

  // Handle navigation
  const handleNavigate = (key) => {
    navigate(key);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Render sidebar content
  const renderSidebar = () => (
    <>
      <div className="studio-brand">
        <img
          src={gymImage}
          alt="MYO Fitness Studio"
          className="studio-logo"
        />
        {(!collapsed || isMobile) && (
          <span>
            MYO FITNESS<br />STUDIO
          </span>
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleNavigate(key)}
      />

      <Button
        type="text"
        className="studio-logout"
        icon={<LogoutOutlined />}
        onClick={logoutUser}
      >
        {(!collapsed || isMobile) && 'Logout'}
      </Button>
    </>
  );

  return (
    <Layout className="studio-layout">

      {/* Desktop Sidebar */}
      <Sider
        className="studio-sider"
        width={270}
        collapsible={!isMobile}
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={isMobile ? 0 : 80}
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
      >
        {renderSidebar()}
      </Sider>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        closable={false}
        bodyStyle={{ padding: 0, background: '#001529' }}
        width={270}
        className="studio-mobile-drawer"
      >
        {renderSidebar()}
      </Drawer>

      <Layout className="studio-main">
        <Header className="studio-header">
          <div className="studio-header-left">
            {/* Mobile Menu Toggle */}
            {isMobile ? (
              <Button
                type="text"
                className="studio-menu-toggle"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
              />
            ) : (
              <Button
                type="text"
                className="studio-menu-toggle"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            )}

            {/* Mobile Brand */}
            {isMobile && (
              <div className="studio-brand-mobile">
                <img
                  src={gymImage}
                  alt="MYO Fitness Studio"
                  className="studio-logo-mobile"
                />
                <span>MYO FITNESS</span>
              </div>
            )}
          </div>

          <div className="studio-user">
            <NotificationBell />
            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
              <span className="studio-user-profile">
                <Avatar icon={<UserOutlined />} />
                {!isMobile && (user?.name || 'Admin')}
              </span>
            </Dropdown>
          </div>
        </Header>

        <Content className="studio-content">
          <Outlet />
        </Content>
      </Layout>

    </Layout>
  );
};

export default MainLayout;