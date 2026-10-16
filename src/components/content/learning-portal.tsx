import Link from "next/link";
import { ArrowIcon } from "@/components/ui/arrow-icon";
import { learningCategories, learningPortalStages } from "@/content/learning";

export function LearningPortal() {
  return <>
    <section className="learning-status"><div className="container learning-status__grid"><div><p className="eyebrow"><span className="eyebrow-line" />LEARNING PORTAL PREVIEW</p><h2>Practical technology learning, built in useful stages.</h2></div><div className="learning-status__notice"><strong>Courses are not open yet</strong><p>This page shows the planned learning structure. Reviewed articles and service guidance remain available while course material is developed.</p><Link href="/blog">Read current articles <ArrowIcon diagonal /></Link></div></div></section>
    <section className="learning-categories"><div className="container"><div className="learning-categories__heading"><h2>Future learning categories</h2><p>Each category can grow into courses, short lessons, exercises and knowledge checks without changing the page structure.</p></div><div className="learning-grid">{learningCategories.map((category, index) => <article key={category.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{category.title}</h3><p>{category.description}</p><Link href={category.relatedPath}>{category.relatedLabel} <ArrowIcon diagonal /></Link></article>)}</div></div></section>
    <section className="learning-roadmap"><div className="container"><p className="eyebrow"><span className="eyebrow-line" />EXPANDABLE FOUNDATION</p><h2>Designed for a future learning journey.</h2><div>{learningPortalStages.map((stage) => <article key={stage.title}><h3>{stage.title}</h3><p>{stage.description}</p></article>)}</div></div></section>
  </>;
}
