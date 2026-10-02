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
| 48 | `h1` page title: collection, page, blog, article, 404, **and the homepage hero**. Fluid: `clamp(36px, 4.8vw, 48px)`, so **36 on mobile** is this tier's floor, not a stray. There is no separate display tier any more — the hero was a bespoke 72/40 and is now on this rung. **The product title is the exception — see below** |
| 32 | `h2` **section title** — the standard. **28 on mobile** |
| 28 | `h3` sub-heading inside a section |
| 24 | `h4` — stat numbers, pull quotes |
| 18 | `h5` |
| 16 | body, and **every card title** |
| 14 | small print, meta |
| 12 | **eyebrow**, caption, legal. Every uppercase micro-label is this size: the hero and section eyebrows, "HEAR FROM OUR CUSTOMERS", "FOR ORGANISATIONS", the footer column headings, product card badges. They drifted to 14, 13 and 12 before this was written down |

Sizes live in **Theme settings → Typography** (`type_size_h1`…`h6` in
`config/settings_data.json`). Do not hardcode a heading size in a section's `{% stylesheet %}`
— change the scale, or use the right level.

A scoped rule in `custom.css` is correct only when the element is chrome with no heading level
and no theme setting, and the file that owns it is stock Horizon (editing that would conflict
on the next upstream merge). The announcement bar is the worked example. Even then the value
must land on a ladder rung, and the rule carries a comment saying why it exists.

**A text block has its own mobile size field.** `enable_mobile_size` + `mobile_font_size` on a
text block is the right lever for that block, in preference to CSS — the hero heading, hero body
and eyebrows are all set this way, and the client can see and change them in the editor.
Reach for a `--font-h*--size` override only for a size no block owns: the mobile h2 step is one,
because four of the seven section headings are fork sections styled by class, not text blocks,
so per-block settings would move three of them and leave the other four behind.

**Building a page from the Figma:** the mockup's px values are a starting point, not the spec.
Snap each one to the nearest ladder value before writing it. Typing Figma numbers verbatim is
how 22px, 20px, 15px and 13px got onto the homepage.

### Heading level is not a styling choice

- A **page title** is an `<h1>` **and** must use the `h1` type preset. Horizon text blocks let
  these disagree: every page title here was an `<h1>` presetted to `h2`, so page titles rendered
  at the section-title size and the h1 scale went unused. Check `type_preset`, not just the tag.
- A **section title** is an `<h2>`. A text block used as one needs `type_preset: "h2"` and
  `<h2>` in its `text`.

**The product title is the one exception: `<h1>` tag, `h2` preset (32px).** It is the only
page title that does not span the page — it sits in a ~413px column beside an 803px gallery.
Real product names here run 40–50 characters ("Men's Black Leather Slip-On Work Shoes 047U-8"),
so at 48px they wrapped to four lines and swamped the column. The sweep that put every page
title on the h1 rung did not catch this because the demo products were named "Vira Slip-on".
Judge a title size against the **longest real** title in the **column it actually occupies**,
never against placeholder content.

### Card titles are 16px, everywhere

Product cards, the homepage collection rail (`.collection-rail__tile-title`), `/collections`
cards, the product page's "You may also like" rail, and both mega-menu tile grids
(`.ft-tiles__label`, `.menu-drawer__tile-label`). A row of cards should read evenly whether it
holds products or collections.

**16px at weight 600**, and the weight comes from the *font family*, not a weight setting:
`--font-subheading--weight` is 600 and `--font-body--weight` is 400. A card title block must be
`type_preset: "custom"` + `font: "var(--font-subheading--family)"` + `font_size: ""`. A block
left on the `paragraph` or `rte` preset with the body family renders 16px/400 and looks
lighter than every other card on the site — that is how the recommendations rail and the
`/collections` cards drifted. Matching the size alone is not enough; measure the weight too.

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
