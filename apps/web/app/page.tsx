import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { productsService } from "../lib/services/products.service";
import { HomePageClient } from "../components/HomePageClient";

const HOME_PRODUCTS_REVALIDATE = 60;

/**
 * Home page: server-fetches featured and kids products (cached), then renders client UI.
 */
export default async function HomePage() {
  let lang = "en";
  try {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("shop_language");
    if (langCookie?.value && ["hy", "en", "ru"].includes(langCookie.value)) {
      lang = langCookie.value;
    }
  } catch {
    lang = "en";
  }

  const getFeatured = () =>
    productsService.findAll({ filter: "featured", limit: 9, page: 1, lang });
  const getKids = () =>
    productsService.findAll({ search: "kids", limit: 10, page: 1, lang });

  const [featuredRes, kidsRes] = await Promise.all([
    unstable_cache(getFeatured, ["home-featured", lang], {
      revalidate: HOME_PRODUCTS_REVALIDATE,
    })(),
    unstable_cache(getKids, ["home-kids", lang], {
      revalidate: HOME_PRODUCTS_REVALIDATE,
    })(),
  ]);

  const featured = featuredRes.data ?? [];
  let kids = kidsRes.data ?? [];
  if (kids.length === 0 && featured.length > 0) {
    kids = featured.slice(0, 10);
  }

  return (
    <HomePageClient
      serverDataProvided
      initialFeaturedProducts={featured}
      initialWaterEnergyProducts={kids}
    />
  );
}
