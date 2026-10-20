import Link from "next/link";
import { calendarMonthDays, BRISBANE_TIME_ZONE, type CalendarView } from "../range";
import type { AdminRequestActivity } from "../repository";

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "full",
  timeZone: BRISBANE_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: BRISBANE_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: BRISBANE_TIME_ZONE,
});

function ActivityEventLink({ event, compact = false }: { event: AdminRequestActivity["events"][number]; compact?: boolean }) {
  return <Link
    aria-label={`${event.title}, ${event.reference}, ${event.serviceLabel}, ${dateTimeFormatter.format(event.at)}`}
    className={`activity-event activity-event--${event.type}`}
    href={event.href}
  >
    <span className="activity-event__dot" aria-hidden="true" />
    <span><strong>{compact ? event.reference : event.title}</strong>{compact ? <small>{event.type === "created" ? "Received" : "Resolved"}</small> : <small>{event.reference} · {event.serviceLabel}</small>}</span>
    {compact ? <time dateTime={event.at.toISOString()}>{timeFormatter.format(event.at)}</time> : null}
  </Link>;
}

function ActivityList({ data, headingLevel = "h2" }: { data: AdminRequestActivity; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const groups = new Map<string, AdminRequestActivity["events"]>();
  for (const event of data.events) groups.set(event.date, [...(groups.get(event.date) ?? []), event]);
  if (!data.events.length) return <div className="activity-empty"><span aria-hidden="true">○</span><h2>No recorded activity</h2><p>No request creation or resolution events match these filters for {data.range.label}.</p></div>;
  return <ol className="activity-list">
    {[...groups].map(([date, events]) => <li key={date}>
      <Heading><time dateTime={date}>{dateFormatter.format(events[0].at)}</time></Heading>
      <ol>{events.map((event) => <li key={`${event.type}-${event.id}`}><ActivityEventLink event={event} /><time className="activity-list__time" dateTime={event.at.toISOString()}>{timeFormatter.format(event.at)}</time></li>)}</ol>
    </li>)}
  </ol>;
}

export function RequestActivityCalendar({ data, listHref, view }: { data: AdminRequestActivity; listHref: string; view: CalendarView }) {
  if (view === "list") return <section aria-labelledby="activity-list-title" className="activity-list-view"><header><h2 id="activity-list-title">Chronological activity</h2><p>Recorded request events in Australia/Brisbane time, oldest first.</p></header><ActivityList data={data} headingLevel="h3" /></section>;

  const eventsByDate = new Map<string, AdminRequestActivity["events"]>();
  for (const event of data.events) eventsByDate.set(event.date, [...(eventsByDate.get(event.date) ?? []), event]);
  const days = calendarMonthDays(`${data.range.year}-${String(data.range.month).padStart(2, "0")}`);

  return <section aria-labelledby="activity-month-title" className="activity-month-view">
    <header><h2 id="activity-month-title">Monthly activity</h2><p>Request activity by Brisbane calendar day.</p></header>
    {!data.events.length ? <div className="activity-empty"><span aria-hidden="true">○</span><h3>No recorded activity</h3><p>No request creation or resolution events match these filters for {data.range.label}.</p></div> : null}
    <div className="activity-calendar-grid">
      <table>
        <caption>{data.range.label} request activity. Events are operational records, not appointments.</caption>
        <thead><tr>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => <th key={day} scope="col"><span aria-hidden="true">{day.slice(0, 3)}</span><span className="sr-only">{day}</span></th>)}</tr></thead>
        <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((day) => {
          const events = eventsByDate.get(day.date) ?? [];
          return <td className={day.inMonth ? undefined : "is-outside-month"} key={day.date}>
            <time className="activity-calendar-grid__day" dateTime={day.date}>{day.day}</time>
            <div>{events.slice(0, 3).map((event) => <ActivityEventLink compact event={event} key={`${event.type}-${event.id}`} />)}
              {events.length > 3 ? <Link className="activity-calendar-grid__more" href={`${listHref}#activity-list-title`}>+{events.length - 3} more</Link> : null}
            </div>
          </td>;
        })}</tr>)}</tbody>
      </table>
    </div>
    <div className="activity-calendar-mobile" aria-label="Mobile chronological activity"><ActivityList data={data} headingLevel="h3" /></div>
  </section>;
}
