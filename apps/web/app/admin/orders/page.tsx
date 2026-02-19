'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';
import { formatPrice, getStoredCurrency, type CurrencyCode } from '../../../lib/currency';

interface Order {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  customerFirstName?: string;
  customerLastName?: string;
  customerId?: string | null;
  itemsCount: number;
  createdAt: string;
  hasEhdmReceipt?: boolean;
}

interface OrdersResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface OrderExportRow {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  currency: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  customerId: string;
  itemsCount: number;
  createdAt: string;
}

const ORDER_EXPORT_COLUMNS: { key: keyof OrderExportRow; header: string }[] = [
  { key: 'id', header: 'ID' },
  { key: 'number', header: 'Order Number' },
  { key: 'status', header: 'Status' },
  { key: 'paymentStatus', header: 'Payment Status' },
  { key: 'fulfillmentStatus', header: 'Fulfillment Status' },
  { key: 'total', header: 'Total' },
  { key: 'currency', header: 'Currency' },
  { key: 'customerEmail', header: 'Customer Email' },
  { key: 'customerPhone', header: 'Customer Phone' },
  { key: 'customerName', header: 'Customer Name' },
  { key: 'customerId', header: 'Customer ID' },
  { key: 'itemsCount', header: 'Items Count' },
  { key: 'createdAt', header: 'Created At' },
];

const mapOrderToExportRow = (order: Order): OrderExportRow => ({
  id: order.id,
  number: order.number,
  status: order.status,
  paymentStatus: order.paymentStatus,
  fulfillmentStatus: order.fulfillmentStatus,
  total: order.total,
  currency: order.currency,
  customerEmail: order.customerEmail,
  customerPhone: order.customerPhone,
  customerName: [order.customerFirstName, order.customerLastName].filter(Boolean).join(' '),
  customerId: order.customerId || '',
  itemsCount: order.itemsCount,
  createdAt: order.createdAt,
});

const escapeCsvValue = (value: string | number): string => {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const escapeHtml = (value: string | number): string => {
  const str = String(value ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const createOrdersCsvBlob = (orders: Order[]): Blob => {
  const rows = orders.map(mapOrderToExportRow);

  const columnWidths = ORDER_EXPORT_COLUMNS.map((column) => {
    const headerLength = column.header.length;
    const maxDataLength = rows.reduce((max, row) => {
      const value = String(row[column.key] ?? '');
      return Math.max(max, value.length);
    }, 0);
    return Math.max(headerLength, maxDataLength) + 2;
  });

  const formatRow = (row: OrderExportRow | null): string =>
    ORDER_EXPORT_COLUMNS
      .map((column, index) => {
        const raw =
          row === null ? column.header : String(row[column.key] ?? '');
        const value = escapeCsvValue(raw);
        return value.padEnd(columnWidths[index], ' ');
      })
      .join('');

  const headerLine = formatRow(null);
  const bodyLines = rows.map((row) => formatRow(row)).join('\r\n');
  const csv = `${headerLine}\r\n${bodyLines}`;

  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};

const createOrdersExcelBlob = (orders: Order[]): Blob => {
  const rows = orders.map(mapOrderToExportRow);
  const headerRow = `<tr>${ORDER_EXPORT_COLUMNS.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr>`;
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${ORDER_EXPORT_COLUMNS.map((c) => `<td>${escapeHtml(row[c.key] ?? '')}</td>`).join('')}</tr>`,
    )
    .join('');

  const tableHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      table { border-collapse: collapse; }
      th, td { padding: 4px 8px; }
    </style>
  </head>
  <body>
    <table>
      <thead>${headerRow}</thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;

  return new Blob([tableHtml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<OrdersResponse['meta'] | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(new Set());
  const [updatingPaymentStatuses, setUpdatingPaymentStatuses] = useState<Set<string>>(new Set());
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'excel' | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>(getStoredCurrency());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize filters from URL params on mount and when URL changes
  useEffect(() => {
    if (searchParams) {
      const status = searchParams.get('status') || '';
      const paymentStatus = searchParams.get('paymentStatus') || '';
      const search = searchParams.get('search') || '';
      setStatusFilter(status);
      setPaymentStatusFilter(paymentStatus);
      setSearchKeyword(search);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const buildOrdersParams = (pageValue: number, limitValue: number): Record<string, string> => {
    return {
      page: pageValue.toString(),
      limit: limitValue.toString(),
      status: statusFilter || '',
      paymentStatus: paymentStatusFilter || '',
      search: searchKeyword || '',
      sortBy: sortBy || '',
      sortOrder: sortOrder || '',
    };
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📦 [ADMIN] Fetching orders...', { page, statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder });
      
      const response = await apiClient.get<OrdersResponse>('/api/v1/admin/orders', {
        params: buildOrdersParams(page, 20),
      });

      console.log('✅ [ADMIN] Orders fetched:', response);
      setOrders(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, page, statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder]);

  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchAllOrdersForExport = useCallback(async (): Promise<Order[]> => {
    try {
      console.log('📦 [ADMIN] Fetching all orders for export...', {
        statusFilter,
        paymentStatusFilter,
        searchKeyword,
        sortBy,
        sortOrder,
      });

      const limit = 100;
      const firstResponse = await apiClient.get<OrdersResponse>('/api/v1/admin/orders', {
        params: buildOrdersParams(1, limit),
      });

      let allOrders: Order[] = firstResponse.data || [];
      const metaInfo = firstResponse.meta;

      if (metaInfo && metaInfo.totalPages > 1) {
        const pagePromises: Promise<OrdersResponse>[] = [];
        for (let p = 2; p <= metaInfo.totalPages; p++) {
          pagePromises.push(
            apiClient.get<OrdersResponse>('/api/v1/admin/orders', {
              params: buildOrdersParams(p, limit),
            }),
          );
        }

        const otherPages = await Promise.all(pagePromises);
        otherPages.forEach((resp) => {
          if (resp.data && Array.isArray(resp.data)) {
            allOrders = allOrders.concat(resp.data);
          }
        });
      }

      // Apply same filters on frontend for extra safety
      const filtered = allOrders.filter((order) => {
        if (statusFilter && order.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
        if (
          paymentStatusFilter &&
          order.paymentStatus.toLowerCase() !== paymentStatusFilter.toLowerCase()
        ) {
          return false;
        }
        if (searchKeyword.trim()) {
          const keyword = searchKeyword.toLowerCase().trim();
          const searchableText = [
            order.number,
            order.customerEmail,
            order.customerPhone,
            order.customerFirstName,
            order.customerLastName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!searchableText.includes(keyword)) {
            return false;
          }
        }
        return true;
      });

      console.log('✅ [ADMIN] All orders loaded for export (after filters):', filtered.length);
      return filtered;
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching orders for export:', err);
      alert(t('admin.orders.failedToDelete')); // generic error message reuse
      return [];
    }
  }, [statusFilter, paymentStatusFilter, searchKeyword, sortBy, sortOrder, t]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (orders.length === 0) return;
    setSelectedIds(prev => {
      const allIds = orders.map(o => o.id);
      const hasAll = allIds.every(id => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page when sorting changes
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('admin.orders.deleteConfirm').replace('{count}', selectedIds.size.toString()))) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      console.log('🗑️ [ADMIN] Starting bulk delete for orders:', ids);
      
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          try {
            const response = await apiClient.delete(`/api/v1/admin/orders/${id}`);
            console.log('✅ [ADMIN] Order deleted successfully:', id, response);
            return { id, success: true };
          } catch (error: any) {
            console.error('❌ [ADMIN] Failed to delete order:', id, error);
            return { id, success: false, error: error.message || t('admin.common.unknownErrorFallback') };
          }
        })
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
      
      console.log('📊 [ADMIN] Bulk delete results:', {
        total: ids.length,
        successful: successful.length,
        failed: failed.length,
      });
      
      setSelectedIds(new Set());
      await fetchOrders();
      
      if (failed.length > 0) {
        const failedIds = failed.map(r => 
          r.status === 'fulfilled' ? r.value.id : 'unknown'
        );
        alert(t('admin.orders.bulkDeleteFailed').replace('{success}', successful.length.toString()).replace('{total}', ids.length.toString()).replace('{failed}', failedIds.join(', ')));
      } else {
        alert(t('admin.orders.bulkDeleteFinished').replace('{success}', successful.length.toString()).replace('{total}', ids.length.toString()));
      }
    } catch (err) {
      console.error('❌ [ADMIN] Bulk delete orders error:', err);
      alert(t('admin.orders.failedToDelete'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      console.log('📝 [ADMIN] Changing order status:', { orderId, newStatus });
      
      // Add to updating set
      setUpdatingStatuses((prev) => new Set(prev).add(orderId));
      setUpdateMessage(null);

      // Update order status via API
      await apiClient.put(`/api/v1/admin/orders/${orderId}`, {
        status: newStatus,
      });

      console.log('✅ [ADMIN] Order status updated successfully');

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Show success message
      setUpdateMessage({ type: 'success', text: t('admin.orders.statusUpdated') });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('❌ [ADMIN] Error updating order status:', err);
      setUpdateMessage({ 
        type: 'error', 
        text: t('admin.orders.failedToUpdateStatus')
      });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      // Remove from updating set
      setUpdatingStatuses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    try {
      console.log('📝 [ADMIN] Changing order payment status:', { orderId, newPaymentStatus });
      
      // Add to updating set
      setUpdatingPaymentStatuses((prev) => new Set(prev).add(orderId));
      setUpdateMessage(null);

      // Update order payment status via API
      await apiClient.put(`/api/v1/admin/orders/${orderId}`, {
        paymentStatus: newPaymentStatus,
      });

      console.log('✅ [ADMIN] Order payment status updated successfully');

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
        )
      );

      // Show success message
      setUpdateMessage({ type: 'success', text: t('admin.orders.paymentStatusUpdated') });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err) {
      console.error('❌ [ADMIN] Error updating order payment status:', err);
      setUpdateMessage({ 
        type: 'error', 
        text: t('admin.orders.failedToUpdatePaymentStatus')
      });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      // Remove from updating set
      setUpdatingPaymentStatuses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (exporting) return;
    setExporting(format);
    try {
      const allOrders = await fetchAllOrdersForExport();
      if (!allOrders.length) {
        alert(t('admin.orders.noOrders'));
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'csv') {
        const blob = createOrdersCsvBlob(allOrders);
        downloadBlob(blob, `orders-${timestamp}.csv`);
      } else {
        const blob = createOrdersExcelBlob(allOrders);
        downloadBlob(blob, `orders-${timestamp}.xls`);
      }
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.orders.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg 
              className="w-5 h-5 transition-transform hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">{t('admin.common.back')}</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.orders.title')}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Filters */}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatusFilter(newStatus);
                setPage(1);
                // Update URL without causing navigation
                const params = new URLSearchParams(searchParams?.toString() || '');
                if (newStatus) {
                  params.set('status', newStatus);
                } else {
                  params.delete('status');
                }
                const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                router.push(newUrl, { scroll: false });
              }}
            >
              <option value="">{t('admin.orders.allStatuses')}</option>
              <option value="pending">{t('admin.orders.pending')}</option>
              <option value="processing">{t('admin.orders.processing')}</option>
              <option value="completed">{t('admin.orders.completed')}</option>
              <option value="cancelled">{t('admin.orders.cancelled')}</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentStatusFilter}
              onChange={(e) => {
                const newPaymentStatus = e.target.value;
                setPaymentStatusFilter(newPaymentStatus);
                setPage(1);
                // Update URL without causing navigation
                const params = new URLSearchParams(searchParams?.toString() || '');
                if (newPaymentStatus) {
                  params.set('paymentStatus', newPaymentStatus);
                } else {
                  params.delete('paymentStatus');
                }
                const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                router.push(newUrl, { scroll: false });
              }}
            >
              <option value="">{t('admin.orders.allPaymentStatuses')}</option>
              <option value="paid">{t('admin.orders.paid')}</option>
              <option value="pending">{t('admin.orders.pendingPayment')}</option>
              <option value="failed">{t('admin.orders.failed')}</option>
              <option value="cancelled">{t('admin.orders.cancelled')}</option>
              <option value="refunded">{t('admin.orders.refunded')}</option>
            </select>
            <input
              type="text"
              placeholder={t('admin.orders.searchPlaceholder') || 'Search orders...'}
              value={searchKeyword}
              onChange={(e) => {
                const newSearch = e.target.value;
                setSearchKeyword(newSearch);
                setPage(1);
                
                // Clear existing timeout
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                
                // Debounce URL update - search after 2 seconds of no typing
                searchTimeoutRef.current = setTimeout(() => {
                  const params = new URLSearchParams(searchParams?.toString() || '');
                  if (newSearch.trim()) {
                    params.set('search', newSearch.trim());
                  } else {
                    params.delete('search');
                  }
                  const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                  router.push(newUrl, { scroll: false });
                }, 2000);
              }}
              onKeyDown={(e) => {
                // Allow Tab key to work normally
                if (e.key === 'Tab') {
                  // Update URL immediately when Tab is pressed
                  if (searchTimeoutRef.current) {
                    clearTimeout(searchTimeoutRef.current);
                  }
                  const params = new URLSearchParams(searchParams?.toString() || '');
                  if (searchKeyword.trim()) {
                    params.set('search', searchKeyword.trim());
                  } else {
                    params.delete('search');
                  }
                  const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                  router.push(newUrl, { scroll: false });
                }
              }}
              onBlur={() => {
                // Update URL when input loses focus
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                const params = new URLSearchParams(searchParams?.toString() || '');
                if (searchKeyword.trim()) {
                  params.set('search', searchKeyword.trim());
                } else {
                  params.delete('search');
                }
                const newUrl = params.toString() ? `/admin/orders?${params.toString()}` : '/admin/orders';
                router.push(newUrl, { scroll: false });
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
            />
            {updateMessage && (
              <div
                className={`px-4 py-2 rounded-md text-sm ${
                  updateMessage.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {updateMessage.text}
              </div>
            )}
          </div>
        </Card>

        {/* Selection Controls */}
        {selectedIds.size > 0 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('admin.orders.selectedOrders').replace('{count}', selectedIds.size.toString())}
              </div>
              <ProductPageButton
                variant="outline"
                className="px-4 py-2 text-sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? t('admin.orders.deleting') : t('admin.orders.deleteSelected')}
              </ProductPageButton>
            </div>
          </Card>
        )}

        {/* Orders Table */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('admin.orders.loadingOrders')}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('admin.orders.noOrders')}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                {meta && (
                  <div className="text-sm text-gray-600">
                    {t('admin.orders.totalOrders') || 'Total orders'}:{' '}
                    <span className="font-medium">{meta.total}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <ProductPageButton
                    variant="outline"
                    className="px-3 py-1 text-xs"
                    onClick={() => handleExport('csv')}
                    disabled={exporting !== null}
                  >
                    {exporting === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
                  </ProductPageButton>
                  <ProductPageButton
                    variant="outline"
                    className="px-3 py-1 text-xs"
                    onClick={() => handleExport('excel')}
                    disabled={exporting !== null}
                  >
                    {exporting === 'excel' ? 'Exporting Excel...' : 'Export Excel'}
                  </ProductPageButton>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={t('admin.orders.selectAllOrders')}
                          checked={orders.length > 0 && orders.every(o => selectedIds.has(o.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.orderNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.customer')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center gap-1">
                          {t('admin.orders.total')}
                          <div className="flex flex-col">
                            <svg 
                              className={`w-3 h-3 ${sortBy === 'total' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <svg 
                              className={`w-3 h-3 -mt-1 ${sortBy === 'total' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.items')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.orders.payment')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" title={t('admin.orders.invoiceTitle')}>
                        {t('admin.orders.invoice')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          {t('admin.orders.date')}
                          <div className="flex flex-col">
                            <svg 
                              className={`w-3 h-3 ${sortBy === 'createdAt' && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <svg 
                              className={`w-3 h-3 -mt-1 ${sortBy === 'createdAt' && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            aria-label={t('admin.orders.selectOrder').replace('{number}', order.number)}
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleSelect(order.id)}
                          />
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                        >
                          <div className="text-sm font-medium text-gray-900 text-blue-600 hover:text-blue-800">{order.number}</div>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {[order.customerFirstName, order.customerLastName].filter(Boolean).join(' ') || t('admin.orders.unknownCustomer')}
                          </div>
                          {order.customerPhone && (
                            <div className="text-sm text-gray-500">{order.customerPhone}</div>
                          )}
                          <div className="mt-1 text-xs text-blue-600">{t('admin.orders.viewOrderDetails')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(order.total, order.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.itemsCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {updatingStatuses.has(order.id) ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                <span className="text-xs text-gray-500">{t('admin.orders.updating')}</span>
                              </div>
                            ) : (
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`px-2 py-1 text-xs font-medium rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getStatusColor(order.status)}`}
                              >
                                <option value="pending">{t('admin.orders.pending')}</option>
                                <option value="processing">{t('admin.orders.processing')}</option>
                                <option value="completed">{t('admin.orders.completed')}</option>
                                <option value="cancelled">{t('admin.orders.cancelled')}</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {updatingPaymentStatuses.has(order.id) ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                <span className="text-xs text-gray-500">{t('admin.orders.updating')}</span>
                              </div>
                            ) : (
                              <select
                                value={order.paymentStatus}
                                onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                                className={`px-2 py-1 text-xs font-medium rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${getPaymentStatusColor(order.paymentStatus)}`}
                              >
                                <option value="paid">{t('admin.orders.paid')}</option>
                                <option value="pending">{t('admin.orders.pendingPayment')}</option>
                                <option value="failed">{t('admin.orders.failed')}</option>
                                <option value="cancelled">{t('admin.orders.cancelled')}</option>
                                <option value="refunded">{t('admin.orders.refunded')}</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" title={order.hasEhdmReceipt ? t('admin.orders.invoiceCreated') : t('admin.orders.invoiceNotCreated')}>
                          {order.hasEhdmReceipt ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700" aria-label={t('admin.orders.invoiceCreated')}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400" aria-label={t('admin.orders.invoiceNotCreated')}>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    {t('admin.orders.showingPage').replace('{page}', meta.page.toString()).replace('{totalPages}', meta.totalPages.toString()).replace('{total}', meta.total.toString())}
                  </div>
                  <div className="flex items-center gap-1">
                    <ProductPageButton
                      variant="outline"
                      className="px-3 py-1.5 text-sm shrink-0"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t('admin.orders.previous')}
                    </ProductPageButton>
                    <div className="flex items-center gap-0.5 mx-1">
                      {(() => {
                        const totalPages = meta.totalPages;
                        const current = page;
                        const maxVisible = 5;
                        let from = Math.max(1, current - Math.floor(maxVisible / 2));
                        let to = Math.min(totalPages, from + maxVisible - 1);
                        if (to - from + 1 < maxVisible) {
                          from = Math.max(1, to - maxVisible + 1);
                        }
                        const pages: (number | 'ellipsis')[] = [];
                        if (from > 1) {
                          pages.push(1);
                          if (from > 2) pages.push('ellipsis');
                        }
                        for (let i = from; i <= to; i++) pages.push(i);
                        if (to < totalPages) {
                          if (to < totalPages - 1) pages.push('ellipsis');
                          pages.push(totalPages);
                        }
                        return pages.map((p, i) =>
                          p === 'ellipsis' ? (
                            <span key={`e-${i}`} className="px-2 text-gray-400">…</span>
                          ) : (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPage(p)}
                              className={`min-w-[2rem] px-2 py-1.5 text-sm rounded-md transition-colors ${
                                p === current
                                  ? 'bg-gray-900 text-white font-medium'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        );
                      })()}
                    </div>
                    <ProductPageButton
                      variant="outline"
                      className="px-3 py-1.5 text-sm shrink-0"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >
                      {t('admin.orders.next')}
                    </ProductPageButton>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

