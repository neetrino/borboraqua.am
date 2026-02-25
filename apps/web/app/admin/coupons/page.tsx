'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import { AdminMenuDrawer, getAdminMenuTABS } from '@/components/icons/global/global';
import { ProductPageButton } from '@/components/icons/global/globalMobile';

interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  roles?: string[];
}

type CouponStatus = 'used' | 'expired' | 'not_used';

interface CouponItem {
  id: string;
  name: string;
  code: string;
  expiresAt: string;
  quantity: number;
  remainingQuantity: number;
  isActive: boolean;
  status: CouponStatus;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  singleUse: boolean;
  assignments: Array<{ id: string; userId: string; usedAt: string | null; user: AdminUser }>;
  redemptions: Array<{ id: string; discountAmount: number; redeemedAt: string; user: AdminUser; order: { number: string } }>;
  userIds?: string[];
}

interface CouponsResponse {
  data: CouponItem[];
}

interface UsersResponse {
  data: AdminUser[];
}

export default function AdminCouponsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const adminTabs = getAdminMenuTABS(t);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUserSelectionOpen, setIsUserSelectionOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [newCoupon, setNewCoupon] = useState({
    name: '',
    code: '',
    expiresAt: '',
    quantity: 1,
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: 10,
    singleUse: true,
    isActive: true,
    userIds: [] as string[],
  });

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/admin');
    }
  }, [isLoading, isLoggedIn, isAdmin, router]);

  // Disable body scroll and hide header when modal is open
  useEffect(() => {
    const isModalOpen = showCreateModal || editingCoupon;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [showCreateModal, editingCoupon]);

  async function fetchData() {
    try {
      setLoading(true);
      const [couponRes, userRes] = await Promise.all([
        apiClient.get<CouponsResponse>('/api/v1/admin/coupons'),
        apiClient.get<UsersResponse>('/api/v1/admin/users'),
      ]);
      setCoupons(couponRes.data || []);
      setUsers(userRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      void fetchData();
    }
  }, [isLoading, isLoggedIn, isAdmin]);

  const createCoupon = async () => {
    // Frontend validation
    if (!newCoupon.name?.trim()) {
      setError(t('admin.coupons.errors.nameRequired') || 'Coupon name is required');
      return;
    }
    if (!newCoupon.code?.trim()) {
      setError(t('admin.coupons.errors.codeRequired') || 'Coupon code is required');
      return;
    }
    if (!newCoupon.expiresAt) {
      setError(t('admin.coupons.errors.expiresAtRequired') || 'Expiration date is required');
      return;
    }
    if (!Number.isFinite(newCoupon.quantity) || newCoupon.quantity <= 0) {
      setError(t('admin.coupons.errors.quantityInvalid') || 'Quantity must be greater than 0');
      return;
    }
    if (!Number.isFinite(newCoupon.discountValue) || newCoupon.discountValue <= 0) {
      setError(t('admin.coupons.errors.discountInvalid') || 'Discount must be greater than 0');
      return;
    }
    if (newCoupon.discountType === 'PERCENT' && newCoupon.discountValue > 100) {
      setError(t('admin.coupons.errors.discountPercentTooHigh') || 'Percent discount cannot exceed 100%');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await apiClient.post('/api/v1/admin/coupons', newCoupon);
      setNewCoupon({
        name: '',
        code: '',
        expiresAt: '',
        quantity: 1,
        discountType: 'PERCENT',
        discountValue: 10,
        singleUse: true,
        isActive: true,
        userIds: [],
      });
      setShowCreateModal(false);
      setIsUserSelectionOpen(false);
      setUserSearch('');
      setUserRoleFilter('all');
      await fetchData();
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail || e.message || t('admin.coupons.errors.createFailed') || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setNewCoupon((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }));
  };

  const selectAllUsers = () => {
    const filtered = getFilteredUsers();
    setNewCoupon((prev) => ({
      ...prev,
      userIds: filtered.map((u) => u.id),
    }));
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by role
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter((user) => {
        if (userRoleFilter === 'admin') {
          return user.roles?.includes('admin');
        }
        return user.roles?.includes('customer') || (!user.roles || user.roles.length === 0);
      });
    }

    // Filter by search
    if (userSearch.trim()) {
      const searchLower = userSearch.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const firstName = (user.firstName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        return email.includes(searchLower) || phone.includes(searchLower) || firstName.includes(searchLower) || lastName.includes(searchLower);
      });
    }

    return filtered;
  };

  const deselectAllUsers = () => {
    setNewCoupon((prev) => ({
      ...prev,
      userIds: [],
    }));
  };

  const toggleUserSelectionForEdit = (userId: string) => {
    if (!editingCoupon) return;
    setEditingCoupon({
      ...editingCoupon,
      userIds: (editingCoupon.userIds || []).includes(userId)
        ? (editingCoupon.userIds || []).filter((id) => id !== userId)
        : [...(editingCoupon.userIds || []), userId],
    });
  };

  const selectAllUsersForEdit = () => {
    if (!editingCoupon) return;
    const filtered = getFilteredUsers();
    setEditingCoupon({
      ...editingCoupon,
      userIds: filtered.map((u) => u.id),
    });
  };

  const deselectAllUsersForEdit = () => {
    if (!editingCoupon) return;
    setEditingCoupon({
      ...editingCoupon,
      userIds: [],
    });
  };


  const handleEdit = (coupon: CouponItem) => {
    setEditingCoupon({
      ...coupon,
      userIds: coupon.assignments.map((a) => a.userId),
    });
    setIsUserSelectionOpen(false);
    setUserSearch('');
    setUserRoleFilter('all');
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;

    setSaving(true);
    setError(null);
    try {
      await apiClient.patch(`/api/v1/admin/coupons/${editingCoupon.id}`, {
        name: editingCoupon.name,
        code: editingCoupon.code,
        expiresAt: editingCoupon.expiresAt,
        quantity: editingCoupon.quantity,
        discountType: editingCoupon.discountType,
        discountValue: editingCoupon.discountValue,
        singleUse: editingCoupon.singleUse,
        isActive: editingCoupon.isActive,
        userIds: editingCoupon.userIds || [],
      });
      setEditingCoupon(null);
      await fetchData();
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail || e.message || t('admin.coupons.errors.updateFailed') || 'Failed to update coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm(t('admin.coupons.deleteConfirm') || 'Are you sure you want to delete this coupon?')) {
      return;
    }

    setDeletingId(couponId);
    setError(null);
    try {
      await apiClient.delete(`/api/v1/admin/coupons/${couponId}`);
      await fetchData();
    } catch (err: unknown) {
      const e = err as { detail?: string; message?: string };
      setError(e.detail || e.message || t('admin.coupons.errors.deleteFailed') || 'Failed to delete coupon');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('admin.common.loading')}</div>;
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body.modal-open > div > div > div:first-child,
        body.modal-open header,
        body.modal-open [class*="Header"]:not([class*="Modal"]):not([class*="modal"]),
        body.modal-open [class*="TopHeaderBar"] {
          display: none !important;
        }
        body.modal-open div[class*="h-\\[80px\\]"],
        body.modal-open div[class*="h-\\[70px\\]"],
        body.modal-open div[class*="h-\\[60px\\]"] {
          display: none !important;
        }
      `}} />
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('admin.coupons.title')}</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden mb-6">
            <AdminMenuDrawer tabs={adminTabs} currentPath={pathname || '/admin/coupons'} />
          </div>
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
              {adminTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => router.push(tab.path)}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium ${pathname?.startsWith(tab.path) ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{t('admin.coupons.listTitle')}</h2>
                <ProductPageButton onClick={() => setShowCreateModal(true)}>
                  {t('admin.coupons.create')}
                </ProductPageButton>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-xl font-semibold mb-4">{t('admin.coupons.listTitle')}</h2>
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{coupon.name} ({coupon.code})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(coupon)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          aria-label={t('admin.coupons.edit')}
                          title={t('admin.coupons.edit')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon.id)}
                          disabled={deletingId === coupon.id}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          aria-label={t('admin.coupons.delete')}
                          title={t('admin.coupons.delete')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            coupon.status === 'used'
                              ? 'bg-gray-200 text-gray-700'
                              : coupon.status === 'expired'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                          }`}
                          aria-label={t(`admin.coupons.status.${coupon.status}`)}
                        >
                          {t(`admin.coupons.status.${coupon.status}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {!coupons.length && <p className="text-gray-500">{t('admin.coupons.empty')}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('admin.coupons.createTitle')}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                  setIsUserSelectionOpen(false);
                  setUserSearch('');
                  setUserRoleFilter('all');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.name')}</label>
                  <input className="w-full border rounded px-3 py-2" placeholder={t('admin.coupons.fields.name')} value={newCoupon.name} onChange={(e) => { setNewCoupon((p) => ({ ...p, name: e.target.value })); setError(null); }} required />
                  <p className="text-xs text-gray-500">{t('admin.coupons.fields.nameDescription')}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.code')}</label>
                  <input className="w-full border rounded px-3 py-2" placeholder={t('admin.coupons.fields.code')} value={newCoupon.code} onChange={(e) => { setNewCoupon((p) => ({ ...p, code: e.target.value })); setError(null); }} required />
                  <p className="text-xs text-gray-500">{t('admin.coupons.fields.codeDescription')}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.expiresAt')}</label>
                  <input className="w-full border rounded px-3 py-2" type="datetime-local" value={newCoupon.expiresAt} onChange={(e) => { setNewCoupon((p) => ({ ...p, expiresAt: e.target.value })); setError(null); }} required />
                  <p className="text-xs text-gray-500">{t('admin.coupons.fields.expiresAtDescription')}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.quantity')}</label>
                  <input className="w-full border rounded px-3 py-2" type="number" min={1} value={newCoupon.quantity} onChange={(e) => setNewCoupon((p) => ({ ...p, quantity: Number(e.target.value) }))} />
                  <p className="text-xs text-gray-500">{t('admin.coupons.fields.quantityDescription')}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.discountValue')}</label>
                  <div className="flex items-center gap-2">
                    <input className="w-full border rounded px-3 py-2" type="number" min={0} max={100} value={newCoupon.discountValue} onChange={(e) => setNewCoupon((p) => ({ ...p, discountValue: Number(e.target.value) }))} />
                    <span className="text-gray-600 whitespace-nowrap">%</span>
                  </div>
                  <p className="text-xs text-gray-500">{t('admin.coupons.fields.discountValueDescription')}</p>
                </div>
              </div>
              <div className="flex gap-5 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={newCoupon.singleUse} onChange={(e) => setNewCoupon((p) => ({ ...p, singleUse: e.target.checked }))} />{t('admin.coupons.fields.singleUse')}</label>
              </div>
              <div className="border rounded-lg bg-gray-50">
                <button
                  type="button"
                  onClick={() => setIsUserSelectionOpen(!isUserSelectionOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.selectUsers')}</label>
                    {newCoupon.userIds.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {newCoupon.userIds.length}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${isUserSelectionOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isUserSelectionOpen && (
                  <div className="p-4 space-y-3 border-t">
                    <p className="text-xs text-gray-500">{t('admin.coupons.fields.selectUsersDescription')}</p>
                    
                    {/* Search */}
                    <div>
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder={t('admin.coupons.searchUsers') || 'Search users...'}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>

                    {/* Role Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {t('admin.users.adminCustomer') || 'Filter:'}
                      </span>
                      <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setUserRoleFilter('all')}
                          className={`px-3 py-1 rounded-full transition-all ${
                            userRoleFilter === 'all'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {t('admin.users.all') || 'All'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserRoleFilter('customer')}
                          className={`px-3 py-1 rounded-full transition-all ${
                            userRoleFilter === 'customer'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {t('admin.users.customers') || 'Customers'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserRoleFilter('admin')}
                          className={`px-3 py-1 rounded-full transition-all ${
                            userRoleFilter === 'admin'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {t('admin.users.admins') || 'Admins'}
                        </button>
                      </div>
                    </div>

                    {/* Select All / Deselect All */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllUsers}
                        className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800"
                      >
                        {t('admin.coupons.selectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllUsers}
                        className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
                      >
                        {t('admin.coupons.deselectAll')}
                      </button>
                    </div>

                    {/* Users List */}
                    <div className="max-h-48 overflow-y-auto border rounded bg-white p-3">
                      {getFilteredUsers().length === 0 ? (
                        <p className="text-sm text-gray-500">{t('admin.coupons.noUsers')}</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {getFilteredUsers().map((user) => {
                            const userLabel = user.email || user.phone || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.id;
                            return (
                              <label key={user.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={newCoupon.userIds.includes(user.id)}
                                  onChange={() => toggleUserSelection(user.id)}
                                  className="cursor-pointer"
                                />
                                <span className="truncate">{userLabel}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {newCoupon.userIds.length > 0 && (
                      <p className="text-xs text-gray-600">
                        {t('admin.coupons.selectedUsersCount').replace('{count}', String(newCoupon.userIds.length))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            <div className="flex gap-2 mt-6">
              <ProductPageButton onClick={createCoupon} disabled={saving}>
                {saving ? t('admin.common.saving') : t('admin.coupons.create')}
              </ProductPageButton>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError(null);
                  setIsUserSelectionOpen(false);
                  setUserSearch('');
                  setUserRoleFilter('all');
                }}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                {t('admin.coupons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{t('admin.coupons.editTitle')}</h2>
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setIsUserSelectionOpen(false);
                  setUserSearch('');
                  setUserRoleFilter('all');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.name')}</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={editingCoupon.name}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.code')}</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  value={editingCoupon.code}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.expiresAt')}</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="datetime-local"
                  value={editingCoupon.expiresAt ? new Date(editingCoupon.expiresAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, expiresAt: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.quantity')}</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  type="number"
                  min={1}
                  value={editingCoupon.quantity}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, quantity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.discountValue')}</label>
                <div className="flex items-center gap-2">
                  <input
                    className="w-full border rounded px-3 py-2"
                    type="number"
                    min={0}
                    max={100}
                    value={editingCoupon.discountValue}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discountValue: Number(e.target.value) })}
                  />
                  <span className="text-gray-600 whitespace-nowrap">%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-5 text-sm mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingCoupon.singleUse}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, singleUse: e.target.checked })}
                />
                {t('admin.coupons.fields.singleUse')}
              </label>
            </div>
            <div className="border rounded-lg bg-gray-50 mt-4">
              <button
                type="button"
                onClick={() => setIsUserSelectionOpen(!isUserSelectionOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">{t('admin.coupons.fields.selectUsers')}</label>
                  {(editingCoupon.userIds || []).length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {(editingCoupon.userIds || []).length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isUserSelectionOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isUserSelectionOpen && (
                <div className="p-4 space-y-3 border-t">
                  <p className="text-xs text-gray-500">{t('admin.coupons.fields.selectUsersDescription')}</p>
                  
                  {/* Search */}
                  <div>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={t('admin.coupons.searchUsers') || 'Search users...'}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>

                  {/* Role Filter */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('admin.users.adminCustomer') || 'Filter:'}
                    </span>
                    <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('all')}
                        className={`px-3 py-1 rounded-full transition-all ${
                          userRoleFilter === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {t('admin.users.all') || 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('customer')}
                        className={`px-3 py-1 rounded-full transition-all ${
                          userRoleFilter === 'customer'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {t('admin.users.customers') || 'Customers'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('admin')}
                        className={`px-3 py-1 rounded-full transition-all ${
                          userRoleFilter === 'admin'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {t('admin.users.admins') || 'Admins'}
                      </button>
                    </div>
                  </div>

                  {/* Select All / Deselect All */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllUsersForEdit}
                      className="text-xs px-2 py-1 text-blue-600 hover:text-blue-800"
                    >
                      {t('admin.coupons.selectAll')}
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllUsersForEdit}
                      className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
                    >
                      {t('admin.coupons.deselectAll')}
                    </button>
                  </div>

                  {/* Users List */}
                  <div className="max-h-48 overflow-y-auto border rounded bg-white p-3">
                    {getFilteredUsers().length === 0 ? (
                      <p className="text-sm text-gray-500">{t('admin.coupons.noUsers')}</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {getFilteredUsers().map((user) => {
                          const userLabel = user.email || user.phone || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.id;
                          return (
                            <label key={user.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={(editingCoupon.userIds || []).includes(user.id)}
                                onChange={() => toggleUserSelectionForEdit(user.id)}
                                className="cursor-pointer"
                              />
                              <span className="truncate">{userLabel}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {(editingCoupon.userIds || []).length > 0 && (
                    <p className="text-xs text-gray-600">
                      {t('admin.coupons.selectedUsersCount').replace('{count}', String((editingCoupon.userIds || []).length))}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <ProductPageButton onClick={handleUpdateCoupon} disabled={saving}>
                {saving ? t('admin.common.saving') : t('admin.coupons.update')}
              </ProductPageButton>
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setIsUserSelectionOpen(false);
                  setUserSearch('');
                  setUserRoleFilter('all');
                }}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                {t('admin.coupons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

