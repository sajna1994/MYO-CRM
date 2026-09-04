import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Modal,
  Table,
  Space,
  Popconfirm,
  Switch,
  Tag,
} from 'antd';

import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import API from '../api/axios';
import '../styles/Products.css'; // We'll create this

const Products = () => {
  // ─────────────────────────────────────────────
  // PRODUCT STATE
  // ─────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form] = Form.useForm();

  const navigate = useNavigate();
  const location = useLocation();

  const editingProduct = location.state?.product;

  // ─────────────────────────────────────────────
  // CATEGORY STATE
  // ─────────────────────────────────────────────
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm] = Form.useForm();

  const [categorySaving, setCategorySaving] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  // ─────────────────────────────────────────────
  // LOAD CATEGORIES
  // ─────────────────────────────────────────────
  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data.data || []);
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Unable to load categories'
      );
    }
  };

  // ─────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();

    if (editingProduct) {
      form.setFieldsValue({
        ...editingProduct,
        category:
          editingProduct.category?._id ||
          editingProduct.category ||
          undefined,
      });

      if (editingProduct.image) {
        setPreview(editingProduct.image);
        setImageFile(editingProduct.image);
      }
    } else {
      form.setFieldsValue({
        costPrice: 0,
        price: 0,
        stock: 0,
        lowStockThreshold: 10,
        unit: 'Pcs',
      });
    }
  }, [form, editingProduct]);

  // ─────────────────────────────────────────────
  // PRODUCT SUBMIT
  // ─────────────────────────────────────────────
  const submit = async (values) => {
    setSaving(true);

    try {
      const productData = {
        ...values,
        image: imageFile || preview || '',
      };

      if (editingProduct?._id) {
        await API.put(`/products/${editingProduct._id}`, productData);
        message.success('Product updated successfully');
      } else {
        await API.post('/products', {
          ...productData,
          sku: `PRD-${Date.now().toString().slice(-6)}`,
        });
        message.success('Product saved successfully');
      }

      navigate('/quotes');
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Unable to save product'
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // IMAGE
  // ─────────────────────────────────────────────
  const selectImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setImageFile(e.target.result);
    };
    reader.readAsDataURL(file);
    return false;
  };

  // ─────────────────────────────────────────────
  // OPEN CATEGORY MODAL
  // ─────────────────────────────────────────────
  const openCategoryModal = () => {
    setEditingCategoryId(null);
    categoryForm.resetFields();
    setCategoryModalOpen(true);
    fetchCategories();
  };

  // ─────────────────────────────────────────────
  // CLOSE CATEGORY MODAL
  // ─────────────────────────────────────────────
  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setEditingCategoryId(null);
    categoryForm.resetFields();
  };

  // ─────────────────────────────────────────────
  // CREATE / UPDATE CATEGORY
  // ─────────────────────────────────────────────
  const saveCategory = async (values) => {
    setCategorySaving(true);

    try {
      if (editingCategoryId) {
        await API.put(`/categories/${editingCategoryId}`, values);
        message.success('Category updated successfully');
      } else {
        await API.post('/categories', values);
        message.success('Category created successfully');
      }

      categoryForm.resetFields();
      setEditingCategoryId(null);
      await fetchCategories();
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Unable to save category'
      );
    } finally {
      setCategorySaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // EDIT CATEGORY
  // ─────────────────────────────────────────────
  const editCategory = (record) => {
    setEditingCategoryId(record._id);
    categoryForm.setFieldsValue({
      name: record.name,
      description: record.description,
      isActive: record.isActive,
    });
  };

  // ─────────────────────────────────────────────
  // DELETE CATEGORY
  // ─────────────────────────────────────────────
  const deleteCategory = async (id) => {
    try {
      await API.delete(`/categories/${id}`);
      message.success('Category deleted successfully');
      await fetchCategories();

      const currentCategory = form.getFieldValue('category');
      if (currentCategory === id) {
        form.setFieldValue('category', undefined);
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Unable to delete category'
      );
    }
  };

  // ─────────────────────────────────────────────
  // CATEGORY TABLE COLUMNS (Responsive)
  // ─────────────────────────────────────────────
  const categoryColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description) => description || '-',
      responsive: ['sm'],
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (isActive) =>
        isActive ? (
          <Tag color="green">ACTIVE</Tag>
        ) : (
          <Tag color="red">INACTIVE</Tag>
        ),
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
            onClick={() => editCategory(record)}
          />
          <Popconfirm
            title="Delete this category?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteCategory(record._id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="product-editor-screen">
      {/* PAGE HEADER */}
      <div className="product-editor-header">
        <h1 className="product-editor-screen__title">
          Product Management
        </h1>

        <Button
          icon={<AppstoreOutlined />}
          onClick={openCategoryModal}
          className="manage-categories-btn"
        >
          Manage Categories
        </Button>
      </div>

      {/* PRODUCT FORM */}
      <section className="product-editor">
        <h2 className="product-editor__heading">
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          className="product-editor__form"
        >
          <div className="product-editor__fields">
            {/* LEFT COLUMN */}
            <div className="product-editor__column">
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  {
                    required: true,
                    message: 'Enter a product name',
                  },
                ]}
              >
                <Input placeholder="Enter Product Name" />
              </Form.Item>

              {/* CATEGORY */}
              <Form.Item
                name="category"
                label="Category"
                rules={[
                  {
                    required: true,
                    message: 'Please select a category',
                  },
                ]}
              >
                <Select
                  placeholder="Select Category"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={categories
                    .filter((item) => item.isActive !== false)
                    .map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <div
                        style={{
                          padding: '8px 12px',
                          borderTop: '1px solid #f0f0f0',
                        }}
                      >
                        <Button
                          type="link"
                          icon={<PlusOutlined />}
                          onClick={openCategoryModal}
                        >
                          Add New Category
                        </Button>
                      </div>
                    </>
                  )}
                />
              </Form.Item>

              <Form.Item name="brand" label="Brand">
                <Input placeholder="Enter Brand" />
              </Form.Item>

              <Form.Item name="unit" label="Unit">
                <Select
                  options={[
                    { value: 'Pcs', label: 'Pcs' },
                    { value: 'Tub', label: 'Tub' },
                    { value: 'Bottle', label: 'Bottle' },
                    { value: 'Box', label: 'Box' },
                  ]}
                />
              </Form.Item>
            </div>

            {/* RIGHT COLUMN */}
            <div className="product-editor__column">
              <Form.Item name="costPrice" label="Buying Price (₹)">
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="price"
                label="Selling Price (₹)"
                rules={[
                  {
                    required: true,
                    message: 'Enter selling price',
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item name="lowStockThreshold" label="Reorder Level">
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item name="description" label="Description (Optional)">
                <Input.TextArea rows={4} placeholder="Enter description" />
              </Form.Item>
            </div>

            {/* IMAGE */}
            <div className="product-image-field">
              <label>Product Image</label>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={selectImage}
              >
                <div className="product-image-upload">
                  {preview ? (
                    <img src={preview} alt="Product preview" />
                  ) : (
                    <>
                      <PlusOutlined />
                      <span>Upload Image</span>
                    </>
                  )}
                </div>
              </Upload>
            </div>
          </div>

          {/* PRODUCT ACTIONS */}
          <div className="product-editor__actions">
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
            >
              {editingProduct ? 'Update Product' : 'Save Product'}
            </Button>

            <Button onClick={() => navigate('/quotes')}>Cancel</Button>
          </div>
        </Form>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORY MANAGEMENT MODAL (Responsive)
      ═══════════════════════════════════════════ */}

      <Modal
        title={
          <Space>
            <SettingOutlined />
            Category Management
          </Space>
        }
        open={categoryModalOpen}
        onCancel={closeCategoryModal}
        width={window.innerWidth < 768 ? '95%' : 850}
        footer={null}
        destroyOnClose
        style={{ top: window.innerWidth < 768 ? 10 : 100 }}
      >
        {/* CATEGORY FORM */}
        <div className="category-form-container">
          <h3 style={{ marginTop: 0 }}>
            {editingCategoryId ? 'Edit Category' : 'Add New Category'}
          </h3>

          <Form form={categoryForm} layout="vertical" onFinish={saveCategory}>
            <div className="category-form-grid">
              <Form.Item
                name="name"
                label="Category Name"
                rules={[
                  {
                    required: true,
                    message: 'Enter category name',
                  },
                  {
                    max: 100,
                    message: 'Maximum 100 characters',
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="e.g. Protein" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Category description" />
              </Form.Item>

              <Form.Item
                name="isActive"
                label="Active"
                valuePropName="checked"
                initialValue={true}
                style={{ marginBottom: 0 }}
              >
                <Switch />
              </Form.Item>

              <Space className="category-form-actions">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={categorySaving}
                  icon={editingCategoryId ? <EditOutlined /> : <PlusOutlined />}
                >
                  {editingCategoryId ? 'Update' : 'Add'}
                </Button>

                {editingCategoryId && (
                  <Button
                    onClick={() => {
                      setEditingCategoryId(null);
                      categoryForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Space>
            </div>
          </Form>
        </div>

        {/* CATEGORY LIST */}
        <Table
          columns={categoryColumns}
          dataSource={categories}
          rowKey="_id"
          pagination={{
            pageSize: 6,
          }}
          size="middle"
          scroll={{ x: window.innerWidth < 768 ? 500 : 'auto' }}
        />
      </Modal>
    </div>
  );
};

export default Products;