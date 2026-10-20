import type { RequestPriority, RequestStatus } from "@/features/requests/workflow";
import { adminStatusLabels, priorityLabels, statusLabels } from "@/features/requests/workflow";

export function RequestStatusBadge({ audience = "customer", status }: { audience?: "admin" | "customer"; status: RequestStatus }) {
  const label = audience === "admin" ? adminStatusLabels[status] : statusLabels[status];
  return <span aria-label={`Status: ${label}`} className={`request-badge request-badge--status-${status.toLowerCase()}`}>{label}</span>;
}

export function RequestPriorityBadge({ priority }: { priority: RequestPriority }) {
  return <span aria-label={`Priority: ${priorityLabels[priority]}`} className={`request-badge request-badge--priority-${priority.toLowerCase()}`}>{priorityLabels[priority]} priority</span>;
}
