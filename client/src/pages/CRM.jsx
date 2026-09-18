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
  Pagination,
  Spin,
  Empty,
} from 'antd';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

import API from '../api/axios';
import '../styles/CRM.css';

const { Title } = Typography;

const CRM = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

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
        error.response?.data?.message ||
          'Failed to fetch suppliers'
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
        await API.put(
          `/suppliers/${editingId}`,
          values
        );

        message.success(
          'Supplier updated successfully'
        );
      } else {
        await API.post('/suppliers', values);

        message.success(
          'Supplier added successfully'
        );
      }

      handleCancel();
      await fetchSuppliers();

      // Go back to first page after adding
      if (!editingId) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error(error);

      message.error(
        error.response?.data?.message ||
          'Unable to save supplier'
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

      message.success(
        'Supplier deleted successfully'
      );

      await fetchSuppliers();

      // If deleting the last item on current page,
      // move back one page
      const maxPage = Math.max(
        1,
        Math.ceil(
          Math.max(suppliers.length - 1, 0) /
            PAGE_SIZE
        )
      );

      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    } catch (error) {
      console.error(error);

      message.error(
        error.response?.data?.message ||
          'Unable to delete supplier'
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
      render: (value) => (
        <strong>{value || '-'}</strong>
      ),
    },

    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      responsive: ['sm'],
      render: (value) => value || '-',
    },

    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
      render: (value) => value || '-',
    },

    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['lg'],
      render: (value) => value || '-',
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
            onClick={() =>
              showModal(record)
            }
            className="supplier-edit-btn"
            aria-label={`Edit ${record.name}`}
          />

          <Popconfirm
            title="Delete Supplier"
            description={`Delete ${record.name}?`}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() =>
              handleDelete(record._id)
            }
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="supplier-delete-btn"
              aria-label={`Delete ${record.name}`}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ============================================================
  // MOBILE PAGINATED DATA
  // ============================================================

  const startIndex =
    (currentPage - 1) * PAGE_SIZE;

  const paginatedSuppliers =
    suppliers.slice(
      startIndex,
      startIndex + PAGE_SIZE
    );

  // ============================================================
  // MOBILE SUPPLIER CARD
  // ============================================================

  const renderSupplierCard = (supplier) => {
    return (
      <div
        className="supplier-mobile-card"
        key={supplier._id}
      >
        {/* Card Header */}
        <div className="supplier-card-header">
          <div className="supplier-card-title-area">
            <div className="supplier-card-icon">
              {supplier.name
                ?.charAt(0)
                ?.toUpperCase() || 'S'}
            </div>

            <div>
              <h3 className="supplier-card-name">
                {supplier.name || 'Unnamed Supplier'}
              </h3>

              <p className="supplier-card-contact">
                {supplier.contactPerson ||
                  'No contact person'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="supplier-card-details">

          {supplier.phone && (
            <div className="supplier-detail-row">
              <div className="supplier-detail-icon">
                <PhoneOutlined />
              </div>

              <div className="supplier-detail-content">
                <span>Phone</span>
                <strong>
                  {supplier.phone}
                </strong>
              </div>
            </div>
          )}

          {supplier.email && (
            <div className="supplier-detail-row">
              <div className="supplier-detail-icon">
                <MailOutlined />
              </div>

              <div className="supplier-detail-content">
                <span>Email</span>
                <strong className="supplier-email">
                  {supplier.email}
                </strong>
              </div>
            </div>
          )}

          {supplier.website && (
            <div className="supplier-detail-row">
              <div className="supplier-detail-icon">
                <GlobalOutlined />
              </div>

              <div className="supplier-detail-content">
                <span>Website</span>
                <strong>
                  {supplier.website}
                </strong>
              </div>
            </div>
          )}

          {supplier.address && (
            <div className="supplier-detail-row">
              <div className="supplier-detail-icon">
                <EnvironmentOutlined />
              </div>

              <div className="supplier-detail-content">
                <span>Address</span>
                <strong className="supplier-address">
                  {supplier.address}
                </strong>
              </div>
            </div>
          )}

        </div>

        {/* Extra Information */}
        {(supplier.gstNumber ||
          supplier.landline) && (
          <div className="supplier-card-extra">

            {supplier.gstNumber && (
              <div>
                <span>GST Number</span>
                <strong>
                  {supplier.gstNumber}
                </strong>
              </div>
            )}

            {supplier.landline && (
              <div>
                <span>Landline</span>
                <strong>
                  {supplier.landline}
                </strong>
              </div>
            )}

          </div>
        )}

        {/* Actions */}
        <div className="supplier-card-actions">

          <Button
            icon={<EditOutlined />}
            onClick={() =>
              showModal(supplier)
            }
            className="supplier-mobile-edit"
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete Supplier"
            description={`Delete ${supplier.name}?`}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() =>
              handleDelete(supplier._id)
            }
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              className="supplier-mobile-delete"
            >
              Delete
            </Button>
          </Popconfirm>

        </div>
      </div>
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="supplier-management">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="supplier-header">

        <div className="supplier-heading">
          <Title
            level={2}
            className="supplier-title"
          >
            Suppliers
          </Title>

          <p className="supplier-subtitle">
            Manage your supplier contacts
          </p>
        </div>

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
          SUPPLIER LIST
      ====================================================== */}

      <Card className="supplier-table-card">

        {/* DESKTOP / TABLET */}
        <div className="supplier-desktop-view">

          <Table
            dataSource={suppliers}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total: suppliers.length,
              showSizeChanger: false,
              responsive: true,

              showTotal: (
                total,
                range
              ) => {
                return `Showing ${range[0]} to ${range[1]} of ${total} suppliers`;
              },

              onChange: (page) => {
                setCurrentPage(page);
              },
            }}
            scroll={{
              x: 600,
            }}
            size="middle"
          />

        </div>

        {/* MOBILE */}
        <div className="supplier-mobile-view">

          {loading ? (
            <div className="supplier-mobile-loading">
              <Spin size="large" />
              <p>Loading suppliers...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <Empty
              description="No suppliers found"
            />
          ) : (
            <>
              <div className="supplier-mobile-list">
                {paginatedSuppliers.map(
                  renderSupplierCard
                )}
              </div>

              <div className="supplier-mobile-pagination">
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={suppliers.length}
                  showSizeChanger={false}
                  showQuickJumper={false}
                  onChange={(page) =>
                    setCurrentPage(page)
                  }
                />
              </div>
            </>
          )}

        </div>

      </Card>

      {/* ======================================================
          ADD / EDIT SUPPLIER MODAL
      ====================================================== */}

      <Modal
        title={
          editingId
            ? 'Edit Supplier'
            : 'Add New Supplier'
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width="min(850px, 95vw)"
        destroyOnClose
        centered
        className="supplier-modal"
      >

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >

          <Row gutter={[20, 0]}>

            {/* Supplier Name */}
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Supplier Name"
                rules={[
                  {
                    required: true,
                    message:
                      'Please enter supplier name',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter supplier name"
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
                    message:
                      'Please enter a valid email',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter email"
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
                    message:
                      'Please enter contact person',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter contact person"
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
                  placeholder="Enter landline number"
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
                    message:
                      'Please enter phone number',
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter phone number"
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
                  placeholder="Enter website"
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
                  placeholder="Enter GST number"
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
                    message:
                      'Please enter address',
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter address"
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

          {/* Modal Buttons */}
          <div className="supplier-modal-actions">

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
              {editingId
                ? 'Update Supplier'
                : 'Save Supplier'}
            </Button>

          </div>

        </Form>

      </Modal>

    </div>
  );
};

export default CRM;