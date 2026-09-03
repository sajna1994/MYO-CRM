 import { useState } from 'react'; 
import { Outlet, useNavigate, useLocation } from 'react-router-dom'; 
import { useDispatch, useSelector } from 'react-redux'; 
import { Layout, Menu, Button, Dropdown, Avatar } from 'antd'; 
import { 
  DashboardOutlined, ShoppingCartOutlined, InboxOutlined, UnorderedListOutlined, 
  AppstoreOutlined, DollarOutlined, TeamOutlined, BarChartOutlined, BellOutlined, 
  LogoutOutlined, UserOutlined, MenuUnfoldOutlined, MenuFoldOutlined, 
} from '@ant-design/icons'; 
import { logout } from '../store/slices/authSlice'; 
import NotificationBell from '../components/NotificationBell'; 
import gymImage from '../images/gym.png'; 
import {
  FileTextOutlined,
} from '@ant-design/icons';
const { Header, Sider, Content } = Layout; 
 
const MainLayout = () => { 
  const [collapsed, setCollapsed] = useState(false); 
  const navigate = useNavigate(); 
  const location = useLocation(); 
  const dispatch = useDispatch(); 
  const { user } = useSelector((state) => state.auth); 
  const logoutUser = () => { dispatch(logout()); navigate('/login'); }; 
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
  const userMenu = { items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: logoutUser }] }; 
 
  return <Layout className="studio-layout"> 
    <Sider className="studio-sider" width={270} collapsible collapsed={collapsed} trigger={null}> 
      <div className="studio-brand"> 
       <img 
  src={gymImage} 
  alt="MYO Fitness Studio" 
  className="studio-logo" 
/> 
{!collapsed && <span>MYO FITNESS<br />STUDIO</span>} 
      </div> 
      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={({ key }) => navigate(key)} /> 
      <Button type="text" className="studio-logout" icon={<LogoutOutlined />} onClick={logoutUser}>{!collapsed && 'Logout'}</Button> 
    </Sider> 
    <Layout className="studio-main"> 
      <Header className="studio-header"> 
        <Button type="text" className="studio-menu-toggle" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} /> 
        <div className="studio-user"><NotificationBell /><Dropdown menu={userMenu} trigger={['click']}><span><Avatar icon={<UserOutlined />} /> {!collapsed && (user?.name || 'Admin')}</span></Dropdown></div> 
      </Header> 
      <Content className="studio-content"><Outlet /></Content> 
    </Layout> 
  </Layout>; 
}; 
 
export default MainLayout; 