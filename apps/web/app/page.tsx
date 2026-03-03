import { cookies } from "next/headers";
import { getHomePageData } from "../lib/home-server";
import HomePageClient from "../components/HomePageClient";

/**
 * Home page: server-fetches featured and kids products (cached via home-server), then renders client UI.
 * Uses listOnly: true so payload stays under Next.js data cache limit (2MB).
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

  const { featured, kids } = await getHomePageData(lang);

  return (
    <HomePageClient
      serverDataProvided
      initialFeaturedProducts={featured}
      initialWaterEnergyProducts={kids}
    />
  );
}
