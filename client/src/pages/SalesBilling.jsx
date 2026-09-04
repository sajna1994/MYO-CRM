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
} from 'antd';

import {
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  SaveOutlined,
  MinusOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import API from '../api/axios';
import '../styles/billing.css';

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

      // Find or create walk-in customer
      let walkIn = customersData.find(c => c.name === 'Walk-in Customer');
      
      if (!walkIn) {
        // Create walk-in customer if not exists
        const walkInRes = await API.post('/customers', {
          name: 'Walk-in Customer',
          email: 'walkin@example.com',
          phone: '',
          company: ''
        });
        walkIn = walkInRes.data?.data || walkInRes.data;
        setCustomers(prev => [walkIn, ...prev]);
      }
      
      setWalkInCustomerId(walkIn._id);
      setCustomerId(walkIn._id); // Set walk-in as default

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

    const customer = customers.find((item) => item._id === id);
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
      const newCustomer = response.data?.data || response.data;

      if (!newCustomer?._id) {
        throw new Error('Customer was created but no ID was returned');
      }

      setCustomers((prev) => [newCustomer, ...prev]);
      setCustomerId(newCustomer._id);
      setPhone(newCustomer.phone || '');

      message.success(`${newCustomer.name} added successfully`);
      setCustomerModal(false);
      customerForm.resetFields();

    } catch (error) {
      console.error('CREATE CUSTOMER ERROR:', error);
      console.error('SERVER RESPONSE:', error.response?.data);
      message.error(error.response?.data?.message || 'Failed to create customer');
    } finally {
      setCustomerSaving(false);
    }
  };

  // ✅ CORRECTED: Single customerOptions definition
  const customerOptions = useMemo(() => {
    if (!walkInCustomerId) return [];

    return [
      {
        value: walkInCustomerId,
        label: 'Walk-in Customer',
      },
      ...customers
        .filter(c => c._id !== walkInCustomerId) // Remove duplicate walk-in
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

    console.log('SELECTED PRODUCT:', selectedProduct);

    const productId = selectedProduct._id;
    const productName = selectedProduct.name || selectedProduct.productName || 'Unnamed Product';
    const unitPrice = getProductPrice(selectedProduct);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      message.error(`Invalid selling price for ${productName}`);
      return;
    }

    const existing = items.find((item) => item.product === productId);

    if (existing) {
      setItems((prev) =>
        prev.map((item) => {
          if (item.product !== productId) return item;
          const quantity = Number(item.quantity || 0) + 1;
          return {
            ...item,
            quantity,
            total: quantity * item.unitPrice,
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
        if (item.product !== productId) return item;
        const quantity = Number(item.quantity || 0) + 1;
        return {
          ...item,
          quantity,
          total: quantity * Number(item.unitPrice || 0),
        };
      })
    );
  };

  const decreaseQty = (productId) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.product !== productId) return item;
          const quantity = Number(item.quantity || 0) - 1;
          return {
            ...item,
            quantity,
            total: quantity * Number(item.unitPrice || 0),
          };
        })
        .filter((item) => Number(item.quantity) > 0)
    );
  };

  const deleteItem = (productId) => {
    setItems((prev) => prev.filter((item) => item.product !== productId));
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  }, [items]);

  const grandTotal = Math.max(0, subtotal - Number(discount || 0));

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const clearBill = () => {
    setCustomerId(walkInCustomerId); // ✅ Reset to walk-in instead of null
    setPhone('');
    setNotes('');
    setDiscount(0);
    setItems([]);
    generateInvoiceNumber();
    setInvoiceDate(dayjs());
  };

  const saveBill = async (printAfterSave = false) => {
    if (!customerId) {
      message.warning('Please select a customer');
      return;
    }

    if (!items.length) {
      message.warning('Please add at least one product');
      return;
    }

    const invalidItem = items.find((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      return (
        !item.product ||
        !item.description ||
        !Number.isFinite(quantity) ||
        quantity < 1 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      );
    });

    if (invalidItem) {
      console.error('INVALID BILL ITEM:', invalidItem);
      message.error('One or more products have invalid quantity or price');
      return;
    }

    setSaving(true);

    try {
      // Get customer details
      let customerName = 'Walk-in Customer';
      let customerPhone = phone || '';
      let customerIdValue = customerId;

      // If it's the walk-in customer, set customer to null (or keep the ID)
      if (customerId === walkInCustomerId) {
        // Option 1: Send null (if backend allows)
        customerIdValue = null;
        // Option 2: Send the walk-in customer ID (if backend requires it)
        // customerIdValue = walkInCustomerId;
      } else {
        const customer = customers.find(c => c._id === customerId);
        if (customer) {
          customerName = customer.name || 'Walk-in Customer';
          customerPhone = customer.phone || phone || '';
          customerIdValue = customerId;
        }
      }

      const payload = {
        invoiceNumber,
        invoiceDate: invoiceDate.toISOString(),
        customer: customerIdValue, // ✅ This will be null for walk-in
        customerName: customerName,
        phone: customerPhone,
        items: items.map((item) => {
          const quantity = Number(item.quantity);
          const unitPrice = Number(item.unitPrice);
          return {
            product: item.product,
            description: item.description,
            quantity,
            unitPrice,
            total: quantity * unitPrice,
          };
        }),
        subtotal: Number(subtotal),
        discount: Number(discount) || 0,
        totalAmount: Number(grandTotal),
        paidAmount: Number(grandTotal),
        status: 'paid',
        dueDate: invoiceDate.toISOString(),
        notes: notes || '',
      };

      console.log('FINAL INVOICE PAYLOAD:', JSON.stringify(payload, null, 2));

      const response = await API.post('/invoices', payload);
      const invoice = response.data?.data || response.data;

      message.success(`Bill ${invoice.invoiceNumber} saved successfully`);

      if (printAfterSave) {
        navigate(`/invoices/${invoice._id}`, {
          state: { invoice, autoPrint: true },
        });
      } else {
        navigate(`/invoices/${invoice._id}`, {
          state: { invoice },
        });
      }

    } catch (error) {
      console.error('CREATE INVOICE ERROR:', error);
      console.error('SERVER RESPONSE:', error.response?.data);
      message.error(error.response?.data?.message || 'Failed to save bill');
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
            <small>Stock: {record.stock}</small>
          )}
        </div>
      ),
    },
    {
      title: 'Price (₹)',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price) => Number(price || 0).toLocaleString('en-IN'),
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
            onClick={() => decreaseQty(record.product)}
          />
          <span>{record.quantity}</span>
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => increaseQty(record.product)}
          />
        </div>
      ),
    },
    {
      title: 'Total (₹)',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (total) => Number(total || 0).toLocaleString('en-IN'),
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
          onClick={() => deleteItem(record.product)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="billing-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="billing-page">
      <div className="billing-page__header">
        <div>
          <h1>Sales / Billing</h1>
          <p>Create New Bill</p>
        </div>
      </div>

      <div className="billing-layout">
        {/* LEFT SIDE */}
        <Card className="billing-details-card">
          <div className="billing-field">
            <label>Invoice No.</label>
            <Input value={invoiceNumber} readOnly />
          </div>

          <div className="billing-field">
            <label>Date</label>
            <DatePicker
              value={invoiceDate}
              onChange={(date) => setInvoiceDate(date || dayjs())}
              format="DD-MM-YYYY"
              style={{ width: '100%' }}
            />
          </div>

          <div className="billing-field">
            <label>Customer Name</label>
            <Select
              value={customerId}
              onChange={handleCustomerChange}
              options={customerOptions}
              style={{ width: '100%' }}
              placeholder="Select Customer"
              showSearch
              optionFilterProp="label"
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
                      onClick={() => {
                        customerForm.resetFields();
                        setCustomerModal(true);
                      }}
                    >
                      Add New Customer
                    </Button>
                  </div>
                </>
              )}
            />
          </div>

          <div className="billing-field">
            <label>Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="billing-field">
            <label>Notes (Optional)</label>
            <Input.TextArea
              rows={7}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes..."
            />
          </div>
        </Card>

        {/* RIGHT SIDE */}
        <Card className="billing-products-card">
          <div className="billing-products-header">
            <h2>Products</h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openProductSelector}
            >
              Add Product
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="billing-empty">
              <Empty description="No products added" />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openProductSelector}
              >
                Add Product
              </Button>
            </div>
          ) : (
            <Table
              columns={productColumns}
              dataSource={items}
              rowKey="product"
              pagination={false}
              bordered
            />
          )}
        </Card>
      </div>

      {/* SUMMARY */}
      <Card className="billing-summary-card">
        <div className="billing-summary">
          <div className="billing-summary-row">
            <span>Total Items :</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="billing-summary-row">
            <span>Subtotal :</span>
            <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
          </div>

          <div className="billing-summary-row">
            <span>Discount :</span>
            <InputNumber
              min={0}
              max={subtotal}
              precision={2}
              value={discount}
              onChange={(value) => setDiscount(value || 0)}
            />
          </div>

          <div className="billing-summary-grand">
            <span>Grand Total</span>
            <strong>₹{grandTotal.toLocaleString('en-IN')}</strong>
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
          onClick={() => saveBill(true)}
        >
          Save & Print Bill
        </Button>

        <Button
          type="primary"
          className="billing-save"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => saveBill(false)}
        >
          Save Bill
        </Button>

        <Button className="billing-clear" onClick={clearBill}>
          Clear
        </Button>
      </div>

      {/* PRODUCT MODAL */}
      {productModal && (
        <div className="billing-product-modal">
          <div className="billing-product-modal__overlay">
            <div className="billing-product-modal__content">
              <div className="billing-product-modal__header">
                <h2>Add Product</h2>
                <Button onClick={() => setProductModal(false)}>Close</Button>
              </div>

              <Select
                showSearch
                allowClear
                value={selectedProduct?._id || undefined}
                onChange={(id) => {
                  const product = products.find((item) => item._id === id);
                  setSelectedProduct(product || null);
                }}
                optionFilterProp="label"
                placeholder="Search and select product"
                style={{ width: '100%', marginBottom: 20 }}
                getPopupContainer={(triggerNode) => triggerNode.parentElement}
                popupMatchSelectWidth={true}
                options={products.map((product) => ({
                  value: product._id,
                  label: `${product.name} - ₹${getProductPrice(product).toLocaleString('en-IN')}`,
                }))}
                notFoundContent={products.length === 0 ? 'No products available' : 'No matching product'}
              />

              {selectedProduct && (
                <div className="selected-product-preview">
                  <h3>{selectedProduct.name}</h3>
                  <p>
                    Selling Price: <strong>₹{Number(selectedProduct.price || 0).toLocaleString('en-IN')}</strong>
                  </p>
                  {selectedProduct.stock !== undefined && (
                    <p>Available Stock: {selectedProduct.stock}</p>
                  )}
                </div>
              )}

              <div className="billing-product-modal__actions">
                <Button onClick={() => setProductModal(false)}>Cancel</Button>
                <Button type="primary" onClick={addProduct}>
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
      >
        <Form form={customerForm} layout="vertical" onFinish={handleCreateCustomer}>
          <Form.Item
            label="Customer Name"
            name="name"
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" autoFocus />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item label="Company" name="company">
            <Input placeholder="Enter company name" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button
              onClick={() => {
                setCustomerModal(false);
                customerForm.resetFields();
              }}
              disabled={customerSaving}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={customerSaving}>
              Add Customer
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesBilling;