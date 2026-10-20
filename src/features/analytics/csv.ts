import { adminStatusLabels, type RequestStatus } from "@/features/requests/workflow";
import type { AdminAnalyticsData } from "./repository";
import { analyticsPeriodLabels } from "./range";

export function escapeCsvCell(value: string | number) {
  let text = String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function row(values: (string | number)[]) {
  return values.map(escapeCsvCell).join(",");
}

export function createOperationalSummaryCsv(data: AdminAnalyticsData) {
  const lines = [
    row(["BoomoTech operational summary"]),
    row(["Reporting period", analyticsPeriodLabels[data.period]]),
    row(["Date range", data.range.label]),
    "",
    row(["Summary metric", "Count"]),
    row(["Requests received", data.summary.requestsReceived]),
    row(["Requests resolved", data.summary.requestsResolved]),
    row(["Outstanding requests", data.summary.outstanding]),
    row(["High-priority outstanding", data.summary.highPriorityOutstanding]),
    row(["Registered customer growth", data.summary.registeredCustomers]),
    "",
    row(["Daily activity"]),
    row(["Date", "Requests received", "Requests resolved", "Registered customers"]),
    ...data.daily.map((item) => row([item.date, item.received, item.resolved, item.customers])),
    "",
    row(["Requests grouped by service"]),
    row(["Service", "Count"]),
    ...data.services.map((item) => row([item.label, item.count])),
    "",
    row(["Request status distribution"]),
    row(["Status", "Count"]),
    ...data.statuses.map((item) => row([adminStatusLabels[item.status as RequestStatus] ?? item.status, item.count])),
  ];
  return `${lines.join("\r\n")}\r\n`;
}

