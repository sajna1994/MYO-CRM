import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
  Card,
} from 'antd';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

import API from '../api/axios';
import '../styles/CRM.css'; // We'll create this

const { Title } = Typography;

const CRM = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form] = Form.useForm();

  // ============================================================
  // FETCH SUPPLIERS
  // ============================================================

  const fetchSuppliers = async () => {
    setLoading(true);

    try {
      const res = await API.get('/suppliers?limit=100');
      setSuppliers(res.data.data || []);
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || 'Failed to fetch suppliers'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ============================================================
  // OPEN ADD / EDIT MODAL
  // ============================================================

  const showModal = (record = null) => {
    if (record) {
      setEditingId(record._id);
      form.setFieldsValue({
        name: record.name,
        contactPerson: record.contactPerson,
        phone: record.phone,
        email: record.email,
        landline: record.landline,
        website: record.website,
        gstNumber: record.gstNumber,
        address: record.address,
        notes: record.notes,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }

    setIsModalVisible(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingId(null);
    form.resetFields();
  };

  // ============================================================
  // CREATE / UPDATE SUPPLIER
  // ============================================================

  const onFinish = async (values) => {
    setSaving(true);

    try {
      if (editingId) {
        await API.put(`/suppliers/${editingId}`, values);
        message.success('Supplier updated successfully');
      } else {
        await API.post('/suppliers', values);
        message.success('Supplier added successfully');
      }

      handleCancel();
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || 'Unable to save supplier'
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE SUPPLIER
  // ============================================================

  const handleDelete = async (id) => {
    try {
      await API.delete(`/suppliers/${id}`);
      message.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      console.error(error);
      message.error(
        error.response?.data?.message || 'Unable to delete supplier'
      );
    }
  };

  // ============================================================
  // TABLE COLUMNS
  // ============================================================

  const columns = [
    {
      title: 'Supplier Name',
      dataIndex: 'name',
      key: 'name',
      render: (value) => <strong>{value}</strong>,
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      responsive: ['sm'],
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['lg'],
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            className="supplier-edit-btn"
          />
          <Popconfirm
            title="Delete Supplier"
            description="Are you sure you want to delete this supplier?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="supplier-delete-btn"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="supplier-management">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="supplier-header">
        <Title level={2} className="supplier-title">
          Suppliers Management
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          className="supplier-add-btn"
        >
          Add Supplier
        </Button>
      </div>

      {/* ======================================================
          SUPPLIER TABLE
      ====================================================== */}

      <Card className="supplier-table-card">
        <Table
          dataSource={suppliers}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            responsive: true,
            showTotal: (total, range) => {
              if (window.innerWidth < 480) {
                return `${range[0]}-${range[1]} of ${total}`;
              }
              return `Showing ${range[0]} to ${range[1]} of ${total} entries`;
            },
          }}
          scroll={{ x: 600 }}
          size="middle"
        />
      </Card>

      {/* ======================================================
          ADD / EDIT SUPPLIER MODAL
      ====================================================== */}

      <Modal
        title={editingId ? 'Edit Supplier' : 'Add New Supplier'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={window.innerWidth < 768 ? '95%' : 850}
        destroyOnClose
        style={{ top: window.innerWidth < 768 ? 10 : 100 }}
        className="supplier-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={[24, 0]}>

            {/* Supplier Name */}
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Supplier Name"
                rules={[
                  {
                    required: true,
                    message: 'Please enter supplier name',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter Supplier Name"
                />
              </Form.Item>
            </Col>

            {/* Email */}
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    type: 'email',
                    message: 'Please enter a valid email',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter Email"
                />
              </Form.Item>
            </Col>

            {/* Contact Person */}
            <Col xs={24} md={12}>
              <Form.Item
                name="contactPerson"
                label="Contact Person"
                rules={[
                  {
                    required: true,
                    message: 'Please enter contact person',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter Contact Person"
                />
              </Form.Item>
            </Col>

            {/* Landline */}
            <Col xs={24} md={12}>
              <Form.Item
                name="landline"
                label="Landline"
              >
                <Input
                  size="large"
                  placeholder="Enter Landline Number"
                />
              </Form.Item>
            </Col>

            {/* Phone */}
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  {
                    required: true,
                    message: 'Please enter phone number',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter Phone Number"
                />
              </Form.Item>
            </Col>

            {/* Website */}
            <Col xs={24} md={12}>
              <Form.Item
                name="website"
                label="Website"
              >
                <Input
                  size="large"
                  placeholder="Enter Website"
                />
              </Form.Item>
            </Col>

            {/* GST Number */}
            <Col xs={24} md={12}>
              <Form.Item
                name="gstNumber"
                label="GST Number"
              >
                <Input
                  size="large"
                  placeholder="Enter GST Number"
                />
              </Form.Item>
            </Col>

            {/* Address */}
            <Col xs={24} md={12}>
              <Form.Item
                name="address"
                label="Address"
                rules={[
                  {
                    required: true,
                    message: 'Please enter address',
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter Address"
                  className="supplier-textarea"
                />
              </Form.Item>
            </Col>

            {/* Notes */}
            <Col xs={24} md={12}>
              <Form.Item
                name="notes"
                label="Notes"
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter notes"
                  className="supplier-textarea"
                />
              </Form.Item>
            </Col>

          </Row>

          {/* Buttons */}
          <Form.Item
            className="supplier-modal-actions"
          >
            <Button
              onClick={handleCancel}
              className="supplier-modal-cancel"
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              className="supplier-modal-submit"
            >
              {editingId ? 'Update Supplier' : 'Save Supplier'}
            </Button>
          </Form.Item>

        </Form>
      </Modal>

    </div>
  );
};

export default CRM;