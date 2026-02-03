'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, Button } from '@shop/ui';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredLanguage, LANGUAGES, type LanguageCode } from '../../../lib/language';
import { AdminMenuDrawer, getAdminMenuTABS } from '../../../components/icons/global/global';

interface AdminBlogPost {
  id: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  locale: string;
  title: string;
  excerpt?: string | null;
}

export default function AdminBlogPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const adminTabs = getAdminMenuTABS(t);
  const currentPath = pathname || '/admin/blog';

  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);

  const [formLocale, setFormLocale] = useState<LanguageCode>(() => getStoredLanguage() as LanguageCode || 'hy');
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContentHtml, setFormContentHtml] = useState('');
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');
  const [formPublished, setFormPublished] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/admin');
        return;
      }
      fetchPosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, isLoading]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const language = getStoredLanguage();
      const response = await apiClient.get<{ data: AdminBlogPost[] }>('/api/v1/admin/blog', {
        params: { locale: language },
      });

      const list = response.data || [];
      setPosts(list);
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error loading posts:', err);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      setError(t('admin.blog.errorLoading').replace('{message}', message));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingPost(null);
    setFormLocale(getStoredLanguage() as LanguageCode || 'hy');
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormContentHtml('');
    setFormSeoTitle('');
    setFormSeoDescription('');
    setFormPublished(false);
  };

  const openCreateModal = () => {
    resetForm();
    setEditorOpen(true);
  };

  const openEditModal = async (post: AdminBlogPost) => {
    try {
      setLoading(true);
      setError(null);

      const language = getStoredLanguage();
      const response = await apiClient.get<AdminBlogPost & {
        contentHtml?: string | null;
        seoTitle?: string | null;
        seoDescription?: string | null;
      }>(`/api/v1/admin/blog/${post.id}`, {
        params: { locale: language },
      });

      const data = response;

      setEditingPost(post);
      setFormLocale((data.locale as LanguageCode) || (language as LanguageCode));
      setFormTitle(data.title || '');
      setFormSlug(data.slug || '');
      setFormExcerpt(data.excerpt || '');
      setFormContentHtml(data.contentHtml || '');
      setFormSeoTitle(data.seoTitle || '');
      setFormSeoDescription(data.seoDescription || '');
      setFormPublished(data.published);
      setEditorOpen(true);
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error loading post:', err);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      alert(t('admin.blog.errorLoading').replace('{message}', message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (post: AdminBlogPost) => {
    if (!confirm(t('admin.blog.deleteConfirm').replace('{title}', post.title))) {
      return;
    }
    try {
      await apiClient.delete(`/api/v1/admin/blog/${post.id}`);
      await fetchPosts();
      alert(t('admin.blog.deletedSuccess'));
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error deleting post:', err);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      alert(t('admin.blog.errorDeleting').replace('{message}', message));
    }
  };

  const handleTogglePublished = async (post: AdminBlogPost) => {
    try {
      const newStatus = !post.published;
      await apiClient.put(`/api/v1/admin/blog/${post.id}`, {
        published: newStatus,
        locale: formLocale,
      });
      await fetchPosts();
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error updating status:', err);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      alert(t('admin.blog.errorLoading').replace('{message}', message));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        slug: formSlug.trim(),
        published: formPublished,
        locale: formLocale,
        title: formTitle.trim(),
        contentHtml: formContentHtml || undefined,
        excerpt: formExcerpt || undefined,
        seoTitle: formSeoTitle || undefined,
        seoDescription: formSeoDescription || undefined,
      };

      if (editingPost) {
        await apiClient.put(`/api/v1/admin/blog/${editingPost.id}`, payload);
      } else {
        await apiClient.post('/api/v1/admin/blog', payload);
      }

      setEditorOpen(false);
      resetForm();
      await fetchPosts();
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error saving post:', err);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      setError(t('admin.blog.errorLoading').replace('{message}', message));
    } finally {
      setSaving(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q)
    );
  });

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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('admin.blog.title')}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:hidden mb-6">
            <AdminMenuDrawer tabs={adminTabs} currentPath={currentPath} />
          </div>

          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg p-2 space-y-1">
              {adminTabs.map((tab) => {
                const isActive =
                  currentPath === tab.path ||
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
                    <span
                      className={`flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span className="text-left">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
              <div className="w-full md:w-1/2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('admin.blog.searchPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="w-full md:w-auto">
                <button
                  onClick={openCreateModal}
                  className="w-full md:w-auto px-4 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {t('admin.blog.addNewPost')}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-4 py-3">
                {error}
              </div>
            )}

            <Card className="overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    {t('admin.blog.loadingPosts')}
                  </p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">{t('admin.blog.noPosts')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.blog.post')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.blog.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.blog.created')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.blog.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {post.title}
                              </span>
                              <span className="text-xs text-gray-500">
                                {post.slug}
                              </span>
                              {post.excerpt && (
                                <span className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {post.excerpt}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleTogglePublished(post)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                post.published
                                  ? 'bg-green-500'
                                  : 'bg-gray-300'
                              }`}
                              title={
                                post.published
                                  ? t('admin.blog.clickToDraft')
                                  : t('admin.blog.clickToPublished')
                              }
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                                  post.published
                                    ? 'translate-x-[18px]'
                                    : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString(
                              'hy-AM'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(post)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                {t('admin.blog.edit')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(post)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                {t('admin.blog.delete')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingPost ? t('admin.blog.editPost') : t('admin.blog.addNewPost')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditorOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.blog.titleLabel')}
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={t('admin.blog.titlePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.blog.slugLabel')}
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder={t('admin.blog.slugPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.blog.localeLabel')}
                  </label>
                  <select
                    value={formLocale}
                    onChange={(e) =>
                      setFormLocale(e.target.value as LanguageCode)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(LANGUAGES).map(([code, lang]) => (
                      <option key={code} value={code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center mt-4 md:mt-7">
                  <label className="inline-flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formPublished}
                      onChange={(e) => setFormPublished(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2">{t('admin.blog.publishedLabel')}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.blog.excerptLabel')}
                </label>
                <textarea
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder={t('admin.blog.excerptPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px] resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.blog.contentLabel')}
                </label>
                <textarea
                  value={formContentHtml}
                  onChange={(e) => setFormContentHtml(e.target.value)}
                  placeholder={t('admin.blog.contentPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[160px] font-mono resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.blog.seoTitleLabel')}
                  </label>
                  <input
                    type="text"
                    value={formSeoTitle}
                    onChange={(e) => setFormSeoTitle(e.target.value)}
                    placeholder={t('admin.blog.seoTitlePlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.blog.seoDescriptionLabel')}
                  </label>
                  <textarea
                    value={formSeoDescription}
                    onChange={(e) => setFormSeoDescription(e.target.value)}
                    placeholder={t('admin.blog.seoDescriptionPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px] resize-y"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditorOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={saving}
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-70"
                  disabled={saving}
                >
                  {saving
                    ? t('admin.blog.saving')
                    : editingPost
                    ? t('admin.blog.updatePost')
                    : t('admin.blog.createPost')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}