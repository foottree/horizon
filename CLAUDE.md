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

**16px at weight 600, line height 1.4** (`--line-height--body-normal`, the text block's "Normal"; a
custom card such as `snippets/collection-tile.liquid` must set it, or it inherits the 1.6 body
leading), and the weight comes from the *font family*, not a weight setting:
`--font-subheading--weight` is 600 and `--font-body--weight` is 400. A card title block must be
`type_preset: "custom"` + `font: "var(--font-subheading--family)"` + `font_size: ""`. A block
left on the `paragraph` or `rte` preset with the body family renders 16px/400 and looks
lighter than every other card on the site — that is how the recommendations rail and the
`/collections` cards drifted. Matching the size alone is not enough; measure the weight too.

**Phones keep card titles at 16px too.** Until 2026-10-27 one custom.css rule stepped every card
title up to 18px below 750px, because a phone carousel then showed one card across most of the
screen. The client's mobile review moved the collection rail, Bestsellers, reviews and reels to
Horizon's "Mobile columns: 2" (172px cards at 390), where 18px wrapped real product names to three
lines, so the rule was removed. Do not reintroduce a phone-only card title size; if a single-card
carousel ever returns, size it from the card (container query), not the viewport.

## New pages and sections: adapt the mockup, never copy it 1:1

Every new template, page or section requested from the Figma is built **into the design system
the site already has**, not as a pixel copy of the mockup. The mockup is drawn for one 1440
viewport (usually with no phone frame). It decides content, order and composition. The size,
spacing, colour and components come from what is already built.

Before writing a new section:

1. **Stock Horizon first, custom only when necessary.** Compose the page from Horizon's stock
   `section` type and theme blocks (`group`, `text`, `image`, `button`, `icon`, divider), the
   way the homepage's New Arrivals, Why Foot Tree and Corporate sections are built, and copy
   the settings of the equivalent block elsewhere on the site (eyebrow, section heading, card
   title, colour scheme). A custom section is the last resort: only for layout a section must
   compute from its blocks (the Our Story timeline's auto-alternating rows), data stock blocks
   can't render, or behaviour no stock section has. The report says why. The global
   `horizon-stock-first` skill has the full checklist. Lesson: Our Story was first built as
   ~2,800 lines of custom `story-*` sections, and a phone font-size fix then needed code
   because those sections had no per-block mobile size field. Its letter and visit sections
   were moved back to stock blocks on 2026-10-17.
2. **Type** snaps to the ladder above. The mockup's 40, 34, 22, 20, 13 are never typed in.
3. **Spacing follows the homepage rhythm, not the frame.**
   - Desktop: section padding **50** top and bottom; 0 on a side where a full-bleed photo meets
     the section edge. Same-background neighbours therefore sit 100 apart, and rows inside a
     section use the same 100.
   - Phones: **every visible boundary is exactly 64px**: section to section, a colour edge to the
     next content, a photo edge to text, between stacked rows, the last content to the footer.
     `custom_mobile_padding` values above 20 render at ×0.7 below 990px, so **91 renders 64 and
     46 renders 32** (text-to-text joins are 46 + 46).
   - Never copy the mockup's 80/100/128 paddings or pin a section to the frame's height.
4. **Colour** comes from `settings.color_palette.*` slots, never hex literals.
5. **Anything the client may want to tune** (heights, sizes, spacing) is a section setting with a
   plain-English label, not a value buried in `custom.css` or a `{% stylesheet %}`.
6. **When the mockup disagrees with the system** (an off-ladder size, a one-off padding, a
   different button), follow the system and name the deviation in the report so the client can
   push back.
7. **No phone frame?** Design the phone layout from how the existing sections stack, then measure.

Verify at **390 and 1440** by measuring the rendered page (computed font sizes on the ladder,
the boundary table at 64 on phones), then look at the screenshots before reporting.

## Phone pass: make a page shorter, then hold every boundary at 64

When a page is optimised for phones, the order is audit, shorten, fix spacing, then prove desktop did
not move. The `checking-phone-layout` skill (`.claude/skills/`) has the boundary script. Every change
in a phone pass is below 750px only.

- **A tinted band is a colour edge.** The client-logo strip (`color2`), the cream bands (`color5`), the
  green letter panel and the footer are measured from the band's edge, not from what is inside it.
  Same-background neighbours are measured content to content (46 + 46 settings = 32 + 32).
- **Custom sections need phone padding.** A section that renders `spacing-style` but has no
  `custom_mobile_padding` / `mobile-padding-block-start` / `-end` settings gets them, copied from
  `sections/wholesale-industries.liquid`. Set both start and end: custom.css drops the rule otherwise.
- **Shorten tall media by cropping, not shrinking.** A phone-only `aspect-ratio` plus
  `object-position` keeps the subject: a 4:5 portrait becomes 4:3 with the focus low, a white-background
  packshot becomes 2:1, and a looping video is checked at several frames. The shoes stay in frame.
- **A tight composition is barely cropped.** The homepage hero carries copy over its top half and the model
  under it (head at ~55% of every mobile key visual, shoes at ~92%). The slideshow's "Trim on mobile"
  (`slide_height_trim_mobile`, px, bottom-anchored) is at 20 since 2026-10-28. The ft-hero phone rule in
  custom.css floors the slide with `padding-bottom: max(56px, calc(12px + 69vw))` (12px + the photo
  from her head down), so narrow phones grow back instead of the trim pulling her head under the
  button: button to head measures 10 / 16 / 17 / 51 / 66px at 360 / 375 / 390 / 412 / 430. Re-measure
  69vw if the mobile photos change. Anything more needs a new phone crop from the client, not code.
- **A stack of full-width tiles** shrinks with the block's own phone width (image `width_mobile` custom
  70) or takes the tablet grid down to phones (Industries: the feature tile full width, then two per row).
- **Carousels use Horizon's "Mobile columns: 1 / 2"** (`mobile_card_size`, 60cqw / 44cqw), the stock
  control. The four custom homepage carousels (collection-rail, product-rail-tabs, review-cards,
  video-carousel) add a third choice, "Custom", which reveals "Card width on phones" (`mobile_card_width`,
  30-90%, resolved to `cqw`); Shop by Collection runs on Custom 40% since 2026-10-28. Extend the stock
  select this way, never replace it with a bare range. Judge 2 against real ~42-character product names:
  titles wrap to three lines and the swatches cut to three.
- **Narrow-card layouts key off the card, not the viewport** (a container query on the card), so they
  survive a column change. The review card's Verified chip moves beside the name below 340px.
- **Hierarchy steps down together.** The product h1 is 28px on phones, so the description's h3 drops to
  24px; a feature tile label under a 28px section heading is 24px. Nothing inside a section may match
  the size of the heading above it.
- **A section's Custom CSS box** is prefixed per rule with the section id by Shopify (a class prefix
  inside it is redundant), has its commas inside `:is()` split by that prefixing, and is capped near 500
  characters in the editor. Over budget, merge rules or move them to custom.css with a comment.
- **Desktop must not move.** Run the boundary script at 1440 on dev and on live; the numbers must match
  before the push.

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
