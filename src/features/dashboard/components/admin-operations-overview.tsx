import Link from "next/link";
import type { CSSProperties } from "react";
import { RequestPriorityBadge, RequestStatusBadge } from "@/components/requests/status-badge";
import { serviceLabel } from "@/features/booking/booking-schema";
import { reportingPeriodLabels, reportingPeriods, type ReportingPeriod } from "@/features/dashboard/reporting";
import { brisbaneDateTime, formatRequestEvent } from "@/features/requests/format";
import type { getAdminOperationsDashboard } from "@/features/requests/repository";
import { DashboardCard, DashboardEmptyState, DashboardMetricCard } from "./dashboard-card";

type OperationsData = Awaited<ReturnType<typeof getAdminOperationsDashboard>>;

function queueHref(period: ReportingPeriod, filters: Record<string, string> = {}) {
  const params = new URLSearchParams({ period, ...filters });
  return `/admin?${params.toString()}#request-list`;
}

function RequestList({ empty, requests }: { empty: string; requests: OperationsData["recentRequests"] }) {
  if (!requests.length) return <DashboardEmptyState description={empty} title="No matching requests" />;
  return <ul className="operations-request-list">{requests.map((request) => <li key={request.id}>
    <Link href={`/admin/requests/${request.reference}`}>
      <span className="operations-request-list__top"><strong>{request.reference}</strong><span aria-hidden="true">→</span></span>
      <span className="operations-request-list__service">{serviceLabel(request.servicePath)}</span>
      <span className="operations-request-list__customer">{request.fullName}</span>
      <span className="request-badges"><RequestStatusBadge audience="admin" status={request.status} /><RequestPriorityBadge priority={request.priority} /></span>
      <time dateTime={request.createdAt.toISOString()}>{brisbaneDateTime.format(request.createdAt)}</time>
    </Link>
  </li>)}</ul>;
}

export function AdminOperationsOverview({ customerCount, data, period }: { customerCount: number; data: OperationsData; period: ReportingPeriod }) {
  const { summary } = data;
  const periodLabel = reportingPeriodLabels[period];
  const workloadPercentage = summary.total ? Math.round((summary.outstanding / summary.total) * 100) : 0;
  return <div className="operations-overview">
    <div className="operations-overview__toolbar">
      <div><h2>Operations at a glance</h2><p>Request and customer activity for {periodLabel.toLowerCase()}.</p></div>
      <form method="get"><label htmlFor="reporting-period">Reporting period</label><select defaultValue={period} id="reporting-period" name="period">{reportingPeriods.map((value) => <option key={value} value={value}>{reportingPeriodLabels[value]}</option>)}</select><button type="submit">Update</button></form>
    </div>

    <ul aria-label={`Operations summary for ${periodLabel}`} className="operations-metrics">
      <DashboardMetricCard description={periodLabel} href={queueHref(period)} label="Total requests" value={summary.total} />
      <DashboardMetricCard description="Needs triage" href={queueHref(period, { status: "NEW" })} label="New" tone={summary.NEW ? "attention" : "default"} value={summary.NEW} />
      <DashboardMetricCard description="Being handled" href={queueHref(period, { status: "IN_PROGRESS" })} label="In progress" value={summary.IN_PROGRESS} />
      <DashboardMetricCard description="Customer response needed" href={queueHref(period, { status: "AWAITING_USER" })} label="Awaiting customer" value={summary.AWAITING_USER} />
      <DashboardMetricCard description="Completed work" href={queueHref(period, { status: "RESOLVED" })} label="Resolved" tone="positive" value={summary.RESOLVED} />
      <DashboardMetricCard description="Closed by customer" href={queueHref(period, { status: "WITHDRAWN" })} label="Withdrawn" value={summary.WITHDRAWN} />
      <DashboardMetricCard description={periodLabel} href="/admin/customers" label="Registered customers" linkLabel="View customer directory" value={customerCount} />
    </ul>

    <div className="operations-grid operations-grid--workload">
      <DashboardCard className="operations-workload" description="Active work excludes resolved and withdrawn requests." title="Outstanding work" titleId="outstanding-work">
        <div className="operations-workload__summary">
          <div aria-label={`${summary.outstanding} of ${summary.total} requests are outstanding`} className="operations-progress" style={{ "--operations-progress": `${workloadPercentage * 3.6}deg` } as CSSProperties}><span><strong>{summary.outstanding}</strong><small>active</small></span></div>
          <div><p><strong>{summary.highPriorityOutstanding}</strong> high-priority request{summary.highPriorityOutstanding === 1 ? "" : "s"} need attention.</p><Link href={queueHref(period, { priority: "HIGH", scope: "outstanding" })}>Review high-priority work <span aria-hidden="true">→</span></Link><Link href={queueHref(period, { scope: "outstanding" })}>View all outstanding work</Link></div>
        </div>
      </DashboardCard>
      <DashboardCard description="High-priority requests that remain active." title="Priority queue" titleId="priority-queue"><RequestList empty="There are no outstanding high-priority requests in this reporting period." requests={data.highPriorityRequests} /></DashboardCard>
    </div>

    <div className="operations-grid operations-grid--activity">
      <DashboardCard description="The newest requests received during this reporting period." title="Recent requests" titleId="recent-requests"><RequestList empty="No requests were received in this reporting period." requests={data.recentRequests} /></DashboardCard>
      <DashboardCard description="Persisted request workflow events, newest first." title="Recent activity" titleId="recent-activity">
        {data.recentActivity.length ? <ol className="operations-activity-list">{data.recentActivity.map((event) => { const formatted = formatRequestEvent(event); return <li key={event.id}><span className="operations-activity-list__marker" aria-hidden="true" /><div><Link href={`/admin/requests/${event.reference}`}>{formatted.label}</Link><p>{serviceLabel(event.servicePath)} · {event.reference}</p>{formatted.transition ? <span>{formatted.transition}</span> : null}<time dateTime={event.createdAt.toISOString()}>{brisbaneDateTime.format(event.createdAt)}</time></div></li>; })}</ol> : <DashboardEmptyState description="Workflow changes will appear after requests are processed or customers update them." title="No recent activity" />}
      </DashboardCard>
    </div>
  </div>;
}
