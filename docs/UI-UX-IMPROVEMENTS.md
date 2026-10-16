# UI and UX Improvement Pass

Implementation date: 15 October 2026  
Branch: `feat/website-optimisation-audit`

This pass builds on the uncommitted website optimisation audit. It preserves
the current identity, authentication, administrator MFA, booking, support,
indexing and security controls.

## Responsive layout

The shared content container now grows fluidly to 1440 px with responsive
gutters. Text components retain their own readable maximum widths while grids,
the service pathfinder and hero use the additional space. The supported visual
review widths are 375, 768, 1024, 1440 and 1920 px, with the existing 320 and
390 px regression coverage retained.

## Navigation

The Services mega menu includes a lightweight service-discovery panel. It cycles
through common problems and links each prompt to an existing approved service.
Hover and keyboard interaction pause the typing effect. Reduced-motion users see
a stable prompt, and the changing visual text is hidden from assistive technology
to avoid repeated announcements.

The Resources navigation is now labelled **Resources & Learning** and separates
blog posts, the future learning portal, the IT Health Check and FAQs. Pricing is
a distinct primary navigation item. Mobile navigation exposes the same routes.

Navigation underline animation is limited to top-level navigation links. Mega
menu links use one conventional text underline, preventing overlapping underline
and pseudo-element effects while retaining visible focus outlines.

## Orbital diagrams

The homepage Understand / Plan / Improve diagram and About page Listen / Clarify /
Build diagram share `OrbitDiagram`. Movement uses CSS transforms, pauses for
hover or focus, retains readable label orientation and stops under
`prefers-reduced-motion`. Every stage is a keyboard-operable button. Focus, hover
or tap reveals a reserved contextual panel; Escape or the close control dismisses
it without moving surrounding layout.

## FAQs

The public FAQ collection now contains 15 reviewed questions, including ten new
practical questions about preparation, slow computers, Wi-Fi, Microsoft 365,
backups, network security, websites, automation and consultation requests.
Optional typed related links keep answers concise while providing a useful next
step.

## Learning portal architecture

`src/content/learning.ts` is the single typed source for learning categories and
future portal stages. `/learning` clearly states that courses are not open and
links visitors to current reviewed articles and services. Courses, lessons,
quizzes and account progress are represented only as future structure. No
learning management system or unavailable enrolment flow was added.

## Pricing architecture

`src/content/pricing.ts` contains seven editable service pricing records. Each
record includes its service route, summary, possible inclusions, pricing basis
and limitations. `/pricing` publishes no numeric rate because the owner has not
approved one. Every card links to service information and the existing secure
booking request, which does not confirm an appointment or price.

## Known limitations and owner decisions

- Fixed or starting prices require owner approval and operational scope.
- Onsite service area, travel costs, availability and response expectations are
  still unconfirmed.
- Learning content needs an editorial review and course delivery decision before
  courses, quizzes or progress tracking can be activated.
- The referenced five-page Word file was not present in the supplied attachment
  folder; implementation follows the written requirements and existing design
  system rather than claiming pixel comparison with unavailable screenshots.
