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
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import API from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes] = await Promise.all([
        API.get('/payments?limit=100'),
        API.get('/invoices?limit=100&status=unpaid,partial'), // Fetch only unpaid/partial invoices
      ]);
      setPayments(payRes.data.data);
      setInvoices(invRes.data.data);
    } catch (error) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      method: 'bank',
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      await API.post('/payments', values);
      message.success('Payment recorded successfully');
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/payments/${id}`);
      message.success('Payment deleted successfully');
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      title: 'Invoice Ref',
      key: 'invoice',
      render: (_, record) => record.invoice?.invoiceNumber || '-',
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => record.invoice?.customer?.name || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `$${val?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method) => <Tag color="blue">{method?.toUpperCase()}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm title="Delete this payment?" onConfirm={() => handleDelete(record._id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Payments</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
          Record Payment
        </Button>
      </div>

      <Table dataSource={payments} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 800 }} />

      <Modal
        title="Record Payment"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="invoice" label="Invoice" rules={[{ required: true }]}>
            <Select placeholder="Select an invoice">
              {invoices.map((inv) => (
                <Option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} - {inv.customer?.name} - Bal: ${(inv.totalAmount - inv.paidAmount).toFixed(2)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber
              placeholder="0.00"
              style={{ width: '100%' }}
              min={0.01}
              step={0.01}
            />
          </Form.Item>

          <Form.Item name="method" label="Payment Method" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">Cash</Option>
              <Option value="card">Card</Option>
              <Option value="bank">Bank Transfer</Option>
              <Option value="upi">UPI</Option>
              <Option value="cheque">Cheque</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: 16 }}>
            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Payments;
