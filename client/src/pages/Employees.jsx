import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
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

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/employees?limit=100');
      setEmployees(res.data.data);
    } catch (error) {
      message.error('Failed to fetch personnel data');
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
      form.setFieldsValue({ ...record });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ department: 'engineering', isActive: true, salary: 0 });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      if (editingId) {
        await API.put(`/employees/${editingId}`, values);
        message.success('Employee updated successfully');
      } else {
        await API.post('/employees', values);
        message.success('Employee added successfully');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/employees/${id}`);
      message.success('Employee deleted successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Tag color="geekblue">{text?.toUpperCase()}</Tag>,
    },
    { title: 'Position', dataIndex: 'position', key: 'position' },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (val) => `$${val?.toLocaleString() || 0}`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'ACTIVE' : 'INACTIVE'}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Popconfirm title="Delete this employee?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Employees</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Add Employee
        </Button>
      </div>

      <Table dataSource={employees} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} />

      <Modal
        title={editingId ? 'Edit Employee' : 'Add Employee'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="department" label="Department" rules={[{ required: true }]} style={{ width: 200 }}>
              <Select>
                <Option value="engineering">Engineering</Option>
                <Option value="sales">Sales</Option>
                <Option value="marketing">Marketing</Option>
                <Option value="hr">HR</Option>
                <Option value="finance">Finance</Option>
                <Option value="operations">Operations</Option>
                <Option value="support">Support</Option>
                <Option value="management">Management</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item name="position" label="Position" rules={[{ required: true }]}>
              <Input placeholder="e.g. Senior Dev" style={{ width: 200 }} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="salary" label="Annual Salary" rules={[{ required: true }]}>
              <InputNumber min={0} step={1000} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="isActive" label="Status" valuePropName="checked">
              <Select style={{ width: 200 }}>
                <Option value={true}>Active</Option>
                <Option value={false}>Inactive</Option>
              </Select>
            </Form.Item>
          </Space>

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

export default Employees;
