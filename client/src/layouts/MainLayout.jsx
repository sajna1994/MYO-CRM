import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Drawer,
} from 'antd';

import {
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  DollarOutlined,
  TeamOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  FileTextOutlined,
  MoreOutlined,
  HomeOutlined,
} from '@ant-design/icons';

import { logout } from '../store/slices/authSlice';
import NotificationBell from '../components/NotificationBell';

import gymImage from '../images/gym.png';

import '../styles/MainLayout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  /* =====================================================
     RESPONSIVE
     ===================================================== */

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

      // Close mobile drawer when switching to desktop
      if (!mobile) {
        setMobileMoreOpen(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, []);


  /* =====================================================
     LOGOUT
     ===================================================== */

  const logoutUser = () => {
    dispatch(logout());

    setMobileMoreOpen(false);

    navigate('/login');
  };


  /* =====================================================
     MENU ITEMS
     ===================================================== */

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/purchases',
      icon: <ShoppingCartOutlined />,
      label: 'Purchase',
    },
    {
      key: '/products',
      icon: <InboxOutlined />,
      label: 'Products',
    },
    {
      key: '/quotes',
      icon: <UnorderedListOutlined />,
      label: 'Price List',
    },
    {
      key: '/inventory',
      icon: <AppstoreOutlined />,
      label: 'Stock',
    },
    {
      key: '/billing',
      icon: <DollarOutlined />,
      label: 'Sales / Billing',
    },
    {
      key: '/invoiceslist',
      icon: <FileTextOutlined />,
      label: 'Invoice List',
    },
    {
      key: '/customers',
      icon: <TeamOutlined />,
      label: 'Suppliers',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Reports',
    },
  ];


  /* =====================================================
     NAVIGATION
     ===================================================== */

  const handleNavigate = (key) => {
    navigate(key);

    setMobileMoreOpen(false);
  };


  /* =====================================================
     USER MENU
     ===================================================== */

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


  /* =====================================================
     DESKTOP SIDEBAR
     ===================================================== */

  const renderSidebar = () => {
    return (
      <div className="studio-sidebar-inner">

        {/* BRAND */}

        <div className="studio-brand">

          <img
            src={gymImage}
            alt="MYO Fitness Studio"
            className="studio-logo"
          />

          {!collapsed && (
            <div className="studio-brand-text">
              <strong>MYO</strong>
              <span>FITNESS STUDIO</span>
            </div>
          )}

        </div>


        {/* MENU */}

        <div className="studio-menu-wrapper">

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => handleNavigate(key)}
          />

        </div>


        {/* LOGOUT */}

        <Button
          type="text"
          className="studio-logout"
          icon={<LogoutOutlined />}
          onClick={logoutUser}
        >
          {!collapsed && 'Logout'}
        </Button>

      </div>
    );
  };


  /* =====================================================
     MOBILE BOTTOM NAVIGATION
     ===================================================== */

  const mobileBottomItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Home',
    },
    {
      key: '/products',
      icon: <InboxOutlined />,
      label: 'Products',
    },
    {
      key: '/billing',
      icon: <DollarOutlined />,
      label: 'Billing',
    },
    {
      key: 'more',
      icon: <MoreOutlined />,
      label: 'More',
    },
  ];


  /* =====================================================
     BOTTOM NAVIGATION
     ===================================================== */

  const handleBottomNavigation = (key) => {
    if (key === 'more') {
      setMobileMoreOpen(true);

      return;
    }

    navigate(key);
  };


  /* =====================================================
     ACTIVE MENU
     ===================================================== */

  const isMenuActive = (key) => {
    if (key === '/') {
      return location.pathname === '/';
    }

    return location.pathname === key ||
      location.pathname.startsWith(`${key}/`);
  };


  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <Layout className="studio-layout">

      {/* =================================================
          DESKTOP SIDEBAR
          ================================================= */}

      <Sider
        className="studio-sider"
        width={255}
        collapsedWidth={78}
        collapsible
        collapsed={collapsed}
        trigger={null}
      >
        {renderSidebar()}
      </Sider>


      {/* =================================================
          MOBILE MORE DRAWER
          ================================================= */}

      <Drawer
        placement="bottom"
        open={mobileMoreOpen}
        onClose={() => setMobileMoreOpen(false)}
        closable={false}
        height="auto"
        className="studio-more-drawer"
      >

        <div className="mobile-drawer-handle" />


        <div className="mobile-drawer-header">

          <div>
            <strong>
              MYO FITNESS STUDIO
            </strong>

            <span>
              Quick Navigation
            </span>
          </div>

          <Button
            type="text"
            onClick={() =>
              setMobileMoreOpen(false)
            }
          >
            Close
          </Button>

        </div>


        <div className="mobile-menu-grid">

          {menuItems.map((item) => (

            <button
              key={item.key}
              type="button"
              className={
                isMenuActive(item.key)
                  ? 'mobile-menu-item active'
                  : 'mobile-menu-item'
              }
              onClick={() =>
                handleNavigate(item.key)
              }
            >

              <span className="mobile-menu-icon">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </button>

          ))}


          {/* LOGOUT */}

          <button
            type="button"
            className="mobile-menu-item logout-item"
            onClick={logoutUser}
          >

            <span className="mobile-menu-icon">
              <LogoutOutlined />
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </Drawer>


      {/* =================================================
          MAIN
          ================================================= */}

      <Layout
        className={
          collapsed
            ? 'studio-main studio-main-collapsed'
            : 'studio-main'
        }
      >

        {/* =================================================
            HEADER
            ================================================= */}

        <Header className="studio-header">

          <div className="studio-header-left">

            {/* DESKTOP COLLAPSE */}

            {!isMobile && (
              <Button
                type="text"
                className="studio-menu-toggle"
                icon={
                  collapsed
                    ? <MenuUnfoldOutlined />
                    : <MenuFoldOutlined />
                }
                onClick={() =>
                  setCollapsed((value) => !value)
                }
              />
            )}


            {/* MOBILE MENU */}

            {isMobile && (
              <Button
                type="text"
                className="studio-mobile-menu-button"
                icon={<MenuOutlined />}
                onClick={() =>
                  setMobileMoreOpen(true)
                }
              />
            )}


            {/* MOBILE BRAND */}

            {isMobile && (
              <div className="studio-brand-mobile">

                <img
                  src={gymImage}
                  alt="MYO Fitness Studio"
                  className="studio-logo-mobile"
                />

                <div>

                  <strong>
                    MYO
                  </strong>

                  <span>
                    FITNESS STUDIO
                  </span>

                </div>

              </div>
            )}

          </div>


          {/* =================================================
              USER AREA
              ================================================= */}

          <div className="studio-user">

            <NotificationBell />

            <Dropdown
              menu={userMenu}
              trigger={['click']}
              placement="bottomRight"
            >

              <button
                type="button"
                className="studio-user-profile"
              >

                <Avatar
                  size={isMobile ? 34 : 38}
                  icon={<UserOutlined />}
                />

                {!isMobile && (
                  <span>
                    {user?.name || 'Admin'}
                  </span>
                )}

              </button>

            </Dropdown>

          </div>

        </Header>


        {/* =================================================
            CONTENT
            ================================================= */}

        <Content className="studio-content">

          <div className="studio-content-inner">
            <Outlet />
          </div>

        </Content>


        {/* =================================================
            MOBILE BOTTOM NAVIGATION
            ================================================= */}

        {isMobile && (
          <nav className="studio-bottom-nav">

            {mobileBottomItems.map((item) => {

              const active =
                item.key !== 'more' &&
                isMenuActive(item.key);

              return (
                <button
                  key={item.key}
                  type="button"
                  className={
                    active
                      ? 'bottom-nav-item active'
                      : 'bottom-nav-item'
                  }
                  onClick={() =>
                    handleBottomNavigation(item.key)
                  }
                >

                  <span className="bottom-nav-icon">
                    {item.icon}
                  </span>

                  <span className="bottom-nav-label">
                    {item.label}
                  </span>

                </button>
              );
            })}

          </nav>
        )}

      </Layout>

    </Layout>
  );
};

export default MainLayout;