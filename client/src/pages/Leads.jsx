import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import API from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, empRes] = await Promise.all([
        API.get('/leads?limit=100'),
        API.get('/employees?limit=100').catch(() => ({ data: { data: [] } })), // Silent fail if employees endpoint is inaccessible
      ]);
      setLeads(leadsRes.data.data);
      setEmployees(empRes.data.data);
    } catch (error) {
      message.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showModal = (record = null) => {
    setIsModalVisible(true);
    if (record) {
      setEditingId(record._id);
      form.setFieldsValue({
        ...record,
        assignedTo: record.assignedTo?._id || record.assignedTo,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ status: 'new', source: 'website' });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      const payload = { ...values };
      if (!payload.assignedTo) {
        delete payload.assignedTo;
      }

      if (editingId) {
        await API.put(`/leads/${editingId}`, payload);
        message.success('Lead updated successfully');
      } else {
        await API.post('/leads', payload);
        message.success('Lead added successfully');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/leads/${id}`);
      message.success('Lead deleted');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (text) => text?.toUpperCase() || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { new: 'blue', contacted: 'orange', converted: 'green' };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Popconfirm title="Delete this lead?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Sales Leads</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Add Lead
        </Button>
      </div>

      <Table dataSource={leads} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} />

      <Modal
        title={editingId ? 'Edit Lead' : 'Add Lead'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Lead Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]} style={{ width: 200 }}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone" style={{ width: 200 }}>
              <Input />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="status" label="Status" rules={[{ required: true }]} style={{ width: 200 }}>
              <Select>
                <Option value="new">New</Option>
                <Option value="contacted">Contacted</Option>
                <Option value="converted">Converted</Option>
              </Select>
            </Form.Item>

            <Form.Item name="source" label="Source" style={{ width: 200 }}>
              <Select>
                <Option value="website">Website</Option>
                <Option value="referral">Referral</Option>
                <Option value="cold_call">Cold Call</Option>
                <Option value="event">Event</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="assignedTo" label="Assigned Rep">
            <Select placeholder="Select a Sales Rep" allowClear>
              {employees.map((emp) => (
                <Option key={emp._id} value={emp._id}>
                  {emp.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingId ? 'Update' : 'Save'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Leads;
