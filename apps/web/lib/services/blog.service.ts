import { db } from "@white-shop/db";
import { randomUUID } from "crypto";

type Locale = "en" | "hy" | "ru" | string;

interface BlogPostTranslation {
  locale: Locale;
  title: string;
  contentHtml?: string | null;
  excerpt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  featuredImage?: string | null;
  ogImage?: string | null;
}

interface BlogPost {
  id: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  translations: BlogPostTranslation[];
}

const SETTINGS_KEY = "blog-posts";

// Simple in-memory cache for blog posts (cleared on updates)
let postsCache: BlogPost[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 30000; // 30 seconds cache

async function loadAllPosts(): Promise<BlogPost[]> {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (postsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return postsCache;
  }
  
  try {
    const setting = await db.settings.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (!setting) {
      postsCache = [];
      cacheTimestamp = now;
      return [];
    }

    const value = setting.value as unknown;

    if (!Array.isArray(value)) {
      postsCache = [];
      cacheTimestamp = now;
      return [];
    }

    // Basic runtime validation/normalization
    const posts = value
      .filter((item): item is BlogPost => {
        return (
          item &&
          typeof item === "object" &&
          typeof (item as any).id === "string" &&
          typeof (item as any).slug === "string"
        );
      })
      .map((item) => ({
        ...item,
        translations: Array.isArray(item.translations) ? item.translations : [],
      }));
    
    // Update cache
    postsCache = posts;
    cacheTimestamp = now;
    
    return posts;
  } catch (error) {
    console.error('❌ [BLOG SERVICE] Error loading posts:', error);
    // Return cached data if available, even if stale
    if (postsCache) {
      return postsCache;
    }
    return [];
  }
}

async function saveAllPosts(posts: BlogPost[]) {
  await db.settings.upsert({
    where: { key: SETTINGS_KEY },
    update: {
      value: posts,
    },
    create: {
      key: SETTINGS_KEY,
      value: posts,
      description: "Blog posts storage (JSON, per-locale translations)",
    },
  });
  
  // Clear cache after save
  postsCache = null;
  cacheTimestamp = 0;
}

function pickTranslation(
  post: BlogPost,
  locale: Locale
): BlogPostTranslation | null {
  const translations = Array.isArray(post.translations)
    ? post.translations
    : [];

  if (translations.length === 0) return null;

  const exact = translations.find((t) => t.locale === locale);
  if (exact) return exact;

  // Fallback to "en" then first available
  const en = translations.find((t) => t.locale === "en");
  return en || translations[0] || null;
}

class BlogService {
  /**
   * Admin list of posts for specific locale
   */
  async getAdminPosts(locale: Locale) {
    const posts = await loadAllPosts();

    const visible = posts.filter((p) => !p.deletedAt);

    return visible
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((post) => {
        const translation = pickTranslation(post, locale);

        return {
          id: post.id,
          slug: post.slug,
          published: post.published,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          locale: translation?.locale || locale,
          title: translation?.title || post.slug,
          contentHtml: translation?.contentHtml || null,
          excerpt: translation?.excerpt || null,
          seoTitle: translation?.seoTitle || null,
          seoDescription: translation?.seoDescription || null,
          featuredImage: translation?.featuredImage || null,
          ogImage: translation?.ogImage || null,
        };
      });
  }

  /**
   * Admin get single post by id + locale
   */
  async getAdminPost(id: string, locale: Locale, includeTranslations: boolean = false) {
    const posts = await loadAllPosts();
    const post = posts.find((p) => p.id === id && !p.deletedAt);

    if (!post) {
      return null;
    }

    const translation = pickTranslation(post, locale);

    const result: any = {
      id: post.id,
      slug: post.slug,
      published: post.published,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      locale: translation?.locale || locale,
      title: translation?.title || post.slug,
      contentHtml: translation?.contentHtml || null,
      excerpt: translation?.excerpt || null,
      seoTitle: translation?.seoTitle || null,
      seoDescription: translation?.seoDescription || null,
      featuredImage: translation?.featuredImage || null,
      ogImage: translation?.ogImage || null,
    };

    // If includeTranslations is true, add all translations
    if (includeTranslations && post.translations) {
      result.translations = post.translations;
    }

    return result;
  }

  /**
   * Create new post with multiple translations
   */
  async createPost(input: {
    slug: string;
    published: boolean;
    translations: Array<{
      locale: Locale;
      title: string;
      contentHtml?: string | null;
      excerpt?: string | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      featuredImage?: string | null;
      ogImage?: string | null;
    }>;
  }) {
    const now = new Date().toISOString();
    const posts = await loadAllPosts();

    // Ensure unique slug
    if (posts.some((p) => p.slug === input.slug && !p.deletedAt)) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: `Blog post with slug '${input.slug}' already exists`,
      };
    }

    const newPost: BlogPost = {
      id: randomUUID(),
      slug: input.slug,
      published: input.published,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      translations: input.translations.map(t => ({
        locale: t.locale,
        title: t.title,
        contentHtml: t.contentHtml ?? null,
        excerpt: t.excerpt ?? null,
        seoTitle: t.seoTitle ?? null,
        seoDescription: t.seoDescription ?? null,
        featuredImage: t.featuredImage ?? null,
        ogImage: t.ogImage ?? null,
      })),
    };

    posts.push(newPost);
    await saveAllPosts(posts);

    // Return with first translation locale (or 'en' as fallback)
    const firstLocale = input.translations[0]?.locale || 'en';
    return this.getAdminPost(newPost.id, firstLocale);
  }

  /**
   * Update post fields and/or translations
   */
  async updatePost(input: {
    id: string;
    slug?: string;
    published?: boolean;
    translations?: Array<{
      locale: Locale;
      title: string;
      contentHtml?: string | null;
      excerpt?: string | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      featuredImage?: string | null;
      ogImage?: string | null;
    }>;
    // Backward compatibility: single locale update
    locale?: Locale;
    title?: string;
    contentHtml?: string;
    excerpt?: string;
    seoTitle?: string;
    seoDescription?: string;
    featuredImage?: string | null;
    ogImage?: string | null;
  }) {
    const posts = await loadAllPosts();
    const index = posts.findIndex((p) => p.id === input.id && !p.deletedAt);

    if (index === -1) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Blog post not found",
        detail: `Blog post with id '${input.id}' does not exist`,
      };
    }

    const post = posts[index];

    // Update base fields
    if (typeof input.slug === "string" && input.slug.trim()) {
      // Check slug uniqueness
      if (
        posts.some(
          (p) => p.id !== post.id && p.slug === input.slug && !p.deletedAt
        )
      ) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: `Blog post with slug '${input.slug}' already exists`,
        };
      }
      post.slug = input.slug.trim();
    }

    if (typeof input.published === "boolean") {
      post.published = input.published;
    }

    // Update translations
    const translations = Array.isArray(post.translations)
      ? [...post.translations]
      : [];

    if (input.translations && Array.isArray(input.translations)) {
      // Update multiple translations
      input.translations.forEach((newTrans) => {
        const existingIndex = translations.findIndex(
          (t) => t.locale === newTrans.locale
        );
        const translationData = {
          locale: newTrans.locale,
          title: newTrans.title,
          contentHtml: newTrans.contentHtml ?? null,
          excerpt: newTrans.excerpt ?? null,
          seoTitle: newTrans.seoTitle ?? null,
          seoDescription: newTrans.seoDescription ?? null,
          featuredImage: newTrans.featuredImage ?? null,
          ogImage: newTrans.ogImage ?? null,
        };

        if (existingIndex >= 0) {
          translations[existingIndex] = translationData;
        } else {
          translations.push(translationData);
        }
      });
    } else if (input.locale) {
      // Backward compatibility: single locale update
      let translation =
        translations.find((t) => t.locale === input.locale) || null;

      if (!translation) {
        translation = {
          locale: input.locale,
          title: input.title || post.slug,
          contentHtml: input.contentHtml ?? null,
          excerpt: input.excerpt ?? null,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          featuredImage: input.featuredImage ?? null,
          ogImage: input.ogImage ?? null,
        };
        translations.push(translation);
      } else {
        if (typeof input.title === "string") {
          translation.title = input.title;
        }
        if (typeof input.contentHtml === "string") {
          translation.contentHtml = input.contentHtml;
        }
        if (typeof input.excerpt === "string") {
          translation.excerpt = input.excerpt;
        }
        if (typeof input.seoTitle === "string") {
          translation.seoTitle = input.seoTitle;
        }
        if (typeof input.seoDescription === "string") {
          translation.seoDescription = input.seoDescription;
        }
        if (input.featuredImage !== undefined) {
          translation.featuredImage = input.featuredImage;
        }
        if (input.ogImage !== undefined) {
          translation.ogImage = input.ogImage;
        }
      }
    }

    post.translations = translations;
    post.updatedAt = new Date().toISOString();
    posts[index] = post;

    await saveAllPosts(posts);

    // Return with first translation locale or provided locale
    const returnLocale = input.translations?.[0]?.locale || input.locale || 'en';
    return this.getAdminPost(post.id, returnLocale);
  }

  /**
   * Soft delete post
   */
  async deletePost(id: string) {
    const posts = await loadAllPosts();
    const index = posts.findIndex((p) => p.id === id && !p.deletedAt);

    if (index === -1) {
      // Already deleted or not found – consider as success
      return;
    }

    posts[index] = {
      ...posts[index],
      deletedAt: new Date().toISOString(),
      published: false,
    };

    await saveAllPosts(posts);
  }

  /**
   * Public: list published posts for locale
   */
  async listPublished(locale: Locale, page: number = 1, limit: number = 10) {
    const loadStartTime = Date.now();
    const posts = await loadAllPosts();
    const loadDuration = Date.now() - loadStartTime;
    console.log(`📝 [BLOG SERVICE] Loaded ${posts.length} posts in ${loadDuration}ms`);

    const filterStartTime = Date.now();
    const published = posts
      .filter((p) => p.published && !p.deletedAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    const filterDuration = Date.now() - filterStartTime;
    console.log(`📝 [BLOG SERVICE] Filtered to ${published.length} published posts in ${filterDuration}ms`);

    const total = published.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPosts = published.slice(startIndex, endIndex);

    const mapStartTime = Date.now();
    const result = {
      data: paginatedPosts.map((post) => {
        const translation = pickTranslation(post, locale);

        return {
          id: post.id,
          slug: post.slug,
          locale: translation?.locale || locale,
          title: translation?.title || post.slug,
          excerpt: translation?.excerpt || null,
          contentHtml: translation?.contentHtml || null,
          seoTitle: translation?.seoTitle || null,
          seoDescription: translation?.seoDescription || null,
          featuredImage: translation?.featuredImage || null,
          ogImage: translation?.ogImage || null,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          publishedAt: post.createdAt,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
    const mapDuration = Date.now() - mapStartTime;
    console.log(`📝 [BLOG SERVICE] Mapped ${result.data.length} posts in ${mapDuration}ms`);

    return result;
  }

  /**
   * Public: get single published post by slug
   */
  async getBySlug(slug: string, locale: Locale) {
    const posts = await loadAllPosts();
    const post = posts.find(
      (p) => p.slug === slug && p.published && !p.deletedAt
    );

    if (!post) {
      return null;
    }

    const translation = pickTranslation(post, locale);

    return {
      id: post.id,
      slug: post.slug,
      locale: translation?.locale || locale,
      title: translation?.title || post.slug,
      excerpt: translation?.excerpt || null,
      contentHtml: translation?.contentHtml || null,
      seoTitle: translation?.seoTitle || null,
      seoDescription: translation?.seoDescription || null,
      featuredImage: translation?.featuredImage || null,
      ogImage: translation?.ogImage || null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.createdAt,
    };
  }
}

export const blogService = new BlogService();
