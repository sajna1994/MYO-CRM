import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
    Switch, 
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
    SettingOutlined, // Add this

} from '@ant-design/icons';

import dayjs from 'dayjs';

import API from '../api/axios';

import './PurchaseManagement.css';

const { Title } = Typography;

const PAGE_SIZE = 9;

const DEFAULT_ITEM = {
  product: '',
  productId: '',
  quantity: 1,
  unitPrice: 0,
};

const DEFAULT_PURCHASE = {
  invoiceNumber: '',
  supplier: '',
  date: dayjs(),
  status: 'received',
  notes: '',
  items: [{ ...DEFAULT_ITEM }],
};

const STATUS_OPTIONS = [
  {
    value: 'received',
    label: 'Received',
  },
  {
    value: 'pending',
    label: 'Pending',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
  },
];

const UNIT_OPTIONS = [
  {
    value: 'Pcs',
    label: 'Pcs',
  },
  {
    value: 'Tub',
    label: 'Tub',
  },
  {
    value: 'Bottle',
    label: 'Bottle',
  },
  {
    value: 'Box',
    label: 'Box',
  },
];

const PurchaseManagement = () => {
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();

  // =========================================================
  // PURCHASE STATE
  // =========================================================

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // =========================================================
  // VIEW STATE
  // =========================================================

  const [viewModalVisible, setViewModalVisible] =
    useState(false);

  const [selectedPurchase, setSelectedPurchase] =
    useState(null);

  // =========================================================
  // PAGINATION / SEARCH
  // =========================================================

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [search, setSearch] = useState('');

  // =========================================================
  // PRODUCT STATE
  // =========================================================

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] =
    useState(false);

  const [productModalVisible, setProductModalVisible] =
    useState(false);

  const [productSaving, setProductSaving] =
    useState(false);

  const [productTargetIndex, setProductTargetIndex] =
    useState(null);

  // =========================================================
  // CATEGORY STATE
  // =========================================================

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] =
    useState(false);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = useCallback((value) => {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
  }, []);

  const getPurchasePrice = useCallback((product) => {
    const price = Number(
      product?.costPrice ??
        product?.buyingPrice ??
        0
    );

    return Number.isFinite(price)
      ? price
      : 0;
  }, []);

// =========================================================
// SUPPLIER STATE
// =========================================================

const [suppliers, setSuppliers] = useState([]);
const [suppliersLoading, setSuppliersLoading] = useState(false);

const [supplierModalVisible, setSupplierModalVisible] =
  useState(false);

const [supplierSaving, setSupplierSaving] =
  useState(false);

const [supplierForm] = Form.useForm();

// =========================================================
// FETCH SUPPLIERS
// =========================================================

const fetchSuppliers = useCallback(async () => {
  setSuppliersLoading(true);

  try {
    const response = await API.get('/suppliers', {
      params: {
        limit: 1000,
      },
    });

    setSuppliers(
      response.data?.data || []
    );
  } catch (error) {
    console.error(
      'FETCH SUPPLIERS ERROR:',
      error
    );

    message.error(
      error.response?.data?.message ||
        'Failed to load suppliers'
    );
  } finally {
    setSuppliersLoading(false);
  }
}, []);
// =========================================================
// CATEGORY STATE (Add these after existing categories state)
// =========================================================

const [categoryModalVisible, setCategoryModalVisible] = useState(false);
const [categorySaving, setCategorySaving] = useState(false);
const [categoryForm] = Form.useForm();
const [editingCategoryId, setEditingCategoryId] = useState(null);

// =========================================================
// OPEN ADD CATEGORY MODAL
// =========================================================

const openCategoryModal = () => {
  categoryForm.resetFields();
  setEditingCategoryId(null);
  setCategoryModalVisible(true);
};

// =========================================================
// CLOSE CATEGORY MODAL
// =========================================================

const closeCategoryModal = () => {
  setCategoryModalVisible(false);
  setEditingCategoryId(null);
  categoryForm.resetFields();
};

// =========================================================
// CREATE/UPDATE CATEGORY
// =========================================================

const handleCreateCategory = async (values) => {
  setCategorySaving(true);

  try {
    const payload = {
      name: values.name?.trim(),
      description: values.description?.trim() || '',
      isActive: values.isActive !== undefined ? values.isActive : true,
    };

    let response;
    let newCategory;

    if (editingCategoryId) {
      // Update existing category
      response = await API.put(`/categories/${editingCategoryId}`, payload);
      newCategory = response.data?.data || response.data;
      message.success('Category updated successfully');
    } else {
      // Create new category
      response = await API.post('/categories', payload);
      newCategory = response.data?.data || response.data;
      message.success('Category added successfully');
    }

    if (!newCategory?._id) {
      throw new Error('Category was created but no ID was returned');
    }

    // Refresh categories list
    await fetchCategories();

    // If this is called from product form, update the product form's category field
    if (productForm) {
      productForm.setFieldValue('category', newCategory._id);
    }

    closeCategoryModal();

  } catch (error) {
    console.error('CATEGORY ERROR:', error);
    message.error(
      error.response?.data?.message || 
      error.message || 
      'Failed to save category'
    );
  } finally {
    setCategorySaving(false);
  }
};

// =========================================================
// EDIT CATEGORY
// =========================================================

const handleEditCategory = (category) => {
  setEditingCategoryId(category._id);
  categoryForm.setFieldsValue({
    name: category.name,
    description: category.description || '',
    isActive: category.isActive !== false,
  });
  setCategoryModalVisible(true);
};

// =========================================================
// DELETE CATEGORY
// =========================================================

const handleDeleteCategory = async (categoryId) => {
  try {
    await API.delete(`/categories/${categoryId}`);
    message.success('Category deleted successfully');
    await fetchCategories();
  } catch (error) {
    console.error('DELETE CATEGORY ERROR:', error);
    message.error(
      error.response?.data?.message || 'Failed to delete category'
    );
  }
};
  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);

    try {
      const response = await API.get(
        '/products',
        {
          params: {
            limit: 1000,
          },
        }
      );

      setProducts(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        'FETCH PRODUCTS ERROR:',
        error
      );

      message.error(
        error.response?.data?.message ||
          'Failed to load products'
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // =========================================================
  // FETCH CATEGORIES
  // =========================================================

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);

    try {
      const response = await API.get(
        '/categories'
      );

      setCategories(
        response.data?.data || []
      );
    } catch (error) {
      console.error(
        'FETCH CATEGORIES ERROR:',
        error
      );

      message.error(
        error.response?.data?.message ||
          'Failed to load categories'
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // =========================================================
  // FETCH PURCHASES
  // =========================================================

  const fetchPurchases = useCallback(
    async (
      currentPage = 1,
      currentSearch = ''
    ) => {
      setLoading(true);

      try {
        const response = await API.get(
          '/purchases',
          {
            params: {
              page: currentPage,
              limit: PAGE_SIZE,
              search:
                currentSearch || undefined,
            },
          }
        );

        setPurchases(
          response.data?.data || []
        );

        setTotal(
          response.data?.total || 0
        );

        setTotalAmount(
          response.data?.totalAmount || 0
        );
      } catch (error) {
        console.error(
          'FETCH PURCHASES ERROR:',
          error
        );

        message.error(
          error.response?.data?.message ||
            'Failed to fetch purchases'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

 
// =========================================================
// INITIAL LOAD
// =========================================================

useEffect(() => {
  fetchPurchases(1, '');
  fetchProducts();
  fetchSuppliers();
   fetchCategories();
}, [
  fetchPurchases,
  fetchProducts,
  fetchSuppliers,
   fetchCategories,
]);


// =========================================================
// OPEN ADD SUPPLIER MODAL
// =========================================================

const openSupplierModal = () => {
  supplierForm.resetFields();

  setSupplierModalVisible(true);
};


// =========================================================
// CLOSE ADD SUPPLIER MODAL
// =========================================================

const closeSupplierModal = () => {
  setSupplierModalVisible(false);
  supplierForm.resetFields();
};


// =========================================================
// CREATE SUPPLIER
// =========================================================

const handleCreateSupplier = async (values) => {
  setSupplierSaving(true);

  try {
    const payload = {
      name: values.name?.trim(),

      contactPerson:
        values.contactPerson?.trim() || '',

      phone:
        values.phone?.trim() || '',

      email:
        values.email?.trim() || '',

      landline:
        values.landline?.trim() || '',

      website:
        values.website?.trim() || '',

      gstNumber:
        values.gstNumber?.trim() || '',

      address:
        values.address?.trim() || '',

      notes:
        values.notes?.trim() || '',
    };

    const response = await API.post(
      '/suppliers',
      payload
    );

    const newSupplier =
      response.data?.data ||
      response.data;

    if (!newSupplier?._id) {
      throw new Error(
        'Supplier was created but no ID was returned'
      );
    }

    // Add newly created supplier
    // to the supplier list
    setSuppliers((prev) => [
      newSupplier,
      ...prev,
    ]);

    // Automatically select the new supplier
    form.setFieldValue(
      'supplier',
      newSupplier._id
    );

    message.success(
      'Supplier added successfully'
    );

    closeSupplierModal();

  } catch (error) {
    console.error(
      'CREATE SUPPLIER ERROR:',
      error
    );

    message.error(
      error.response?.data?.message ||
        'Failed to create supplier'
    );
  } finally {
    setSupplierSaving(false);
  }
};


  // =========================================================
  // PURCHASE MODAL
  // =========================================================

  const closePurchaseModal = useCallback(() => {
    setModalVisible(false);
    setEditingId(null);
    form.resetFields();
  }, [form]);

  const openNewPurchaseModal = () => {
    setEditingId(null);

    form.setFieldsValue({
      ...DEFAULT_PURCHASE,
      date: dayjs(),
      items: [
        {
          ...DEFAULT_ITEM,
        },
      ],
    });

    setModalVisible(true);
  };

  const openEditPurchaseModal = (
    record
  ) => {
    setEditingId(record._id);

    form.setFieldsValue({
      invoiceNumber:
        record.invoiceNumber || '',

      
supplier:
  record.supplier?._id ||
  record.supplier ||
  '',


      date: record.date
        ? dayjs(record.date)
        : dayjs(),

      status:
        record.status ||
        'received',

      notes:
        record.notes || '',

      items:
        record.items?.length
          ? record.items.map(
              (item) => ({
                product:
                  item.product || '',

                productId:
                  item.productId ||
                  '',

                quantity:
                  Number(
                    item.quantity
                  ) || 1,

                unitPrice:
                  Number(
                    item.unitPrice
                  ) || 0,
              })
            )
          : [
              {
                ...DEFAULT_ITEM,
              },
            ],
    });

    setModalVisible(true);
  };

  // =========================================================
  // PRODUCT SELECTION
  // =========================================================

  const handleProductChange = (
    productId,
    fieldIndex
  ) => {
    const product = products.find(
      (item) =>
        item._id === productId
    );

    if (!product) {
      return;
    }

    const currentItems =
      form.getFieldValue('items') ||
      [];

    const updatedItems = [
      ...currentItems,
    ];

    updatedItems[fieldIndex] = {
      ...updatedItems[fieldIndex],

      product: product.name,

      productId:
        product._id,

      quantity:
        Number(
          updatedItems[fieldIndex]
            ?.quantity
        ) || 1,

      unitPrice:
        getPurchasePrice(product),
    };

    form.setFieldsValue({
      items: updatedItems,
    });
  };

  // =========================================================
  // ADD PRODUCT MODAL
  // =========================================================

  const openProductModal = async (
    fieldIndex
  ) => {
    setProductTargetIndex(
      fieldIndex
    );

    productForm.resetFields();

    productForm.setFieldsValue({
      costPrice: 0,
      price: 0,
      stock: 0,
      lowStockThreshold: 10,
      unit: 'Pcs',
    });

    await fetchCategories();

    setProductModalVisible(true);
  };

  const closeProductModal = () => {
    setProductModalVisible(false);
    setProductTargetIndex(null);
    productForm.resetFields();
  };

  // =========================================================
  // CREATE PRODUCT
  // =========================================================

  const handleCreateProduct =
    async (values) => {
      setProductSaving(true);

      try {
        const targetIndex =
          productTargetIndex;

        const payload = {
          ...values,

          sku: `PRD-${Date.now()
            .toString()
            .slice(-6)}`,

          costPrice:
            Number(
              values.costPrice
            ) || 0,

          price:
            Number(
              values.price
            ) || 0,

          stock:
            Number(
              values.stock
            ) || 0,

          lowStockThreshold:
            Number(
              values.lowStockThreshold
            ) || 0,
        };

        const response =
          await API.post(
            '/products',
            payload
          );

        const newProduct =
          response.data?.data ||
          response.data;

        message.success(
          'Product created successfully'
        );

        await fetchProducts();

        setProductModalVisible(
          false
        );

        productForm.resetFields();

        setProductTargetIndex(
          null
        );

        // Automatically select
        // the new product.
        if (
          newProduct?._id &&
          targetIndex !== null
        ) {
          handleProductChange(
            newProduct._id,
            targetIndex
          );
        }
      } catch (error) {
        console.error(
          'CREATE PRODUCT ERROR:',
          error
        );

        message.error(
          error.response?.data
            ?.message ||
            'Failed to create product'
        );
      } finally {
        setProductSaving(false);
      }
    };

  // =========================================================
  // SAVE PURCHASE
  // =========================================================

  const handleSubmit = async (values) => {
  console.log('========== PURCHASE FORM ==========');
  console.log('All values:', values);
  console.log('Supplier:', values.supplier);
  console.log('Supplier type:', typeof values.supplier);
  console.log('===================================');

  
    if (
      !values.items?.length
    ) {
      message.warning(
        'Please add at least one product'
      );
      return;
    }

    setSaving(true);

    try {
      const formattedItems =
        values.items.map(
          (item, index) => {
            const quantity =
              Number(
                item.quantity
              );

            const unitPrice =
              Number(
                item.unitPrice
              );

            const productName =
              item.product?.trim();

            if (!productName) {
              throw new Error(
                `Please select product ${index + 1}`
              );
            }

            if (
              !Number.isFinite(
                quantity
              ) ||
              quantity <= 0
            ) {
              throw new Error(
                `Invalid quantity for ${productName}`
              );
            }

            if (
              !Number.isFinite(
                unitPrice
              ) ||
              unitPrice <= 0
            ) {
              throw new Error(
                `Invalid unit price for ${productName}`
              );
            }

            return {
              productId:
                item.productId ||
                null,

              product:
                productName,

              quantity,

              unitPrice,

              totalPrice:
                quantity *
                unitPrice,
            };
          }
        );

      const totalAmount =
        formattedItems.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item.totalPrice,
          0
        );

     const supplierId = values.supplier;

if (!supplierId) {
  message.error('Please select a supplier');
  return;
}

const payload = {
  invoiceNumber:
    values.invoiceNumber?.trim(),

  supplier: String(supplierId),

  items: formattedItems,

  totalAmount,

  date: values.date
    ? values.date.toISOString()
    : new Date().toISOString(),

  status:
    values.status || 'received',

  notes:
    values.notes?.trim() || '',
};

      if (editingId) {
        await API.put(
          `/purchases/${editingId}`,
          payload
        );

        message.success(
          'Purchase updated successfully'
        );
      } else {
        await API.post(
          '/purchases',
          payload
        );

        message.success(
          'Purchase created successfully'
        );
      }

      closePurchaseModal();

      await fetchPurchases(
        page,
        search
      );
    } catch (error) {
      console.error(
        'SAVE PURCHASE ERROR:',
        error
      );

      message.error(
        error.response?.data
          ?.message ||
          error.message ||
          'Unable to save purchase'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE PURCHASE
  // =========================================================

  const handleDelete = async (
    id
  ) => {
    try {
      await API.delete(
        `/purchases/${id}`
      );

      message.success(
        'Purchase deleted successfully'
      );

      const nextPage =
        purchases.length === 1 &&
        page > 1
          ? page - 1
          : page;

      setPage(nextPage);

      await fetchPurchases(
        nextPage,
        search
      );
    } catch (error) {
      console.error(
        'DELETE PURCHASE ERROR:',
        error
      );

      message.error(
        error.response?.data
          ?.message ||
          'Delete failed'
      );
    }
  };

  // =========================================================
  // VIEW PURCHASE
  // =========================================================

  const handleView = (
    record
  ) => {
    setSelectedPurchase(
      record
    );

    setViewModalVisible(
      true
    );
  };

  const closeViewModal = () => {
    setViewModalVisible(
      false
    );

    setSelectedPurchase(
      null
    );
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = (
    value
  ) => {
    setSearch(value);
    setPage(1);

    fetchPurchases(
      1,
      value
    );
  };

  // =========================================================
  // FORM WATCH
  // =========================================================

  const purchaseItems =
    Form.useWatch(
      'items',
      form
    );

  const currentGrandTotal =
    useMemo(() => {
      return (
        purchaseItems?.reduce(
          (
            sum,
            item
          ) => {
            const quantity =
              Number(
                item?.quantity
              ) || 0;

            const unitPrice =
              Number(
                item?.unitPrice
              ) || 0;

            return (
              sum +
              quantity *
                unitPrice
            );
          },
          0
        ) || 0
      );
    }, [purchaseItems]);

  // =========================================================
  // PRODUCT OPTIONS
  // =========================================================

  const productOptions =
    useMemo(() => {
      return products.map(
        (product) => ({
          value:
            product._id,

          label: `${
            product.name
          } - ${formatCurrency(
            getPurchasePrice(
              product
            )
          )}`,
        })
      );
    }, [
      products,
      formatCurrency,
      getPurchasePrice,
    ]);
// =========================================================
// CATEGORY TABLE COLUMNS
// =========================================================

const categoryColumns = useMemo(() => [
  {
    title: 'S.No.',
    key: 'serialNumber',
    width: 60,
    align: 'center',
    render: (_, __, index) => index + 1,
  },
  {
    title: 'Category Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (text) => text || '-',
  },
  {
    title: 'Status',
    dataIndex: 'isActive',
    key: 'isActive',
    align: 'center',
    render: (isActive) => (
      <span style={{ color: isActive !== false ? '#52c41a' : '#ff4d4f' }}>
        {isActive !== false ? 'Active' : 'Inactive'}
      </span>
    ),
  },
  {
    title: 'Action',
    key: 'action',
    width: 120,
    align: 'center',
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="Edit">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditCategory(record)}
          />
        </Tooltip>
        <Popconfirm
          title="Delete this category?"
          description="This action cannot be undone."
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDeleteCategory(record._id)}
        >
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
], []);
  // =========================================================
  // TABLE COLUMNS
  // =========================================================

  const columns = useMemo(
    () => [
      {
        title: 'S.No.',
        key: 'serialNumber',
        width: 80,
        align: 'center',

        render: (
          _,
          __,
          index
        ) =>
          (page - 1) *
            PAGE_SIZE +
          index +
          1,
      },

      {
        title: 'Date',
        dataIndex:
          'date',
        width: 130,

        render: (date) =>
          dayjs(date).format(
            'DD-MM-YYYY'
          ),
      },

      {
        title:
          'Invoice No.',
        dataIndex:
          'invoiceNumber',
        width: 180,
      },

      {
        title:
          'Products',
        key: 'products',
        width: 300,

        render: (
          _,
          record
        ) => (
          <div>
            {record.items?.map(
              (
                item,
                index
              ) => (
                <div
                  key={`${record._id}-${index}`}
                  style={{
                    marginBottom: 4,
                  }}
                >
                  <strong>
                    {
                      item.product
                    }
                  </strong>

                  <span
                    style={{
                      color:
                        '#888',
                      marginLeft: 6,
                    }}
                  >
                    ×{' '}
                    {
                      item.quantity
                    }
                  </span>
                </div>
              )
            )}
          </div>
        ),
      },

    {
  title: 'Supplier',
  dataIndex: 'supplier',
  width: 180,
  render: (supplier) => {
    if (!supplier) return 'N/A';
    
    // If supplier is an object with name
    if (typeof supplier === 'object' && supplier.name) {
      return supplier.name;
    }
    
    // If supplier is a string (ID), look it up
    if (typeof supplier === 'string') {
      const foundSupplier = suppliers.find(s => String(s._id) === String(supplier));
      return foundSupplier ? foundSupplier.name : supplier;
    }
    
    return String(supplier);
  },
},
      {
        title:
          'Total Price',
        dataIndex:
          'totalAmount',
        width: 160,
        align: 'right',

        render: (
          value
        ) => (
          <strong>
            {formatCurrency(
              value
            )}
          </strong>
        ),
      },

      {
        title:
          'Action',
        key: 'action',
        width: 130,
        fixed: 'right',

        render: (
          _,
          record
        ) => (
          <Space size="small">

            <Tooltip title="View">
              <Button
                type="text"
                icon={
                  <EyeOutlined />
                }
                onClick={() =>
                  handleView(
                    record
                  )
                }
              />
            </Tooltip>

            <Tooltip title="Edit">
              <Button
                type="text"
                icon={
                  <EditOutlined />
                }
                onClick={() =>
                  openEditPurchaseModal(
                    record
                  )
                }
              />
            </Tooltip>

            <Popconfirm
              title="Delete this purchase?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{
                danger:
                  true,
              }}
              onConfirm={() =>
                handleDelete(
                  record._id
                )
              }
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  danger
                  icon={
                    <DeleteOutlined />
                  }
                />
              </Tooltip>
            </Popconfirm>

          </Space>
        ),
      },
    ],
    [
      page,
      formatCurrency,
    ]
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="purchase-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="purchase-page-header">

        <div>
          <Title
            level={2}
            className="purchase-title"
          >
            Purchase Management
          </Title>

          <div className="purchase-subtitle">
            Manage your gym product purchases
          </div>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="new-purchase-button"
          onClick={
            openNewPurchaseModal
          }
        >
          New Purchase
        </Button>

      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <Row
        gutter={[
          16,
          16,
        ]}
        className="purchase-summary"
      >

        <Col
          xs={24}
          sm={12}
          md={8}
        >
          <Card className="purchase-summary-card">

            <div className="summary-label">
              Total Purchases
            </div>

            <div className="summary-value">
              {total}
            </div>

          </Card>
        </Col>

        <Col
          xs={24}
          sm={12}
          md={8}
        >
          <Card className="purchase-summary-card">

            <div className="summary-label">
              Total Purchase Value
            </div>

            <div className="summary-value orange">
              {formatCurrency(
                totalAmount
              )}
            </div>

          </Card>
        </Col>

      </Row>

      {/* =====================================================
          PURCHASE TABLE
      ===================================================== */}

      <Card
        className="purchase-table-card"
        bordered={false}
      >

        <div className="purchase-table-toolbar">

          <Input
            allowClear
            prefix={
              <SearchOutlined />
            }
            placeholder="Search product, invoice or supplier..."
            value={search}
            onChange={(e) =>
              handleSearch(
                e.target.value
              )
            }
            className="purchase-search"
          />

        </div>

        <Table
          dataSource={
            purchases
          }
          columns={
            columns
          }
          rowKey="_id"
          loading={
            loading
          }
          scroll={{
            x: 1100,
          }}
          pagination={{
            current: page,
            pageSize:
              PAGE_SIZE,
            total,
            showSizeChanger:
              false,

            onChange: (
              newPage
            ) => {
              setPage(
                newPage
              );

              fetchPurchases(
                newPage,
                search
              );
            },

            showTotal: (
              totalRows,
              range
            ) =>
              `Showing ${range[0]} to ${range[1]} of ${totalRows} entries`,
          }}
        />

      </Card>

      {/* =====================================================
          CREATE / EDIT PURCHASE MODAL
      ===================================================== */}

      <Modal
        title={
          editingId
            ? 'Edit Purchase'
            : 'New Purchase'
        }
        open={
          modalVisible
        }
        onCancel={
          closePurchaseModal
        }
        footer={null}
        width={900}
        destroyOnClose
      >

        <Form
          form={form}
          layout="vertical"
          onFinish={
            handleSubmit
          }
        >

          <Row gutter={16}>

            <Col span={12}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice No."
                rules={[
                  {
                    required:
                      true,
                    message:
                      'Please enter invoice number',
                  },
                ]}
              >
                <Input placeholder="INV-0001" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="date"
                label="Purchase Date"
                rules={[
                  {
                    required:
                      true,
                    message:
                      'Please select purchase date',
                  },
                ]}
              >
                <DatePicker
                  style={{
                    width:
                      '100%',
                  }}
                  format="DD-MM-YYYY"
                />
              </Form.Item>
            </Col>

          </Row>

{/* =====================================================
    SUPPLIER
===================================================== */}

<Form.Item
  name="supplier"
  label="Supplier"
  rules={[
    {
      required: true,
      message: 'Please select a supplier',
    },
  ]}
>
  <Select
    showSearch
    allowClear
    loading={suppliersLoading}
    placeholder="Search / Select Supplier"
    optionFilterProp="label"

    options={suppliers.map((supplier) => ({
      value: String(supplier._id),
      label: supplier.phone
        ? `${supplier.name} - ${supplier.phone}`
        : supplier.name,
    }))}

    onChange={(value) => {
      console.log('Selected Supplier ID:', value);

      form.setFieldValue(
        'supplier',
        value ? String(value) : undefined
      );
    }}

    dropdownRender={(menu) => (
      <>
        {menu}

        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            padding: '8px 12px',
          }}
        >
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={openSupplierModal}
          >
            Add New Supplier
          </Button>
        </div>
      </>
    )}
  />
</Form.Item>
          {/* PRODUCTS */}

          <Form.List name="items">

            {(
              fields,
              { add, remove }
            ) => (
              <>
                {fields.map(
                  ({
                    key,
                    name,
                    ...restField
                  }) => (
                    <Card
                      key={key}
                      size="small"
                      style={{
                        marginBottom: 12,
                      }}
                    >

                      <Row
                        gutter={12}
                        align="middle"
                      >

                        {/* PRODUCT */}

                        <Col
                          xs={24}
                          md={9}
                        >
                          <Form.Item
                            {...restField}
                            name={[
                              name,
                              'product',
                            ]}
                            label="Product"
                            rules={[
                              {
                                required:
                                  true,
                                message:
                                  'Please select a product',
                              },
                            ]}
                          >
                            <Select
                              showSearch
                              allowClear
                              loading={
                                productsLoading
                              }
                              placeholder="Search / Select Product"
                              optionFilterProp="label"
                              options={
                                productOptions
                              }
                              onChange={(
                                productId
                              ) =>
                                handleProductChange(
                                  productId,
                                  name
                                )
                              }
                              dropdownRender={(
                                menu
                              ) => (
                                <>
                                  {menu}

                                  <div
                                    style={{
                                      borderTop:
                                        '1px solid #f0f0f0',
                                      padding:
                                        '8px 12px',
                                    }}
                                  >

                                    <Button
                                      type="link"
                                      icon={
                                        <PlusOutlined />
                                      }
                                      onClick={() =>
                                        openProductModal(
                                          name
                                        )
                                      }
                                    >
                                      Add New Product
                                    </Button>

                                  </div>
                                </>
                              )}
                            />
                          </Form.Item>

                          <Form.Item
                            {...restField}
                            name={[
                              name,
                              'productId',
                            ]}
                            hidden
                          >
                            <Input />
                          </Form.Item>
                        </Col>

                        {/* QUANTITY */}

                        <Col
                          xs={12}
                          md={4}
                        >
                          <Form.Item
                            {...restField}
                            name={[
                              name,
                              'quantity',
                            ]}
                            label="Quantity"
                            rules={[
                              {
                                required:
                                  true,
                                message:
                                  'Enter quantity',
                              },
                            ]}
                          >
                            <InputNumber
                              min={1}
                              precision={0}
                              style={{
                                width:
                                  '100%',
                              }}
                            />
                          </Form.Item>
                        </Col>

                        {/* UNIT PRICE */}

                        <Col
                          xs={12}
                          md={4}
                        >
                          <Form.Item
                            {...restField}
                            name={[
                              name,
                              'unitPrice',
                            ]}
                            label="Unit Price"
                            rules={[
                              {
                                required:
                                  true,
                                message:
                                  'Enter unit price',
                              },
                            ]}
                          >
                            <InputNumber
                              min={0.01}
                              precision={2}
                              prefix="₹"
                              style={{
                                width:
                                  '100%',
                              }}
                            />
                          </Form.Item>
                        </Col>

                        {/* TOTAL */}

                        <Col
                          xs={20}
                          md={5}
                        >
                          <Form.Item label="Total Price">
                            <Input
                              readOnly
                              value={formatCurrency(
                                (
                                  Number(
                                    purchaseItems?.[
                                      name
                                    ]?.quantity
                                  ) ||
                                  0
                                ) *
                                  (
                                    Number(
                                      purchaseItems?.[
                                        name
                                      ]?.unitPrice
                                    ) ||
                                    0
                                  )
                              )}
                            />
                          </Form.Item>
                        </Col>

                        {/* DELETE */}

                        <Col
                          xs={4}
                          md={2}
                        >
                          {fields.length >
                            1 && (
                            <Button
                              danger
                              type="text"
                              icon={
                                <DeleteOutlined />
                              }
                              onClick={() =>
                                remove(
                                  name
                                )
                              }
                            />
                          )}
                        </Col>

                      </Row>

                    </Card>
                  )
                )}

                <Button
                  type="dashed"
                  block
                  icon={
                    <PlusOutlined />
                  }
                  onClick={() =>
                    add({
                      ...DEFAULT_ITEM,
                    })
                  }
                >
                  Add Product
                </Button>
              </>
            )}

          </Form.List>

          {/* GRAND TOTAL */}

          <div
            style={{
              display:
                'flex',
              justifyContent:
                'flex-end',
              marginTop:
                20,
              marginBottom:
                20,
              fontSize:
                20,
              fontWeight:
                700,
            }}
          >
            <span>
              Grand Total:&nbsp;
            </span>

            <span
              style={{
                color:
                  '#159447',
              }}
            >
              {formatCurrency(
                currentGrandTotal
              )}
            </span>
          </div>

          {/* STATUS */}

          <Form.Item
            name="status"
            label="Status"
          >
            <Select
              options={
                STATUS_OPTIONS
              }
            />
          </Form.Item>

          {/* NOTES */}

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Additional purchase details..."
            />
          </Form.Item>

          {/* FOOTER */}

          <div className="purchase-modal-footer">

            <Button
              onClick={
                closePurchaseModal
              }
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              className="new-purchase-button"
            >
              {editingId
                ? 'Update Purchase'
                : 'Save Purchase'}
            </Button>

          </div>

        </Form>

      </Modal>

      {/* =====================================================
          ADD NEW PRODUCT MODAL
      ===================================================== */}

      <Modal
        title="Add New Product"
        open={
          productModalVisible
        }
        onCancel={
          closeProductModal
        }
        footer={null}
        width={750}
        destroyOnClose
      >

        <Form
          form={productForm}
          layout="vertical"
          onFinish={
            handleCreateProduct
          }
        >

          <Row gutter={16}>

            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[
                  {
                    required:
                      true,
                    message:
                      'Please enter product name',
                  },
                ]}
              >
                <Input
                  placeholder="e.g. Whey Protein 1kg"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
             <Form.Item
  name="category"
  label="Category"
  rules={[
    {
      required: true,
      message: 'Please select category',
    },
  ]}
>
  <Select
    showSearch
    loading={categoriesLoading}
    optionFilterProp="label"
    placeholder="Select category"
    options={categories
      .filter((category) => category.isActive !== false)
      .map((category) => ({
        value: category._id,
        label: category.name,
      }))}
    dropdownRender={(menu) => (
      <>
        {menu}
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            padding: '8px 12px',
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
            </Col>

            <Col span={12}>
              <Form.Item
                name="brand"
                label="Brand"
              >
                <Input placeholder="e.g. MuscleBlaze" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="unit"
                label="Unit"
              >
                <Select
                  options={
                    UNIT_OPTIONS
                  }
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="costPrice"
                label="Buying Price (₹)"
                rules={[
                  {
                    required:
                      true,
                    message:
                      'Please enter buying price',
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  prefix="₹"
                  style={{
                    width:
                      '100%',
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="price"
                label="Selling Price (₹)"
                rules={[
                  {
                    required:
                      true,
                    message:
                      'Please enter selling price',
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  prefix="₹"
                  style={{
                    width:
                      '100%',
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="stock"
                label="Opening Stock"
              >
                <InputNumber
                  min={0}
                  precision={0}
                  style={{
                    width:
                      '100%',
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="lowStockThreshold"
                label="Reorder Level"
              >
                <InputNumber
                  min={0}
                  precision={0}
                  style={{
                    width:
                      '100%',
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Product description..."
                />
              </Form.Item>
            </Col>

          </Row>

          <div
            className="purchase-modal-footer"
          >

            <Button
              onClick={
                closeProductModal
              }
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={
                productSaving
              }
            >
              Add Product
            </Button>

          </div>

        </Form>

      </Modal>

      {/* =====================================================
          VIEW PURCHASE MODAL
      ===================================================== */}

    <Modal
  title="Purchase Details"
  open={viewModalVisible}
  onCancel={closeViewModal}
  footer={[
    <Button
      key="close"
      onClick={closeViewModal}
    >
      Close
    </Button>,
  ]}
  width={850}
>
  {selectedPurchase && (
    <div className="purchase-details">
      <div className="purchase-info-grid">
        <div className="detail-row">
          <span>Date</span>
          <strong>
            {dayjs(selectedPurchase.date).format('DD-MM-YYYY')}
          </strong>
        </div>

        <div className="detail-row">
          <span>Invoice No.</span>
          <strong>{selectedPurchase.invoiceNumber}</strong>
        </div>

        <div className="detail-row">
          <span>Supplier</span>
          <strong>
            {typeof selectedPurchase.supplier === 'object' && selectedPurchase.supplier !== null
              ? selectedPurchase.supplier.name || 'N/A'
              : selectedPurchase.supplier || 'N/A'}
          </strong>
        </div>

        <div className="detail-row">
          <span>Status</span>
          <strong>{selectedPurchase.status}</strong>
        </div>
      </div>

      <div className="purchase-products-section">
        <h3>Products</h3>
        <Table
          bordered
          pagination={false}
          rowKey={(record, index) => `${record.product}-${index}`}
          dataSource={selectedPurchase.items || []}
          columns={[
            {
              title: '#',
              width: 60,
              align: 'center',
              render: (_, __, index) => index + 1,
            },
            {
              title: 'Product',
              dataIndex: 'product',
            },
            {
              title: 'Quantity',
              dataIndex: 'quantity',
              align: 'center',
            },
            {
              title: 'Unit Price',
              dataIndex: 'unitPrice',
              align: 'right',
              render: (value) => formatCurrency(value),
            },
            {
              title: 'Total Price',
              dataIndex: 'totalPrice',
              align: 'right',
              render: (value) => (
                <strong>{formatCurrency(value)}</strong>
              ),
            },
          ]}
        />
      </div>

      <div className="purchase-grand-total">
        <span>Grand Total</span>
        <strong>{formatCurrency(selectedPurchase.totalAmount)}</strong>
      </div>

      {selectedPurchase.notes && (
        <div className="detail-notes">
          <span>Notes</span>
          <p>{selectedPurchase.notes}</p>
        </div>
      )}
    </div>
  )}
</Modal>

{/* =====================================================
    ADD NEW SUPPLIER MODAL
===================================================== */}

<Modal
  title="Add New Supplier"
  open={supplierModalVisible}
  onCancel={closeSupplierModal}
  footer={null}
  width={850}
  destroyOnClose
>
  <Form
    form={supplierForm}
    layout="vertical"
    onFinish={handleCreateSupplier}
  >

    <Row gutter={24}>

      {/* =================================================
          SUPPLIER NAME
      ================================================= */}

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
            placeholder="Enter Supplier Name"
          />
        </Form.Item>
      </Col>


      {/* =================================================
          EMAIL
      ================================================= */}

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
            placeholder="Enter Email"
          />
        </Form.Item>
      </Col>


      {/* =================================================
          CONTACT PERSON
      ================================================= */}

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
            placeholder="Enter Contact Person"
          />
        </Form.Item>
      </Col>


      {/* =================================================
          LANDLINE
      ================================================= */}

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


      {/* =================================================
          PHONE
      ================================================= */}

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
            placeholder="Enter Phone Number"
          />
        </Form.Item>
      </Col>


      {/* =================================================
          WEBSITE
      ================================================= */}

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


      {/* =================================================
          GST NUMBER
      ================================================= */}

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


      {/* =================================================
          ADDRESS
      ================================================= */}

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
            placeholder="Enter Address"
          />
        </Form.Item>
      </Col>


      {/* =================================================
          NOTES
      ================================================= */}

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


    {/* =================================================
        BUTTONS
    ================================================= */}

    <Form.Item
      style={{
        marginBottom: 0,
        textAlign: 'right',
        marginTop: 10,
      }}
    >

      <Button
        onClick={
          closeSupplierModal
        }
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
        loading={supplierSaving}
        style={{
          background:
            '#ff8a00',

          borderColor:
            '#ff8a00',

          minWidth: 140,
        }}
      >
        Save Supplier
      </Button>

    </Form.Item>

  </Form>
</Modal>
{/* =====================================================
    CATEGORY MANAGEMENT MODAL
===================================================== */}

<Modal
  title={
    <Space>
      {editingCategoryId ? 'Edit Category' : 'Add New Category'}
    </Space>
  }
  open={categoryModalVisible}
  onCancel={closeCategoryModal}
  width={850}
  footer={null}
  destroyOnClose
>
  {/* Category Form */}
  <div
    style={{
      background: '#fafafa',
      padding: 16,
      borderRadius: 10,
      marginBottom: 20,
    }}
  >
    <h3 style={{ marginTop: 0 }}>
      {editingCategoryId ? 'Edit Category' : 'Add New Category'}
    </h3>

    <Form
      form={categoryForm}
      layout="vertical"
      onFinish={handleCreateCategory}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 120px auto',
          gap: 12,
          alignItems: 'end',
        }}
      >
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

        <Space>
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

  {/* Category List */}
  <Table
    columns={categoryColumns}
    dataSource={categories}
    rowKey="_id"
    pagination={{
      pageSize: 6,
    }}
    size="middle"
    loading={categoriesLoading}
  />
</Modal>

    </div>
  );
};

export default PurchaseManagement;