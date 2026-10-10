import Image from "next/image";
import { founderProfile } from "@/content/founder";

export function FounderProfile({ description }: { description: string }) {
  return <section className="founder-profile"><div className="container founder-profile__grid"><div className="founder-profile__visual">
    {founderProfile.image ? <Image alt={founderProfile.image.alt} fill sizes="(max-width: 720px) 92vw, 42vw" src={founderProfile.image.src} /> : <div className="founder-profile__placeholder" role="img" aria-label="Founder photograph placeholder"><Image alt="" height={180} src="/brand/boomotech-mark.png" width={180} /><span>Founder portrait to be added</span></div>}
  </div><div className="founder-profile__copy"><p className="eyebrow"><span className="eyebrow-line" />MEET THE FOUNDER</p><h2>{founderProfile.name}</h2><p className="founder-profile__role">{founderProfile.role}</p><p>{description}</p></div></div></section>;
}
