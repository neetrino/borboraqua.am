'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Input } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminMenuDrawer, getAdminMenuTABS } from '../../../components/icons/global/global';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  roles: string[];
  blocked: boolean;
  ordersCount?: number;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UserExportRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string;
  blocked: string;
  ordersCount: number;
  createdAt: string;
}

const USER_EXPORT_COLUMNS: { key: keyof UserExportRow; header: string }[] = [
  { key: 'id', header: 'ID' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'email', header: 'Email' },
  { key: 'phone', header: 'Phone' },
  { key: 'roles', header: 'Roles' },
  { key: 'blocked', header: 'Blocked' },
  { key: 'ordersCount', header: 'Orders Count' },
  { key: 'createdAt', header: 'Created At' },
];

const mapUserToExportRow = (user: User): UserExportRow => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone || '',
  roles: (user.roles || []).join(', '),
  blocked: user.blocked ? 'blocked' : 'active',
  ordersCount: user.ordersCount ?? 0,
  createdAt: user.createdAt,
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

const createUsersCsvBlob = (users: User[]): Blob => {
  const rows = users.map(mapUserToExportRow);
  const header = USER_EXPORT_COLUMNS.map((c) => c.header).join(',');
  const body = rows
    .map((row) =>
      USER_EXPORT_COLUMNS.map((c) => escapeCsvValue(row[c.key])).join(','),
    )
    .join('\r\n');
  const csv = `${header}\r\n${body}`;
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};

const createUsersExcelBlob = (users: User[]): Blob => {
  const rows = users.map(mapUserToExportRow);
  const headerRow = `<tr>${USER_EXPORT_COLUMNS.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')}</tr>`;
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${USER_EXPORT_COLUMNS.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join('')}</tr>`,
    )
    .join('');
  const tableHtml = `<table>${headerRow}${bodyRows}</table>`;
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

export default function UsersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const adminTabs = getAdminMenuTABS(t);
  const currentPath = pathname || '/admin/users';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<UsersResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [exporting, setExporting] = useState<'csv' | 'excel' | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('👥 [ADMIN] Fetching users...', { page, search, roleFilter });
      
      const response = await apiClient.get<UsersResponse>('/api/v1/admin/users', {
        params: {
          page: page.toString(),
          limit: '20',
          search: search || '',
          role: roleFilter === 'all' ? '' : roleFilter,
        },
      });

      console.log('✅ [ADMIN] Users fetched:', response);
      setUsers(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  const fetchAllUsersForExport = useCallback(async (): Promise<User[]> => {
    try {
      console.log('👥 [ADMIN] Fetching all users for export...', { search, roleFilter });
      const limit = 100;
      const firstResponse = await apiClient.get<UsersResponse>('/api/v1/admin/users', {
        params: {
          page: '1',
          limit: limit.toString(),
          search: search || '',
          role: roleFilter === 'all' ? '' : roleFilter,
        },
      });

      let allUsers: User[] = firstResponse.data || [];
      const metaInfo = firstResponse.meta;

      if (metaInfo && metaInfo.totalPages > 1) {
        const pagePromises: Promise<UsersResponse>[] = [];
        for (let p = 2; p <= metaInfo.totalPages; p++) {
          pagePromises.push(
            apiClient.get<UsersResponse>('/api/v1/admin/users', {
              params: {
                page: p.toString(),
                limit: limit.toString(),
                search: search || '',
                role: roleFilter === 'all' ? '' : roleFilter,
              },
            }),
          );
        }

        const otherPages = await Promise.all(pagePromises);
        otherPages.forEach((resp) => {
          if (resp.data && Array.isArray(resp.data)) {
            allUsers = allUsers.concat(resp.data);
          }
        });
      }

      console.log('✅ [ADMIN] All users loaded for export:', allUsers.length);
      return allUsers;
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching all users for export:', err);
      alert('Failed to export users. Please try again.');
      return [];
    }
  }, [search, roleFilter]);

  const handleExport = async (format: 'csv' | 'excel') => {
    if (exporting) return;
    setExporting(format);
    try {
      const allUsers = await fetchAllUsersForExport();
      if (!allUsers.length) {
        alert('No users to export.');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      if (format === 'csv') {
        const blob = createUsersCsvBlob(allUsers);
        downloadBlob(blob, `users-${timestamp}.csv`);
      } else {
        const blob = createUsersExcelBlob(allUsers);
        downloadBlob(blob, `users-${timestamp}.xls`);
      }
    } finally {
      setExporting(null);
    }
  };

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, page, search, roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    // Ընտրում ենք միայն այն օգտատերերին, որոնք տեսանելի են ընթացիկ ֆիլտրով
    const visibleUsers =
      roleFilter === 'all'
        ? users
        : users.filter((u) =>
            roleFilter === 'admin'
              ? u.roles?.includes('admin')
              : u.roles?.includes('customer')
          );

    if (visibleUsers.length === 0) return;

    setSelectedIds((prev) => {
      const allIds = visibleUsers.map((u) => u.id);
      const hasAll = allIds.every((id) => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('admin.users.deleteConfirm').replace('{count}', selectedIds.size.toString()))) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map(id => apiClient.delete(`/api/v1/admin/users/${id}`))
      );
      const failed = results.filter(r => r.status === 'rejected');
      setSelectedIds(new Set());
      await fetchUsers();
      alert(t('admin.users.bulkDeleteFinished').replace('{success}', (ids.length - failed.length).toString()).replace('{total}', ids.length.toString()));
    } catch (err) {
      console.error('❌ [ADMIN] Bulk delete users error:', err);
      alert(t('admin.users.failedToDelete'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleToggleBlocked = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      const newStatus = !currentStatus;
      await apiClient.put(`/api/v1/admin/users/${userId}`, {
        blocked: newStatus,
      });
      
      console.log(`✅ [ADMIN] User ${newStatus ? 'blocked' : 'unblocked'} successfully`);
      
      // Refresh users list
      fetchUsers();
      
      if (newStatus) {
        alert(t('admin.users.userBlocked').replace('{name}', userName));
      } else {
        alert(t('admin.users.userActive').replace('{name}', userName));
      }
    } catch (err: any) {
      console.error('❌ [ADMIN] Error updating user status:', err);
      alert(t('admin.users.errorUpdatingStatus').replace('{message}', err.message || t('admin.common.unknownErrorFallback')));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  // Տեսանելի օգտատերերի filter Admin / Customer ֆիլտրով
  const filteredUsers =
    roleFilter === 'all'
      ? users
      : users.filter((user) =>
          roleFilter === 'admin'
            ? user.roles?.includes('admin')
            : user.roles?.includes('customer')
        );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.users.title')}</h1>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.users.searchPlaceholder')}
                className="flex-1"
              />
              <ProductPageButton type="submit">
                {t('admin.users.search')}
              </ProductPageButton>
            </div>

            {/* Admin / Customer filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('admin.users.adminCustomer')}
              </span>
              <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter('all');
                    setPage(1);
                    console.log('👥 [ADMIN] Role filter changed to: all');
                  }}
                  className={`px-3 py-1 rounded-full transition-all ${
                    roleFilter === 'all'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.users.all')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter('admin');
                    setPage(1);
                    console.log('👥 [ADMIN] Role filter changed to: admin');
                  }}
                  className={`px-3 py-1 rounded-full transition-all ${
                    roleFilter === 'admin'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.users.admins')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleFilter('customer');
                    setPage(1);
                    console.log('👥 [ADMIN] Role filter changed to: customer');
                  }}
                  className={`px-3 py-1 rounded-full transition-all ${
                    roleFilter === 'customer'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t('admin.users.customers')}
                </button>
              </div>
            </div>
          </form>
        </Card>

        {/* Users Table */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('admin.users.loadingUsers')}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('admin.users.noUsers')}</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                {meta && (
                  <div className="text-sm text-gray-600">
                    Total users: <span className="font-medium">{meta.total}</span>
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
                          aria-label={t('admin.users.selectAll')}
                          checked={users.length > 0 && users.every(u => selectedIds.has(u.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.user')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.contact')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.orders')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.roles')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('admin.users.created')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            aria-label={t('admin.users.selectUser').replace('{email}', user.email)}
                            checked={selectedIds.has(user.id)}
                            onChange={() => toggleSelect(user.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.ordersCount ?? 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            {user.roles?.map((role) => (
                              <span
                                key={role}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleBlocked(
                                user.id,
                                user.blocked,
                                `${user.firstName} ${user.lastName}`,
                              )
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              user.blocked
                                ? 'bg-gray-300 focus:ring-gray-400'
                                : 'bg-green-500 focus:ring-green-500'
                            }`}
                            title={user.blocked ? t('admin.users.clickToActivate') : t('admin.users.clickToBlock')}
                            role="switch"
                            aria-checked={!user.blocked}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                user.blocked ? 'translate-x-1' : 'translate-x-6'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {t('admin.users.showingPage').replace('{page}', meta.page.toString()).replace('{totalPages}', meta.totalPages.toString()).replace('{total}', meta.total.toString())}
                  </div>
                  <div className="flex gap-2">
                    <ProductPageButton
                      variant="outline"
                      className="px-4 py-1 text-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t('admin.users.previous')}
                    </ProductPageButton>
                    <ProductPageButton
                      variant="outline"
                      className="px-4 py-1 text-sm"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >
                      {t('admin.users.next')}
                    </ProductPageButton>
                  </div>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {t('admin.users.selectedUsers').replace('{count}', selectedIds.size.toString())}
                </div>
                <ProductPageButton
                  variant="outline"
                  className="px-4 py-2 text-sm"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0 || bulkDeleting}
                >
                  {bulkDeleting ? t('admin.users.deleting') : t('admin.users.deleteSelected')}
                </ProductPageButton>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

