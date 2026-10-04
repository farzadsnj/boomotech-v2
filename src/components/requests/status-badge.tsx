import type { RequestPriority, RequestStatus } from "@/features/requests/workflow";
import { priorityLabels, statusLabels } from "@/features/requests/workflow";

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span aria-label={`Status: ${statusLabels[status]}`} className={`request-badge request-badge--status-${status.toLowerCase()}`}>{statusLabels[status]}</span>;
}

export function RequestPriorityBadge({ priority }: { priority: RequestPriority }) {
  return <span aria-label={`Priority: ${priorityLabels[priority]}`} className={`request-badge request-badge--priority-${priority.toLowerCase()}`}>{priorityLabels[priority]} priority</span>;
}
