const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatPrice = (value) => money.format(Number(value) || 0);
export const formatDate = (value) => (value ? day.format(new Date(value)) : '');

// Orders and issues have long Mongo ids; show the tail, which is what support will quote.
export const shortId = (id) => `#${String(id).slice(-6).toUpperCase()}`;

export const ORDER_STEPS = ['processing', 'shipped', 'delivered'];
export const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];
export const ISSUE_STATUSES = ['open', 'in-progress', 'resolved', 'closed'];
export const ROLES = ['customer', 'supplier', 'support', 'admin'];

const STATUS_TEXT = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  open: 'Open',
  'in-progress': 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
  customer: 'Customer',
  supplier: 'Supplier',
  support: 'Support',
  admin: 'Admin',
};

export const statusText = (s) => STATUS_TEXT[s] || s;
