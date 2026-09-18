import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Table,
  message,
  Spin,
  Empty,
  Modal,
  Form,
  Pagination,
} from 'antd';

import {
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  SaveOutlined,
  MinusOutlined,
  UserOutlined,
  CalendarOutlined,
  PhoneOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  TagOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import API from '../api/axios';
import '../styles/SalesBilling.css';

const SalesBilling = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [walkInCustomerId, setWalkInCustomerId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(dayjs());

  const [customerId, setCustomerId] = useState(null);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);

  const [customerModal, setCustomerModal] = useState(false);
  const [customerSaving, setCustomerSaving] = useState(false);
  const [customerForm] = Form.useForm();

  const [items, setItems] = useState([]);

  const [productModal, setProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Mobile pagination
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 6;

  useEffect(() => {
    generateInvoiceNumber();
    fetchData();
  }, []);

  const generateInvoiceNumber = () => {
    const year = dayjs().format('YYYY');
    const random = Math.floor(1000 + Math.random() * 9000);

    setInvoiceNumber(`INV-${year}-${random}`);
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const [productsRes, customersRes] = await Promise.all([
        API.get('/products?limit=1000'),
        API.get('/customers?limit=1000'),
      ]);

      setProducts(productsRes.data.data || []);

      const customersData = customersRes.data.data || [];
      setCustomers(customersData);

      let walkIn = customersData.find(
        (c) => c.name === 'Walk-in Customer'
      );

      if (!walkIn) {
        const walkInRes = await API.post('/customers', {
          name: 'Walk-in Customer',
          email: 'walkin@example.com',
          phone: '',
          company: '',
        });

        walkIn = walkInRes.data?.data || walkInRes.data;

        setCustomers((prev) => [walkIn, ...prev]);
      }

      setWalkInCustomerId(walkIn._id);
      setCustomerId(walkIn._id);
    } catch (error) {
      console.error(error);
      message.error('Failed to load products or customers');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(
    (customer) => customer._id === customerId
  );

  const handleCustomerChange = (id) => {
    setCustomerId(id);

    if (id === walkInCustomerId) {
      setPhone('');
      return;
    }

    const customer = customers.find(
      (item) => item._id === id
    );

    setPhone(customer?.phone || '');
  };

  const handleCreateCustomer = async (values) => {
    setCustomerSaving(true);

    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || '',
        company: values.company?.trim() || '',
      };

      const response = await API.post('/customers', payload);

      const newCustomer =
        response.data?.data || response.data;

      if (!newCustomer?._id) {
        throw new Error(
          'Customer was created but no ID was returned'
        );
      }

      setCustomers((prev) => [
        newCustomer,
        ...prev,
      ]);

      setCustomerId(newCustomer._id);
      setPhone(newCustomer.phone || '');

      message.success(
        `${newCustomer.name} added successfully`
      );

      setCustomerModal(false);
      customerForm.resetFields();
    } catch (error) {
      console.error('CREATE CUSTOMER ERROR:', error);
      console.error(
        'SERVER RESPONSE:',
        error.response?.data
      );

      message.error(
        error.response?.data?.message ||
          'Failed to create customer'
      );
    } finally {
      setCustomerSaving(false);
    }
  };

  const customerOptions = useMemo(() => {
    if (!walkInCustomerId) return [];

    return [
      {
        value: walkInCustomerId,
        label: 'Walk-in Customer',
      },
      ...customers
        .filter(
          (c) => c._id !== walkInCustomerId
        )
        .map((customer) => ({
          value: customer._id,
          label: customer.company
            ? `${customer.name} - ${customer.company}`
            : customer.name,
        })),
    ];
  }, [customers, walkInCustomerId]);

  const openProductSelector = () => {
    setSelectedProduct(null);
    setProductModal(true);
  };

  const getProductPrice = (product) => {
    const rawPrice =
      product?.sellingPrice ??
      product?.salePrice ??
      product?.price ??
      product?.unitPrice ??
      0;

    const price = Number(rawPrice);

    return Number.isFinite(price) ? price : 0;
  };

  const addProduct = () => {
    if (!selectedProduct) {
      message.warning('Please select a product');
      return;
    }

    const productId = selectedProduct._id;

    const productName =
      selectedProduct.name ||
      selectedProduct.productName ||
      'Unnamed Product';

    const unitPrice =
      getProductPrice(selectedProduct);

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0
    ) {
      message.error(
        `Invalid selling price for ${productName}`
      );

      return;
    }

    const existing = items.find(
      (item) => item.product === productId
    );

    if (existing) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.product !== productId)
            return item;

          const quantity =
            Number(item.quantity || 0) + 1;

          return {
            ...item,
            quantity,
            total:
              quantity * item.unitPrice,
          };
        })
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          product: productId,
          description: productName,
          quantity: 1,
          unitPrice,
          total: unitPrice,
        },
      ]);
    }

    setSelectedProduct(null);
    setProductModal(false);
  };

  const increaseQty = (productId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product !== productId)
          return item;

        const quantity =
          Number(item.quantity || 0) + 1;

        return {
          ...item,
          quantity,
          total:
            quantity *
            Number(item.unitPrice || 0),
        };
      })
    );
  };

  const decreaseQty = (productId) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.product !== productId)
            return item;

          const quantity =
            Number(item.quantity || 0) - 1;

          return {
            ...item,
            quantity,
            total:
              quantity *
              Number(item.unitPrice || 0),
          };
        })
        .filter(
          (item) =>
            Number(item.quantity) > 0
        )
    );
  };

  const deleteItem = (productId) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          item.product !== productId
      )
    );
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity =
        Number(item.quantity) || 0;

      const unitPrice =
        Number(item.unitPrice) || 0;

      return (
        sum + quantity * unitPrice
      );
    }, 0);
  }, [items]);

  const grandTotal = Math.max(
    0,
    subtotal - Number(discount || 0)
  );

  const totalItems = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        (Number(item.quantity) || 0),
      0
    );
  }, [items]);

  const clearBill = () => {
    setCustomerId(walkInCustomerId);
    setPhone('');
    setNotes('');
    setDiscount(0);
    setItems([]);
    generateInvoiceNumber();
    setInvoiceDate(dayjs());
    setMobilePage(1);
  };

  const saveBill = async (
    printAfterSave = false
  ) => {
    if (!customerId) {
      message.warning(
        'Please select a customer'
      );
      return;
    }

    if (!items.length) {
      message.warning(
        'Please add at least one product'
      );
      return;
    }

    const invalidItem = items.find(
      (item) => {
        const quantity =
          Number(item.quantity);

        const unitPrice =
          Number(item.unitPrice);

        return (
          !item.product ||
          !item.description ||
          !Number.isFinite(quantity) ||
          quantity < 1 ||
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        );
      }
    );

    if (invalidItem) {
      console.error(
        'INVALID BILL ITEM:',
        invalidItem
      );

      message.error(
        'One or more products have invalid quantity or price'
      );

      return;
    }

    setSaving(true);

    try {
      let customerName =
        'Walk-in Customer';

      let customerPhone =
        phone || '';

      let customerIdValue =
        customerId;

      if (
        customerId === walkInCustomerId
      ) {
        customerIdValue = null;
      } else {
        const customer =
          customers.find(
            (c) => c._id === customerId
          );

        if (customer) {
          customerName =
            customer.name ||
            'Walk-in Customer';

          customerPhone =
            customer.phone ||
            phone ||
            '';

          customerIdValue =
            customerId;
        }
      }

      const payload = {
        invoiceNumber,
        invoiceDate:
          invoiceDate.toISOString(),

        customer: customerIdValue,

        customerName,

        phone: customerPhone,

        items: items.map((item) => {
          const quantity =
            Number(item.quantity);

          const unitPrice =
            Number(item.unitPrice);

          return {
            product: item.product,
            description: item.description,
            quantity,
            unitPrice,
            total:
              quantity * unitPrice,
          };
        }),

        subtotal: Number(subtotal),

        discount:
          Number(discount) || 0,

        totalAmount:
          Number(grandTotal),

        paidAmount:
          Number(grandTotal),

        status: 'paid',

        dueDate:
          invoiceDate.toISOString(),

        notes: notes || '',
      };

      const response =
        await API.post(
          '/invoices',
          payload
        );

      const invoice =
        response.data?.data ||
        response.data;

      message.success(
        `Bill ${invoice.invoiceNumber} saved successfully`
      );

      navigate(
        `/invoices/${invoice._id}`,
        {
          state: {
            invoice,
            ...(printAfterSave && {
              autoPrint: true,
            }),
          },
        }
      );
    } catch (error) {
      console.error(
        'CREATE INVOICE ERROR:',
        error
      );

      console.error(
        'SERVER RESPONSE:',
        error.response?.data
      );

      message.error(
        error.response?.data?.message ||
          'Failed to save bill'
      );
    } finally {
      setSaving(false);
    }
  };

  const productColumns = [
    {
      title: 'Product',
      dataIndex: 'description',
      key: 'description',

      render: (name, record) => (
        <div className="billing-product-name">
          <span>{name}</span>

          {record.stock !== undefined && (
            <small>
              Stock: {record.stock}
            </small>
          )}
        </div>
      ),
    },

    {
      title: 'Price (₹)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',

      render: (price) =>
        Number(
          price || 0
        ).toLocaleString('en-IN'),

      responsive: ['sm'],
    },

    {
      title: 'Qty',
      key: 'quantity',
      align: 'center',

      render: (_, record) => (
        <div className="billing-qty-control">
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={() =>
              decreaseQty(
                record.product
              )
            }
          />

          <span>
            {record.quantity}
          </span>

          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() =>
              increaseQty(
                record.product
              )
            }
          />
        </div>
      ),
    },

    {
      title: 'Total (₹)',
      dataIndex: 'total',
      key: 'total',
      align: 'right',

      render: (total) =>
        Number(
          total || 0
        ).toLocaleString('en-IN'),
    },

    {
      title: 'Action',
      key: 'action',
      align: 'center',

      render: (_, record) => (
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          onClick={() =>
            deleteItem(
              record.product
            )
          }
        />
      ),
    },
  ];

  // Mobile product cards
  const mobileProducts = useMemo(() => {
    const start =
      (mobilePage - 1) *
      mobilePageSize;

    const end =
      start + mobilePageSize;

    return items.slice(start, end);
  }, [items, mobilePage]);

  if (loading) {
    return (
      <div className="billing-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="billing-page">

      {/* HEADER */}
      <div className="billing-page__header">
        <div>
          <div className="billing-header-icon">
            <ShoppingCartOutlined />
          </div>

          <div>
            <h1>Sales / Billing</h1>
            <p>Create New Bill</p>
          </div>
        </div>
      </div>

      {/* INVOICE / CUSTOMER */}
      <div className="billing-layout">

        {/* LEFT */}
        <Card className="billing-details-card">

          <div className="billing-section-title">
            <UserOutlined />
            <span>Customer Details</span>
          </div>

          <div className="billing-field">
            <label>
              Invoice No.
            </label>

            <Input
              prefix={<FileTextOutlined />}
              value={invoiceNumber}
              readOnly
            />
          </div>

          <div className="billing-field">
            <label>
              Date
            </label>

            <DatePicker
              prefix={<CalendarOutlined />}
              value={invoiceDate}
              onChange={(date) =>
                setInvoiceDate(
                  date || dayjs()
                )
              }
              format="DD-MM-YYYY"
              style={{
                width: '100%',
              }}
            />
          </div>

          <div className="billing-field">
            <div className="billing-label-row">
              <label>
                Customer Name
              </label>

              <button
                type="button"
                className="billing-add-customer"
                onClick={() => {
                  customerForm.resetFields();
                  setCustomerModal(true);
                }}
              >
                <PlusOutlined />
                Add Customer
              </button>
            </div>

            <Select
              value={customerId}
              onChange={
                handleCustomerChange
              }
              options={customerOptions}
              style={{
                width: '100%',
              }}
              placeholder="Select Customer"
              showSearch
              optionFilterProp="label"
            />
          </div>

          <div className="billing-field">
            <label>
              Phone
            </label>

            <Input
              prefix={<PhoneOutlined />}
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              placeholder="Enter phone number"
            />
          </div>

          <div className="billing-field billing-field--notes">
            <label>
              Notes
              <span>Optional</span>
            </label>

            <Input.TextArea
              rows={5}
              value={notes}
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              placeholder="Add notes for this bill..."
            />
          </div>
        </Card>

        {/* RIGHT */}
        <Card className="billing-products-card">

          <div className="billing-products-header">

            <div>
              <div className="billing-products-title">
                <ShoppingCartOutlined />
                <h2>Products</h2>

                {items.length > 0 && (
                  <span>
                    {totalItems} items
                  </span>
                )}
              </div>

              <p>
                Add products to this bill
              </p>
            </div>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={
                openProductSelector
              }
              className="billing-add-product"
            >
              Add Product
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="billing-empty">
              <div className="billing-empty-icon">
                <ShoppingCartOutlined />
              </div>

              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No products added"
              />

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={
                  openProductSelector
                }
              >
                Add Your First Product
              </Button>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="billing-desktop-products">
                <Table
                  columns={productColumns}
                  dataSource={items}
                  rowKey="product"
                  pagination={false}
                  bordered
                  size="middle"
                />
              </div>

              {/* MOBILE CARDS */}
              <div className="billing-mobile-products">

                {mobileProducts.map(
                  (item) => (
                    <div
                      className="billing-mobile-product"
                      key={item.product}
                    >

                      <div className="billing-mobile-product__top">

                        <div className="billing-mobile-product__icon">
                          <TagOutlined />
                        </div>

                        <div className="billing-mobile-product__info">
                          <h3>
                            {item.description}
                          </h3>

                          <span>
                            ₹
                            {Number(
                              item.unitPrice || 0
                            ).toLocaleString(
                              'en-IN'
                            )}{' '}
                            / unit
                          </span>
                        </div>

                        <button
                          type="button"
                          className="billing-mobile-delete"
                          onClick={() =>
                            deleteItem(
                              item.product
                            )
                          }
                          aria-label="Delete product"
                        >
                          <DeleteOutlined />
                        </button>

                      </div>

                      <div className="billing-mobile-product__bottom">

                        <div className="billing-mobile-price">
                          <span>
                            Total
                          </span>

                          <strong>
                            ₹
                            {Number(
                              item.total || 0
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </strong>
                        </div>

                        <div className="billing-mobile-qty">

                          <span>
                            Quantity
                          </span>

                          <div className="billing-mobile-qty-control">

                            <button
                              type="button"
                              onClick={() =>
                                decreaseQty(
                                  item.product
                                )
                              }
                            >
                              <MinusOutlined />
                            </button>

                            <strong>
                              {item.quantity}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQty(
                                  item.product
                                )
                              }
                            >
                              <PlusOutlined />
                            </button>

                          </div>
                        </div>

                      </div>

                    </div>
                  )
                )}

                {items.length >
                  mobilePageSize && (
                  <div className="billing-mobile-pagination">
                    <Pagination
                      current={mobilePage}
                      pageSize={
                        mobilePageSize
                      }
                      total={items.length}
                      showSizeChanger={false}
                      onChange={(page) =>
                        setMobilePage(page)
                      }
                    />
                  </div>
                )}

              </div>
            </>
          )}
        </Card>
      </div>

      {/* SUMMARY */}
      <Card className="billing-summary-card">

        <div className="billing-summary">

          <div className="billing-summary-row">
            <span>
              Total Items
            </span>

            <strong>
              {totalItems}
            </strong>
          </div>

          <div className="billing-summary-row">
            <span>
              Subtotal
            </span>

            <strong>
              ₹
              {subtotal.toLocaleString(
                'en-IN'
              )}
            </strong>
          </div>

          <div className="billing-summary-row billing-summary-row--discount">

            <span>
              Discount
            </span>

            <InputNumber
              min={0}
              max={subtotal}
              precision={2}
              value={discount}
              onChange={(value) =>
                setDiscount(
                  value || 0
                )
              }
              prefix="₹"
            />

          </div>

          <div className="billing-summary-grand">

            <div>
              <span>
                Grand Total
              </span>

              <small>
                Amount to be paid
              </small>
            </div>

            <strong>
              ₹
              {grandTotal.toLocaleString(
                'en-IN'
              )}
            </strong>

          </div>

        </div>
      </Card>

      {/* ACTIONS */}
      <div className="billing-actions">

        <Button
          type="primary"
          className="billing-save-print"
          icon={<PrinterOutlined />}
          loading={saving}
          onClick={() =>
            saveBill(true)
          }
        >
          Save & Print Bill
        </Button>

        <Button
          type="primary"
          className="billing-save"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() =>
            saveBill(false)
          }
        >
          Save Bill
        </Button>

        <Button
          className="billing-clear"
          onClick={clearBill}
        >
          Clear
        </Button>

      </div>

      {/* PRODUCT MODAL */}
      {productModal && (
        <div className="billing-product-modal">

          <div className="billing-product-modal__overlay">

            <div className="billing-product-modal__content">

              <div className="billing-product-modal__header">

                <div>
                  <span>
                    <ShoppingCartOutlined />
                  </span>

                  <div>
                    <h2>
                      Add Product
                    </h2>

                    <p>
                      Select a product for this bill
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    setProductModal(
                      false
                    )
                  }
                >
                  Close
                </Button>

              </div>

              <Select
                showSearch
                allowClear
                value={
                  selectedProduct?._id ||
                  undefined
                }
                onChange={(id) => {
                  const product =
                    products.find(
                      (item) =>
                        item._id === id
                    );

                  setSelectedProduct(
                    product || null
                  );
                }}
                optionFilterProp="label"
                placeholder="Search product..."
                style={{
                  width: '100%',
                  marginBottom: 20,
                }}
                getPopupContainer={(
                  triggerNode
                ) =>
                  triggerNode.parentElement
                }
                popupMatchSelectWidth
                options={products.map(
                  (product) => ({
                    value:
                      product._id,

                    label: `${
                      product.name
                    } - ₹${getProductPrice(
                      product
                    ).toLocaleString(
                      'en-IN'
                    )}`,
                  })
                )}
                notFoundContent={
                  products.length === 0
                    ? 'No products available'
                    : 'No matching product'
                }
              />

              {selectedProduct && (
                <div className="selected-product-preview">

                  <div className="selected-product-preview__icon">
                    <TagOutlined />
                  </div>

                  <div>
                    <h3>
                      {
                        selectedProduct.name
                      }
                    </h3>

                    <p>
                      Selling Price:{' '}
                      <strong>
                        ₹
                        {getProductPrice(
                          selectedProduct
                        ).toLocaleString(
                          'en-IN'
                        )}
                      </strong>
                    </p>

                    {selectedProduct.stock !==
                      undefined && (
                      <p>
                        Available Stock:{' '}
                        <strong>
                          {
                            selectedProduct.stock
                          }
                        </strong>
                      </p>
                    )}
                  </div>

                </div>
              )}

              <div className="billing-product-modal__actions">

                <Button
                  onClick={() =>
                    setProductModal(
                      false
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  type="primary"
                  onClick={addProduct}
                >
                  Add Product
                </Button>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      <Modal
        title="Add New Customer"
        open={customerModal}
        onCancel={() => {
          if (!customerSaving) {
            setCustomerModal(false);
            customerForm.resetFields();
          }
        }}
        footer={null}
        destroyOnClose
        width={
          window.innerWidth < 768
            ? '95%'
            : 520
        }
      >

        <Form
          form={customerForm}
          layout="vertical"
          onFinish={
            handleCreateCustomer
          }
        >

          <Form.Item
            label="Customer Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  'Please enter customer name',
              },
            ]}
          >
            <Input
              placeholder="Enter customer name"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message:
                  'Please enter email',
              },
              {
                type: 'email',
                message:
                  'Please enter a valid email',
              },
            ]}
          >
            <Input
              placeholder="Enter email address"
            />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
          >
            <Input
              placeholder="Enter phone number"
            />
          </Form.Item>

          <Form.Item
            label="Company"
            name="company"
          >
            <Input
              placeholder="Enter company name"
            />
          </Form.Item>

          <div className="billing-customer-modal-actions">

            <Button
              onClick={() => {
                setCustomerModal(
                  false
                );

                customerForm.resetFields();
              }}
              disabled={customerSaving}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={customerSaving}
            >
              Add Customer
            </Button>

          </div>

        </Form>
      </Modal>

    </div>
  );
};

export default SalesBilling;