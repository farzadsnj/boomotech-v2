# Design System Direction

## Experience goal

Modern, calm and credible—not a generic neon “AI company” and not a crowded repair-shop site. The interface should feel technically capable while remaining friendly to non-technical visitors.

## Visual concept

Use clean editorial structure, strong typography, generous but efficient spacing, layered cards, crisp product imagery, and subtle technical motifs inspired by connected systems. Prefer authentic team/work/process imagery or purposeful illustrations over cliché server-room photography.

Final logo assets and existing brand colours: `TODO(owner)`.

## Colour roles

Initial accessible direction to prototype and test:

- Ink: deep navy/near-black for text and dark surfaces
- Surface: warm off-white and cool neutral layers
- Primary: confident blue
- Accent: restrained cyan or teal
- Success, warning, danger, and info semantic colours
- Borders: visible neutral contrast, not ultra-faint

Define colours as semantic tokens, not raw values in components. Verify WCAG AA contrast in every state. Do not rely on colour alone.

## Typography

Choose one highly readable variable sans family with excellent Latin support. A restrained display face may be used only if performance and readability remain strong. Use fluid type scales with comfortable line length (roughly 60–75 characters for body copy).

## Layout

- Mobile-first responsive grid
- Maximum content width around 1200–1280 px, subject to testing
- Narrow reading width for articles and legal content
- 8 px base spacing rhythm with semantic tokens
- Consistent section spacing; avoid excessive empty hero height
- Sticky header only if it does not consume too much mobile space

## Core components

- Header, mega menu and mobile navigation
- Announcement/availability bar when genuinely needed
- Hero variants
- Problem/service/solution cards
- Service comparison and service finder
- Process steps
- Trust/proof strip
- Testimonials only with approved content
- Case-study preview
- Article card and table of contents
- FAQ accordion
- Search/filter controls
- Booking type card and availability states
- Support triage stepper
- Forms, file upload, validation summary and confirmation
- Product card, gallery, price, stock status, cart drawer, checkout summary
- CTA band, footer and contact options
- Toasts, dialogs, skeletons, empty/error states
- Consent/cookie controls if required by actual analytics stack

## Interaction

Motion communicates hierarchy and state. Keep transitions roughly 150–300 ms. Respect `prefers-reduced-motion`. Avoid scroll hijacking, autoplay background video, cursor effects, parallax-heavy pages, and animations that delay a task.

## Accessibility

Target WCAG 2.2 AA:

- keyboard-operable navigation and controls;
- skip link and logical heading order;
- visible focus;
- touch targets at least 44 by 44 CSS pixels where practical;
- labels, descriptions, and error associations;
- status updates announced appropriately;
- accessible dialogs and menus;
- captions/transcripts for meaningful media;
- no essential information hidden in hover states;
- useful alt text and decorative-image handling.

## Content UI rules

- State benefits before features.
- Keep jargon defined or expandable.
- Show starting prices only when approved and explain scope.
- Use comparison tables sparingly and make them responsive.
- Make phone/email links usable but prevent scraping where practical.
- Never use fake urgency, fake counters, fake chat messages, or preselected paid extras.

## Design QA

Test at minimum:

- 320 px and 390 px mobile widths
- tablet portrait
- 1280 px desktop
- large desktop without uncontrolled stretching
- keyboard-only flow
- 200% zoom
- reduced motion
- high-content cases (long titles, errors, unavailable slots, out-of-stock products)
