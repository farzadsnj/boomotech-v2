export const brisbaneDateTime = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Australia/Brisbane",
});

const eventLabels: Record<string, string> = {
  ADMIN_STARTED_PROCESSING: "Started processing",
  ADMIN_CHANGED_STATUS: "Status changed",
  ADMIN_CHANGED_PRIORITY: "Priority changed",
  ADMIN_REPLIED: "Response sent",
  ADMIN_RESOLVED_REQUEST: "Request resolved",
  ADMIN_REOPENED_REQUEST: "Request reopened",
  ADMIN_UPDATED_INTERNAL_NOTES: "Internal notes updated",
  CUSTOMER_REPLIED: "Customer replied",
  CUSTOMER_EDITED_DESCRIPTION: "Customer updated request",
  CUSTOMER_WITHDREW_REQUEST: "Customer withdrew request",
};

const stateLabels: Record<string, string> = {
  NEW: "New", IN_PROGRESS: "In progress", AWAITING_USER: "Waiting for customer",
  RESOLVED: "Resolved", WITHDRAWN: "Withdrawn", HIGH: "High", MEDIUM: "Medium", LOW: "Low",
};

export function formatRequestEvent(event: { eventType: string; fromStatus: string | null; toStatus: string | null; fromPriority: string | null; toPriority: string | null }) {
  const label = eventLabels[event.eventType] ?? "Request updated";
  const from = event.fromStatus ?? event.fromPriority;
  const to = event.toStatus ?? event.toPriority;
  return { label, transition: from && to && from !== to ? `${stateLabels[from] ?? from} → ${stateLabels[to] ?? to}` : null };
}
