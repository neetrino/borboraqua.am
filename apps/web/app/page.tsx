import { cookies } from "next/headers";
import { productsService } from "../lib/services/products.service";
import { HomePageClient } from "../components/HomePageClient";

/**
 * Home page: server-fetches featured and kids products, then renders client UI with initial data.
 * This avoids client-side fetch delay and duplicate requests.
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

  const [featuredRes, kidsRes] = await Promise.all([
    productsService.findAll({ filter: "featured", limit: 9, page: 1, lang }),
    productsService.findAll({ search: "kids", limit: 10, page: 1, lang }),
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
