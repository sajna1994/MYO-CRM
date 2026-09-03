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
} from 'antd';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

import API from '../api/axios';

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
    },

    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
    },

    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },

    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },

    {
      title: 'Action',
      key: 'action',
      width: 130,
      align: 'center',

      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            style={{
              color: '#555',
              fontSize: 20,
            }}
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
              style={{
                fontSize: 20,
              }}
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 25,
        }}
      >
        <Title
          level={2}
          style={{
            margin: 0,
            fontWeight: 700,
          }}
        >
          Suppliers Management
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          style={{
            background: '#ff8a00',
            borderColor: '#ff8a00',
            height: 46,
            padding: '0 25px',
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
          }}
        >
          Add Supplier
        </Button>
      </div>

      {/* ======================================================
          SUPPLIER TABLE
      ====================================================== */}

      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 10,
          border: '1px solid #e5e5e5',
        }}
      >
        <Table
          dataSource={suppliers}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `Showing ${range[0]} to ${range[1]} of ${total} entries`,
          }}
          scroll={{ x: 800 }}
        />
      </div>

      {/* ======================================================
          ADD / EDIT SUPPLIER MODAL
      ====================================================== */}

      <Modal
        title={editingId ? 'Edit Supplier' : 'Add New Supplier'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={850}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >

          <Row gutter={24}>

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

            {/* Email Required */}
            <Col xs={24} md={12}>
              <Form.Item
                name="emailRequired"
                label="Email"
                style={{ display: 'none' }}
              >
                <Input />
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
                />
              </Form.Item>
            </Col>

          </Row>

          {/* Buttons */}

          <Form.Item
            style={{
              marginBottom: 0,
              textAlign: 'right',
              marginTop: 10,
            }}
          >
            <Button
              onClick={handleCancel}
              style={{
                marginRight: 10,
                minWidth: 100,
              }}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              style={{
                background: '#ff8a00',
                borderColor: '#ff8a00',
                minWidth: 140,
              }}
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