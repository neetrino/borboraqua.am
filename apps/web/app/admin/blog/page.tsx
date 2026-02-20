'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card } from '@shop/ui';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredLanguage, LANGUAGES, type LanguageCode } from '../../../lib/language';
import { AdminMenuDrawer, getAdminMenuTABS } from '../../../components/icons/global/global';
import { ProductPageButton } from '../../../components/icons/global/globalMobile';
import { processImageFile } from '../../../lib/utils/image-utils';
import Image from 'next/image';

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

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '') || ''
  );
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
  const [duplicating, setDuplicating] = useState<string | null>(null); // Track which post is being duplicated
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminBlogPost | null>(null);

  const [formSlug, setFormSlug] = useState('');
  const [formPublished, setFormPublished] = useState(true);
  const [formTranslations, setFormTranslations] = useState<{
    hy: { title: string; contentHtml: string; excerpt: string; seoTitle: string; seoDescription: string };
    en: { title: string; contentHtml: string; excerpt: string; seoTitle: string; seoDescription: string };
    ru: { title: string; contentHtml: string; excerpt: string; seoTitle: string; seoDescription: string };
  }>({
    hy: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
    en: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
    ru: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
  });
  const [formFeaturedImage, setFormFeaturedImage] = useState<string | null>(null);
  const [formOgImage, setFormOgImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<'featured' | 'og' | null>(null);

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

  // Prevent body scroll and hide header when editor modal is open
  useEffect(() => {
    if (editorOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Prevent scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      // Dispatch event to hide header
      window.dispatchEvent(new Event('app:modal-open'));
      
      return () => {
        // Restore scroll position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        // Dispatch event to show header
        window.dispatchEvent(new Event('app:modal-close'));
      };
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.dispatchEvent(new Event('app:modal-close'));
    }
  }, [editorOpen]);

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
    setFormSlug('');
    setFormTranslations({
      hy: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
      en: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
      ru: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
    });
    setFormFeaturedImage(null);
    setFormOgImage(null);
    setFormPublished(true);
  };

  const openCreateModal = () => {
    resetForm();
    setEditorOpen(true);
  };

  const openEditModal = async (post: AdminBlogPost) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch post with all translations
      // Retry once if post not found (might be duplicate in progress)
      let response: AdminBlogPost & {
        translations?: Array<{
          locale: string;
          title: string;
          contentHtml?: string | null;
          excerpt?: string | null;
          seoTitle?: string | null;
          seoDescription?: string | null;
        }>;
        featuredImage?: string | null;
        ogImage?: string | null;
      };
      
      try {
        response = await apiClient.get<AdminBlogPost & {
          translations?: Array<{
            locale: string;
            title: string;
            contentHtml?: string | null;
            excerpt?: string | null;
            seoTitle?: string | null;
            seoDescription?: string | null;
          }>;
          featuredImage?: string | null;
          ogImage?: string | null;
        }>(`/api/v1/admin/blog/${post.id}`, {
          params: { includeTranslations: 'true' },
        });
      } catch (firstError: any) {
        // If 404 and might be duplicate, wait a bit and retry once
        if (firstError?.status === 404 || firstError?.response?.status === 404) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          response = await apiClient.get<AdminBlogPost & {
            translations?: Array<{
              locale: string;
              title: string;
              contentHtml?: string | null;
              excerpt?: string | null;
              seoTitle?: string | null;
              seoDescription?: string | null;
            }>;
            featuredImage?: string | null;
            ogImage?: string | null;
          }>(`/api/v1/admin/blog/${post.id}`, {
            params: { includeTranslations: 'true' },
          });
        } else {
          throw firstError;
        }
      }

      const data = response;

      setEditingPost(post);
      setFormSlug(data.slug || '');
      
      // Initialize translations map
      const translationsMap: {
        hy: { title: string; contentHtml: string; excerpt: string; seoTitle: string; seoDescription: string };
        en: { title: string; contentHtml: string; excerpt: string; seoTitle: string; seoDescription: string };
        ru: { title: string; contentHtml: string; excerpt: string; seoTitle: string; seoDescription: string };
      } = {
        hy: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
        en: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
        ru: { title: '', contentHtml: '', excerpt: '', seoTitle: '', seoDescription: '' },
      };

      // Populate translations from response
      if (data.translations && Array.isArray(data.translations)) {
        data.translations.forEach((trans: any) => {
          const locale = trans.locale as 'hy' | 'en' | 'ru';
          if (locale && (locale === 'hy' || locale === 'en' || locale === 'ru')) {
            translationsMap[locale] = {
              title: trans.title || '',
              contentHtml: trans.contentHtml || '',
              excerpt: trans.excerpt || '',
              seoTitle: trans.seoTitle || '',
              seoDescription: trans.seoDescription || '',
            };
          }
        });
      } else {
        // Fallback: if no translations array, use single locale data
        const language = getStoredLanguage() as 'hy' | 'en' | 'ru';
        if (language && (language === 'hy' || language === 'en' || language === 'ru')) {
          translationsMap[language] = {
            title: data.title || '',
            contentHtml: (data as any).contentHtml || '',
            excerpt: (data as any).excerpt || '',
            seoTitle: (data as any).seoTitle || '',
            seoDescription: (data as any).seoDescription || '',
          };
        }
      }

      setFormTranslations(translationsMap);
      setFormFeaturedImage(data.featuredImage || null);
      setFormOgImage(data.ogImage || null);
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
    
    // Optimistic update: remove from UI immediately
    const originalPosts = [...posts];
    setPosts(prev => prev.filter(p => p.id !== post.id));
    
    try {
      await apiClient.delete(`/api/v1/admin/blog/${post.id}`);
      // Refetch in background to ensure consistency
      fetchPosts().catch(err => {
        console.error('❌ [ADMIN BLOG] Error refetching after delete:', err);
      });
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error deleting post:', err);
      // Rollback on error
      setPosts(originalPosts);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      alert(t('admin.blog.errorDeleting').replace('{message}', message));
    }
  };

  const handleTogglePublished = async (post: AdminBlogPost) => {
    try {
      const newStatus = !post.published;
      await apiClient.put(`/api/v1/admin/blog/${post.id}`, {
        published: newStatus,
      });
      await fetchPosts();
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error updating status:', err);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      alert(t('admin.blog.errorLoading').replace('{message}', message));
    }
  };

  const handleDuplicatePost = async (post: AdminBlogPost) => {
    if (!confirm(t('admin.blog.duplicateConfirm').replace('{title}', post.title))) {
      return;
    }

    // Set loading state for this specific post
    setDuplicating(post.id);

    try {
      const response = await apiClient.post<AdminBlogPost>(`/api/v1/admin/blog/${post.id}/duplicate`);
      console.log('✅ [ADMIN BLOG] Post duplicated successfully');
      
      // Add the duplicated post to the list immediately
      setPosts(prev => [response, ...prev]);
      
      // Refetch in background to ensure consistency
      fetchPosts().catch(err => {
        console.error('❌ [ADMIN BLOG] Error refetching after duplicate:', err);
      });
    } catch (err: any) {
      console.error('❌ [ADMIN BLOG] Error duplicating post:', err);
      const message = err?.message || t('admin.common.unknownErrorFallback');
      alert(t('admin.blog.errorDuplicating').replace('{message}', message));
    } finally {
      setDuplicating(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Collect all filled translations
      const translations: Array<{
        locale: string;
        title: string;
        contentHtml?: string;
        excerpt?: string;
        seoTitle?: string;
        seoDescription?: string;
      }> = [];

      // Add translations that have at least a title
      (['hy', 'en', 'ru'] as const).forEach((locale) => {
        const trans = formTranslations[locale];
        if (trans.title.trim()) {
          translations.push({
            locale,
            title: trans.title.trim(),
            contentHtml: trans.contentHtml?.trim() || undefined,
            excerpt: trans.excerpt?.trim() || undefined,
            seoTitle: trans.seoTitle?.trim() || undefined,
            seoDescription: trans.seoDescription?.trim() || undefined,
          });
        }
      });

      // Validate: at least one translation is required
      if (translations.length === 0) {
        setError(t('admin.blog.atLeastOneTranslationRequired') || 'At least one language translation is required');
        setSaving(false);
        return;
      }

      const payload = {
        slug: formSlug.trim(),
        published: formPublished,
        translations,
        featuredImage: formFeaturedImage || undefined,
        ogImage: formOgImage || undefined,
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
      post.title.toLowerCase().includes(q)
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

  const handleTitleChange = (locale: 'hy' | 'en' | 'ru', value: string) => {
    setFormTranslations(prev => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        title: value,
      },
    }));
    if (!editingPost) {
      // Use English title for slug generation, fallback to first available
      const slugTitle = formTranslations.en.title.trim() || formTranslations.hy.title.trim() || formTranslations.ru.title.trim() || value;
      if (locale === 'en' || !formSlug) {
        setFormSlug(generateSlug(slugTitle));
      }
      // Auto-generate SEO title if empty for this locale
      if (!formTranslations[locale].seoTitle) {
        setFormTranslations(prev => ({
          ...prev,
          [locale]: {
            ...prev[locale],
            seoTitle: value,
          },
        }));
      }
    }
  };

  const handleTranslationChange = (locale: 'hy' | 'en' | 'ru', field: 'contentHtml' | 'excerpt' | 'seoTitle' | 'seoDescription', value: string) => {
    setFormTranslations(prev => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [field]: value,
      },
    }));
  };

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    type: 'featured' | 'og'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('admin.blog.selectImageFile'));
      return;
    }

    try {
      setUploadingImage(type);
      const base64 = await processImageFile(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.8,
      });

      if (type === 'featured') {
        setFormFeaturedImage(base64);
      } else {
        setFormOgImage(base64);
      }
    } catch (error: any) {
      console.error('❌ [ADMIN BLOG] Error uploading image:', error);
      const message = error?.message || t('admin.blog.unknownError');
      alert(t('admin.blog.errorUploadingImage').replace('{message}', message));
    } finally {
      setUploadingImage(null);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleRemoveImage = (type: 'featured' | 'og') => {
    if (type === 'featured') {
      setFormFeaturedImage(null);
    } else {
      setFormOgImage(null);
    }
  };

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
                <ProductPageButton
                  onClick={openCreateModal}
                  className="w-full md:w-auto px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
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
                </ProductPageButton>
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
                              <button
                                type="button"
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                onClick={() => openEditModal(post)}
                                aria-label={t('admin.blog.edit')}
                                title={t('admin.blog.edit')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="p-1.5 text-black hover:text-gray-900 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleDuplicatePost(post)}
                                disabled={duplicating === post.id}
                                aria-label={t('admin.blog.duplicate') || 'Duplicate'}
                                title={t('admin.blog.duplicate') || 'Duplicate post'}
                              >
                                {duplicating === post.id ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {/* Back square (dashed outline, offset to top-right) */}
                                    <rect x="8" y="1" width="16" height="16" rx="2" strokeDasharray="2 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} fill="none" />
                                    {/* Front square (solid filled, centered) */}
                                    <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" />
                                    {/* Plus sign in front square (rounded ends) */}
                                    <path stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v8M8 12h8" />
                                  </svg>
                                )}
                              </button>
                              <button
                                type="button"
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                onClick={() => handleDelete(post)}
                                aria-label={t('admin.blog.delete')}
                                title={t('admin.blog.delete')}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.blog.slugLabelRequired')}
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder={t('admin.blog.articleSlugPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Multi-language Title Inputs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.blog.titleLabel')} *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['hy', 'en', 'ru'] as const).map((locale) => (
                    <div key={locale}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {LANGUAGES[locale].nativeName}
                      </label>
                      <input
                        type="text"
                        value={formTranslations[locale].title}
                        onChange={(e) => handleTitleChange(locale, e.target.value)}
                        placeholder={`${t('admin.blog.titlePlaceholder')} (${LANGUAGES[locale].nativeName})`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-language Excerpt Inputs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.blog.excerptLabel')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['hy', 'en', 'ru'] as const).map((locale) => (
                    <div key={locale}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {LANGUAGES[locale].nativeName}
                      </label>
                      <textarea
                        value={formTranslations[locale].excerpt}
                        onChange={(e) => handleTranslationChange(locale, 'excerpt', e.target.value)}
                        placeholder={`${t('admin.blog.excerptPlaceholderFull')} (${LANGUAGES[locale].nativeName})`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-y"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Published checkbox - only show when editing existing post */}
              {editingPost && (
                <div className="flex items-center">
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
              )}

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.blog.featuredImageLabel')}
                </label>
                {formFeaturedImage ? (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={formFeaturedImage}
                        alt="Featured"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 512px"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('featured')}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      {t('admin.blog.removeImage')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'featured')}
                      disabled={uploadingImage === 'featured'}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingImage === 'featured' && (
                      <p className="mt-1 text-xs text-gray-500">{t('admin.blog.uploading')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* SEO Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('admin.blog.seoSettingsTitle')}</h3>
                <div className="space-y-4">
                  {/* Multi-language SEO Title Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.blog.metaTitleLabel')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(['hy', 'en', 'ru'] as const).map((locale) => (
                        <div key={locale}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {LANGUAGES[locale].nativeName}
                          </label>
                          <input
                            type="text"
                            value={formTranslations[locale].seoTitle}
                            onChange={(e) => handleTranslationChange(locale, 'seoTitle', e.target.value)}
                            placeholder={`${t('admin.blog.metaTitlePlaceholder')} (${LANGUAGES[locale].nativeName})`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('admin.blog.metaTitleHint')}
                    </p>
                  </div>
                  {/* Multi-language SEO Description Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.blog.metaDescriptionLabel')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(['hy', 'en', 'ru'] as const).map((locale) => (
                        <div key={locale}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {LANGUAGES[locale].nativeName}
                          </label>
                          <textarea
                            value={formTranslations[locale].seoDescription}
                            onChange={(e) => handleTranslationChange(locale, 'seoDescription', e.target.value)}
                            placeholder={`${t('admin.blog.metaDescriptionPlaceholder')} (${LANGUAGES[locale].nativeName})`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-y"
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('admin.blog.metaDescriptionHint')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.blog.ogImageLabel')}
                    </label>
                    {formOgImage ? (
                      <div className="relative">
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                          <Image
                            src={formOgImage}
                            alt="OG Image"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 512px"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage('og')}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          {t('admin.blog.removeImage')}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'og')}
                          disabled={uploadingImage === 'og'}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {uploadingImage === 'og' && (
                          <p className="mt-1 text-xs text-gray-500">{t('admin.blog.uploading')}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {t('admin.blog.ogImageHint')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-language Content Inputs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.blog.contentLabel')} (HTML)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['hy', 'en', 'ru'] as const).map((locale) => (
                    <div key={locale}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {LANGUAGES[locale].nativeName}
                      </label>
                      <textarea
                        value={formTranslations[locale].contentHtml}
                        onChange={(e) => handleTranslationChange(locale, 'contentHtml', e.target.value)}
                        placeholder={`${t('admin.blog.contentPlaceholder')} (${LANGUAGES[locale].nativeName})`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px] font-mono resize-y"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t('admin.blog.contentHint')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <ProductPageButton
                  variant="outline"
                  type="button"
                  className="px-4 py-2 text-sm"
                  onClick={() => {
                    setEditorOpen(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  {t('admin.common.cancel')}
                </ProductPageButton>
                <ProductPageButton
                  type="submit"
                  className="px-4 py-2 text-sm"
                  disabled={saving}
                >
                  {saving
                    ? t('admin.blog.saving')
                    : editingPost
                    ? t('admin.blog.updatePost')
                    : t('admin.blog.createPost')}
                </ProductPageButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}