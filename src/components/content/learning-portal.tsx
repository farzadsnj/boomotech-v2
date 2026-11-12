import Link from "next/link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { learningCategories, learningPortalStages } from "@/content/learning";

export function LearningPortal() {
  return <>
    <section className="learning-status"><div className="container learning-status__grid"><div><p className="eyebrow"><span className="eyebrow-line" />AVAILABLE NOW</p><h2>Start with focused PTE practice.</h2></div><div className="learning-status__notice"><strong>PTE Academic Reading and Writing</strong><p>Preview seven task types, then use your BoomoTech account for a flexible study plan, saved progress, explanations and optional Persian support.</p><Link href="/learning/pte-academic">Open PTEpath <ArrowIcon diagonal /></Link></div></div></section>
    <section className="learning-categories"><div className="container"><div className="learning-categories__heading"><h2>Learning paths</h2><p>PTE practice is usable now. The technology categories remain planned and link to current service guidance rather than pretending lessons are available.</p></div><div className="learning-grid">{learningCategories.map((category, index) => <article className={category.status === "available" ? "learning-card--available" : ""} key={category.title}><span>{category.status === "available" ? "AVAILABLE" : `PLANNED ${String(index).padStart(2, "0")}`}</span><h3>{category.title}</h3><p>{category.description}</p><Link href={category.relatedPath}>{category.relatedLabel} <ArrowIcon diagonal /></Link></article>)}</div></div></section>
    <section className="learning-roadmap"><div className="container"><p className="eyebrow"><span className="eyebrow-line" />HOW IT WORKS</p><h2>A private-by-default practice workspace.</h2><div>{learningPortalStages.map((stage) => <article key={stage.title}><h3>{stage.title}</h3><p>{stage.description}</p></article>)}</div><p className="learning-storage-note">Progress is stored only in this browser profile. It is not synced to another device or protected as a separate user account; people sharing this browser profile share the same Learning workspace.</p></div></section>
  </>;
}
