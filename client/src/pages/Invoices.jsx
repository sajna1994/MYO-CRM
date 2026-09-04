import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';

import {
  CalendarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  MinusOutlined,
  PlusOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  CloseOutlined,
  PlusOutlined as AddOutlined,
  SaveOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import API from '../api/axios';

import '../styles/Invoices.css';

const { Title, Text } = Typography;

const Invoices = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(dayjs());

  const [customerId, setCustomerId] = useState(null);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([]);

  const [discount, setDiscount] = useState(0);

  const [previewInvoice, setPreviewInvoice] = useState(null);

  // --------------------------------------------------
  // Fetch customers + products
  // --------------------------------------------------

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);

    try {
      const res = await API.get('/customers?limit=100');
      setCustomers(res.data.data || []);
    } catch (error) {
      message.error('Failed to fetch customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);

    try {
      const res = await API.get('/products?limit=100');

      setProducts(res.data.data || []);
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  };

 const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  setInvoiceNumber(`INV-${year}-${random}`);
};

  // --------------------------------------------------
  // Customer
  // --------------------------------------------------

  const handleCustomerChange = (id) => {
    setCustomerId(id);

    const customer = customers.find(
      (item) => item._id === id
    );

    setPhone(customer?.phone || '');
  };

  // --------------------------------------------------
  // Product
  // --------------------------------------------------

  const getProductPrice = (product) => {
    return (
      product?.sellingPrice ??
      product?.salePrice ??
      product?.price ??
      product?.unitPrice ??
      0
    );
  };

  const addProduct = (productId) => {
    if (!productId) return;

    const product = products.find(
      (item) => item._id === productId
    );

    if (!product) return;

    const existing = items.find(
      (item) => item.productId === productId
    );

    if (existing) {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );

      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: product._id,
        description: product.name,
        quantity: 1,
        unitPrice: getProductPrice(product),
      },
    ]);
  };

  const increaseQuantity = (index) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (index) => {
    setItems((prev) =>
      prev
        .map((item, i) =>
          i === index
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeProduct = (index) => {
    setItems((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // --------------------------------------------------
  // Calculations
  // --------------------------------------------------

  const totalItems = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );
  }, [items]);

  const grandTotal = Math.max(
    0,
    subtotal - Number(discount || 0)
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  // --------------------------------------------------
  // Save invoice
  // --------------------------------------------------

const saveInvoice = async (shouldPreview = false) => {
  if (!customerId) {
    message.warning('Please select a customer');
    return;
  }

  if (items.length === 0) {
    message.warning('Please add at least one product');
    return;
  }

  setSaving(true);

  try {
    const payload = {
      invoiceNumber,

      invoiceDate: invoiceDate.toISOString(),

      customer: customerId,

      phone,

      items: items.map((item) => ({
        product: item.productId,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total:
          Number(item.quantity) *
          Number(item.unitPrice),
      })),

      discount: Number(discount || 0),

      totalAmount: Number(grandTotal),

      status: 'unpaid',

      dueDate: invoiceDate.toISOString(),

      notes: notes || '',
    };

    console.log('INVOICE PAYLOAD:', payload);

    const res = await API.post(
      '/invoices',
      payload
    );

    const savedInvoice =
      res.data?.data || res.data;

    message.success(
      'Bill created successfully'
    );

    if (shouldPreview) {
      const customer = customers.find(
        (item) => item._id === customerId
      );

      setPreviewInvoice({
        ...savedInvoice,

        customer:
          savedInvoice.customer || customer,

        phone:
          savedInvoice.phone || phone,

        invoiceDate:
          savedInvoice.invoiceDate ||
          invoiceDate.toISOString(),

        discount:
          Number(discount || 0),
      });
    } else {
      clearBill();
    }

  } catch (error) {
    console.error(
      'CREATE INVOICE ERROR:',
      error.response?.data || error
    );

    message.error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Failed to create bill'
    );
  } finally {
    setSaving(false);
  }
};

  // --------------------------------------------------
  // Clear
  // --------------------------------------------------

  const clearBill = () => {
    setCustomerId(null);
    setPhone('');
    setNotes('');
    setItems([]);
    setDiscount(0);
    setInvoiceDate(dayjs());
  };

  // --------------------------------------------------
  // Print
  // --------------------------------------------------

  const printInvoice = () => {
    window.print();
  };

  // --------------------------------------------------
  // Download PDF
  // --------------------------------------------------

  const downloadPDF = () => {
    message.info(
      'Use the browser print dialog and select "Save as PDF".'
    );

    window.print();
  };

  // --------------------------------------------------
  // Share
  // --------------------------------------------------

  const shareInvoice = async () => {
    if (!previewInvoice) return;

    const shareData = {
      title: `Invoice ${previewInvoice.invoiceNumber}`,
      text: `Invoice ${previewInvoice.invoiceNumber} - ${formatCurrency(
        previewInvoice.totalAmount
      )}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${previewInvoice.invoiceNumber} - ${formatCurrency(
            previewInvoice.totalAmount
          )}`
        );

        message.success('Invoice details copied');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // --------------------------------------------------
  // Preview
  // --------------------------------------------------

  if (previewInvoice) {
    const customer =
      previewInvoice.customer || {};

    const previewItems =
      previewInvoice.items || [];

    const previewSubtotal = previewItems.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.unitPrice || 0),
      0
    );

    const previewDiscount =
      Number(previewInvoice.discount || 0);

    const previewGrandTotal =
      Number(previewInvoice.totalAmount || 0);

    return (
      <div className="invoice-preview-page">
        <div className="invoice-preview-header">
          <Title level={2}>
            Billing / Invoice Preview
          </Title>
        </div>

        <div className="invoice-preview-layout">

          {/* MAIN INVOICE */}
          <Card className="invoice-paper">
            <div className="invoice-company-header">

              <div className="company-logo">
                MYO
              </div>

              <div className="company-info">
                <h1>MYO FITNESS STUDIO</h1>

                <div>
                  Malappuram - Kavungal
                </div>

                <div>
                  9495103460
                </div>
              </div>

              <div className="invoice-meta">
                <div>
                  <strong>Invoice No.</strong>
                  <span>
                    {previewInvoice.invoiceNumber}
                  </span>
                </div>

                <div>
                  <strong>Date</strong>
                  <span>
                    {dayjs(
                      previewInvoice.invoiceDate ||
                        previewInvoice.createdAt
                    ).format('DD-MM-YYYY')}
                  </span>
                </div>

                <div>
                  <strong>Cashier</strong>
                  <span>Admin</span>
                </div>
              </div>
            </div>

            {/* CUSTOMER */}
            <div className="customer-summary">
              <div>
                <strong>Customer Name :</strong>

                <span>
                  {customer.name ||
                    'Walk-in Customer'}
                </span>
              </div>

              <div>
                <strong>Phone :</strong>

                <span>
                  {customer.phone || phone || '-'}
                </span>
              </div>
            </div>

            {/* ITEMS */}
            <div className="preview-table-wrapper">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {previewItems.map(
                    (item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>

                        <td>
                          {item.description}
                        </td>

                        <td>
                          {item.quantity}
                        </td>

                        <td>
                          {formatCurrency(
                            item.unitPrice
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            Number(item.quantity) *
                              Number(
                                item.unitPrice
                              )
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* TOTALS */}
            <div className="invoice-total-area">

              <div className="invoice-small-totals">
                <div>
                  <strong>Total Items :</strong>
                  <span>
                    {previewItems.reduce(
                      (sum, item) =>
                        sum +
                        Number(
                          item.quantity || 0
                        ),
                      0
                    )}
                  </span>
                </div>

                <div>
                  <strong>Subtotal :</strong>
                  <span>
                    {formatCurrency(
                      previewSubtotal
                    )}
                  </span>
                </div>

                <div>
                  <strong>Discount :</strong>
                  <span>
                    {formatCurrency(
                      previewDiscount
                    )}
                  </span>
                </div>
              </div>

              <div className="grand-total-box">
                <strong>Grand Total</strong>

                <span>
                  {formatCurrency(
                    previewGrandTotal
                  )}
                </span>
              </div>
            </div>

            <div className="invoice-thank-you">
              Thank you! Visit Again.
            </div>
          </Card>

          {/* ACTION PANEL */}
          <div className="invoice-actions">

            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={printInvoice}
              className="print-button"
            >
              Print
            </Button>

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadPDF}
              className="pdf-button"
            >
              Download PDF
            </Button>

            <Button
              icon={<ShareAltOutlined />}
              onClick={shareInvoice}
              className="share-button"
            >
              Share
            </Button>

            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                setPreviewInvoice(null);
                clearBill();
              }}
              className="close-button"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // CREATE BILL PAGE
  // --------------------------------------------------

  const productOptions = products.map(
    (product) => ({
      value: product._id,
      label: `${product.name} - ${formatCurrency(
        getProductPrice(product)
      )}`,
    })
  );

  return (
    <div className="billing-page">

      <div className="billing-page-header">
        <Title level={2}>
          Sales / Billing (Create Bill)
        </Title>
      </div>

      <div className="billing-layout">

        {/* LEFT SIDE */}
        <div className="billing-left">

          <div className="form-group">
            <label>Invoice No.</label>

            <Input
              value={invoiceNumber}
              readOnly
            />
          </div>

          <div className="form-group">
            <label>Date</label>

            <DatePicker
              value={invoiceDate}
              onChange={(date) =>
                setInvoiceDate(date)
              }
              format="DD-MM-YYYY"
              suffixIcon={<CalendarOutlined />}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>Customer Name</label>

            <Select
              showSearch
              allowClear
              loading={loadingCustomers}
              placeholder="Walk-in Customer"
              value={customerId}
              onChange={handleCustomerChange}
              optionFilterProp="label"
              options={customers.map(
                (customer) => ({
                  value: customer._id,
                  label: customer.name,
                })
              )}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>

            <Input
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="Phone number"
            />
          </div>

          <div className="form-group notes-group">
            <label>Notes (Optional)</label>

            <Input.TextArea
              rows={6}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Enter notes..."
            />
          </div>

          <div className="billing-buttons">
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              loading={saving}
              onClick={() => saveInvoice(true)}
              className="save-print-button"
            >
              Save & Print Bill
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => saveInvoice(false)}
              className="save-button"
            >
              Save Bill
            </Button>

            <Button
              onClick={clearBill}
              className="clear-button"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="billing-right">

          <div className="billing-product-selector">

            <Select
              showSearch
              loading={loadingProducts}
              placeholder="Select Product"
              optionFilterProp="label"
              options={productOptions}
              onChange={addProduct}
              value={null}
              style={{
                width: 300,
              }}
            />

            <Button
              icon={<AddOutlined />}
              onClick={() => {
                message.info(
                  'Select a product first'
                );
              }}
            >
              Add Product
            </Button>
          </div>

          {/* PRODUCT TABLE */}
          <div className="billing-table-wrapper">

            {items.length === 0 ? (
              <Empty
                description="No products added"
              />
            ) : (
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price (₹)</th>
                    <th>Qty</th>
                    <th>Total (₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (item, index) => (
                      <tr key={index}>

                        <td>
                          <div className="product-name">
                            <span className="product-number">
                              {index + 1}
                            </span>

                            {item.description}
                          </div>
                        </td>

                        <td>
                          {Number(
                            item.unitPrice
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        <td>
                          <div className="quantity-control">

                            <Button
                              size="small"
                              icon={
                                <MinusOutlined />
                              }
                              onClick={() =>
                                decreaseQuantity(
                                  index
                                )
                              }
                            />

                            <span>
                              {item.quantity}
                            </span>

                            <Button
                              size="small"
                              icon={
                                <PlusOutlined />
                              }
                              onClick={() =>
                                increaseQuantity(
                                  index
                                )
                              }
                            />
                          </div>
                        </td>

                        <td>
                          {Number(
                            item.quantity *
                              item.unitPrice
                          ).toLocaleString(
                            'en-IN'
                          )}
                        </td>

                        <td>
                          <Button
                            type="text"
                            danger
                            icon={
                              <DeleteOutlined />
                            }
                            onClick={() =>
                              removeProduct(
                                index
                              )
                            }
                          />
                        </td>

                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* SUMMARY */}
          <div className="billing-summary">

            <div className="summary-row">
              <strong>Total Items :</strong>

              <span>
                {totalItems}
              </span>
            </div>

            <div className="summary-row">
              <strong>Subtotal :</strong>

              <span>
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="summary-row">
              <strong>Discount :</strong>

              <InputNumber
                min={0}
                value={discount}
                onChange={(value) =>
                  setDiscount(value || 0)
                }
                style={{
                  width: 200,
                }}
                prefix="₹"
              />
            </div>

            <div className="summary-divider" />

            <div className="grand-total-row">
              <strong>Grand Total</strong>

              <span>
                {formatCurrency(
                  grandTotal
                )}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoices;