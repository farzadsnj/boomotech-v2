"use client";

import dynamic from "next/dynamic";
import type { AdminAnalyticsData } from "../repository";

const AnalyticsCharts = dynamic(() => import("./analytics-charts").then((module) => module.AnalyticsCharts), {
  loading: () => <div aria-label="Loading charts" className="analytics-chart-grid" role="status">{Array.from({ length: 5 }, (_, index) => <div className="analytics-chart-skeleton" key={index} />)}</div>,
  ssr: false,
});

export function AnalyticsChartsLoader({ data }: { data: AdminAnalyticsData }) {
  return <AnalyticsCharts data={data} />;
}
