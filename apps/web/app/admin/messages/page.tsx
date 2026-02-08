'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { AdminMenuDrawer, getAdminMenuTABS } from '../../../components/icons/global/global';
import { useTranslation } from '../../../lib/i18n-client';
import { showToast } from '../../../components/Toast';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

function MessagesSection() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📬 [ADMIN] Fetching messages...');
      const response = await apiClient.get<{ data: ContactMessage[] }>('/api/v1/admin/messages');
      setMessages(response.data || []);
      console.log('✅ [ADMIN] Messages loaded:', response.data?.length || 0);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Pagination calculations
  const totalPages = Math.ceil(messages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMessages = messages.slice(startIndex, endIndex);

  // Reset to page 1 when messages change
  useEffect(() => {
    setCurrentPage(1);
  }, [messages.length]);

  const handleDeleteMessage = async (messageId: string, messageSubject: string) => {
    if (!confirm(t('admin.messages.deleteConfirm').replace('{subject}', messageSubject))) {
      return;
    }

    try {
      console.log(`🗑️ [ADMIN] Deleting message: ${messageSubject} (${messageId})`);
      await apiClient.delete(`/api/v1/admin/messages/${messageId}`);
      console.log('✅ [ADMIN] Message deleted successfully');
      fetchMessages();
      showToast(t('admin.messages.deletedSuccess'), 'success');
    } catch (err: any) {
      console.error('❌ [ADMIN] Error deleting message:', err);
      let errorMessage = 'Unknown error occurred';
      if (err.data?.detail) {
        errorMessage = err.data.detail;
      } else if (err.detail) {
        errorMessage = err.detail;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      showToast(t('admin.messages.errorDeleting').replace('{message}', errorMessage), 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">{t('admin.messages.loadingMessages')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Messages List */}
      {messages.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">{t('admin.messages.noMessages')}</p>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedMessages.map((message) => (
              <div
                key={message.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{message.subject}</h3>
                      <span className="text-xs text-gray-500">{formatDate(message.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{t('admin.messages.from')}:</span> {message.name} ({message.email})
                    </div>
                  </div>
                  <ProductPageButton
                    variant="outline"
                    className="h-7 px-2 text-[10px] font-medium flex items-center justify-center gap-0.5 !text-red-600 !border-red-300 hover:!bg-red-50 hover:!text-red-600 hover:!border-red-300"
                    onClick={() => handleDeleteMessage(message.id, message.subject)}
                  >
                    <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('admin.common.delete')}
                  </ProductPageButton>
                </div>
                <div className="bg-gray-50 rounded-md p-3 mt-3">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('admin.messages.showingPage')
                  .replace('{page}', currentPage.toString())
                  .replace('{totalPages}', totalPages.toString())
                  .replace('{total}', messages.length.toString())}
              </div>
              <div className="flex gap-2">
                <ProductPageButton
                  variant="outline"
                  className="px-4 py-1 text-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {t('admin.messages.previous')}
                </ProductPageButton>
                <ProductPageButton
                  variant="outline"
                  className="px-4 py-1 text-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t('admin.messages.next')}
                </ProductPageButton>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState(pathname || '/admin/messages');

  useEffect(() => {
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const adminTabs = getAdminMenuTABS(t);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.messages.backToAdmin')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.messages.title')}</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden mb-6">
            <AdminMenuDrawer tabs={adminTabs} currentPath={currentPath} />
          </div>
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
              {adminTabs.map((tab) => {
                const isActive = currentPath === tab.path || 
                  (tab.path === '/admin' && currentPath === '/admin') ||
                  (tab.path !== '/admin' && currentPath.startsWith(tab.path));
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      router.push(tab.path);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                      tab.isSubCategory ? 'pl-12' : ''
                    } ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {tab.icon}
                    </span>
                    <span className="text-left">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('admin.messages.title')}</h2>
              <MessagesSection />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


