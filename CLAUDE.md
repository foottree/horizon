# Foot Tree theme — project rules

Horizon fork. `origin/main` is connected to the **live** theme through the Shopify GitHub
integration, so `git push origin main` IS a production deploy. Dev theme: `166896992476`.

```
shopify theme push --store foot-tree-x5meqw0j.myshopify.com --theme 166896992476
```

Always pass `--store foot-tree-x5meqw0j.myshopify.com`. The CLI has been pointed at other
stores before, and an omitted `--store` silently reads or writes the wrong shop.

## Type ladder — nothing may render at a size outside it

| px | Use |
|----|-----|
| 72 | display — homepage hero only, **40 on mobile**; its text blocks use the `custom` preset and set their own size, so the scale does not drive it |
| 48 | `h1` page title: collection, product, page, blog, article, 404. Fluid: `clamp(36px, 4.8vw, 48px)`, so **36 on mobile** is this tier's floor, not a stray |
| 32 | `h2` **section title** — the standard |
| 28 | `h3` sub-heading inside a section |
| 24 | `h4` — stat numbers, pull quotes |
| 18 | `h5` |
| 16 | body, and **every card title** |
| 14 | small print, meta |
| 12 | eyebrow, caption, legal |

Sizes live in **Theme settings → Typography** (`type_size_h1`…`h6` in
`config/settings_data.json`). Do not hardcode a heading size in a section's `{% stylesheet %}`
and do not add a size override to `custom.css` — change the scale, or use the right level. The
one exception is a genuinely bespoke element, and then it still has to land on a ladder value.

**Building a page from the Figma:** the mockup's px values are a starting point, not the spec.
Snap each one to the nearest ladder value before writing it. Typing Figma numbers verbatim is
how 22px, 20px, 15px and 13px got onto the homepage.

### Heading level is not a styling choice

- A **page title** is an `<h1>` **and** must use the `h1` type preset. Horizon text blocks let
  these disagree: every page title here was an `<h1>` presetted to `h2`, so page titles rendered
  at the section-title size and the h1 scale went unused. Check `type_preset`, not just the tag.
- A **section title** is an `<h2>`. A text block used as one needs `type_preset: "h2"` and
  `<h2>` in its `text`.

### Card titles are 16px, everywhere

Product cards, the homepage collection rail (`.collection-rail__tile-title`), `/collections`
cards, and both mega-menu tile grids (`.ft-tiles__label`, `.menu-drawer__tile-label`). A row of
cards should read evenly whether it holds products or collections.

## A global setting reaches the whole site

`variant_swatch_radius` was raised to 100 for the product page's 72px circles and silently
turned every collection-card, search and filter swatch into a circle. `type_size_h2` touches
drawer headings as well as section titles.

Before changing anything in `config/settings_data.json`, enumerate what it affects across
`/`, `/collections`, `/collections/all`, a product, `/cart` and a page — then say so in the
commit message. If one surface needs to differ, scope an override to that surface rather than
moving the global.

## Verify by measuring the rendered page

Reading a template tells you what was configured, not what paints. Several sizes here are set
by a block preset that overrides the element, and `{% stylesheet %}` blocks are compiled into
`compiled_assets/styles.css`, so grepping page HTML for a CSS rule always finds nothing.

- Measure with `getComputedStyle` on the live or dev URL at **390** and **1440**.
- `grep -c` against the compiled CSS is meaningless — it is minified to one line.
- To prove a push shipped: `shopify theme pull --theme <id> --only <path>` and diff.

## Before pushing to live

1. Push to the dev theme and **look at a rendered page**. A server-side check for Liquid errors
   is not a visual check; that is how a visual regression reached live once already.
2. Smoke the routes: `/`, `/collections`, `/collections/all`, a product, `/cart`, a page, a 404.
   Expect 200 and zero `Liquid error`.
3. Keep `main` on the old commit until the preview is approved, so rollback is "do nothing".

## Never leave Playwright artifacts in the project

`.playwright-mcp/` and any `*.png` must be deleted before finishing. Everything in this folder
is uploaded by `shopify theme push`. Re-check at the end — each new Playwright call recreates
the directory.

## Schemas: plain English labels

New settings, blocks and sections use literal `label` / `info` / `content` strings, never a new
`t:` key, and never touch `locales/*.schema.json`. One admin language; an invented key costs a
`MatchingTranslations` offense in ~21 locale files.

## Commits

No AI attribution: no `Co-Authored-By: Claude`, no "Generated with" footer, no robot emoji.
