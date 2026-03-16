export const FEATURED_CATEGORY_CONFIGS = [
  {
    id: 'smallPack',
    labelKey: 'home.featuredCategories.items.smallPack',
    categorySlugs: ['0-25', '0-33l'],
  },
  {
    id: 'mediumPack',
    labelKey: 'home.featuredCategories.items.mediumPack',
    categorySlugs: ['0-5l'],
  },
  {
    id: 'largePack',
    labelKey: 'home.featuredCategories.items.largePack',
    categorySlugs: ['1l'],
  },
  {
    id: 'bulkPack',
    labelKey: 'home.featuredCategories.items.bulkPack',
    categorySlugs: ['5l', '19l'],
  },
] as const;

export type FeaturedCategoryId = (typeof FEATURED_CATEGORY_CONFIGS)[number]['id'];

export const getFeaturedCategoryConfig = (categoryId: FeaturedCategoryId) =>
  FEATURED_CATEGORY_CONFIGS.find((category) => category.id === categoryId);
