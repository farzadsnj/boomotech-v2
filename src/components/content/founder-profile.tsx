import Image from "next/image";
import { founderProfile } from "@/content/founder";

export function FounderProfile({ description }: { description: string }) {
  return <section className="founder-profile"><div className="container founder-profile__grid"><div className="founder-profile__visual">
    {founderProfile.image ? <Image alt={founderProfile.image.alt} fill sizes="(max-width: 720px) 92vw, 42vw" src={founderProfile.image.src} /> : <div className="founder-profile__placeholder" role="img" aria-label="Founder photograph placeholder">
      <Image alt="Farzad Sanjarani - Boomotech Founder" height={2694} src="/brand/founder/Farzad-Sanjarani-Boomotech.jpeg" width={2694} /></div>}
  </div><div className="founder-profile__copy"><p className="eyebrow"><span className="eyebrow-line" />MEET THE FOUNDER</p><h2>{founderProfile.name}</h2><p className="founder-profile__role">{founderProfile.role}</p><p>{description}</p></div></div></section>;
}
