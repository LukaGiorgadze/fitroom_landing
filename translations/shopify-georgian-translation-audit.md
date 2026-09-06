# Shopify Georgian translation audit

Store: `qsuqsb-c6`  
Locale: Georgian (`ka`)  
Started: 2026-09-04  
Method: Shopify Translate & Adapt bulk auto-translation, followed by manual translation of excluded legal policies.

## Status

- Bulk auto-translation completed successfully on 2026-09-04.
- Georgian is published in Shopify.
- The complete Shopify export is stored beside this file as two CSV parts and the original ZIP.
- Shopify excludes legal policies from auto-translation. All three configured policies were translated manually and saved on 2026-09-04; see `shopify-georgian-legal-policies.md`.

## Local files

| File | Purpose |
|---|---|
| `Fitroom_translations_Sep-04-2026.csv` | Complete Shopify export, part 1 |
| `Fitroom_translations_Sep-04-2026_1.csv` | Complete Shopify export, part 2 |
| `Fitroom_translations_Sep-04-2026.zip` | Original Shopify export archive |
| `shopify-georgian-translations.tsv` | Searchable English → Georgian rows |
| `shopify-georgian-untranslated-review.tsv` | Searchable rows whose Georgian export field is empty |
| `shopify-georgian-legal-policies.md` | Full English and Georgian legal-policy text |

## Export verification

- Exported resource rows: **27,440**
- Rows containing a Georgian translation: **3,206**
- Rows with an empty Georgian field: **24,234**
- Most empty fields are Shopify handles, URLs, image data, and custom metafield values that Translate & Adapt did not auto-translate. They are preserved in `shopify-georgian-untranslated-review.tsv` for exact lookup and manual review.

## Collections

| Shopify ID | Field | English | Georgian | Review status |
|---|---|---|---|---|
| `gid://shopify/Collection/365896925381` | Title | Workout Sets | კომპლექტები | Auto-translated; review recommended |
| `gid://shopify/Collection/365896925381` | URL handle | workout-sets | workout-sets | Unchanged |
| `gid://shopify/Collection/365897023685` | Title | Shorts & Skirts | შორტები და კალთები | Auto-translated; review recommended |
| `gid://shopify/Collection/365897023685` | URL handle | shorts-and-skirts | shorts-and-skirts | Unchanged |
| `gid://shopify/Collection/366171029701` | Title | Flared Leggings | გაშლილი ლეგინსები | Auto-translated; review recommended |
| `gid://shopify/Collection/366171062469` | Title | Skirt Shorts | ქვედაკაბა-შორტი | Auto-translated; review recommended |

## Content inventory

The bulk translation covers available fields in:

- Collections
- Products
- Blog posts and blog titles
- Cookie banner
- Filters
- Metaobjects
- Pages
- Store metadata
- Menus
- Theme app embeds, default content, section groups, static sections, templates, and settings
- Notifications
- Shipping and delivery

## Legal policies

| Policy | Georgian status | Local reference |
|---|---|---|
| Privacy Policy | Translated and saved | `shopify-georgian-legal-policies.md` |
| Refund Policy | Translated and saved | `shopify-georgian-legal-policies.md` |
| Shipping Policy | Translated and saved | `shopify-georgian-legal-policies.md` |
