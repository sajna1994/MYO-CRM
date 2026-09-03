import { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Spin, Empty, Avatar, Space } from 'antd';
import { BellOutlined, InfoCircleOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import API from '../api/axios';

dayjs.extend(relativeTime);

const { Text } = Typography;

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data.data);
    } catch (error) {
      console.error('Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Set up polling or websocket here for real-time updates
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications(current =>
        current.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await API.patch('/notifications/read-all');
      setNotifications(current => current.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const content = (
    <div style={{ width: 350, background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead} loading={loading}>
            Mark all read
          </Button>
        )}
      </div>
      
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={item => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  background: item.isRead ? '#fff' : '#f0f5ff',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'background 0.3s'
                }}
                onClick={() => !item.isRead && handleMarkAsRead(item._id)}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={getIcon(item.type)} style={{ backgroundColor: 'transparent' }} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: '13px', color: item.isRead ? '#888' : '#333', fontWeight: item.isRead ? 'normal' : '500' }}>
                        {item.message}
                      </Text>
                    </div>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(item.createdAt).fromNow()}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Dropdown overlay={content} trigger={['click']} placement="bottomRight" arrow>
      <Badge count={unreadCount} style={{ cursor: 'pointer' }} size="small" offset={[-2, 5]}>
        <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: '18px' }} />} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
