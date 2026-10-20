# In-app notifications

BoomoTech stores dashboard notification metadata separately from outbound email delivery. The notification bell performs one bounded request when a protected dashboard shell loads and refreshes only after the user changes read state. It does not poll continuously.

## Audience and authorization

- New requests and customer replies create role-scoped administrator notifications.
- Administrator replies and meaningful status updates create notifications only for the immutable `booking_request.user_id` owner. Guest requests do not receive dashboard notifications.
- Every list and mutation checks the current session again. Administrators require the `admin` role and completed MFA. Customers require a verified account.
- Notification destinations are derived on the server from the authorised request reference. Stored message bodies, contact details, internal notes, session data and email-delivery errors are not returned.

Administrator notifications are shared events with per-administrator read receipts. One administrator reading an item does not mark it read for another. Customer notifications carry one recipient user ID and cannot be read or marked by another account.

## Persistence and deduplication

Migration `0007_curious_pepper_potts.sql` adds:

- `in_app_notification`, which stores the audience, related request, notification kind and a unique domain-event dedupe key;
- `in_app_notification_read`, which stores a read timestamp for each notification and user.

Workflow actions create their request update, audit event, email outbox record where applicable, and in-app notification in the same database transaction. Unique dedupe keys prevent the same workflow action from creating multiple dashboard items. Resend retries remain governed only by `notification_outbox`.

Notification rows cascade with the related request. Customer-targeted rows and read receipts also cascade when that customer account is deleted. No separate time-based deletion is claimed until the owner approves the request and audit retention policy.

## Routes

- `GET /api/notifications` returns only the current user’s bounded notification projection and unread count.
- `POST /api/notifications` accepts validated `read` and `read-all` mutations from an approved same-origin request.
- `/notifications` provides the protected paginated view for either dashboard role.

These routes are dynamic, non-indexed and covered by the existing no-store security headers for application APIs and protected pages.
