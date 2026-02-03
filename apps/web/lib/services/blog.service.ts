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

async function loadAllPosts(): Promise<BlogPost[]> {
  const setting = await db.settings.findUnique({
    where: { key: SETTINGS_KEY },
  });

  if (!setting) {
    return [];
  }

  const value = setting.value as unknown;

  if (!Array.isArray(value)) {
    return [];
  }

  // Basic runtime validation/normalization
  return value
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
        };
      });
  }

  /**
   * Admin get single post by id + locale
   */
  async getAdminPost(id: string, locale: Locale) {
    const posts = await loadAllPosts();
    const post = posts.find((p) => p.id === id && !p.deletedAt);

    if (!post) {
      return null;
    }

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
    };
  }

  /**
   * Create new post (single locale)
   */
  async createPost(input: {
    slug: string;
    published: boolean;
    locale: Locale;
    title: string;
    contentHtml?: string | null;
    excerpt?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
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
      translations: [
        {
          locale: input.locale,
          title: input.title,
          contentHtml: input.contentHtml ?? null,
          excerpt: input.excerpt ?? null,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
        },
      ],
    };

    posts.push(newPost);
    await saveAllPosts(posts);

    return this.getAdminPost(newPost.id, input.locale);
  }

  /**
   * Update post fields and/or a specific locale translation
   */
  async updatePost(input: {
    id: string;
    slug?: string;
    published?: boolean;
    locale: Locale;
    title?: string;
    contentHtml?: string;
    excerpt?: string;
    seoTitle?: string;
    seoDescription?: string;
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

    // Update translation for locale
    const translations = Array.isArray(post.translations)
      ? post.translations
      : [];
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
    }

    post.translations = translations;
    post.updatedAt = new Date().toISOString();
    posts[index] = post;

    await saveAllPosts(posts);

    return this.getAdminPost(post.id, input.locale);
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
  async listPublished(locale: Locale) {
    const posts = await loadAllPosts();

    return posts
      .filter((p) => p.published && !p.deletedAt)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((post) => {
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
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      });
  }
}

export const blogService = new BlogService();
