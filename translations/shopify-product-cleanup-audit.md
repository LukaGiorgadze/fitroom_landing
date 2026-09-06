# Shopify product cleanup audit

Store: `qsuqsb-c6`  
Completed: 2026-09-04  
Products updated: **615**

## Changes applied

- Product descriptions now contain only English material/composition and available fabric-feel information.
- All Georgian text was removed from the primary product titles and descriptions.
- Product titles were simplified to product category plus color/pattern.
- Georgian (`ka`) product **title translations only** were removed.
- Georgian (`ka`) product `body_html`, `meta_title`, and `meta_description` translations were subsequently removed so Georgian product pages fall back to the cleaned English content.
- Primary product SEO titles now inherit the cleaned product title; SEO descriptions contain only the same English material/feel facts.
- Prices, variants, inventory, images, handles, collections, tags, and other product data were not changed.

## Verification

- Live products checked: **615**
- Live products differing from the saved plan: **0**
- Georgian characters in live primary titles/descriptions: **0**
- Remaining Georgian product-title translations: **0**
- Remaining Georgian product translations of any kind: **0**
- Descriptions containing anything outside `Material:` and `Feel:`: **0**
- SEO titles/descriptions differing from the cleanup plan: **0**
- Products with no source material/feel information and therefore an empty description: **10**

## Examples

| Before | After |
|---|---|
| Push-up Jumpsuit Pink Babe | Push-up Jumpsuit Pink |
| Flared Leggings Baby Pink V | Flared Leggings Baby Pink |
| Push-up Leggings Booty Black | Push-up Leggings Black |
| უნაკერო სავარჯიშო კომპლექტი Slim Purple | Workout Set Purple |

## Local records

- `shopify-products-before-cleanup.json` — complete rollback snapshot of titles and descriptions before the change.
- `shopify-product-cleanup-plan.csv` — searchable before/after comparison for every product.
- `shopify-product-cleanup-plan.json` — machine-readable before/after comparison.
- `shopify-product-cleanup-results/` — all 41 Shopify mutation responses; every response completed without GraphQL or user errors.
- `shopify-product-georgian-translations-before-removal.json` — rollback snapshot of the removed Georgian product translations.
- `shopify-product-translation-cleanup-results/` — all 21 translation-removal responses with no GraphQL or user errors.
- `shopify-product-seo-before-cleanup.json` — rollback snapshot of product SEO content.
- `shopify-product-seo-cleanup-results/` — all 21 SEO cleanup responses with no GraphQL or user errors.
- `../scripts/prepare-shopify-product-cleanup.mjs` — deterministic cleanup-plan generator.
- `../scripts/prepare-shopify-product-translation-cleanup.mjs` — translation cleanup generator.
- `../scripts/prepare-shopify-product-seo-cleanup.mjs` — SEO cleanup generator.

## Storefront verification

The supplied Georgian storefront URL was reloaded after the cleanup. It renders:

- Page title: `Push-up Set Brown Leopard – Fitroom`
- Product heading: `Push-up Set Brown Leopard`
- Description: `Material: Spandex / Polyester`

Archived and out-of-stock products were included because the bulk operation was already underway when they were declared optional to ignore.
