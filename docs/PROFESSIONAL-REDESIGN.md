# Professional site redesign

## Information architecture

The public experience uses five primary navigation destinations: Services, Solutions, Resources, About and Support. Blog and the IT Health Check sit under Resources. The client portal remains a clearly labelled utility action and the consultation request remains the primary conversion action.

Services are organised around four customer goals:

- **Support:** everyday IT, managed IT and Microsoft 365;
- **Secure:** cybersecurity, backup and recovery, and network foundations;
- **Improve:** cloud infrastructure and responsible automation;
- **Build:** web and software, digital presence, and UI, UX and branding.

The service catalogue remains the source of truth. Navigation, the homepage capability system and the services directory derive from that catalogue through `src/content/service-groups.ts`.

Public search is a local, read-only index assembled from approved services, solutions, resources, published articles, FAQs and support information. It does not call an external search service, store queries or include account, administration, legal or disabled shop content. Service preparation questions also remain in browser memory only; their support link carries the approved service path and never carries the visitor's answers.

## Visual direction

The redesign keeps the approved BoomoTech blue and ink palette while increasing contrast between editorial white space and deep navy technical surfaces. Layouts use structured grids, visible sequence numbers, restrained system diagrams and the real brand mark. Interaction movement is reserved for controls and linked cards and continues to respect reduced motion.

## Content and trust decisions

- Brisbane and remote options across Australia are the only published location claims.
- Featured work uses a typed architecture with an honest fallback until owner-approved project records are available.
- The IT Health Check is deterministic, stores no answers and is explicitly general guidance.
- No testimonials, awards, partnerships, prices, response promises or outcome statistics were added.
- A dedicated suburb or location landing page was deferred because there is not yet enough approved, unique local content to justify one.

## Phase 2 backlog

- Publish approved case studies with client permission and reviewed outcomes.
- Extend search filters only when the public resource library is large enough to justify additional controls.
- Add a Brisbane service-area page only when the owner approves unique coverage, onsite and contact information.
- Review professional photography or commissioned illustration when approved assets are available.
- Review the conversion path using privacy-respecting aggregate evidence after an analytics approach is approved.
## Founder portrait

The About page includes a deliberately sized founder portrait slot. Until an approved photograph is supplied it renders a branded placeholder without layout shift. Add the approved image at `public/images/founder/farzad-sanjarani.jpg`, then set `founderProfile.image` in `src/content/founder.ts` to that path with a concise, meaningful alt description. Use a portrait crop with enough resolution for the rendered 4:5 frame and confirm usage rights before publishing.
