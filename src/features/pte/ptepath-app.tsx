"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth/client";
import { authHref, PTE_RETURN_PATH } from "@/lib/auth/return-path";
import { academicCollocations, pteLessons } from "./learning-content";
import {
  exerciseBank,
  exerciseById,
  exercisesByTask,
  pteOfficialSources,
  pteTaskGuidance,
} from "./exercise-bank";
import { adjacentPairScore, writingFormChecks } from "./logic";
import { localDateInTimeZone, prioritiseMistakes } from "./planning";
import { pteTaskTypes, taskLabels, type PteExercise } from "./types";
import type {
  LearningAttempt,
  LearningDraft,
  LearningManualScore,
  LearningMistake,
  LearningPlanDay,
  LearningProfile,
  LearningSnapshot,
  LearningUser,
} from "./client-types";
import s from "./ptepath.module.css";

type View =
  | "dashboard"
  | "practice"
  | "mistakes"
  | "grammar"
  | "progress"
  | "plan"
  | "settings";
const viewPaths: Record<View, string> = {
  dashboard: PTE_RETURN_PATH,
  practice: `${PTE_RETURN_PATH}/practice`,
  mistakes: `${PTE_RETURN_PATH}/mistakes`,
  grammar: `${PTE_RETURN_PATH}/grammar`,
  progress: `${PTE_RETURN_PATH}/progress`,
  plan: `${PTE_RETURN_PATH}/plan`,
  settings: `${PTE_RETURN_PATH}/settings`,
};
const nav: Array<[View, string, string]> = [
  ["dashboard", "My dashboard", "⌂"],
  ["practice", "Practice studio", "▤"],
  ["mistakes", "Mistake notebook", "✓"],
  ["grammar", "Grammar & collocations", "✦"],
  ["progress", "My progress", "↗"],
  ["plan", "My study plan", "□"],
];

export function PtePathApp({
  user,
  initial,
  initialView,
}: {
  user: LearningUser | null;
  initial: LearningSnapshot | null;
  initialView: View;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState(initial);
  const [status, setStatus] = useState(user ? "Saved" : "Preview mode");
  const [active, setActive] = useState<PteExercise | null>(null);
  const [slide, setSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [manualCarousel, setManualCarousel] = useState(false);
  const mistakes = snapshot?.mistakes.filter((item) => !item.reviewedAt) ?? [];
  const profile = snapshot?.profile ?? null;
  const target = profile?.targetScore ? `${profile.targetScore}+` : "79+";
  const name = user?.name.split(/\s+/u)[0] ?? "Learner";
  useEffect(() => {
    if (
      manualCarousel ||
      carouselPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = window.setInterval(
      () => setSlide((value) => (value + 1) % 5),
      7_000,
    );
    return () => window.clearInterval(id);
  }, [carouselPaused, manualCarousel]);
  const refresh = async () => {
    if (!user) return;
    const response = await fetch("/api/learning/pte", { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as LearningSnapshot & {
        user: LearningUser;
      };
      setSnapshot(data);
    }
  };
  const navigate = (view: View) => router.push(viewPaths[view]);
  const open = (exercise: PteExercise) => {
    if (!user) {
      router.push(authHref("/login", pathname));
      return;
    }
    setActive(exercise);
  };
  const signOut = async () => {
    setStatus("Signing out…");
    setActive(null);
    setSnapshot(null);
    await authClient.signOut();
    router.replace(authHref("/login", PTE_RETURN_PATH));
    router.refresh();
  };
  if (user && (!profile || !profile.onboardingComplete))
    return (
      <div className={s.shell}>
        <Onboarding
          user={user}
          initial={profile}
          onSaved={async () => {
            await refresh();
            router.refresh();
          }}
        />
      </div>
    );
  const slides = [
    {
      kicker: "YOUR PERSONAL TARGET",
      title: `${target} is your goal—not a promise.`,
      body: profile
        ? `Your ${profile.durationDays}-study-day plan adapts future work without erasing past attempts.`
        : "Sign in to choose your own timeframe, study days and personal target.",
      action: user ? "Open my study plan" : "Create my study space",
      run: () =>
        user
          ? navigate("plan")
          : router.push(authHref("/register", PTE_RETURN_PATH)),
      art: target,
    },
    {
      kicker: "READING PRACTICE",
      title: "Blanks, paragraph order and comprehension.",
      body: "Work through five current Reading task types with checked answers and plain-language explanations.",
      action: "Explore Reading practice",
      run: () =>
        user
          ? navigate("practice")
          : router.push(authHref("/login", PTE_RETURN_PATH)),
      art: "READ",
    },
    {
      kicker: "WRITING PRACTICE",
      title: "Summaries, essays and guided revision.",
      body: "Use form checks, complete model responses and self-review without a fabricated automated score.",
      action: "Explore Writing practice",
      run: () =>
        user
          ? navigate("practice")
          : router.push(authHref("/login", PTE_RETURN_PATH)),
      art: "WRITE",
    },
    {
      kicker: "LEARN FROM MISTAKES",
      title: "Turn errors into the next lesson.",
      body: "Revisit explanations, related grammar and collocations, then retry the original skill.",
      action: "Open mistake notebook",
      run: () =>
        user
          ? navigate("mistakes")
          : router.push(authHref("/login", PTE_RETURN_PATH)),
      art: "RETRY",
    },
    {
      kicker: "COMING LATER",
      title: "Speaking and Listening practice",
      body: "These practice areas are not active yet. No launch date or complete-exam coverage is promised.",
      action: "Review current Reading & Writing",
      run: () => navigate("practice"),
      art: "SOON",
    },
  ];
  const current = slides[slide];
  return (
    <div className={s.shell}>
      <a className={s.skip} href="#pte-main">
        Skip to practice content
      </a>
      <aside className={s.sidebar}>
        <Link
          aria-label="PTEpath home"
          className={s.brand}
          href={PTE_RETURN_PATH}
        >
          <span className={s.brandIcon}>p↗</span>PTE
          <span className={s.brandLight}>path</span>
        </Link>
        <Link className={s.by} href="/">
          BY BOOMOTECH
        </Link>
        <span className={s.label}>YOUR STUDY SPACE</span>
        <nav aria-label="PTEpath" className={s.nav}>
          {nav.map(([id, label, icon]) => (
            <Link
              aria-current={initialView === id ? "page" : undefined}
              aria-label={label}
              href={viewPaths[id]}
              key={id}
            >
              <Icon value={icon} />
              <span>{label}</span>
              {id === "mistakes" && mistakes.length ? (
                <b className={s.badge}>{mistakes.length}</b>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className={s.goal}>
          <strong>A little better, every day.</strong>
          <p>Small steps. Clear feedback. Your path follows your own target.</p>
          <div className={s.goalBar}>
            <span
              style={{
                width: `${Math.min(100, (snapshot?.attempts.length ?? 0) * 2.5)}%`,
              }}
            />
          </div>
        </div>
        <Link
          aria-label="Study settings"
          className={s.settings}
          href={viewPaths.settings}
        >
          <Icon value="⚙" />
          <span>Study settings</span>
        </Link>
        <Link
          aria-label="BoomoTech account settings"
          className={s.profile}
          href={
            user ? "/dashboard/settings" : authHref("/login", PTE_RETURN_PATH)
          }
        >
          <span className={s.avatar}>{initials(user?.name)}</span>
          <span>
            <strong>{user?.name ?? "Guest preview"}</strong>
            <small>{user?.email ?? "Use a BoomoTech account"}</small>
          </span>
        </Link>
      </aside>
      <div className={s.content}>
        <header className={s.topbar}>
          <span>
            MY LEARNING /{" "}
            <strong>
              {nav.find(([id]) => id === initialView)?.[1] ?? "PTEpath"}
            </strong>
          </span>
          <div>
            <span className={s.save} role="status">
              {status}
            </span>
            <Link href="/">Back to BoomoTech</Link>
            {user ? (
              <button onClick={signOut} type="button">
                Sign out
              </button>
            ) : (
              <Link href={authHref("/login", pathname)}>Sign in</Link>
            )}
          </div>
        </header>
        <main className={s.main} id="pte-main" tabIndex={-1}>
          {initialView === "dashboard" ? (
            <>
              <Heading
                label="YOUR NEXT CHAPTER STARTS HERE"
                title={`Let’s make progress, ${name}`}
                text={
                  user
                    ? "A clear plan. Focused practice. One useful step at a time."
                    : "Preview PTEpath, then use one BoomoTech account to save and resume on another device."
                }
              />
              <div className={s.dashboardGrid}>
                <section
                  aria-label="PTEpath features"
                  className={s.hero}
                  onBlur={() => setCarouselPaused(false)}
                  onFocus={() => setCarouselPaused(true)}
                  onMouseEnter={() => setCarouselPaused(true)}
                  onMouseLeave={() => setCarouselPaused(false)}
                >
                  <div className={s.heroText}>
                    <span className={s.eyebrow}>{current.kicker}</span>
                    <h2>{current.title}</h2>
                    <p>{current.body}</p>
                    <button
                      className={s.heroButton}
                      onClick={current.run}
                      type="button"
                    >
                      {current.action} <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                  <div aria-hidden="true" className={s.heroArt}>
                    <span className={s.orbit} />
                    <span className={`${s.orbit} ${s.orbit2}`} />
                    <span className={s.circle}>
                      <span>YOUR PATH</span>
                      <strong>{current.art}</strong>
                      <span>PTE ACADEMIC</span>
                    </span>
                  </div>
                  <div
                    aria-label={`Slide ${slide + 1} of 5`}
                    className={s.dots}
                  >
                    {slides.map((item, index) => (
                      <button
                        aria-current={index === slide}
                        aria-label={`Show ${item.kicker.toLowerCase()}`}
                        key={item.kicker}
                        onClick={() => {
                          setSlide(index);
                          setManualCarousel(true);
                        }}
                        type="button"
                      />
                    ))}
                  </div>
                  <div className={s.carouselControls}>
                    <button
                      aria-label="Previous feature"
                      onClick={() => {
                        setSlide((slide + 4) % 5);
                        setManualCarousel(true);
                      }}
                      type="button"
                    >
                      ‹
                    </button>
                    <button
                      aria-label="Next feature"
                      onClick={() => {
                        setSlide((slide + 1) % 5);
                        setManualCarousel(true);
                      }}
                      type="button"
                    >
                      ›
                    </button>
                    <button
                      aria-label={
                        manualCarousel
                          ? "Play feature slides"
                          : "Pause feature slides"
                      }
                      onClick={() => setManualCarousel((value) => !value)}
                      type="button"
                    >
                      {manualCarousel ? "▶" : "Ⅱ"}
                    </button>
                  </div>
                </section>
                <TodayCard
                  profile={profile}
                  snapshot={snapshot}
                  user={user}
                  onStart={() =>
                    user
                      ? open(nextExercise(snapshot))
                      : router.push(authHref("/login", PTE_RETURN_PATH))
                  }
                />
              </div>
              <DashboardStats snapshot={snapshot} />
              <div className={s.lower}>
                <section>
                  <div className={s.sectionTitle}>
                    <h2>Your daily practice</h2>
                    <Link href={viewPaths.practice}>All practice →</Link>
                  </div>
                  <div className={`${s.panel} ${s.daily}`}>
                    {pteTaskTypes.map((type, index) => (
                      <button
                        className={s.exercise}
                        key={type}
                        onClick={() => open(exercisesByTask(type)[0])}
                        type="button"
                      >
                        <span className={s.taskIcon}>{index + 1}</span>
                        <span>
                          <strong>{taskLabels[type]}</strong>
                          <small>
                            {exercisesByTask(type).length} original exercises
                          </small>
                        </span>
                        <time>
                          {profile?.dailyMinutes
                            ? Math.max(5, Math.round(profile.dailyMinutes / 4))
                            : 10}{" "}
                          min
                        </time>
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <div className={s.sectionTitle}>
                    <h2>A smarter way to study</h2>
                  </div>
                  <div className={`${s.panel} ${s.loop}`}>
                    {[
                      [
                        "01",
                        "Practise with a purpose",
                        "Work on one task and record a real attempt.",
                      ],
                      [
                        "02",
                        "Understand mistakes",
                        "Read why an answer fits before retrying.",
                      ],
                      [
                        "03",
                        "Review over time",
                        "Return to unresolved patterns and weaker tasks.",
                      ],
                    ].map(([n, t, b]) => (
                      <div key={n}>
                        <span>{n}</span>
                        <p>
                          <strong>{t}</strong>
                          <br />
                          {b}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className={s.persian} dir="rtl" lang="fa">
                    یک قدم، هر روز. دلیل اشتباه را بفهم و دوباره تمرین کن.
                  </p>
                </section>
              </div>
            </>
          ) : null}
          {initialView === "practice" ? (
            <PracticeStudio attempts={snapshot?.attempts ?? []} onOpen={open} />
          ) : null}
          {initialView === "mistakes" ? (
            <MistakeNotebook
              mistakes={snapshot?.mistakes ?? []}
              onChanged={refresh}
              onRetry={(id) => {
                const exercise = exerciseById.get(id);
                if (exercise) open(exercise);
              }}
            />
          ) : null}
          {initialView === "grammar" ? (
            <LearningLibrary
              onPractice={(lessonId) => {
                const exercise =
                  exerciseBank.find((item) =>
                    item.lessonIds.includes(lessonId),
                  ) ?? exerciseBank[0];
                open(exercise);
              }}
            />
          ) : null}
          {initialView === "progress" ? (
            <ProgressView
              attempts={snapshot?.attempts ?? []}
              manualScores={snapshot?.manualScores ?? []}
              onChanged={refresh}
            />
          ) : null}
          {initialView === "plan" ? (
            <PlanView
              plan={snapshot?.plan ?? []}
              profile={profile}
              onOpen={open}
            />
          ) : null}
          {initialView === "settings" ? (
            <SettingsView
              profile={profile}
              onSaved={refresh}
              onStatus={setStatus}
            />
          ) : null}
        </main>
      </div>
      {active ? (
        <PracticeDialog
          draft={snapshot?.drafts.find((item) => item.exerciseId === active.id)}
          exercise={active}
          onClose={() => setActive(null)}
          onSaved={async () => {
            setStatus("Saved");
            await refresh();
          }}
          onStatus={setStatus}
        />
      ) : null}
    </div>
  );
}

function Icon({ value }: { value: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <text x="4" y="17">
        {value}
      </text>
    </svg>
  );
}
function initials(name?: string) {
  return name
    ? name
        .split(/\s+/u)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "P";
}
function Heading({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <header className={s.heading}>
      <span className={s.eyebrow}>{label}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}
function nextExercise(snapshot: LearningSnapshot | null) {
  const attempted = new Set(
    snapshot?.attempts.map(({ exerciseId }) => exerciseId),
  );
  const today = snapshot?.profile
    ? localDateInTimeZone(snapshot.profile.timezone)
    : "";
  const planned =
    snapshot?.plan.find((day) => day.studyDate === today && !day.completedAt) ??
    snapshot?.plan.find((day) => !day.completedAt);
  const plannedExercise =
    planned?.exerciseIds
      .map((id) => exerciseById.get(id))
      .find((exercise) => exercise && !attempted.has(exercise.id)) ??
    planned?.exerciseIds.map((id) => exerciseById.get(id)).find(Boolean);
  return (
    plannedExercise ??
    exerciseBank.find(({ id }) => !attempted.has(id)) ??
    exerciseBank[0]
  );
}

function TodayCard({
  profile,
  snapshot,
  user,
  onStart,
}: {
  profile: LearningProfile | null;
  snapshot: LearningSnapshot | null;
  user: LearningUser | null;
  onStart: () => void;
}) {
  const today = profile ? localDateInTimeZone(profile.timezone) : "";
  const day =
    snapshot?.plan.find((item) => item.studyDate === today) ??
    snapshot?.plan.find((item) => !item.completedAt);
  return (
    <section className={s.today}>
      <span className={s.eyebrow}>TODAY&apos;S FOCUS</span>
      <h2>
        {user
          ? day
            ? day.review
              ? "Review and retry"
              : day.phase === "baseline"
                ? "Build your baseline"
                : "Continue your plan"
            : "Choose a practice task"
          : "Your study space is ready"}
      </h2>
      <p>
        {user
          ? day
            ? `${day.exerciseIds.length} planned exercise${day.exerciseIds.length === 1 ? "" : "s"}. ${day.review ? "Resolve an earlier pattern before moving on." : "Your saved performance guides later review."}`
            : "Adjust your study plan or choose any available exercise."
          : "Sign in or create a BoomoTech account to save plans, drafts and attempts across devices."}
      </p>
      <button className={s.primary} onClick={onStart} type="button">
        {user ? "Start today’s practice" : "Start with my account"}
      </button>
    </section>
  );
}
function DashboardStats({ snapshot }: { snapshot: LearningSnapshot | null }) {
  const reading =
    snapshot?.attempts.filter((a) => a.resultKind === "reading-accuracy") ?? [];
  const correct = reading.reduce((sum, a) => sum + (a.correct ?? 0), 0);
  const total = reading.reduce((sum, a) => sum + a.total, 0);
  const minutes = Math.round(
    (snapshot?.attempts.reduce((sum, a) => sum + a.elapsedSeconds, 0) ?? 0) /
      60,
  );
  const writing =
    snapshot?.attempts.filter((a) => a.resultKind === "writing-self-review")
      .length ?? 0;
  return (
    <section aria-label="Practice summary" className={s.stats}>
      <Stat
        label="Attempts"
        value={String(snapshot?.attempts.length ?? 0)}
        foot="Real submitted practice"
      />
      <Stat
        label="Study time"
        value={`${minutes} min`}
        foot="Recorded attempt time"
      />
      <Stat
        label="Reading accuracy"
        value={total ? `${Math.round((correct / total) * 100)}%` : "—"}
        foot="App calculation · not a PTE score"
      />
      <Stat
        label="Writing reviews"
        value={String(writing)}
        foot="Form checks and self-review"
      />
    </section>
  );
}
function Stat({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot: string;
}) {
  return (
    <article className={s.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{foot}</p>
    </article>
  );
}

function PracticeStudio({
  attempts,
  onOpen,
}: {
  attempts: LearningAttempt[];
  onOpen: (exercise: PteExercise) => void;
}) {
  return (
    <>
      <Heading
        label="PRACTICE STUDIO"
        title="Make every attempt count."
        text="Seven Reading and Writing task types, each with ten original exercises, explanations and linked lessons."
      />
      <div className={s.grid}>
        {pteTaskTypes.map((type, index) => (
          <section className={s.card} key={type}>
            <span className={s.taskIcon}>{index + 1}</span>
            <h2>{taskLabels[type]}</h2>
            <p>{pteTaskGuidance[type].summary}</p>
            <p>{pteTaskGuidance[type].official}</p>
            {exercisesByTask(type).map((exercise, n) => (
              <button
                className={s.exercise}
                key={exercise.id}
                onClick={() => onOpen(exercise)}
                type="button"
              >
                <span>
                  <small>
                    {String(n + 1).padStart(2, "0")} ·{" "}
                    {
                      attempts.filter((item) => item.exerciseId === exercise.id)
                        .length
                    }{" "}
                    attempts · {exercise.difficulty}
                  </small>
                  <strong>{exercise.title}</strong>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </section>
        ))}
      </div>
      <SourceNote />
    </>
  );
}

function MistakeNotebook({
  mistakes,
  onChanged,
  onRetry,
}: {
  mistakes: LearningMistake[];
  onChanged: () => Promise<void>;
  onRetry: (id: string) => void;
}) {
  const open = mistakes.filter((m) => !m.reviewedAt);
  const ordered = prioritiseMistakes(mistakes);
  return (
    <>
      <Heading
        label="YOUR MISTAKE NOTEBOOK"
        title="Mistakes worth learning from."
        text="Read the explanation, open the linked lesson and retry the original exercise. Reviewed history stays visible."
      />
      {!mistakes.length ? (
        <div className={s.empty}>
          <h2>A fresh page for your progress</h2>
          <p>Submitted mistakes will appear here without fabricated history.</p>
        </div>
      ) : (
        <div className={s.review}>
          {ordered.map((mistake) => (
            <article key={mistake.id}>
              <header>
                <span>{mistake.category}</span>
                <span>{mistake.reviewedAt ? "Reviewed" : "To review"}</span>
              </header>
              <h2>
                {exerciseById.get(mistake.exerciseId)?.title ?? "Practice item"}
              </h2>
              <p>
                <strong>Your answer:</strong> {mistake.learnerAnswer}
              </p>
              {mistake.correctAnswer ? (
                <p>
                  <strong>Review:</strong> {mistake.correctAnswer}
                </p>
              ) : null}
              <p>{mistake.explanation}</p>
              <div className={s.modalActions}>
                <button
                  onClick={() => onRetry(mistake.exerciseId)}
                  type="button"
                >
                  Retry exercise
                </button>
                {mistake.lessonId ? (
                  <Link href={`${viewPaths.grammar}#${mistake.lessonId}`}>
                    Open lesson
                  </Link>
                ) : null}
                <button
                  onClick={async () => {
                    await fetch("/api/learning/pte/mistakes", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        mistakeId: mistake.id,
                        reviewed: !mistake.reviewedAt,
                      }),
                    });
                    await onChanged();
                  }}
                  type="button"
                >
                  {mistake.reviewedAt ? "Return to review" : "Mark reviewed"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}{" "}
      {open.length ? (
        <p className={s.notice}>
          {open.length} unresolved item{open.length === 1 ? "" : "s"}; older
          unresolved items in frequent categories appear first.
        </p>
      ) : null}
    </>
  );
}

function LearningLibrary({ onPractice }: { onPractice: (id: string) => void }) {
  return (
    <>
      <Heading
        label="GRAMMAR & COLLOCATIONS"
        title="Simple rules. Stronger answers."
        text={`${pteLessons.length} concise lessons and ${academicCollocations.length} contextual academic collocations with Persian support.`}
      />
      <div className={s.lessonGrid}>
        {pteLessons.map((lesson) => (
          <article className={s.lesson} id={lesson.id} key={lesson.id}>
            <span className={s.eyebrow}>{lesson.id.replaceAll("-", " ")}</span>
            <h2>{lesson.title}</h2>
            <p>{lesson.rule}</p>
            <p className={s.bad}>Not this: {lesson.commonError}</p>
            <p className={s.good}>Use this: {lesson.example}</p>
            <p>
              <strong>Mini exercise:</strong> {lesson.miniQuestion}
              <br />
              <strong>Answer:</strong> {lesson.answer}
            </p>
            <p dir="rtl" lang="fa">
              {lesson.explanationFa}
            </p>
            <button onClick={() => onPractice(lesson.id)} type="button">
              Practise this skill →
            </button>
          </article>
        ))}
      </div>
      <div className={s.sectionTitle}>
        <h2>Academic collocation bank</h2>
        <span>{academicCollocations.length} entries</span>
      </div>
      <table className={s.collocations}>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Collocation</th>
            <th>Persian meaning</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          {academicCollocations.map((item) => (
            <tr key={item.id}>
              <td>{item.topic}</td>
              <td>{item.phrase}</td>
              <td dir="rtl" lang="fa">
                {item.meaningFa}
              </td>
              <td>{item.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function ProgressView({
  attempts,
  manualScores,
  onChanged,
}: {
  attempts: LearningAttempt[];
  manualScores: LearningManualScore[];
  onChanged: () => Promise<void>;
}) {
  const reading = pteTaskTypes.filter(
    (t) => t.startsWith("reading") || t === "reorder-paragraphs",
  );
  return (
    <>
      <Heading
        label="VISIBLE PROGRESS"
        title="See patterns without inventing a score."
        text="App-calculated Reading accuracy, Writing self-review and manually entered official/mock results remain separate."
      />
      <div className={s.stats}>
        {reading.slice(0, 4).map((type) => {
          const list = attempts.filter(
            (a) => a.taskType === type && a.correct !== null,
          );
          const c = list.reduce((n, a) => n + (a.correct ?? 0), 0),
            t = list.reduce((n, a) => n + a.total, 0);
          return (
            <Stat
              foot="Practice accuracy"
              key={type}
              label={taskLabels[type]}
              value={t ? `${Math.round((c / t) * 100)}%` : "—"}
            />
          );
        })}
      </div>
      <section className={s.panel}>
        <h2>Recent attempts</h2>
        {attempts.length ? (
          attempts.slice(0, 30).map((a) => (
            <p key={a.id}>
              <strong>{exerciseById.get(a.exerciseId)?.title}</strong> ·{" "}
              {a.resultKind === "reading-accuracy"
                ? `${a.correct}/${a.total} app accuracy`
                : `${a.selfReview?.length ?? 0} self-review items`}{" "}
              · {new Date(a.submittedAt).toLocaleString("en-AU")}
            </p>
          ))
        ) : (
          <p>No attempts yet.</p>
        )}
      </section>
      <ManualScoreForm scores={manualScores} onChanged={onChanged} />
    </>
  );
}

function ManualScoreForm({
  scores,
  onChanged,
}: {
  scores: LearningManualScore[];
  onChanged: () => Promise<void>;
}) {
  return (
    <section className={s.panel}>
      <h2>Official or named mock score history</h2>
      <p>
        Enter only a result you received from the named source. It is never
        derived from practice percentages.
      </p>
      <form
        className={s.form}
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const response = await fetch("/api/learning/pte/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              source: form.get("source"),
              scoreDate: form.get("date"),
              readingScore: form.get("reading")
                ? Number(form.get("reading"))
                : null,
              writingScore: form.get("writing")
                ? Number(form.get("writing"))
                : null,
            }),
          });
          if (response.ok) {
            event.currentTarget.reset();
            await onChanged();
          }
        }}
      >
        <label>
          Source
          <input maxLength={120} name="source" required />
        </label>
        <label>
          Date
          <input name="date" required type="date" />
        </label>
        <label>
          Reading score
          <input max="90" min="10" name="reading" type="number" />
        </label>
        <label>
          Writing score
          <input max="90" min="10" name="writing" type="number" />
        </label>
        <button className={s.primary} type="submit">
          Add result
        </button>
      </form>
      {scores.map((score) => (
        <p key={score.id}>
          {score.scoreDate} · {score.source} · Reading{" "}
          {score.readingScore ?? "—"} · Writing {score.writingScore ?? "—"}
        </p>
      ))}
    </section>
  );
}

function PlanView({
  plan,
  profile,
  onOpen,
}: {
  plan: LearningPlanDay[];
  profile: LearningProfile | null;
  onOpen: (exercise: PteExercise) => void;
}) {
  return (
    <>
      <Heading
        label="A PLAN THAT FITS YOUR LIFE"
        title="My study plan"
        text={
          profile
            ? `${profile.durationDays} study days from ${profile.startDate}. This is a study structure, not a result guarantee.`
            : "Complete onboarding to create a plan."
        }
      />
      {profile?.durationDays && profile.durationDays < 10 ? (
        <p className={s.notice}>
          This is a tight timeframe. Prioritise baseline, frequent review and
          realistic daily minutes, or revise the plan.
        </p>
      ) : null}
      <div className={s.plan}>
        {plan.map((day, index) => (
          <article key={`${day.studyDate}-${index}`}>
            <span className={s.eyebrow}>
              DAY {index + 1} · {day.phase}
            </span>
            <h2>
              {new Date(`${day.studyDate}T12:00:00`).toLocaleDateString(
                "en-AU",
                { dateStyle: "medium" },
              )}
            </h2>
            <p>
              {day.review
                ? "Spaced review and retry"
                : "Guided work from the available exercise bank"}
            </p>
            {day.exerciseIds.map((id) => (
              <button
                className={s.exercise}
                key={id}
                onClick={() => {
                  const item = exerciseById.get(id);
                  if (item) onOpen(item);
                }}
                type="button"
              >
                {exerciseById.get(id)?.title ?? id} →
              </button>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}

function SettingsView({
  profile,
  onSaved,
  onStatus,
}: {
  profile: LearningProfile | null;
  onSaved: () => Promise<void>;
  onStatus: (v: string) => void;
}) {
  return (
    <>
      <Heading
        label="STUDY SETTINGS"
        title="Adjust future work, keep past progress."
        text="Changing the timeframe creates a new future plan revision. Attempts, drafts and completed history remain."
      />
      <ProfileForm
        initial={profile}
        complete
        onSaved={async () => {
          onStatus("Saved");
          await onSaved();
        }}
      />
      <section className={s.panel}>
        <h2>Learning data</h2>
        <p>
          Export your account-linked PTEpath records, or permanently reset only
          your Learning data. Account and service-request data are not included.
        </p>
        <div className={s.modalActions}>
          <Link
            className={s.secondary}
            download
            href="/api/learning/pte/export"
          >
            Export JSON
          </Link>
          <button
            className={s.danger}
            onClick={async () => {
              if (
                !window.confirm(
                  "Permanently delete your PTEpath profile, plan, drafts, attempts, mistakes and score history?",
                )
              )
                return;
              const response = await fetch("/api/learning/pte", {
                method: "DELETE",
                headers: { "x-confirm-learning-reset": "RESET" },
              });
              if (response.ok) location.assign(PTE_RETURN_PATH);
            }}
            type="button"
          >
            Reset PTEpath data
          </button>
          <Link href="/dashboard/settings">BoomoTech account settings</Link>
        </div>
      </section>
    </>
  );
}

function Onboarding({
  user,
  initial,
  onSaved,
}: {
  user: LearningUser;
  initial: LearningProfile | null;
  onSaved: () => Promise<void>;
}) {
  return (
    <div className={s.modalBackdrop}>
      <section
        aria-labelledby="onboarding-title"
        className={`${s.modal} ${s.onboarding}`}
      >
        <span className={s.eyebrow}>WELCOME TO PTEPATH</span>
        <h1 id="onboarding-title">
          Build a study plan that fits your timeframe.
        </h1>
        <p>
          Choose an estimated exam date or preparation period. A clear timeframe
          helps you stay focused and use your study time well. You can change it
          later.
        </p>
        <p dir="rtl" lang="fa">
          یک تاریخ تقریبی برای آزمون یا یک بازه زمانی برای آمادگی انتخاب کن.
          داشتن زمان مشخص کمک می‌کند متمرکز بمانی و وقتت را بهتر استفاده کنی.
          بعداً می‌توانی آن را تغییر بدهی.
        </p>
        <p>
          Signed in as <strong>{user.email}</strong>
        </p>
        <ProfileForm allowDraft initial={initial} complete onSaved={onSaved} />
        <Link href="/dashboard">Return to my BoomoTech dashboard</Link>
      </section>
    </div>
  );
}

function ProfileForm({
  initial,
  complete,
  onSaved,
  allowDraft = false,
}: {
  initial: LearningProfile | null;
  complete: boolean;
  onSaved: () => Promise<void>;
  allowDraft?: boolean;
}) {
  const today = localDateInTimeZone("Australia/Brisbane");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const defaults = {
    startDate: initial?.startDate ?? today,
    examDate: initial?.examDate ?? "",
    durationDays: initial?.durationDays ?? 30,
    dailyMinutes: initial?.dailyMinutes ?? 60,
    studyDays: initial?.studyDays ?? [1, 2, 3, 4, 5, 6],
    preferredTime: initial?.preferredTime ?? "18:00",
    timezone: initial?.timezone ?? "Australia/Brisbane",
    targetScore: initial?.targetScore ?? 79,
    currentLevel: initial?.currentLevel ?? "unsure",
    previousReadingScore: initial?.previousReadingScore ?? "",
    previousWritingScore: initial?.previousWritingScore ?? "",
    persianHelp: initial?.persianHelp ?? true,
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const saveAsDraft = allowDraft && submitter?.value === "draft";
    const form = new FormData(event.currentTarget);
    const body = {
      startDate: form.get("startDate"),
      examDate: form.get("examDate") || null,
      durationDays: Number(form.get("durationDays")),
      dailyMinutes: Number(form.get("dailyMinutes")),
      studyDays: form.getAll("studyDays").map(Number),
      preferredTime: form.get("preferredTime"),
      timezone: form.get("timezone"),
      targetScore: form.get("targetScore")
        ? Number(form.get("targetScore"))
        : null,
      currentLevel: form.get("currentLevel"),
      previousReadingScore: form.get("previousReadingScore")
        ? Number(form.get("previousReadingScore"))
        : null,
      previousWritingScore: form.get("previousWritingScore")
        ? Number(form.get("previousWritingScore"))
        : null,
      persianHelp: form.get("persianHelp") === "on",
    };
    const response = await fetch(
      `/api/learning/pte/profile${saveAsDraft || !complete ? "?draft=1" : ""}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      const result = (await response
        .json()
        .catch(() => ({ error: "Settings could not be saved." }))) as {
        error?: string;
      };
      setError(result.error ?? "Settings could not be saved.");
      setPending(false);
      return;
    }
    if (saveAsDraft) {
      setMessage(
        "Onboarding draft saved. Complete it when you return to PTEpath.",
      );
    } else {
      await onSaved();
    }
    setPending(false);
  };
  return (
    <form className={s.form} onSubmit={submit}>
      <label>
        Start date
        <input
          defaultValue={defaults.startDate}
          name="startDate"
          required
          type="date"
        />
      </label>
      <label>
        Estimated exam date (optional)
        <input defaultValue={defaults.examDate} name="examDate" type="date" />
      </label>
      <label>
        Preparation study days
        <input
          defaultValue={defaults.durationDays}
          max="730"
          min="1"
          name="durationDays"
          required
          type="number"
        />
      </label>
      <label>
        Minutes available per study day
        <input
          defaultValue={defaults.dailyMinutes}
          max="480"
          min="10"
          name="dailyMinutes"
          required
          type="number"
        />
      </label>
      <label>
        Preferred study time
        <input
          defaultValue={defaults.preferredTime}
          name="preferredTime"
          required
          type="time"
        />
      </label>
      <label>
        Timezone
        <select defaultValue={defaults.timezone} name="timezone">
          <option>Australia/Brisbane</option>
          <option>Australia/Sydney</option>
          <option>Australia/Perth</option>
          <option>UTC</option>
        </select>
      </label>
      <label>
        Personal target score (optional)
        <input
          defaultValue={defaults.targetScore}
          max="90"
          min="10"
          name="targetScore"
          type="number"
        />
      </label>
      <label>
        Current level
        <select defaultValue={defaults.currentLevel} name="currentLevel">
          <option value="unsure">Not sure yet</option>
          <option value="starting">Starting</option>
          <option value="developing">Developing</option>
          <option value="confident">Confident</option>
        </select>
      </label>
      <label>
        Previous Reading score (optional)
        <input
          defaultValue={defaults.previousReadingScore}
          max="90"
          min="10"
          name="previousReadingScore"
          type="number"
        />
      </label>
      <label>
        Previous Writing score (optional)
        <input
          defaultValue={defaults.previousWritingScore}
          max="90"
          min="10"
          name="previousWritingScore"
          type="number"
        />
      </label>
      <fieldset>
        <legend>Available study days</legend>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <label key={day}>
            <input
              defaultChecked={defaults.studyDays.includes(index)}
              name="studyDays"
              type="checkbox"
              value={index}
            />
            {day}
          </label>
        ))}
      </fieldset>
      <label>
        <input
          defaultChecked={defaults.persianHelp}
          name="persianHelp"
          type="checkbox"
        />{" "}
        Show optional Persian help
      </label>
      {error ? <p role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <div className={s.modalActions}>
        <button
          className={s.primary}
          disabled={pending}
          type="submit"
          value="complete"
        >
          {pending
            ? "Saving…"
            : complete
              ? "Save and build my plan"
              : "Save onboarding draft"}
        </button>
        {allowDraft ? (
          <button disabled={pending} type="submit" value="draft">
            Save and continue later
          </button>
        ) : null}
      </div>
    </form>
  );
}

function PracticeDialog({
  exercise,
  draft,
  onClose,
  onSaved,
  onStatus,
}: {
  exercise: PteExercise;
  draft?: LearningDraft;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onStatus: (v: string) => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  const idempotencyKey = useRef(crypto.randomUUID());
  const draftVersion = useRef(draft?.version ?? 0);
  const saveInFlight = useRef<Promise<void> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState(
    exercise.kind === "reorder"
      ? exercise.paragraphs.map(({ id }) => id).reverse()
      : [],
  );
  const [writing, setWriting] = useState(draft?.response ?? "");
  const [review, setReview] = useState<string[]>([]);
  const [feedback, setFeedback] = useState(false);
  const [pending, setPending] = useState(false);
  const [elapsed, setElapsed] = useState(draft?.elapsedSeconds ?? 0);
  const [running, setRunning] = useState(Boolean(draft?.timerRunning));
  const duration =
    exercise.kind === "writing"
      ? exercise.officialMinutes * 60
      : exercise.practiceMinutes * 60;
  const deadline = useRef(
    draft?.timerStartedAt && draft.timerRunning
      ? new Date(draft.timerStartedAt).getTime() +
          (draft.timerDurationSeconds ?? duration) * 1000 -
          draft.elapsedSeconds * 1000
      : null,
  );
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const controls = [
        ...dialog.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!controls.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      window.setTimeout(() => returnFocus.current?.focus(), 0);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    if (!deadline.current)
      deadline.current = Date.now() + (duration - elapsed) * 1000;
    const id = window.setInterval(() => {
      const next = Math.min(
        duration,
        Math.max(
          0,
          duration - Math.ceil((deadline.current! - Date.now()) / 1000),
        ),
      );
      setElapsed(next);
      if (next >= duration) setRunning(false);
    }, 1000);
    return () => window.clearInterval(id);
  }, [duration, elapsed, running]);
  const saveDraft = async () => {
    if (exercise.kind !== "writing") return;
    if (saveInFlight.current) return saveInFlight.current;
    const request = (async () => {
      onStatus("Saving…");
      const response = await fetch("/api/learning/pte/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          response: writing,
          elapsedSeconds: elapsed,
          timerStartedAt: running ? new Date().toISOString() : null,
          timerDurationSeconds: duration,
          timerRunning: running,
          expectedVersion: draftVersion.current,
        }),
      });
      if (response.ok) {
        const result = (await response.json()) as {
          draft: { version: number };
        };
        draftVersion.current = result.draft.version;
        onStatus("Saved");
      } else {
        onStatus(
          response.status === 409
            ? "Draft changed in another tab — reload before replacing it"
            : "Save failed — draft kept on screen",
        );
      }
    })();
    saveInFlight.current = request;
    try {
      await request;
    } finally {
      saveInFlight.current = null;
    }
  };
  const submit = async () => {
    if (pending || feedback) return;
    setPending(true);
    const answer =
      exercise.kind === "fill"
        ? answers
        : exercise.kind === "reorder"
          ? order
          : exercise.kind === "choice"
            ? selected
            : writing;
    const response = await fetch("/api/learning/pte/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: idempotencyKey.current,
        exerciseId: exercise.id,
        taskType: exercise.taskType,
        answer,
        selfReview: review,
        elapsedSeconds: elapsed,
        revealed: false,
      }),
    });
    if (response.ok) {
      setFeedback(true);
      setRunning(false);
      await onSaved();
    } else
      onStatus("Attempt could not be saved — your response remains on screen");
    setPending(false);
  };
  return (
    <div className={s.modalBackdrop} role="presentation">
      <section
        aria-labelledby="practice-title"
        aria-modal="true"
        className={s.modal}
        ref={dialog}
        role="dialog"
        tabIndex={-1}
      >
        <button
          aria-label="Close practice"
          className={s.close}
          onClick={async () => {
            await saveDraft();
            onClose();
          }}
          type="button"
        >
          ×
        </button>
        <span className={s.eyebrow}>
          {taskLabels[exercise.taskType]} · {exercise.difficulty}
        </span>
        <h2 id="practice-title">{exercise.title}</h2>
        <p>{exercise.instruction}</p>
        <p>
          <strong>Timer:</strong> {Math.max(0, duration - elapsed)} seconds
          remaining ·{" "}
          <button
            onClick={() => {
              if (running) {
                setRunning(false);
                deadline.current = null;
              } else {
                deadline.current = Date.now() + (duration - elapsed) * 1000;
                setRunning(true);
              }
            }}
            type="button"
          >
            {running ? "Pause" : "Start"}
          </button>{" "}
          · timed practice is an app aid unless an official item limit is
          stated.
        </p>
        {exercise.kind === "fill" ? (
          <FillWork
            exercise={exercise}
            answers={answers}
            disabled={feedback}
            onChange={(id, value) =>
              setAnswers((current) => ({ ...current, [id]: value }))
            }
          />
        ) : null}
        {exercise.kind === "reorder" ? (
          <ol className={s.order}>
            {order.map((id, index) => (
              <li key={id}>
                <span>
                  {exercise.paragraphs.find((p) => p.id === id)?.text}
                </span>
                <span>
                  <button
                    aria-label={`Move paragraph ${index + 1} up`}
                    disabled={feedback || index === 0}
                    onClick={() => setOrder(move(order, index, -1))}
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Move paragraph ${index + 1} down`}
                    disabled={feedback || index === order.length - 1}
                    onClick={() => setOrder(move(order, index, 1))}
                    type="button"
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
        {exercise.kind === "choice" ? (
          <div className={s.choices}>
            <p className={s.passage}>{exercise.passage}</p>
            <strong>{exercise.question}</strong>
            {exercise.options.map((option) => (
              <label key={option.id}>
                <input
                  checked={selected.includes(option.id)}
                  disabled={feedback}
                  name="choice"
                  onChange={(event) =>
                    setSelected((current) =>
                      exercise.taskType === "reading-multiple-single"
                        ? [option.id]
                        : event.target.checked
                          ? [...current, option.id]
                          : current.filter((id) => id !== option.id),
                    )
                  }
                  type={
                    exercise.taskType === "reading-multiple-single"
                      ? "radio"
                      : "checkbox"
                  }
                />
                {option.text}
              </label>
            ))}
          </div>
        ) : null}
        {exercise.kind === "writing" ? (
          <>
            <p className={s.passage}>{exercise.source ?? exercise.prompt}</p>
            <label>
              Your response
              <textarea
                className={s.writing}
                onBlur={saveDraft}
                onChange={(event) => setWriting(event.target.value)}
                value={writing}
              />
            </label>
            <p>
              {writing.trim() ? writing.trim().split(/\s+/u).length : 0} words ·
              official form {exercise.wordRange[0]}–{exercise.wordRange[1]}
              {exercise.taskType === "summarise-written-text"
                ? ", one sentence"
                : ""}
            </p>
            <fieldset className={s.choices}>
              <legend>Self-review (not automated scoring)</legend>
              {exercise.checklist.map((item) => (
                <label key={item}>
                  <input
                    checked={review.includes(item)}
                    onChange={(event) =>
                      setReview((current) =>
                        event.target.checked
                          ? [...current, item]
                          : current.filter((value) => value !== item),
                      )
                    }
                    type="checkbox"
                  />
                  {item}
                </label>
              ))}
            </fieldset>
          </>
        ) : null}
        <div className={s.modalActions}>
          <button
            className={s.primary}
            disabled={pending || feedback}
            onClick={submit}
            type="button"
          >
            {pending ? "Saving attempt…" : "Submit and review"}
          </button>
          {exercise.kind === "writing" ? (
            <button onClick={saveDraft} type="button">
              Save draft
            </button>
          ) : null}
        </div>
        {feedback ? (
          <Feedback
            exercise={exercise}
            answers={answers}
            order={order}
            selected={selected}
            writing={writing}
          />
        ) : null}
      </section>
    </div>
  );
}

function FillWork({
  exercise,
  answers,
  disabled,
  onChange,
}: {
  exercise: Extract<PteExercise, { kind: "fill" }>;
  answers: Record<string, string>;
  disabled: boolean;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <p className={s.passage}>
      {exercise.segments.map((segment, index) => (
        <span key={`${exercise.id}-${index}`}>
          {segment}
          {exercise.blanks[index] ? (
            <label>
              <span className="sr-only">Blank {index + 1}</span>
              <select
                disabled={disabled}
                onChange={(event) =>
                  onChange(exercise.blanks[index].id, event.target.value)
                }
                value={answers[exercise.blanks[index].id] ?? ""}
              >
                <option value="">Choose…</option>
                {exercise.blanks[index].options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          ) : null}
        </span>
      ))}
    </p>
  );
}
function move(values: string[], index: number, direction: -1 | 1) {
  const next = [...values];
  const target = index + direction;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
function Feedback({
  exercise,
  answers,
  order,
  selected,
  writing,
}: {
  exercise: PteExercise;
  answers: Record<string, string>;
  order: string[];
  selected: string[];
  writing: string;
}) {
  return (
    <div className={s.feedback} tabIndex={-1}>
      <h2>Review your attempt</h2>
      {exercise.kind === "fill"
        ? exercise.blanks.map((blank) => (
            <article key={blank.id}>
              <h3>{blank.answer}</h3>
              <p>{blank.explanation}</p>
              <p>Your choice: {answers[blank.id] || "No answer"}</p>
              <p dir="rtl" lang="fa">
                {blank.explanationFa}
              </p>
            </article>
          ))
        : null}
      {exercise.kind === "reorder" ? (
        <>
          <p>Correct order: {exercise.correctOrder.join(" → ")}</p>
          <p>
            Your transparent metric:{" "}
            {adjacentPairScore(order, exercise.correctOrder).correct}/
            {adjacentPairScore(order, exercise.correctOrder).total} correct
            adjacent pairs. This is not a Pearson score.
          </p>
          <p>{exercise.explanation}</p>
        </>
      ) : null}
      {exercise.kind === "choice" ? (
        <>
          {exercise.options.map((option) => (
            <p key={option.id}>
              <strong>
                {exercise.answers.includes(option.id)
                  ? "Correct"
                  : "Not selected as correct"}
                : {option.text}
              </strong>
              <br />
              {option.rationale}
            </p>
          ))}
          <p>Your selection: {selected.join(", ") || "No answer"}</p>
        </>
      ) : null}
      {exercise.kind === "writing" ? (
        <>
          <h3>Complete model response</h3>
          <p className={s.passage}>{exercise.sample}</p>
          <p>{exercise.explanation}</p>
          <p>
            Form check:{" "}
            {
              writingFormChecks(exercise.taskType, writing, exercise.wordRange)
                .wordCount
            }{" "}
            words. This does not assess content, grammar or vocabulary
            accurately.
          </p>
        </>
      ) : null}
    </div>
  );
}
function SourceNote() {
  return (
    <aside className={s.notice}>
      <p>
        Independent original practice—not Pearson questions, endorsement,
        official scoring or a result guarantee. Rules reviewed on 8 November
        2026. Pearson&apos;s overview and detailed Dropdown scoring wording are
        not fully aligned, so PTEpath records the discrepancy rather than
        inferring a Writing contribution.
      </p>
      <ul>
        {pteOfficialSources.map((source) => (
          <li key={source.id}>
            <a href={source.url} rel="noreferrer" target="_blank">
              {source.title}
            </a>{" "}
            (reviewed {source.reviewedOn})
          </li>
        ))}
      </ul>
    </aside>
  );
}
