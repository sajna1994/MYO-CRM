import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
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

const { Title, Text } = Typography;
const { Option } = Select;

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        API.get('/payroll?limit=100'),
        API.get('/employees?limit=100'),
      ]);
      setPayrolls(payRes.data.data);
      setEmployees(empRes.data.data);
    } catch (error) {
      message.error('Failed to fetch data');
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
        employee: record.employee?._id || record.employee,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      form.setFieldsValue({
        month: currentMonth,
        year: currentYear,
        status: 'pending',
        allowances: 0,
        bonus: 0,
        deductions: 0,
        tax: 0,
      });
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // Watch for employee selection to autofill baseSalary in UI context (backend does it too, but UI feedback is nice)
  const handleEmployeeChange = (empId) => {
    const emp = employees.find(e => e._id === empId);
    if (emp) {
      form.setFieldsValue({ baseSalary: emp.salary / 12 }); // Monthly salary approximation
    }
  };

  const onFinish = async (values) => {
    try {
      if (editingId) {
        await API.put(`/payroll/${editingId}`, values);
        message.success('Payroll updated successfully');
      } else {
        await API.post('/payroll', values);
        message.success('Payroll generated successfully');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/payroll/${id}`);
      message.success('Record deleted');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => record.employee?.name || '-',
    },
    { title: 'Month/Year', key: 'date', render: (_, record) => `${record.month}/${record.year}` },
    {
      title: 'Net Pay',
      dataIndex: 'netPay',
      key: 'netPay',
      render: (val) => <Text strong>${val?.toLocaleString()}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { pending: 'orange', processed: 'blue', paid: 'green' };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Popconfirm title="Delete this payroll record?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Payroll Processing</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Process Individual
          </Button>
        </Space>
      </div>

      <Table dataSource={payrolls} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} />

      <Modal
        title={editingId ? 'Edit Payroll' : 'Process Payroll'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="employee" label="Employee" rules={[{ required: true }]}>
            <Select placeholder="Select an employee" onChange={handleEmployeeChange}>
              {employees.map((emp) => (
                <Option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.department})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Space size="large">
            <Form.Item name="month" label="Month" rules={[{ required: true }]}>
              <InputNumber min={1} max={12} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="year" label="Year" rules={[{ required: true }]}>
              <InputNumber min={2020} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select style={{ width: 150 }}>
                <Option value="pending">Pending</Option>
                <Option value="processed">Processed</Option>
                <Option value="paid">Paid</Option>
              </Select>
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Form.Item name="baseSalary" label="Base Salary (Leave empty to auto-fill)">
              <InputNumber style={{ width: 150 }} step={100} min={0} />
            </Form.Item>
            <Form.Item name="allowances" label="Allowances">
              <InputNumber style={{ width: 150 }} min={0} />
            </Form.Item>
            <Form.Item name="bonus" label="Bonus">
              <InputNumber style={{ width: 150 }} min={0} />
            </Form.Item>
            <Form.Item name="deductions" label="Deductions">
              <InputNumber style={{ width: 150 }} min={0} />
            </Form.Item>
            <Form.Item name="tax" label="Tax Deduction">
              <InputNumber style={{ width: 150 }} min={0} />
            </Form.Item>
          </Space>

          <Text type="secondary">* Net Pay is auto-calculated upon submission (Base + Allowances + Bonus - Deductions - Tax)</Text>

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

export default Payroll;
