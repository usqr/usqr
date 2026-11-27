---
title: "Ten years of one marketing site: from copy in the markup to blocks, a design system, and a CMS"
description: "How we moved the content of a static site out of the templates in four steps, and why each step made the next one cheap."
pubDate: 2027-01-12
skills: [design-tokens, html, css, process]
draft: true
---

<!--
PRIVACY CHECK before you publish:
- No private repo names, ticket keys, PR numbers, commit hashes, internal URLs
  (preview hosts, the Studio URL), or colleague names. Use roles ("a front-end
  developer", "the content team").
- The public site and the public stack (Hexo, Pug, Sanity) are permitted. Get
  approval from your employer before you name the company or the product.
- Raw evidence for each section: content-out-of-code.notes.md (local only, do not publish).

SCOPE NOTE: the post "design-system-migration.md" covers the block-by-block
migration in detail. Keep step 3 here short and link to that post.
-->

## TL;DR

<!--
3 sentences:
1. A static marketing site, about 10 years old, 2 repos, about 20,000 commits.
2. Page files went from about 18,000 lines (copy mixed into markup) to about 1,600 lines (page = data only).
   CAUTION: about 7,400 lines of developer markup (demos) moved to 98 fragment files in 2026. Do not claim that the markup went away.
3. Four steps: content to data, markup to blocks, look to tokens, data to a CMS. The CMS step did not change the render path.
-->

## Where we started: the page was the content

<!--
- Show a sanitized 15-line Pug excerpt: a <section> with BEM classes, an <h2>, copy with inline <strong>, links, and a <picture>.
  (Source: the 2022 product page template, 238 lines. Rewrite the copy as lorem or generic text.)
- The per-page YAML file held only meta and config (title, description, scripts). The copy was in the template.
- Result: each copy change was a code change by a developer. Give one example of a content-only burst
  (an SEO pass: many commits with the same subject, in one month).
- Numbers: 113 page templates, about 18,000 lines, 88 of them longer than 40 lines.
-->

## The idea was there early, the structure was not

<!--
- In the first year, someone already listed a reusable "module" in the page config (one CTA module in one YAML file).
- Partials and mixins grew, but each page still put them together by hand in its template.
- Question for you: why did the idea not spread? (No catalog? No naming rule for "block" vs "partial"? No time?)
- Thesis to test: a good pattern needs a structure that makes it the default, not a one-off.
-->

## Step 1: a restart with blocks and components from day one

<!--
- New repo. The first commits: CSS layers (reset, spacing, typography, utilities) and a UI kit page. The UI kit came before the pages.
- Naming rule in week 2: a block is a page section, a component is a part inside a block.
- The block builder: the page YAML lists blocks by name, and a builder calls one mixin for each item.
  Show a sanitized YAML example:
    blocks:
      - bannerHero
      - info:
          source: [infoData2]
      - testimonials
- Convention: each block reads `<blockName>Data` from the page data. This key is the contract that makes step 4 possible.
- Coexistence: a wrapper class kept the old styles alive on pages that were not migrated yet.
- Number: page template lines fell from about 16,500 to about 7,900 in the first 7 months.
-->

## Step 2: make the catalog the source of truth

<!--
- The UI kit page grew into a gallery: one page for each block, built from real block data.
- Each repeatable part (components, blocks, builders, modules) is imported once at the base layout level,
  not in each page (one change: about 140 files, net removal of about 450 lines).
- A shared data file holds global defaults (for example, the default FAQ title), so a page sets only what is different.
- Plateau: about 30 blocks and 27 components for 2 years. Page templates stayed at about 5,700 lines.
  Question for you: what was in those last 5,700 lines? (Demos, one-off layouts, legacy pages.)
-->

## Step 3: a design system as a theme, then as the default

<!--
- The new visual language started as an opt-in theme: a page set `theme: <name>` in its YAML.
- Pages moved one at a time (link to design-system-migration.md for the method).
- The "default" switch: one change promoted the theme tokens to :root, made its utilities and base styles global,
  removed the theme class from markup and page configs, and put the theme styles into each component.
- Then: a type scale as tokens (`--fs-*`), and the component structure reorganized around the system.
- Lesson to test: opt-in first lowers the risk. Flip the default only when the opt-in pages are the majority.
-->

## Step 4: move the data to a CMS, keep the render path

<!--
- Goal: editors write landing pages in a headless CMS. Pages look and build the same.
- Diagram (to draw): CMS -> fetch at build time -> cached JSON -> generated page YAML -> same page layout -> block builder -> block mixins -> HTML.
- One mapper for each block: it turns a CMS block into the `<blockName>Data` object that the mixin already reads.
- A build switch turns the CMS source on or off (for example, off for preview builds).
- A hand-written page with the same slug always wins over a generated page.
- The escape hatch: markup that no CMS can supply (live demos, editor mount points) moved out of the page
  into a sibling fragment file, keyed by the page folder. A generated page has no template file, but it can still have a fragment.
- Self-describing blocks: each block mixin got a header comment (@name, @desc, @preview, @key, @prop, @uses).
  The same comment serves 3 readers: developers, the CMS schema author, and AI coding agents.
- Number: page templates at about 1,600 lines, only 3 longer than 40 lines.
-->

## The numbers

<!--
Chart idea (line chart, lines in page templates over time):

| Date    | Page templates | Lines  | Templates > 40 lines |
|---------|---------------:|-------:|---------------------:|
| 2022-08 (old repo) | 113 | 17,943 | 88 |
| 2022-06 | 110 | 16,474 | 84 |
| 2023-01 | 128 |  7,856 | 25 |
| 2024-01 | 110 |  5,884 | 17 |
| 2025-01 | 117 |  5,671 | 16 |
| 2026-01 | 133 |  6,279 | 17 |
| 2026-07 (before the CMS work) | 196 | 8,591 | 37 |
| 2026-11 | 198 |  1,601 |  3 |
| 2026-11 fragment files (developer markup, moved out of the pages) | 98 | 7,443 | – |

Second series if useful: blocks 15 -> 36, components 10 -> 28, CMS schema files 0 -> 24.
Note: the page count went up while the lines went down.
-->

## What I would tell a team that starts this today

<!--
3-5 points. Candidates from the history (keep the ones you agree with):
1. Name the data contract first (`<blockName>Data`). Every later step depends on it.
2. Build the catalog before the pages. A block that is not in the catalog does not exist.
3. Ship a new design system as opt-in, then flip the default in one change.
4. Plan an escape hatch for markup that is not content (demos).
5. Document each block in a fixed format. Humans, the CMS, and agents read the same text.
6. Do not change the renderer and the data source at the same time.
-->

## What is still open

<!--
- Structured data (JSON-LD) from the CMS: not done yet.
- Which blocks stay developer-only.
- What the content team says after the first months. (Get a quote, with permission.)
-->
