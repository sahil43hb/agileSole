# Agile Sole — Software Requirements Specification (SRS)

| Field | Value |
|---|---|
| Product | Agile Sole E-commerce Platform |
| Version | 1.3 |
| Status | Draft for client review |
| Date | 11 November 2026 |
| Business | Agile Sole, Gujranwala, Pakistan |
| Prepared for | Store owner / client |
| Scope of this document | Requirements and product definition only. No implementation. |

---

## 1. Purpose of this document

This document turns a short client brief into a complete ecommerce specification.

It does three things:

1. Records what the client asked for.
2. Adds every capability a modern shoe store and admin dashboard need, based on current international footwear sites, Pakistan ecommerce practice, and industry UX research.
3. Splits work into **Milestone 1 (build now)** and **Milestone 2 (payments and later growth)** so nothing is forgotten, and so the first release stays shippable.

Implementation details, architecture, data model, and sprint plan live in [AGILE-SOLE-IMPLEMENTATION-PLAN.md](./AGILE-SOLE-IMPLEMENTATION-PLAN.md).

---

## 2. Client brief (as given)

| Item | Client statement |
|---|---|
| Product | Ecommerce website for the Agile Sole shoe store |
| Brand reference | Existing Facebook page (cover, logo, photos, tagline) |
| Storefront | Proper landing page and modern ecommerce sections |
| Catalog | Categories, subcategories, brands, and all necessary ecommerce entities |
| Admin | Add products, categories, subcategories, brands; check and track all orders and related entities |
| Checkout / payments | Simple checkout now. **No payment gateway in Milestone 1.** Payments in Milestone 2. |
| Order tracking | Full tracking on **admin** and **customer** sides |
| Customer login | Phone number **or** email, then login and track orders |
| Market | Currently Pakistan; site must follow **international standards** |
| Languages | Customer side: **English and Urdu** now. More languages possible in Milestone 2 |
| Stack | One Next.js repo (full stack). APIs as Next.js Route Handlers on Node.js. MongoDB. Not a separate Express server. |
| This phase | Requirements document and plan only |

---

## 3. Brand facts taken from the Facebook page

These facts are treated as source-of-truth for branding, catalog, and homepage.

| Fact | Evidence |
|---|---|
| Brand name | **Agile Sole** (also written **AgileSole** on the logo) |
| Location | Gujranwala, Pakistan |
| Audience today | ~2.1K Facebook followers |
| English tagline | Every Step a Perfect Beat |
| Urdu tagline | ہر قدم ایک مکمل تال ہے |
| English positioning | Stepping up your footwear game, one pair at a time |
| Visual identity | Circular green/white sneaker logo; mint, green, black, and white; modern retail photography |
| Product mix visible in photos | Athletic/running sneakers, casual sneakers, family comfort sandals/slides/clogs, kids and family lifestyle |
| Marketing style | Product posters, “Shop Now”, lifestyle family photos, comfort + style claims |
| Channel today | Facebook-first. The website must become the primary selling channel, not a brochure |

**Catalog implication:** Agile Sole is a **family footwear brand** (men, women, kids) with two commercial pillars: **athletic/casual sneakers** and **comfort sandals**. The data model must still support extra brands, extra categories, and extra attributes so the store can grow without a rebuild.

---

## 4. Research used to complete the requirements

The client brief is necessary but not sufficient. The following sources were used so that no standard ecommerce capability is skipped.

### 4.1 International footwear storefronts

Reviewed patterns from Nike, Adidas, Allbirds, Zappos, Foot Locker, Clarks, DSW, Hoka, The Athlete’s Foot, and current footwear UX research (Baymard Institute footwear and general ecommerce studies).

Must-have storefront capabilities that shoppers now expect:

- Mega-menu by gender, then style, then activity
- Strong on-site search with suggestions
- Filters for size, color, brand, price, category, availability
- Product cards with hover image, color swatches, sale badge, and price
- Product page with gallery, size picker, size guide, stock state, fit note, delivery promise, returns summary, reviews, and related products
- Sticky add-to-cart on mobile
- Mini-cart drawer plus full cart page
- Guest-friendly checkout (account optional)
- Clear order confirmation and order tracking
- Trust content: shipping, exchange, COD, size help

Footwear-specific extras that generic “shop templates” miss:

- Size as a **variant**, not a dropdown text field
- Size chart with **EU / UK / US / CM**
- Fit feedback (true to size / runs small / runs large)
- Width later (standard now, wide later)
- Colorways as sibling variants of one style
- On-foot / lifestyle images, not only studio shots
- Low-stock and sold-out size handling, with notify-me in Milestone 2

### 4.2 Pakistan market (Bata, Servis, Borjan, Metro, Stylo)

Local buying behavior that the first release must respect:

- **Mobile-first.** Most traffic is phone.
- **Cash on Delivery** is still the default trust mechanism.
- Phone number is more important than email.
- WhatsApp is the real customer-service channel.
- City / area address quality is poor unless the form is structured.
- Fake / joke COD orders are a major cost. Confirmation before dispatch is required.
- PKR pricing, 18% sales tax context, and nationwide courier (TCS, Leopards, Trax, PostEx, M&P, Call Courier).
- Urdu is used for trust and family shoppers; English is used for brand and product names. Both must be first-class.
- Free-shipping threshold and flash-sale merchandising are standard conversion tools.

### 4.3 Modern admin dashboards (Shopify Admin, Adobe Commerce / Magento)

A complete back office is not “add product + see orders”. Shopify-class admin groups work into:

| Admin area | Why it is required |
|---|---|
| Home / dashboard | Today’s orders, low stock, pending confirmations |
| Orders | Confirm, pack, ship, deliver, cancel, return, timeline |
| Products | Styles, variants, media, SEO, publish state |
| Collections | New arrivals, sale, campaigns, merchandising |
| Inventory | Per-size stock, reservations, adjustments, history |
| Customers | Profiles, addresses, order history, risk flags |
| Discounts | Codes and automatic rules |
| Content | Banners, pages, menus, FAQs, size charts |
| Files | Media library |
| Analytics | Sales, products, customers, funnel |
| Settings | Shipping, tax, staff, roles, locales, store profile |
| Permissions | Owner vs staff vs support |

### 4.4 International-standard baseline (even while selling only in Pakistan)

- Locale-prefixed URLs (`/en`, `/ur`) and `hreflang`
- Full RTL for Urdu, not only translated text
- Currency stored as a first-class field (PKR now; more later)
- Country on every address (PK enabled now)
- Size conversion table, not local-only sizes
- WCAG-oriented accessibility, keyboard, focus, contrast
- SEO: unique titles, meta, canonical, sitemap, robots, Product schema
- Legal pages: privacy, terms, returns, cookies
- Audit trail on orders, stock, and admin actions
- Architecture that can add Stripe / JazzCash / EasyPaisa / courier APIs without rewriting checkout

### 4.5 Second market pass (11 Nov 2026)

Extra sources after the first SRS: Pakistan COD operations (confirmation-call desks, RTO playbooks), Google Merchant Center / Meta catalog feeds, 2026 ecommerce checklists, PWA for mobile-first markets, and Shopify admin extras (abandoned checkouts, bulk edit, maintenance mode).

Gaps that were missing or too thin, now specified in **§25** and patched into lifecycle/admin/checkout:

- COD **call log**, unreachable / on-hold, alternate phone, delivery instructions, duplicate-order detection, dispatch load sheet, delivery attempts
- Facebook/Google **product feeds** (this brand still sells on Facebook)
- GA4 + Meta Pixel **ecommerce events**, UTM stored on the order
- Customer **invoice PDF**, WhatsApp share, PWA “Add to Home Screen”
- Local **pickup** in Gujranwala, same-day zone, city-level COD on/off
- Maintenance / coming-soon mode, cookie categories, MerchantReturnPolicy schema
- Admin: abandoned checkouts list, Cmd+K search, bulk product edit, GTIN/weight, translation-completeness, confirmation-rate and size sell-through reports

---

## 5. Product vision and market strategy

### 5.1 Positioning

Agile Sole should not copy Bata’s giant catalog or Nike’s member ecosystem. It should look like a **premium independent footwear brand** that happens to operate with Pakistan logistics.

- Promise: comfort and style for the whole family, one pair at a time.
- Proof: fit guidance, real photos, honest stock, reliable COD delivery, easy exchange.
- Personality: clean, modern, bilingual, Gujranwala-rooted, internationally presented.

### 5.2 Who the site is for

| Persona | Need | Site must do |
|---|---|---|
| Family shopper (often mobile, mixed EN/UR) | Kids + adults in one order | Family categories, size help, COD, WhatsApp help |
| Young athletic buyer | Sneakers that look current | Strong PDP, filters, lookbook, new arrivals |
| Repeat buyer | Reorder known size | Saved sizes, order history, reorder |
| Operations staff | Confirm COD, pack, hand to courier | Order pipeline, packing slip, stock deduction |
| Owner | See what is selling | Dashboard, reports, low-stock alerts |

### 5.3 Conversion strategy (Milestone 1)

1. Make the next pair easy to find (search, mega menu, filters).
2. Remove size fear (chart, fit note, exchange policy on PDP).
3. Remove payment fear (COD, simple checkout, no forced account).
4. Remove fake-order cost (phone OTP at order + admin confirm before dispatch).
5. Make tracking obvious (SMS/email + account + guest track by order no. + phone).

### 5.4 Growth strategy (Milestone 2+)

Payments, courier booking, WhatsApp commerce, abandoned-cart recovery, extra languages, loyalty, and performance ads. The data model in Milestone 1 must already contain the hooks.

---

## 6. Goals, non-goals, and success

### 6.1 Business goals

- Move selling from Facebook DMs to a proper store.
- Accept COD orders from anywhere in Pakistan.
- Let the owner manage catalog and orders without a developer.
- Give customers bilingual shopping and order tracking.
- Be ready for paid checkout and international expansion later.

### 6.2 Product goals

- A storefront that feels current in 2026, not a 2015 catalog theme.
- An admin that feels closer to Shopify than to a generic CRUD panel.
- One source of truth for products, stock, customers, and orders.

### 6.3 Success metrics (after launch)

| Metric | Initial target |
|---|---|
| Mobile add-to-cart | Tracked from day one |
| Checkout completion | Tracked from day one |
| COD confirmation rate | > 80% of placed orders confirmed |
| RTO / fake order rate | Down vs Facebook-manual baseline |
| Order tracking usage | Customers can find status without calling |
| Catalog time-to-publish | Staff can add a new style with sizes in one sitting |

### 6.4 Explicit non-goals for Milestone 1

- Online payment capture (cards, JazzCash, EasyPaisa, Stripe, wallets)
- Courier API booking and live courier webhooks
- Native mobile apps
- Marketplace (Daraz / Amazon) sync
- POS / in-store checkout
- Multi-warehouse transfers
- 3D / AR try-on
- Full marketing automation suite
- Multi-currency checkout (currency field exists; only PKR is enabled)

These are specified so they are designed for, not skipped, then scheduled in Milestone 2.

---

## 7. Assumptions (to confirm with client)

The plan proceeds on these assumptions until the client changes them.

| ID | Assumption |
|---|---|
| A1 | House brand is **Agile Sole**. Other brands can be added in admin from day one. |
| A2 | Single warehouse / dispatch point: Gujranwala. |
| A3 | Delivery: Pakistan nationwide. International shipping is data-ready but disabled. |
| A4 | Default payment method in M1: **Cash on Delivery**. Checkout still has a payment-method slot. |
| A5 | Guest checkout is allowed. Login is required to see full order history; guest tracking uses order number + phone. |
| A6 | Phone OTP is the primary login. Email OTP is equally supported. Password is optional, not required. |
| A7 | Prices shown are PKR, tax-inclusive or tax-exclusive based on store setting (default: tax-inclusive display, tax broken out on invoice). |
| A8 | Admin UI language is English in M1. Catalog content is bilingual. |
| A9 | Reviews are allowed; admin must approve before public display. |
| A10 | Returns/exchanges in M1 are request + admin handling, not a courier pickup portal. |
| A11 | WhatsApp click-to-chat in M1; WhatsApp Business API in M2. |
| A12 | One legal entity, one store, one domain. |
| A13 | Local pickup at Gujranwala is an optional shipping method, off until the owner enables it. |
| A14 | Unreachable after **two** logged contact attempts → do not dispatch; staff may cancel. |

---

## 8. Milestones

### Milestone 1 — Launch store (this project)

Bilingual storefront, full catalog, COD checkout, customer accounts, order tracking, complete admin, reports foundation, SEO, legal pages.

### Milestone 2 — Commerce maturity

Payment gateways, courier integrations, WhatsApp API verification, extra languages, abandoned cart, advanced analytics, notify-me, loyalty, gift cards, international shipping.

Each requirement below is tagged **M1** or **M2**.

---

## 9. Users and roles

| Role | Surface | Access |
|---|---|---|
| Guest shopper | Storefront | Browse, search, cart, guest checkout, guest track |
| Customer | Storefront | All guest abilities + profile, addresses, orders, wishlist, reviews |
| Super admin (owner) | Admin | Everything |
| Catalog manager | Admin | Products, categories, brands, collections, media |
| Order manager | Admin | Orders, customers, fulfillment, returns |
| Content manager | Admin | Banners, pages, menus, FAQs, size charts |
| Support agent | Admin | View orders/customers, add notes, limited status updates |
| Reporter | Admin | Dashboard and reports, no edits |

Role-based access is **M1**. Custom permission matrix like Shopify is **M2**, but the code must check permissions per module in M1 so it does not have to be retrofitted.

---

## 10. Information architecture

### 10.1 Customer sitemap

```
/{locale}/
  home
  shop                         all products
  c/{category}                 men | women | kids
  c/{category}/{subcategory}   sneakers, sandals, ...
  brands
  brands/{brand}
  collections/{slug}           new-arrivals, bestsellers, sale, family-comfort
  search
  product/{slug}
  cart
  checkout
  checkout/confirmation
  track-order
  account/login
  account                      overview
  account/orders
  account/orders/{id}
  account/addresses
  account/wishlist
  account/reviews
  account/profile
  account/orders/{id}/invoice
  recently-viewed
  size-guide
  about
  contact
  faq
  shipping-returns
  privacy
  terms
  cookies
```

Locale prefix is always present: `/en/...` and `/ur/...`.

Admin is separate: `/admin` (English, no locale prefix in M1).

### 10.2 Primary navigation (storefront)

- Shop Men
- Shop Women
- Shop Kids
- Comfort / Family
- New In
- Sale
- Brands
- Help (size guide, track order, contact)

Utility nav: language switcher, search, account, wishlist, cart.

### 10.3 Proposed catalog taxonomy (seed data, editable in admin)

This taxonomy matches the Facebook catalog and Pakistan footwear norms. Admin can rename, reorder, nest, and hide.

```
Men
  Athletic & Running
  Casual Sneakers
  Walking & Comfort
  Sandals & Slides
  Formal (hidden until products exist)
Women
  Sneakers
  Casual
  Comfort
  Sandals & Slides
  Formal / Occasion (hidden until products exist)
Kids
  Boys
  Girls
  School & Everyday
  Sandals
Collections (merchandising, not a category)
  New Arrivals
  Best Sellers
  Family Comfort
  Sale
  Every Step a Perfect Beat
```

Gender and category are separate from collections so a sandal can live under Women > Sandals **and** appear in Family Comfort.

---

## 11. Storefront requirements

### 11.1 Global chrome — M1

| ID | Requirement |
|---|---|
| SF-NAV-01 | Sticky header with logo, mega menu, search, language, account, wishlist count, cart count |
| SF-NAV-02 | Mega menu shows category, subcategory, featured collection, and one promo tile |
| SF-NAV-03 | Announcement bar for shipping / promo, admin-managed, dismissible |
| SF-NAV-04 | Footer: shop links, help links, legal, contact, social (Facebook, Instagram, WhatsApp), newsletter |
| SF-NAV-05 | Floating WhatsApp button with pre-filled message, hideable on checkout |
| SF-NAV-06 | Mobile bottom bar: Home, Shop, Search, Account, Cart |
| SF-NAV-07 | Full RTL layout when locale is Urdu (nav, filters, cart, checkout) |
| SF-NAV-08 | Language switch keeps the same page (product, category, cart) |
| SF-NAV-09 | Cookie notice with accept; policy page linked |
| SF-NAV-10 | 404 and empty-search states with recovery links |

### 11.2 Landing page — M1

The homepage is CMS-assembled from sections. Admin can show/hide/reorder/edit content. Default section order:

1. Announcement bar
2. Hero slider (image or video, bilingual headline, CTA)
3. Trust strip (COD, nationwide delivery, easy exchange, size guide)
4. Shop by category (Men, Women, Kids, Comfort)
5. Shop by style (Sneakers, Sandals, Slides, Kids)
6. New arrivals carousel
7. Featured campaign (Family Comfort or current drop)
8. Best sellers
9. Brand story block (tagline EN + UR, Gujranwala origin)
10. Lookbook / lifestyle grid (from Facebook-style photography)
11. Reviews / social proof
12. Instagram / Facebook gallery or “follow us”
13. FAQ teaser
14. Newsletter
15. Optional flash-sale countdown (CMS)
16. Footer
17. Optional first-visit promo popup (once per session, not on checkout)

| ID | Requirement |
|---|---|
| SF-HOME-01 | All homepage sections are data-driven, not hardcoded |
| SF-HOME-02 | Hero supports 1–6 slides, bilingual text, desktop + mobile image |
| SF-HOME-03 | Product carousels pull from collection or manual product picks |
| SF-HOME-04 | Homepage must pass Core Web Vitals targets on mobile |
| SF-HOME-05 | No empty section rendered if the collection has no products |

### 11.3 Search — M1

| ID | Requirement |
|---|---|
| SF-SRCH-01 | Persistent search in header; overlay on mobile |
| SF-SRCH-02 | Typeahead: products, categories, brands |
| SF-SRCH-03 | Search products by name (EN/UR), SKU, brand, tags |
| SF-SRCH-04 | Exact SKU / name match appears first |
| SF-SRCH-05 | Results page supports the same filters as PLP |
| SF-SRCH-06 | Recent searches stored locally |
| SF-SRCH-07 | Zero-results state with popular collections |
| SF-SRCH-08 | Admin can see top search terms in reports |

**M2:** typo tolerance, visual search, “shoppers also searched”.

### 11.4 Listing pages (PLP) — M1

Applies to category, subcategory, brand, collection, shop-all, and search.

| ID | Requirement |
|---|---|
| SF-PLP-01 | Breadcrumbs |
| SF-PLP-02 | Result count and current filter chips with clear-all |
| SF-PLP-03 | Filters: gender, category, subcategory, brand, size, color, price range, availability, on-sale, material, activity, kids age band, sort |
| SF-PLP-04 | Filters encoded in URL so views are shareable |
| SF-PLP-05 | Sort: featured, newest, price low/high, best selling, discount, rating |
| SF-PLP-06 | Grid 2-col mobile / 3–4 col desktop; optional list view |
| SF-PLP-07 | Product card: image, hover image, brand, title, price, compare-at, badges, color dots, lowest available size hint |
| SF-PLP-08 | Quick view (size + add to cart) on desktop; optional on mobile |
| SF-PLP-09 | Pagination or “load more”; default 24 per page |
| SF-PLP-10 | Sold-out products remain visible, greyed, at end unless filtered to in-stock |
| SF-PLP-11 | SEO intro text on category/brand, truncated on mobile |
| SF-PLP-12 | Subcategory chips under the H1 |

### 11.5 Product detail page (PDP) — M1

This is the highest-converting page on a shoe site. It must be complete.

| ID | Requirement |
|---|---|
| SF-PDP-01 | Image gallery: zoom, thumbnails, video support, alt text EN/UR |
| SF-PDP-02 | Colorway selector switches gallery and URL without losing size if still valid |
| SF-PDP-03 | Size selector shows EU (primary), with UK/US/CM in size guide |
| SF-PDP-04 | Unavailable sizes visible but disabled |
| SF-PDP-05 | Size guide modal: category-specific chart + how to measure |
| SF-PDP-06 | Fit note merchandiser field (“runs small, size up”) |
| SF-PDP-07 | Price, compare-at, % off, tax note |
| SF-PDP-08 | Stock: in stock, low stock (“only 2 left”), out of stock |
| SF-PDP-09 | Add to cart requires size; if missing, scroll/highlight size picker |
| SF-PDP-10 | Sticky ATC bar on mobile |
| SF-PDP-11 | Wishlist heart |
| SF-PDP-12 | Quantity stepper with max = available stock |
| SF-PDP-13 | Delivery estimate by city (rule-based in M1, courier API in M2) |
| SF-PDP-14 | Returns/exchange summary + link |
| SF-PDP-15 | COD badge and “pay when you receive” copy |
| SF-PDP-16 | Specs table: material, sole, closure, weight, SKU, care |
| SF-PDP-17 | Bilingual long description (rich text) |
| SF-PDP-18 | Reviews: stars, count, fit-bar (small / true / large) when enough data |
| SF-PDP-19 | You may also like (same category / brand) |
| SF-PDP-20 | Recently viewed |
| SF-PDP-21 | Share link |
| SF-PDP-22 | JSON-LD Product / Offer / AggregateRating |
| SF-PDP-23 | Notify me when back in stock — **M2** (UI can be hidden in M1) |
| SF-PDP-24 | WhatsApp / native share |
| SF-PDP-25 | Sibling colorways |
| SF-PDP-26 | Optional model-wears size |

### 11.6 Cart — M1

| ID | Requirement |
|---|---|
| SF-CART-01 | Mini-cart drawer after add-to-cart |
| SF-CART-02 | Full cart page: image, title, color, size, qty, line price, remove |
| SF-CART-03 | Live stock validation; cannot exceed available |
| SF-CART-04 | Promo code field |
| SF-CART-05 | Shipping estimate (city + method) |
| SF-CART-06 | Totals: subtotal, discount, shipping, tax display, grand total |
| SF-CART-07 | Empty cart with featured products |
| SF-CART-08 | Cart persists for guest (cookie) and customer (server) |
| SF-CART-09 | Merge guest cart on login |
| SF-CART-10 | Free-shipping progress bar if a threshold is configured |

### 11.7 Checkout — M1 (simple, no payment gateway)

Checkout is a dedicated, distraction-free flow. Payment capture is **not** implemented. The order is created as COD (or “pay later” placeholder).

| ID | Requirement |
|---|---|
| SF-CHK-01 | Guest checkout allowed; login optional |
| SF-CHK-02 | Steps: Information → Delivery → Review → Place order |
| SF-CHK-03 | Contact: full name, **phone (required)**, email (optional but recommended) |
| SF-CHK-04 | Phone validated as Pakistan mobile (`+92 3XX...`) in M1; format ready for other countries |
| SF-CHK-05 | Address: country (PK locked), province, city, area/town, street, landmark, postal code optional |
| SF-CHK-06 | Province/city selectable from admin geo list to reduce courier failures |
| SF-CHK-07 | Save address if logged in |
| SF-CHK-08 | Shipping method list from admin (e.g. Standard COD nationwide) with ETA and fee |
| SF-CHK-09 | Payment method UI exists; only **Cash on Delivery** enabled in M1 |
| SF-CHK-10 | Disabled methods (Card, JazzCash, EasyPaisa, Bank transfer) shown as “Coming soon” or hidden by setting |
| SF-CHK-11 | Order notes (optional) |
| SF-CHK-12 | Phone OTP confirmation before placing COD order (anti-fake-order). Email OTP if phone OTP fails and email present |
| SF-CHK-13 | Order summary always visible (sticky on desktop) |
| SF-CHK-14 | Place order creates order, reserves stock, sends confirmation email/SMS (or queues if SMS provider not yet keyed) |
| SF-CHK-15 | Confirmation page: order number, items, address, COD amount, tracking link, WhatsApp help |
| SF-CHK-16 | Confirmation also sent to phone/email |
| SF-CHK-17 | Cannot place order for out-of-stock variant |
| SF-CHK-18 | Duplicate-submit protection |
| SF-CHK-19 | Abandoned checkout record stored for M2 recovery |
| SF-CHK-20 | Alternate phone |
| SF-CHK-21 | Delivery instructions + “call before delivery” |
| SF-CHK-22 | WhatsApp updates opt-in (separate from marketing) |
| SF-CHK-23 | Accept terms checkbox |
| SF-CHK-24 | COD collect amount shown large: “Pay Rs X to the rider” |
| SF-CHK-25 | Offer “create account / save this order” after guest checkout |
| SF-CHK-26 | Min order amount and max qty per SKU from settings |
| SF-CHK-27 | City with shipping/COD disabled shows a clear error, cannot place |
| SF-CHK-28 | Pickup method: skip address street, collect store address + phone |

**M2:** JazzCash, EasyPaisa, debit/credit, Stripe/international, wallet, split payments, plus paid status in the same order model.

### 11.8 Authentication and account — M1

| ID | Requirement |
|---|---|
| SF-AUTH-01 | Identify with **phone or email** |
| SF-AUTH-02 | OTP login (primary). Password optional for returning users |
| SF-AUTH-03 | Register on first successful OTP if no account exists |
| SF-AUTH-04 | Link phone and email on the same customer when both verified |
| SF-AUTH-05 | Session: httpOnly cookies, refresh rotation |
| SF-AUTH-06 | Logout all devices |
| SF-ACC-01 | Account home: last order, default address, wishlist count |
| SF-ACC-02 | Profile: name, phone, email, language, preferred size (men/women/kids) |
| SF-ACC-03 | Address book: multiple addresses, default shipping |
| SF-ACC-04 | Order list with status badge and date |
| SF-ACC-05 | Order detail + timeline (see §13) |
| SF-ACC-06 | Reorder |
| SF-ACC-07 | Cancel request if order is still cancellable |
| SF-ACC-08 | Return/exchange request after delivery |
| SF-ACC-09 | Wishlist with add-to-cart |
| SF-ACC-10 | My reviews |
| SF-ACC-11 | Delete/download my data request (admin fulfills in M1) |
| SF-ACC-12 | Download invoice PDF |
| SF-ACC-13 | Open a ticket from an order |

### 11.9 Order tracking (customer) — M1

| ID | Requirement |
|---|---|
| SF-TRK-01 | Logged-in customer sees all orders and live status |
| SF-TRK-02 | Guest tracking form: **order number + phone** |
| SF-TRK-03 | Visual timeline: Placed → Confirmed → Packed → Shipped → Out for delivery → Delivered |
| SF-TRK-04 | Show courier name and tracking number when admin enters them |
| SF-TRK-05 | Link to courier public tracking URL when known |
| SF-TRK-06 | Show cancel / return / failed-delivery states honestly |
| SF-TRK-07 | Each status has bilingual customer-facing copy |
| SF-TRK-08 | Estimated delivery window |

**M2:** live courier webhook updates, map, SMS/WhatsApp status push.

### 11.10 Content, trust, and help — M1

| ID | Requirement |
|---|---|
| SF-CMS-01 | About page (brand story, Gujranwala, bilingual) |
| SF-CMS-02 | Contact page: form, phone, email, WhatsApp, map/address |
| SF-CMS-03 | FAQ, admin-managed, bilingual |
| SF-CMS-04 | Size guide hub |
| SF-CMS-05 | Shipping & returns policy |
| SF-CMS-06 | Privacy, Terms, Cookie policy |
| SF-CMS-07 | Contact form creates a support ticket in admin |
| SF-CMS-08 | Newsletter subscribe (email and/or phone) |

### 11.11 Reviews — M1

| ID | Requirement |
|---|---|
| SF-REV-01 | Star rating 1–5, title, body, optional photos |
| SF-REV-02 | Structured fit vote: small / true / large |
| SF-REV-03 | Verified buyer badge if order delivered |
| SF-REV-04 | Admin approve / reject / hide |
| SF-REV-05 | Display on PDP and optional homepage |

### 11.12 Localization — M1

| ID | Requirement |
|---|---|
| SF-i18n-01 | Locales: `en`, `ur`. Architecture allows more locales without schema change |
| SF-i18n-02 | UI strings from message files |
| SF-i18n-03 | Catalog fields stored per locale (title, description, SEO, size-chart notes) |
| SF-i18n-04 | Urdu uses Noto Nastaliq / Noto Nastaliq Urdu + fallback, never a broken system font |
| SF-i18n-05 | `dir=rtl` and CSS logical properties |
| SF-i18n-06 | Dates, numbers, PKR formatting per locale (`Rs 4,999`) |
| SF-i18n-07 | Language preference stored on customer |
| SF-i18n-08 | Admin can leave Urdu empty; storefront falls back to English with a visible rule |

**M2:** extra languages (Arabic, etc.), locale-specific merchandising.

---

## 12. Admin requirements

Admin must be a daily operations tool, not a developer form. Layout: left nav, top search (“jump to order # / SKU / customer”), store switcher not needed in M1.

### 12.1 Dashboard — M1

| ID | Requirement |
|---|---|
| AD-DASH-01 | Today / 7d / 30d: orders, COD value, delivered, cancelled, RTO |
| AD-DASH-02 | Action queue: pending confirmation, unfulfilled, failed delivery, low stock, unread tickets |
| AD-DASH-03 | Sales chart |
| AD-DASH-04 | Top products, top cities |
| AD-DASH-05 | Recent orders table |

### 12.2 Orders — M1 (highest priority admin module)

| ID | Requirement |
|---|---|
| AD-ORD-01 | Order grid with tabs: All, Pending confirmation, Confirmed, Packed, Shipped, Out for delivery, Delivered, Failed / RTO, Returned, Cancelled |
| AD-ORD-02 | Filters: date, city, payment method, status, courier, customer, SKU, risk flag |
| AD-ORD-03 | Search by order number, phone, email, name, tracking number |
| AD-ORD-04 | Bulk actions: confirm, print packing slips, export CSV |
| AD-ORD-05 | Order detail: customer, address, items, amounts, payment, fulfillment, timeline, notes |
| AD-ORD-06 | Internal notes vs customer-visible comments |
| AD-ORD-07 | Status transitions with reason and actor (see §13) |
| AD-ORD-08 | Edit address before shipment |
| AD-ORD-09 | Edit items before confirmation (with stock check) |
| AD-ORD-10 | Apply/remove discount |
| AD-ORD-11 | Enter courier, consignment/tracking number, tracking URL |
| AD-ORD-12 | Print packing slip / invoice PDF |
| AD-ORD-13 | Mark COD collected on delivery |
| AD-ORD-14 | Cancel with reason; restock |
| AD-ORD-15 | Return/exchange workflow; restock or mark damaged |
| AD-ORD-16 | Risk flags: repeat RTO phone, too many orders in 24h, incomplete address |
| AD-ORD-17 | Timeline is immutable (append-only events) |
| AD-ORD-18 | Notify customer on important status changes (email; SMS if configured) |
| AD-ORD-19 | Create draft / manual order (phone order from Facebook/WhatsApp) |
| AD-ORD-20 | Duplicate / copy order |
| AD-ORD-21 | Confirmation attempt log: channel (call/WhatsApp/OTP), outcome, next attempt, agent |
| AD-ORD-22 | Click-to-call and click-to-WhatsApp with bilingual confirm script |
| AD-ORD-23 | Mark unreachable / on hold / fake (cancel reason) |
| AD-ORD-24 | Duplicate-order warning (same phone + SKU in 24h) |
| AD-ORD-25 | Delivery attempt count; 3rd fail → RTO/returned policy |
| AD-ORD-26 | Daily dispatch / courier load sheet CSV (name, phone, city, COD amount, CN) |
| AD-ORD-27 | High-value flag when total ≥ setting (extra confirm; advance is M2) |
| AD-ORD-28 | Abandoned checkouts list (view + convert to draft order in M1; auto-message M2) |

**M2:** courier booking API, COD remittance reconciliation, packing photos, barcode scan.

### 12.3 Catalog — products — M1

| ID | Requirement |
|---|---|
| AD-PRD-01 | Product list with status, stock, price, category, brand |
| AD-PRD-02 | Create/edit product with bilingual fields |
| AD-PRD-03 | Variants: **color × size** matrix; each variant has SKU, barcode optional, price override, stock, images |
| AD-PRD-04 | Generate variants from selected colors and sizes |
| AD-PRD-05 | Media: multi-image, reorder, alt text, video URL |
| AD-PRD-06 | Attributes: gender, type, material, closure, sole, tags, fit note |
| AD-PRD-07 | Pricing: price, compare-at, cost (permissioned), tax class |
| AD-PRD-08 | Inventory tracking on/off per product |
| AD-PRD-09 | SEO: slug, title, description, canonical |
| AD-PRD-10 | Publish: draft / active / archived; scheduled publish **M2** |
| AD-PRD-11 | Duplicate product |
| AD-PRD-12 | Bulk CSV import/export |
| AD-PRD-13 | Soft delete; cannot hard-delete if orders exist |
| AD-PRD-14 | Related products picker |
| AD-PRD-15 | Channel visibility (storefront on/off) |

### 12.4 Categories, subcategories, brands, collections — M1

| ID | Requirement |
|---|---|
| AD-TAX-01 | Nested categories (parent/child), slug, bilingual name/description, image, SEO, sort order, show/hide |
| AD-TAX-02 | Prevent deleting a category that has products (force move/reassign) |
| AD-TAX-03 | Brands: name, slug, logo, bilingual description, SEO, show/hide |
| AD-TAX-04 | Collections: manual product list **or** rules (e.g. tag = sale, created last 30 days) |
| AD-TAX-05 | Default seed collections: New Arrivals, Best Sellers, Sale, Family Comfort |
| AD-TAX-06 | Menu builder: header mega menu and footer from categories/collections/pages |

### 12.5 Inventory — M1

| ID | Requirement |
|---|---|
| AD-INV-01 | Stock per variant (size/color) |
| AD-INV-02 | Available = on hand − reserved |
| AD-INV-03 | Reserve on order place; commit on pack/ship; release on cancel |
| AD-INV-04 | Manual adjustment with reason (received, damaged, count correction) |
| AD-INV-05 | Inventory history log |
| AD-INV-06 | Low-stock threshold per variant or global default |
| AD-INV-07 | Low-stock report and dashboard alert |
| AD-INV-08 | Prevent oversell unless product allows backorder (default off) |

**M2:** multi-location, transfers, purchase orders, barcode receiving.

### 12.6 Customers — M1

| ID | Requirement |
|---|---|
| AD-CUS-01 | Customer grid: name, phone, email, orders, LTV, last order, RTO count |
| AD-CUS-02 | Profile with addresses, orders, notes, language, marketing opt-in |
| AD-CUS-03 | Create customer (walk-in / WhatsApp) |
| AD-CUS-04 | Merge duplicate phone/email **M2** (flag duplicates in M1) |
| AD-CUS-05 | Block/unblock phone (fake-order control) |
| AD-CUS-06 | Export CSV |
| AD-CUS-07 | GDPR-style data export / erase request handling |

### 12.7 Discounts — M1

| ID | Requirement |
|---|---|
| AD-DIS-01 | Discount codes: percent, fixed amount, free shipping |
| AD-DIS-02 | Limits: min order, usage cap, per-customer cap, date range, first-order-only |
| AD-DIS-03 | Apply to all / collection / product / variant |
| AD-DIS-04 | Automatic discounts (e.g. 10% above Rs 5,000) |
| AD-DIS-05 | Sale price via compare-at on product still works without a code |

**M2:** BOGO, gift cards, store credit, customer segments.

### 12.8 Content, media, storefront CMS — M1

| ID | Requirement |
|---|---|
| AD-CMS-01 | Homepage section manager (order, visibility, content) |
| AD-CMS-02 | Banner / hero slides |
| AD-CMS-03 | Pages (about, policies) bilingual rich text |
| AD-CMS-04 | FAQ groups |
| AD-CMS-05 | Size charts by product type |
| AD-CMS-06 | Media library (images, alt, folder tags) |
| AD-CMS-07 | Navigation menus |
| AD-CMS-08 | Announcement bar |
| AD-CMS-09 | Redirects (old URL → new) |

### 12.9 Reviews, tickets, newsletter — M1

| ID | Requirement |
|---|---|
| AD-SOC-01 | Review moderation queue |
| AD-SOC-02 | Contact tickets: open / in progress / closed |
| AD-SOC-03 | Newsletter subscriber list export |

### 12.10 Shipping, tax, geo — M1

| ID | Requirement |
|---|---|
| AD-SHP-01 | Shipping zones (e.g. Gujranwala local, Punjab, Sindh, rest of PK) |
| AD-SHP-02 | Rates: flat, free over threshold, per-zone |
| AD-SHP-03 | ETA labels (2–4 days, etc.) |
| AD-SHP-04 | Province / city / area master data |
| AD-SHP-05 | Courier list (manual names in M1) |
| AD-SHP-06 | Shipping methods include optional **Local pickup (Gujranwala)** |
| AD-SHP-07 | Per-zone: COD allowed yes/no; same-day yes/no |
| AD-TAX-07 | Tax setting: rate, inclusive/exclusive display, show on invoice |
| AD-TAX-08 | Invoice fields: business name, NTN/STRN placeholders for FBR compliance |

**M2:** e-bilty / cargo tracking hooks, courier rate APIs, 2% ecommerce withholding reporting exports.

### 12.11 Analytics and reports — M1

| ID | Requirement |
|---|---|
| AD-RPT-01 | Sales over time |
| AD-RPT-02 | Orders by status |
| AD-RPT-03 | Product performance (units, revenue, returns) |
| AD-RPT-04 | Inventory valuation and low stock |
| AD-RPT-05 | Customer report |
| AD-RPT-06 | Discount usage |
| AD-RPT-07 | Geographic sales (city / province) |
| AD-RPT-08 | COD outstanding vs collected |
| AD-RPT-09 | CSV export on every report |
| AD-RPT-10 | Search terms report |

**M2:** cohorts, funnels, live visitors, marketing attribution.

### 12.12 Staff, settings, audit — M1

| ID | Requirement |
|---|---|
| AD-SET-01 | Store profile: name, logo, favicon, phones, email, address, social URLs, WhatsApp |
| AD-SET-02 | Locale and currency settings |
| AD-SET-03 | Checkout settings (guest allowed, OTP required, payment methods enabled) |
| AD-SET-04 | Staff invite, roles, deactivate |
| AD-SET-05 | Activity / audit log: who changed order, stock, product, settings |
| AD-SET-06 | Email/SMS template editor (bilingual) |
| AD-SET-07 | Notification: new order (email to owner) |
| AD-SET-08 | Backup export (JSON/CSV) of catalog and orders |
| AD-SET-09 | Feature flags for M2 modules |
| AD-SET-10 | Maintenance / coming-soon mode |
| AD-SET-11 | Theme tokens: logo, favicon, apple-touch-icon, brand colors, PWA name |
| AD-SET-12 | Analytics IDs, consent mode, UTM capture |
| AD-SET-13 | Return window days, max COD, min order, confirmation-attempt limit |
| AD-SET-14 | Global admin search (orders, customers, SKUs) |

---

## 13. Order lifecycle (customer + admin)

This is the backbone of Milestone 1. Payments can be added later **without changing these states**.

### 13.1 Statuses

| Status | Who sets it | Customer sees | Stock |
|---|---|---|---|
| `draft` | Admin (manual / abandoned) | No | No reserve |
| `pending_confirmation` | System on checkout | Order placed, waiting confirmation | Reserved |
| `unreachable` | Admin after failed call/WhatsApp attempts | We are trying to reach you | Reserved |
| `on_hold` | Admin (address/size issue, callback) | On hold | Reserved |
| `confirmed` | Admin (or auto if OTP passed + policy) | Confirmed, preparing | Reserved |
| `packed` | Admin | Packed | Committed |
| `pickup_ready` | Admin (local pickup method) | Ready to collect | Deducted |
| `shipped` | Admin + tracking no. | Shipped | Deducted |
| `out_for_delivery` | Admin (or courier M2) | Out for delivery | Deducted |
| `delivered` | Admin | Delivered | Deducted |
| `delivery_failed` | Admin | Delivery attempt failed | Deducted until return |
| `returned` | Admin | Returned | Restock if good |
| `cancelled` | Admin or customer (if allowed) | Cancelled | Released |
| `refunded` | M2 (after payments) | Refunded | Per policy |

Payment sub-status (exists in M1, mostly COD):

- `unpaid` — default for COD
- `cod_pending` — out for delivery
- `paid` — COD cash collected
- `failed` / `refunded` — M2

Fulfillment sub-status: `unfulfilled` | `fulfilled` | `partial` | `returned`

### 13.2 Allowed transitions

```
pending_confirmation → confirmed | unreachable | on_hold | cancelled
unreachable          → confirmed | on_hold | cancelled
on_hold              → confirmed | cancelled
confirmed            → packed | cancelled | on_hold
packed               → shipped | pickup_ready | cancelled (restock)
pickup_ready         → delivered | cancelled
shipped              → out_for_delivery | delivery_failed | delivered | returned
out_for_delivery     → delivered | delivery_failed
delivery_failed      → out_for_delivery | returned | cancelled
delivered            → returned
```

Every transition writes an event: `{ from, to, actor, at, note, customerVisible }`.

### 13.3 Customer-cancellable window

Customer may request cancel while status is `pending_confirmation` or `confirmed`. After `packed`, only admin can cancel.

### 13.4 Tracking events shown to customer

Placed, Confirmed, Packed, Ready for pickup, Shipped (with tracking), Out for delivery, Delivered. Side states: On hold, Unreachable, Cancelled, Delivery failed, Returned.

---

## 14. Domain entities (complete list)

Nothing in this list is “optional to think about”. M1 vs M2 marks what is implemented now.

| Entity | M1 | Notes |
|---|---|---|
| User / Staff | Yes | Admin auth |
| Role / Permission | Yes | Fixed roles |
| Customer | Yes | Phone + email identifiers |
| Address | Yes | Structured PK geo |
| Session / OTP | Yes | Login and checkout OTP |
| Category | Yes | Nested |
| Brand | Yes | House + others |
| Collection | Yes | Manual + rules |
| Product | Yes | Bilingual |
| ProductVariant | Yes | Size × color |
| SizeScale / SizeChart | Yes | EU/UK/US/CM |
| Attribute / Tag | Yes | Material, etc. |
| MediaAsset | Yes | |
| InventoryLevel | Yes | Per variant |
| InventoryAdjustment | Yes | |
| Cart / CartItem | Yes | Guest + user |
| Checkout | Yes | |
| Discount | Yes | |
| Order | Yes | |
| OrderItem | Yes | Snapshot of title/price/sku |
| OrderEvent | Yes | Timeline |
| Fulfillment | Yes | Single fulfillment M1 |
| Shipment | Yes | Courier + CN |
| Payment | Yes (record only) | Method COD, status unpaid/paid |
| Return | Yes (request + admin) | |
| Review | Yes | |
| Wishlist | Yes | |
| Page | Yes | CMS |
| Banner / HomeSection | Yes | |
| Menu | Yes | |
| FAQ | Yes | |
| Redirect | Yes | |
| NotificationTemplate | Yes | |
| NotificationLog | Yes | |
| SupportTicket | Yes | |
| NewsletterSubscriber | Yes | |
| AuditLog | Yes | |
| Setting | Yes | Key/value store |
| Geo (Country, Province, City) | Yes | PK seeded |
| ShippingZone / Rate | Yes | |
| Courier | Yes | Manual list |
| SearchTerm | Yes | Logged |
| AbandonedCheckout | Yes (store + admin list) | Recover send in M2 |
| ConfirmationAttempt | Yes | Call / WhatsApp / OTP log |
| CatalogFeed | Yes | Google + Meta XML/CSV |
| AnalyticsEvent | Yes | GA4/Pixel + internal funnel |
| Popup / PromoModal | Yes | CMS, once per session |
| Weight / GTIN on variant | Yes | Feeds + shipping |
| PaymentGateway | M2 | |
| CourierIntegration | M2 | |
| Webhook | M2 | |
| GiftCard / StoreCredit | M2 | |
| Loyalty | M2 | |
| Warehouse / Transfer | M2 | |
| Blog / Journal | M2 | Optional even then |
| Marketplace listing | Out of scope | |

---

## 15. Non-functional requirements

### 15.1 Quality

| ID | Requirement |
|---|---|
| NFR-01 | Mobile-first; usable on 360px; tested at 390, 768, 1280, 1440 |
| NFR-02 | Lighthouse performance ≥ 80 on homepage and PDP on 4G target |
| NFR-03 | LCP images via Next.js Image / CDN |
| NFR-04 | WCAG 2.2 AA target: contrast, focus, labels, skip link, form errors |
| NFR-05 | Keyboard-complete header, cart, checkout |
| NFR-06 | Storefront available 99.5% monthly after launch hosting is chosen |
| NFR-07 | API p95 < 300ms for catalog reads on Vercel serverless |
| NFR-08 | All user input validated server-side (Zod or equivalent) |
| NFR-09 | Tap targets ≥ 44px; `prefers-reduced-motion` respected |
| NFR-10 | Branded 500 and maintenance page |
| NFR-11 | PWA web manifest + icons so Android shoppers can Add to Home Screen (offline browse is M2) |
| NFR-12 | Health endpoint `/api/v1/health` for Vercel |

### 15.2 Security

| ID | Requirement |
|---|---|
| SEC-01 | HTTPS only |
| SEC-02 | Passwordless OTP hashed; OTP rate-limited |
| SEC-03 | JWT/session httpOnly, secure, SameSite |
| SEC-04 | RBAC on every admin API |
| SEC-05 | Helmet, CORS allowlist, rate limits (stricter on auth and checkout) |
| SEC-06 | File upload: type/size scan, no SVG script, stored outside public exec |
| SEC-07 | Secrets in env, never committed |
| SEC-08 | Parameterized queries / Mongoose sanitization |
| SEC-09 | Audit log for money, stock, order, permission changes |
| SEC-10 | PII minimization in logs |
| SEC-11 | Admin login lockout after failed attempts; session idle timeout |
| SEC-12 | Staff forgot-password via email |
| SEC-13 | Captcha or Turnstile on contact, checkout OTP, and login OTP (abuse) |
| SEC-14 | CSRF on cookie-authenticated mutations |
| SEC-15 | Duplicate checkout / duplicate COD order guard (same phone + same variants within N minutes) |

### 15.3 SEO and social

| ID | Requirement |
|---|---|
| SEO-01 | Unique title/meta per locale page |
| SEO-02 | Canonical + hreflang en/ur |
| SEO-03 | XML sitemap split: products, collections, pages |
| SEO-04 | robots.txt |
| SEO-05 | Open Graph and Twitter cards using product image |
| SEO-06 | Product, Offer, BreadcrumbList, Organization, LocalBusiness (Gujranwala), FAQ, WebSite SearchAction JSON-LD |
| SEO-07 | Clean slugs; redirects on slug change |
| SEO-08 | SSR or RSC for catalog pages (Next.js App Router) |
| SEO-09 | `hreflang` includes `x-default` |
| SEO-10 | `robots.txt` noindex cart, checkout, account, admin, search-filter combinations that would duplicate PLP |
| SEO-11 | Image sitemap; MerchantReturnPolicy and shippingDetails on Product schema |
| SEO-12 | Google Merchant Center feed + Meta/Facebook catalog feed (token or CSV download in admin) |
| SEO-13 | Discontinued product: 301 to successor or keep URL with out-of-stock |

### 15.4 Operations

| ID | Requirement |
|---|---|
| OPS-01 | Structured logging |
| OPS-02 | Error tracking hook (Sentry or similar) — can be keyed later |
| OPS-03 | Database backups daily |
| OPS-04 | Env-based config: local, staging, production |
| OPS-05 | Seed script: admin user, taxonomy, size charts, demo products |
| OPS-06 | Store maintenance / coming-soon mode (password or “launching soon”) |
| OPS-07 | Vercel Cron for abandoned-checkout mark and low-stock digest |
| OPS-08 | Cached Mongoose connection for serverless |

---

## 16. Legal, tax, and Pakistan compliance (design now)

| ID | Requirement | When |
|---|---|---|
| LEG-01 | Privacy policy, terms, returns, cookies | M1 |
| LEG-02 | Marketing opt-in recorded (SMS/WhatsApp/email) | M1 |
| LEG-03 | Store NTN/STRN/address on invoice | M1 fields |
| LEG-04 | Tax display configurable | M1 |
| LEG-05 | PECA-aligned privacy wording (data collection, purpose, contact) | M1 copy |
| LEG-06 | Ecommerce withholding / courier 2% reporting export | M2 |
| LEG-07 | FBR e-bilty / cargo tracking | M2 if/when enforced for this seller class |
| LEG-08 | Customer data export/erase | M1 request + admin process |
| LEG-09 | Cookie consent: necessary vs analytics vs marketing (GA/Pixel load only after analytics consent) | M1 |
| LEG-10 | Separate opt-in for WhatsApp order updates (Meta policy) | M1 |
| LEG-11 | Configurable max COD amount (FBR digital-order cash context; default e.g. high but not unlimited) | M1 setting |
| LEG-12 | Return window (days) and who-pays-return as store settings, shown on PDP and policy page | M1 |

This is not legal advice. A Pakistani tax advisor should confirm rates and whether Agile Sole is a tier-1 retailer. The software will not hard-code a single tax law; it will keep rates and invoice fields configurable.

---

## 17. Integrations

| Integration | M1 | M2 |
|---|---|---|
| MongoDB | Yes | |
| Cloudinary / S3-compatible media | Yes (required on Vercel) | |
| SMTP email (Gmail/SES/Mailgun) | Yes | |
| SMS OTP (local gateway: Jazz, Telenor, or Twilio) | Yes, provider-abstracted | |
| WhatsApp click-to-chat | Yes | |
| WhatsApp Cloud API (OTP, COD confirm, status) | | Yes |
| Google Analytics 4 / Meta Pixel | Yes — IDs + ecommerce events | Conversion API |
| Google Merchant Center feed | Yes (XML from admin) | Auto-push |
| Meta / Facebook catalog feed | Yes (CSV/XML from admin) | Commerce Manager API |
| Maps (contact page) | Embed | Address geocode |
| JazzCash / EasyPaisa / card / Stripe | | Yes |
| PWA manifest | Yes | Push notifications |
| TCS / Leopards / Trax / PostEx APIs | Manual CN in M1 | Booking + webhooks |
| Sentry | Optional hook | Yes |
| Google Search Console | After launch | |

---

## 18. Technical constraints (from client)

| Constraint | Decision |
|---|---|
| One repository | Single Next.js project at the repo root. No monorepo, no `apps/web` + `apps/api`. |
| Next.js as full stack | Storefront, admin, and API all live in the same Next.js App Router app. |
| Node.js API | Implemented as Next.js Route Handlers under `app/api/v1`. They run on Node.js. |
| Express | **Not used as a separate server.** Route Handlers replace Express HTTP routing. Backend code is still organized like Express (route → service → model) in `src/server`. |
| MongoDB | Mongoose ODM, replica-ready |

Rationale: Next.js already includes the Node.js API layer. A second Express process would be two deploys and a monorepo, which the client rejected. A Next.js “custom server” wrapping Express would also fight App Router. One app, one `next dev`, one `next start`.

---

## 19. User stories (Milestone 1)

Stories are the acceptance backbone. “Done” means bilingual, mobile, and admin-manageable where relevant.

### Shopper

- US-01: As a shopper I can open a modern homepage and reach Men, Women, Kids, Comfort in one tap.
- US-02: As a shopper I can filter sneakers by size, color, brand, and price.
- US-03: As a shopper I can open a product, pick color and size, see stock, and add to cart.
- US-04: As a shopper I can open a size guide with EU/UK/US/CM.
- US-05: As a shopper I can switch English/Urdu and keep my cart.
- US-06: As a guest I can checkout with name, phone, and address and place a COD order.
- US-07: As a guest I must verify my phone with OTP before the COD order is accepted.
- US-08: As a customer I can log in with phone or email OTP.
- US-09: As a customer I can see my orders and a status timeline.
- US-10: As a guest I can track an order with order number + phone.
- US-11: As a shopper I can apply a discount code.
- US-12: As a shopper I can save a pair to wishlist.
- US-13: As a buyer I can submit a review with fit feedback after delivery.
- US-14: As a shopper I can contact the store via form or WhatsApp.
- US-15: As a shopper I can share a product on WhatsApp.
- US-16: As a guest after ordering I can download/share the invoice and see the exact COD amount to pay the rider.
- US-17: As a shopper I can choose local pickup in Gujranwala if that method is enabled.
- US-18: As a shopper I can install the store on my phone home screen.

### Admin

- US-20: As owner I can add a brand, category, subcategory, and product with sizes and stock.
- US-21: As owner I can publish homepage banners without a developer.
- US-22: As order manager I can see new COD orders and confirm or cancel them.
- US-23: As order manager I can pack, add tracking, mark shipped, mark delivered, mark COD collected.
- US-24: As order manager I can create an order from a Facebook/WhatsApp message.
- US-25: As catalog manager I can correct stock and see a history of adjustments.
- US-26: As support I can find a customer by phone and see all orders.
- US-27: As owner I can see today’s sales, pending confirmations, and low stock.
- US-28: As owner I can block a phone number that repeatedly places fake orders.
- US-29: As owner I can print a packing slip.
- US-30: As owner I can manage staff logins and roles.
- US-31: As order manager I can log confirmation calls (confirmed / unreachable / fake) and open WhatsApp with a script.
- US-32: As order manager I can export today’s courier load sheet.
- US-33: As owner I can download Google and Facebook product feeds.
- US-34: As owner I can put the store in maintenance / coming-soon mode.
- US-35: As catalog manager I can bulk-edit prices/status and see which products are missing Urdu.

---

## 20. Acceptance criteria (release gate for Milestone 1)

Milestone 1 is not done until all of the following are true:

1. A visitor can browse, search, filter, open PDP, add size, checkout COD, and receive an order number — in **English and Urdu**, on **mobile**.
2. A customer can log in with **phone or email OTP** and see order tracking.
3. A guest can track with **order number + phone**.
4. Admin can CRUD products, variants, categories, subcategories, brands, collections, inventory, discounts, CMS, and staff.
5. Admin can move an order through the full lifecycle, with an immutable timeline visible to the customer.
6. Stock cannot go negative; cancel restores stock.
7. No payment gateway is required to complete a purchase.
8. Payment-method and courier fields exist so Milestone 2 does not rewrite orders.
9. Legal pages, SEO basics, and bilingual tagline/branding from the Facebook page are present.
10. Demo seed data shows a believable Agile Sole catalog (sneakers + family comfort + kids).
11. Admin can confirm COD via call log; unreachable orders do not ship.
12. Google and Meta catalog feeds download with stable variant IDs.
13. GA4/Pixel purchase and add_to_cart fire only after cookie consent.
14. Customer can download an invoice PDF; packing slip shows COD collect amount.

---

## 21. Out of scope (recorded so they are not “forgotten”)

| Item | Destination |
|---|---|
| Card / wallet / Stripe payments | M2 |
| JazzCash / EasyPaisa | M2 |
| Courier booking APIs and live tracking webhooks | M2 |
| WhatsApp Business API OTP and COD confirm buttons | M2 |
| Additional languages | M2 |
| Multi-currency selling | M2 |
| Native iOS/Android apps | Future |
| POS | Future |
| Multi-store / marketplace | Future |
| 3D/AR try-on | Future |
| Live chat bot | Future (WhatsApp first) |
| Affiliate / referral network | Future |
| Custom manufacturing / Nike By You | Out |
| Social login (Google / Facebook) | M2 |
| Product compare, Q&A, bundles, preorder | M2 |
| Push notifications / offline PWA browse | M2 |
| BNPL / bank-transfer screenshot / high-value advance capture | M2 (setting + UI hook in M1) |
| Customer impersonation | M2 |
| 3D / 360 / AR | Future |
| Click-and-collect locker networks | Out (local pickup is M1) |

---

## 22. Open questions for the client

Please answer these before UI design locks. The SRS can ship with the assumptions in §7 if answers are delayed.

1. Do you sell **only Agile Sole**, or also other brands from day one?
2. What is the real assortment: sneakers + sandals only, or also formal, heels, bags?
3. Delivery coverage: all Pakistan, or major cities first?
4. Shipping fees and free-shipping threshold?
5. Exchange window (7 / 14 / 30 days) and who pays return courier?
6. WhatsApp number and Facebook URL to embed?
7. Business legal name, NTN, STRN, public phone, public email?
8. Do you already have SMS OTP credentials, or should M1 use email OTP + manual call confirm as fallback?
9. Who will write Urdu product copy — staff in admin, or English-only at launch with UI still bilingual?
10. Any existing SKU / barcode system?
11. Approximate catalog size at launch (20 / 100 / 500+ styles)?
12. Preferred domain and whether a staging URL is needed?
13. Is **local pickup** in Gujranwala offered at launch?
14. Same-day delivery inside Gujranwala?
15. After how many unanswered calls should an order be cancelled (default: 2)?
16. High-value COD threshold for extra confirmation (default Rs 5,000)? Advance capture waits for M2 payments.
17. Return window days and who pays the return courier?
18. Facebook Page ID / catalog for the product feed?
19. GA4 and Meta Pixel IDs available at launch?

---

## 23. Traceability: client sentence → specification

| Client sentence | Where it is fully specified |
|---|---|
| Proper landing page and modern sections | §11.2 |
| Category, subcategory, brands, everything necessary | §10.3, §12.3–12.4, §14 |
| Admin for catalog and orders | §12 |
| Simple checkout, no payment now | §11.7 |
| Payments in second milestone | §8, §21 |
| Track orders admin + customer | §11.9, §12.2, §13 |
| Login with number or email | §11.8 |
| Pakistan now, international standard | §4.4, §15, §16 |
| English + Urdu | §11.12 |
| One Next.js repo + MongoDB | §18 and Implementation Plan |
| Do not skip functionality | §14 entity list, §21 backlog, **§25 gap fill** |

---

## 24. Document history

| Version | Date | Notes |
|---|---|---|
| 1.0 | 10 Nov 2026 | First complete SRS after brand, market, and dashboard research |
| 1.1 | 11 Nov 2026 | Stack locked to one Next.js repo; APIs are Route Handlers, not a separate Express app |
| 1.2 | 11 Nov 2026 | Hosting locked to Vercel for both storefront/admin and `/api` backend |
| 1.3 | 11 Nov 2026 | Second market pass: COD call-desk, feeds, PWA, pickup, analytics events, invoices, maintenance, extra admin (§25) |

---

## 25. Gap fill — second market pass (normative)

Everything below is **in scope**. M1 unless marked M2. These IDs extend §§11–16.

### 25.1 Pakistan COD operations

Industry practice (confirmation desks, RTO guides): never dispatch an unconfirmed COD order; log every contact; collect an alternate number and a landmark; export a load sheet.

| ID | Requirement |
|---|---|
| PK-COD-01 | Admin confirmation queue is the default landing for new orders |
| PK-COD-02 | Scripted WhatsApp/call text: items, size, COD amount, city, “reply YES” |
| PK-COD-03 | Outcomes: confirmed, cancelled, unreachable, callback/on hold, fake |
| PK-COD-04 | Alternate phone stored on address and shown to rider on packing slip |
| PK-COD-05 | Packing slip + invoice show **Amount to collect (COD)** in large type |
| PK-COD-06 | Same-day shipping rate can be attached to Gujranwala zone |
| PK-COD-07 | COD can be disabled per city/zone |
| PK-COD-08 | Customer-facing copy: you pay the rider; keep change ready (bilingual) |

### 25.2 Storefront extras

| ID | Requirement |
|---|---|
| SF-X-01 | WhatsApp share on PDP and order confirmation (pre-filled message) |
| SF-X-02 | Other colorways of the same style on PDP |
| SF-X-03 | Cart: continue shopping, save-for-later, simple cross-sell row |
| SF-X-04 | Recently viewed page |
| SF-X-05 | Customer invoice PDF (bilingual amounts, NTN placeholders) |
| SF-X-06 | Kids filters: age band (toddler / little / youth) where products have the attribute |
| SF-X-07 | Extra filters: material, activity/use; sort by rating |
| SF-X-08 | PDP model note (“model wears EU 42”) optional merchandiser field |
| SF-X-09 | Variant weight (grams) for future courier; shown in admin, optional on PDP |
| SF-X-10 | GTIN / MPN optional on variant for feeds |
| SF-X-11 | Product status `unlisted` (URL works, hidden from nav/search) |
| SF-X-12 | First-visit promo popup CMS; never on checkout; respect DNT/consent |
| SF-X-13 | Flash countdown homepage section |
| SF-X-14 | Store hours on contact page |
| SF-X-15 | Return/exchange: reason list, size-exchange vs refund-request, optional photo; RMA number |
| SF-X-16 | Change phone/email only after OTP |
| SF-X-17 | Account notification preferences (email/SMS/WhatsApp) |
| SF-X-18 | Compare products, product Q&A, “complete the look” — **M2** |
| SF-X-19 | Social login Google/Facebook — **M2** |
| SF-X-20 | Exit-intent popup — **M2** |

### 25.3 Admin extras

| ID | Requirement |
|---|---|
| AD-X-01 | Bulk edit products: status, price, compare-at, category |
| AD-X-02 | Unique SKU enforced |
| AD-X-03 | Missing-Urdu-content report |
| AD-X-04 | Preview unpublished product and homepage draft |
| AD-X-05 | Size sell-through report (which sizes leftover) |
| AD-X-06 | Confirmation rate and RTO-by-city reports |
| AD-X-07 | Funnel counts from stored events: view_item, add_to_cart, begin_checkout, purchase |
| AD-X-08 | Image compression via Cloudinary presets; alt text warning if empty |
| AD-X-09 | 404 URL log (optional, last N) for redirect creation |
| AD-X-10 | Print A4 invoice and packing slip; 80mm thermal layout optional if easy |
| AD-X-11 | Staff last-login visible; deactivate ends sessions |
| AD-X-12 | Pickup orders tab (ready for collection → collected) |

### 25.4 Analytics, ads, PWA

| ID | Requirement |
|---|---|
| MKT-01 | GA4 events: view_item, add_to_cart, begin_checkout, purchase (order number, value, items, coupon) |
| MKT-02 | Meta Pixel equivalent events; load only after analytics consent |
| MKT-03 | UTM source/medium/campaign stored on order |
| MKT-04 | Google Merchant feed: id, title, description, link, image, price, availability, brand, gtin/mpn, size, color, gender, age_group |
| MKT-05 | Meta catalog feed with the same stable variant IDs |
| MKT-06 | Web app manifest, theme-color, apple-touch-icon, installable on Android |
| MKT-07 | TikTok pixel — **M2** |
| MKT-08 | Meta Conversion API — **M2** |

### 25.5 Still explicitly later

Recorded so they are not treated as forgotten: BNPL, JazzCash/EasyPaisa **advance** on high-value COD, courier APIs, WhatsApp Cloud API buttons, loyalty, gift cards, bundles, preorder, 3D, POS, marketplaces.
