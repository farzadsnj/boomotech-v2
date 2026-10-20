"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import type { AdminAnalyticsData } from "../repository";

const colours = {
  blue: "#0070b7",
  cyan: "#3aaed8",
  green: "#21865f",
  navy: "#1d3a49",
  orange: "#c66b18",
  purple: "#7650a5",
  red: "#b44b38",
};

const statusLabels: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  AWAITING_USER: "Awaiting customer",
  RESOLVED: "Resolved",
  WITHDRAWN: "Withdrawn",
};

const statusColours = [colours.orange, colours.blue, colours.purple, colours.green, colours.navy];
const tooltipStyle = { border: "1px solid #b8cdd6", borderRadius: ".5rem", color: "#183543", fontSize: ".78rem" };

function ChartCard({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return <section className="analytics-chart-card">
    <header><h2>{title}</h2><p>{description}</p></header>
    {children}
  </section>;
}

function EmptyChart({ message }: { message: string }) {
  return <div className="analytics-chart-empty"><span aria-hidden="true">0</span><p>{message}</p></div>;
}

export function AnalyticsCharts({ data }: { data: AdminAnalyticsData }) {
  const statusData = data.statuses.filter((item) => item.count > 0).map((item) => ({ ...item, label: statusLabels[item.status] ?? item.status }));
  const serviceHeight = Math.max(240, data.services.length * 46);
  const anyDailyRequests = data.daily.some((item) => item.received > 0);
  const anyDailyActivity = data.daily.some((item) => item.received > 0 || item.resolved > 0);
  const anyCustomers = data.daily.some((item) => item.customers > 0);

  return <div className="analytics-chart-grid">
    <ChartCard description="Requests created on each Brisbane calendar day." title="Requests received over time">
      {anyDailyRequests ? <div aria-label="Line chart of requests received by date" className="analytics-chart-canvas" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data.daily} margin={{ bottom: 4, left: -18, right: 12, top: 12 }} accessibilityLayer>
            <CartesianGrid stroke="var(--dashboard-border)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toLocaleString("en-AU"), "Requests"]} />
            <Line dataKey="received" dot={false} isAnimationActive={false} name="Requests received" stroke={colours.blue} strokeWidth={3} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div> : <EmptyChart message="No requests were received in this period." />}
    </ChartCard>

    <ChartCard description="Requests created during the selected period, grouped by service." title="Requests by service">
      {data.services.length ? <div aria-label="Bar chart of requests grouped by service" className="analytics-chart-canvas analytics-chart-canvas--services" role="img" style={{ height: serviceHeight }}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data.services} layout="vertical" margin={{ bottom: 4, left: 6, right: 18, top: 8 }} accessibilityLayer>
            <CartesianGrid stroke="var(--dashboard-border)" strokeDasharray="4 4" horizontal={false} />
            <XAxis allowDecimals={false} stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 11 }} type="number" />
            <YAxis dataKey="label" stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 10 }} type="category" width={132} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toLocaleString("en-AU"), "Requests"]} />
            <Bar dataKey="count" fill={colours.blue} isAnimationActive={false} name="Requests" radius={[0, 5, 5, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <EmptyChart message="No service demand is available for this period." />}
    </ChartCard>

    <ChartCard description="Current status of requests created during the selected period." title="Status distribution">
      {statusData.length ? <div aria-label="Donut chart of request status distribution" className="analytics-chart-canvas" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart accessibilityLayer>
            <Pie cx="50%" cy="46%" data={statusData} dataKey="count" innerRadius="48%" isAnimationActive={false} nameKey="label" outerRadius="72%" paddingAngle={2}>
              {statusData.map((item) => <Cell fill={statusColours[data.statuses.findIndex((status) => status.status === item.status) % statusColours.length]} key={item.status} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toLocaleString("en-AU"), "Requests"]} />
            <Legend iconType="circle" verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </div> : <EmptyChart message="There are no request statuses to report for this period." />}
    </ChartCard>

    <ChartCard description="Requests created compared with requests resolved on each Brisbane calendar day." title="New versus resolved">
      {anyDailyActivity ? <div aria-label="Bar chart comparing received and resolved requests by date" className="analytics-chart-canvas" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={data.daily} margin={{ bottom: 4, left: -18, right: 12, top: 12 }} accessibilityLayer>
            <CartesianGrid stroke="var(--dashboard-border)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="received" fill={colours.blue} isAnimationActive={false} name="Received" radius={[4, 4, 0, 0]} />
            <Bar dataKey="resolved" fill={colours.green} isAnimationActive={false} name="Resolved" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <EmptyChart message="No requests were received or resolved in this period." />}
    </ChartCard>

    <ChartCard description="New registered customer accounts by Brisbane calendar day." title="Registered customer growth">
      {anyCustomers ? <div aria-label="Line chart of new registered customers by date" className="analytics-chart-canvas" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={data.daily} margin={{ bottom: 4, left: -18, right: 12, top: 12 }} accessibilityLayer>
            <CartesianGrid stroke="var(--dashboard-border)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" interval="preserveStartEnd" minTickGap={24} stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} stroke="var(--dashboard-ink-soft)" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [Number(value).toLocaleString("en-AU"), "Customers"]} />
            <Line dataKey="customers" dot={false} isAnimationActive={false} name="Registered customers" stroke={colours.cyan} strokeWidth={3} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div> : <EmptyChart message="No customer accounts were registered in this period." />}
    </ChartCard>
  </div>;
}
