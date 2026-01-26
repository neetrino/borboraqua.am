նկա# Home Page Pixel-Perfect Figma Implementation Plan

## Նկարագրություն
Home page-ը պետք է վերակառուցվի 100% pixel-perfect Figma design-ի նման՝ օգտագործելով Figma MCP-ից ստացված exact արժեքները։

## Ընդհանուր վերլուծություն

### Figma Design-ից ստացված տվյալներ
- **Ընդհանուր կառուցվածք**: Full-page design with Header, Hero, Featured Products, Water Energy, Why Choose Us, Trusted By, Footer
- **Չափեր**: Desktop-only layout (1920px width)
- **Fonts**: Inter (Regular, Bold, Black) և Montserrat (Light, Regular, Bold, Black)
- **Գույներ**: 
  - Primary: `#00d1ff`, `#1ac0fd`, `#09c1ff`
  - Background: `#0f172a`, white, gradients
  - Text: white, `#0f172a`, `#94a3b8`, `#64748b`
- **Նկարներ**: 40+ նկարներ Figma MCP-ից, որոնցից մի քանիսը ունեն overlay colors

### Ներկա իրավիճակ
- `apps/web/app/page.tsx` - օգտագործում է components (HeroCarousel, FeaturesSection, TopCategories, FeaturedProductsTabs)
- `apps/web/app/layout.tsx` - ներառում է Header և Footer
- TailwindCSS արդեն կոնֆիգուրված է
- Fonts: Inter և Montserrat արդեն setup են

## Զարգացման փուլեր

### ՓՈՒԼ 1: Նախապատրաստական աշխատանք
**Ժամանակ**: ~30 րոպե

#### 1.1. Նկարների գունային տվյալների config
- [ ] Ստեղծել `apps/web/config/figma-image-overlays.ts`
- [ ] Պահել բոլոր նկարների overlay colors, opacity, blend modes
- [ ] Օրինակ:
  ```typescript
  export const imageOverlays = {
    'image-9': {
      glow: { color: 'rgba(118,179,233,0.1)', blur: '4px', blend: 'darken' },
      overlay: { color: 'rgba(0,132,255,0.15)', blend: 'overlay' }
    },
    // ... այլ նկարներ
  }
  ```

#### 1.2. Font weights-ի ստուգում
- [ ] Ստուգել, որ Montserrat-ում կան բոլոր weights (300, 400, 500, 700, 900)
- [ ] Ստուգել, որ Inter-ում կան բոլոր weights (400, 500, 700, 900)
- [ ] Ավելացնել բացակայող weights, եթե կան

#### 1.3. Layout-ի հարց
- [ ] Որոշել՝ Header/Footer-ը պետք է հանել layout-ից Home page-ի համար, թե Figma design-ից
- [ ] **Նախատեսվում է**: Figma design-ում Header/Footer-ը ներառված են, ուստի layout-ից պետք է հանել Home page-ի համար

---

### ՓՈՒԼ 2: Header Section (Navigation Bar)
**Ժամանակ**: ~45 րոպե

#### 2.1. Navigation Bar
- [ ] Position: absolute, top-[64px], left-1/2, translate-x-[-50%]
- [ ] Background: `rgba(255,255,255,0.04)`
- [ ] Width: `1668px`, Height: `73px`
- [ ] Padding: `px-[38px] py-[16px]`
- [ ] Border-radius: `70px`
- [ ] Flex layout: logo (left), menu (center), search icon (right)
- [ ] Menu items: HOME, SHOP, ABOUT US, CONTACT US, BLOG
- [ ] Font: Inter Bold, 16px, uppercase, white
- [ ] Gap between items: `74px`

#### 2.2. Logo
- [ ] Width: `101px`, Height: `31px`
- [ ] Image source: Figma MCP asset

#### 2.3. Search Icon
- [ ] Width: `151.051px`, Height: `21px`
- [ ] Image source: Figma MCP asset

---

### ՓՈՒԼ 3: Hero Section
**Ժամանակ**: ~1.5 ժամ

#### 3.1. Background Gradient
- [ ] Position: absolute, top-0, left-1/2, translate-x-[-50%]
- [ ] Width: `1920px`, Height: `1075px`
- [ ] Gradient: `from-[#62b3e8] to-[rgba(221,216,216,0.75)]`
- [ ] Blur: `50px`

#### 3.2. Decorative Elements (Water Bubbles/Shapes)
- [ ] Բազմաթիվ absolute positioned elements
- [ ] Rotations, scales, mix-blend-modes
- [ ] Exact positions from Figma
- [ ] Նկարների overlay colors-ը կիրառել config-ից

#### 3.3. Main Content
- [ ] Container: `w-[1111px]`, centered
- [ ] "Experience Purity" label: Inter Bold, 14px, uppercase, white, tracking-[1.4px]
- [ ] Main heading: Montserrat Black, 96px, white
  - "YOUR" - Black weight
  - "DAILY DOSE OF" - Light weight
  - "FRESHNESS" - Black weight
- [ ] Subtitle: Inter Regular, 20px, white, centered, max-w-[512px]
- [ ] Buttons:
  - "Shop Now": `bg-[#1ac0fd]`, `w-[185px]`, `h-[60px]`, rounded-full
  - "Learn More": transparent, white border, `h-[60px]`

#### 3.4. Water Wave Graphic
- [ ] Position: absolute, `top-[978px]`, `h-[807px]`, `w-[1920px]`
- [ ] Image source: Figma MCP asset
- [ ] Blurred reflection below: `top-[1741px]`, `blur-[2px]`, `scale-y-[-100%]`

---

### ՓՈՒԼ 4: Featured Products Section
**Ժամանակ**: ~2 ժամ

#### 4.1. Section Container
- [ ] Position: absolute, `top-[1278px]`, `h-[1175px]`, `w-[1920px]`
- [ ] Background: transparent (over water wave)

#### 4.2. Section Header
- [ ] Container: `w-[1536px]`, centered
- [ ] Title: "FEATURED PRODUCTS"
  - Montserrat Black, 70px, white, uppercase
  - Tracking: `[-0.9px]`
  - Line-height: `40px`
- [ ] Subtitle: Inter Regular, 16px, white, centered
- [ ] Blue underline: `bg-[#00d1ff]`, `h-[5px]`, `w-[90px]`, `rounded-[30px]`

#### 4.3. Products Grid
- [ ] Container: `h-[736.83px]`, `w-[1536px]` (with 24px padding)
- [ ] 3 products in a row
- [ ] Product cards:
  - Background: `rgba(255,255,255,0)` (transparent)
  - Border-radius: `24px`
  - Padding: varies per product
  - Product image: exact dimensions from Figma
  - Title: Montserrat Bold, 18px, white
  - Size label: Inter Regular, 12px, `#94a3b8`, uppercase, tracking-[1.2px]
  - Price: Inter Black, 20px, `#00d1ff`
  - Button: `bg-[#00d1ff]`, `py-[12px]`, `rounded-[34px]`, Inter Bold, 16px, white

#### 4.4. Navigation Arrows
- [ ] Left/Right arrows: `w-[56px]`, `h-[56px]`
- [ ] Border: `0.5px solid rgba(255,255,255,0.49)`
- [ ] Rounded-full

#### 4.5. Pagination Dots
- [ ] 3 dots: `w-[6px]`, `h-[6px]`, rounded-full
- [ ] Active: `bg-[#00d1ff]`, `w-[16px]`
- [ ] Inactive: `bg-[#e2e8f0]`

#### 4.6. "View All Products" Button
- [ ] Border: `2px solid #e2e8f0`
- [ ] Padding: `px-[34px] py-[12px]`
- [ ] Rounded-full
- [ ] Text: Inter Bold, 16px, `#0f172a`
- [ ] Arrow icon

---

### ՓՈՒԼ 5: Water Energy Section
**Ժամանակ**: ~1.5 ժամ

#### 5.1. Section Container
- [ ] Position: absolute, `top-[2606px]`
- [ ] Width: `1488px`, centered
- [ ] Title: "WATER ENERGY"
  - Montserrat Black, 70px, `#0f172a`, uppercase
  - Tracking: `[-0.9px]`
- [ ] Blue underline: `bg-[#00d1ff]`, `h-[5px]`, `w-[90px]`

#### 5.2. Main Graphic
- [ ] Container: `w-[914px]`, `h-[678.858px]`, centered
- [ ] Water bottle image with decorative elements
- [ ] "BALANCE" text: Montserrat Black, 66px, `#09c1ff`
- [ ] "PURE ENERGY" text: Montserrat Black, 66px, `#0f172a`
- [ ] Subtitle: Montserrat Regular, 16px, `#0f172a`
- [ ] Overlay colors-ը կիրառել config-ից

---

### ՓՈՒԼ 6: Pure Spring Water / Balanced Hydration Cards
**Ժամանակ**: ~1 ժամ

#### 6.1. Blue Card (98%)
- [ ] Position: absolute, `left-[729px]`, `top-[3570px]`
- [ ] Width: `794px`, Height: `343px`
- [ ] Background: `#1ac0fd`
- [ ] Border-radius: `37px`
- [ ] Image: left side, exact dimensions
- [ ] "98%" text: Montserrat Black, 96px, white
- [ ] "Pure spring water from Armenia" text: Montserrat Black, 46px, white
- [ ] "Natura Source" text: Inter Medium Italic, 16px, white

#### 6.2. White Card (100%)
- [ ] Position: absolute, `left-[393px]`, `top-[3931px]`
- [ ] Width: `795px`, Height: `343px`
- [ ] Background: white
- [ ] Border-radius: `37px`
- [ ] "100%" text: Montserrat Black, 96px, `#0f172a`
- [ ] "Balanced hydration every day" text: Montserrat Black, 46px, `#00d1ff`
- [ ] "Clean Minerals" text: Inter Medium Italic, 16px, `#00d1ff`

#### 6.3. Side Images
- [ ] Left image: `left-[393px]`, `top-[3570px]`, `w-[306px]`, `h-[343px]`
- [ ] Right image: `left-[1215px]`, `top-[3924px]`, `w-[308px]`, `h-[350px]`

---

### ՓՈՒԼ 7: Why Choose Us Section
**Ժամանակ**: ~1.5 ժամ

#### 7.1. Section Header
- [ ] Position: absolute, `top-[4422px]`
- [ ] Width: `1488px`, centered
- [ ] Title: "WHY CHOOSE US"
  - Montserrat Black, 70px, `#0f172a`, uppercase
- [ ] Blue underline: `bg-[#00d1ff]`, `h-[5px]`, `w-[90px]`

#### 7.2. Feature Cards (3 cards)
- [ ] Card 1: "RICH IN MINERALS"
  - Position: `left-[730px]`, `top-[4661px]`
  - Width: `375px`, Height: `286px`
  - Background: white, border-radius: `37px`
  - Icon: molecule-like, light blue
  - Title: Montserrat Bold, 20px, `#0f172a`, uppercase
  - Description: Inter Regular, 16px, `#64748b`

- [ ] Card 2: "NON-CARBONATED"
  - Position: `left-[217px]`, `top-[5086px]`
  - Width: `375px`, Height: `272px`
  - Same styling as Card 1

- [ ] Card 3: "NO ARTIFICIAL INGREDIENTS"
  - Position: `left-[1227px]`, `top-[4932px]`
  - Width: `375px`, Height: `278px`
  - Same styling as Card 1

#### 7.3. Decorative Vector Elements
- [ ] Multiple vector graphics with exact positions
- [ ] Rotations and mix-blend-modes

---

### ՓՈՒԼ 8: Trusted By Section
**Ժամանակ**: ~45 րոպե

#### 8.1. Section Container
- [ ] Position: absolute, `top-[5651px]`
- [ ] Width: `1920px`, Height: `461px`
- [ ] Padding: `px-[192px] py-[80px]`

#### 8.2. Section Header
- [ ] Title: "TRUSTED BY"
  - Montserrat Black, 70px, `#0f172a`, uppercase
- [ ] Subtitle: Inter Regular, 16px, `#94a3b8`, uppercase

#### 8.3. Partner Logos
- [ ] Container: `w-[1441px]`, centered
- [ ] 3 logos in a row
- [ ] Gap: `184px`
- [ ] Exact dimensions from Figma

#### 8.4. Navigation & Pagination
- [ ] Left/Right arrows (same as Featured Products)
- [ ] Pagination dots (same style)

---

### ՓՈՒԼ 9: Footer
**Ժամանակ**: ~1.5 ժամ

#### 9.1. Footer Container
- [ ] Position: absolute, `top-[6061px]`
- [ ] Width: `1920px`, Height: `576px`
- [ ] Background: dark blue with water texture

#### 9.2. Footer Content
- [ ] Container: `w-[1611px]`, centered
- [ ] 4 columns layout:
  - Column 1: Logo + Description + "More" link
  - Column 2: CONTACT (phone, email, address)
  - Column 3: POLICIES (Privacy, Terms, Delivery, Refund)
  - Column 4: SITE MAP (About, Contact, Shop)

#### 9.3. Social Media Icons
- [ ] 4 icons: Facebook, Instagram, YouTube, LinkedIn
- [ ] Border: `1px solid white`
- [ ] Size: `40px` circle
- [ ] Gap: `16px`

#### 9.4. Copyright & Payment Icons
- [ ] Border-top: `1px solid #e2e8f0`
- [ ] Copyright text: Inter Bold, 12px, white
- [ ] Payment icons: Visa, Mastercard, ArCa, etc.

---

### ՓՈՒԼ 10: Decorative Background Elements
**Ժամանակ**: ~1 ժամ

#### 10.1. Ellipses & Shapes
- [ ] Multiple absolute positioned ellipses
- [ ] Exact positions, sizes, rotations from Figma
- [ ] Mix-blend-modes (luminosity, etc.)

#### 10.2. Vector Graphics
- [ ] Decorative vectors with rotations
- [ ] Exact positions and transforms

---

## Ռիսկեր և նրբություններ

### 1. Layout Conflict
- **Խնդիր**: Layout-ում արդեն կա Header/Footer, բայց Figma design-ում նրանք ներառված են
- **Լուծում**: Home page-ի համար պետք է հանել Header/Footer layout-ից կամ ստեղծել conditional rendering

### 2. Նկարների Overlay Colors
- **Խնդիր**: Որոշ նկարներ ունեն overlay colors, որոնք պետք է կիրառվեն
- **Լուծում**: Ստեղծել config file և կիրառել exact colors-ը

### 3. Absolute Positioning
- **Խնդիր**: Design-ը ամբողջությամբ absolute positioned է
- **Լուծում**: Պահպանել exact positions-ը, չփոխել responsive-ի համար

### 4. Font Weights
- **Խնդիր**: Montserrat Light (300) կարող է բացակայել
- **Լուծում**: Ստուգել և ավելացնել, եթե բացակայում է

### 5. Նկարների URLs
- **Խնդիր**: Figma MCP-ից ստացված URLs-ները valid են 7 օր
- **Լուծում**: Նկարները պետք է download անել և պահել project-ում

---

## Հաջորդ քայլեր

1. ✅ Ստեղծել պլան (այս ֆայլը)
2. ⏳ Ստանալ օգտատիրոջ հաստատում
3. ⏳ Սկսել փուլ 1-ից

---

## Նշումներ

- Բոլոր չափերը պետք է լինեն exact Figma-ից (չկլորացնել)
- Բոլոր գույները պետք է լինեն exact HEX/RGBA-ից
- Tailwind arbitrary values օգտագործել (օր. `w-[1176px]`, `text-[15px]`)
- Desktop-only layout (ոչ responsive)
- Եթե որևէ արժեք Figma-ում չկա → գրել TODO comment










