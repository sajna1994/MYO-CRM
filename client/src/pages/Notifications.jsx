import { List, Avatar, Tag, Badge, Button, Tabs, Empty } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

const notifications = [
  { id: 1, type: 'success', title: 'Invoice INV-001 paid',           description: 'Acme Corp paid $4,500 via bank transfer.',   time: '2 hours ago', read: false },
  { id: 2, type: 'warning', title: 'Low stock alert',                description: 'Webcam HD (PRD-005) is below reorder level.', time: '4 hours ago', read: false },
  { id: 3, type: 'info',    title: 'New lead assigned',              description: 'Stark Industries was assigned to your pipeline.', time: '6 hours ago', read: true },
  { id: 4, type: 'error',   title: 'Payment failed',                description: 'Payment PAY-004 from Umbrella Co failed.',    time: '1 day ago',   read: true },
  { id: 5, type: 'success', title: 'Order ORD-001 delivered',       description: 'Acme Corp order was successfully delivered.',  time: '2 days ago',  read: true },
  { id: 6, type: 'info',    title: 'New employee onboarded',        description: 'Lisa Thompson joined the Finance team.',       time: '3 days ago',  read: true },
];

const typeIcons = {
  success: <CheckCircleOutlined style={{ color: '#00b894' }} />,
  warning: <WarningOutlined style={{ color: '#fdcb6e' }} />,
  info:    <InfoCircleOutlined style={{ color: '#0984e3' }} />,
  error:   <CloseCircleOutlined style={{ color: '#e17055' }} />,
};

const typeColors = { success: 'green', warning: 'orange', info: 'blue', error: 'red' };

const NotificationList = ({ items }) => (
  items.length === 0 ? <Empty description="No notifications" /> : (
    <List
      itemLayout="horizontal"
      dataSource={items}
      renderItem={(item) => (
        <List.Item
          style={{
            background: item.read ? 'transparent' : 'rgba(108, 92, 231, 0.06)',
            padding: '16px 20px',
            borderRadius: 8,
            marginBottom: 8,
            border: '1px solid rgba(108, 92, 231, 0.08)',
          }}
          actions={[<Button type="link" size="small" key="mark">{item.read ? 'Read' : 'Mark read'}</Button>]}
        >
          <List.Item.Meta
            avatar={<Avatar style={{ background: 'transparent', fontSize: 20 }} icon={typeIcons[item.type]} />}
            title={
              <span style={{ color: '#e0e0e0' }}>
                {!item.read && <Badge status="processing" />} {item.title}{' '}
                <Tag color={typeColors[item.type]} style={{ marginLeft: 8, fontSize: '0.7rem' }}>{item.type}</Tag>
              </span>
            }
            description={
              <div>
                <div style={{ color: '#999' }}>{item.description}</div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: 4 }}>{item.time}</div>
              </div>
            }
          />
        </List.Item>
      )}
    />
  )
);

const Notifications = () => {
  const unread = notifications.filter((n) => !n.read);
  const all = notifications;

  const tabItems = [
    { key: 'all', label: `All (${all.length})`, children: <NotificationList items={all} /> },
    { key: 'unread', label: `Unread (${unread.length})`, children: <NotificationList items={unread} /> },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Stay updated on important events.</p>
      </div>
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Tabs items={tabItems} defaultActiveKey="all" style={{ flex: 1 }} />
        </div>
      </div>
    </>
  );
};

export default Notifications;
