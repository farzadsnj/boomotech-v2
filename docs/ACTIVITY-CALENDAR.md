# Administrator request activity calendar

## Phase-one scope

`/admin/calendar` is an administrator-only operational view of persisted request activity. It shows:

- the timestamp at which a request was recorded;
- each persisted administrator resolution-event timestamp, including historical resolutions when a request is later reopened;
- links to the existing authorised administrator request detail page; and
- filters for month, service and event type.

Every date boundary, label and time uses `Australia/Brisbane`. The underlying timestamps remain timezone-aware PostgreSQL values. Request creation uses the request row timestamp and resolution uses the persisted `ADMIN_RESOLVED_REQUEST` audit event, so reopening a request does not erase its earlier activity. The repository calculates the selected Brisbane month as a half-open UTC range so events around midnight are assigned to the correct local date.

The calendar never describes an event as an appointment. BoomoTech has no approved appointment, staff availability, reminder or calendar-integration model. A booking request remains a request until a separate scheduling design and operating process are approved.

## Authorization and privacy

The page checks the Better Auth session, administrator role and completed MFA on the server before querying activity. The repository repeats the administrator authorization check before database access. Calendar projections contain only the request reference, service, status and event timestamp. Customer names, contact information, messages and internal notes are not selected.

No calendar data is cached publicly. Each event links to `/admin/requests/[reference]`, which performs its own administrator authorization checks.

## Rendering and dependency choice

The phase-one calendar is a Server Component with a semantic month table and an accessible chronological list. Filters and view selection use URL query parameters. On small screens, the chronological list replaces the dense month grid.

FullCalendar was reviewed because the legacy dashboard uses it. Its React wrapper, core and view plugins would add client JavaScript, styling and event-editing concepts that this read-only two-event calendar does not need. The server-rendered implementation has no calendar runtime dependency and provides the required month and list views without browser-only state. FullCalendar can be reconsidered if an approved scheduling model later requires dense multi-resource calendars, drag-and-drop or advanced recurrence.

## Deferred scheduling capabilities

The following remain deliberately unavailable:

- confirmed appointment creation;
- browser-created or deleted calendar events;
- staff availability and assignment;
- reminders;
- recurring events; and
- Google, Microsoft or other external calendar integrations.

These features require approved operational rules, privacy and retention decisions, notification behaviour, authorization boundaries and an additive database model before implementation.
