import type { Metadata } from "next";
import { Tool } from "@/components/tool";
import { FAQList } from "@/components/faq";
import { AdSlot } from "@/components/ad-slot";
import { FAQSchema, SoftwareAppSchema, WebSiteSchema } from "@/components/structured-data";
import {
  CarPlateIcon,
  DocIcon,
  InfoIcon,
  LockIcon,
  PersonIcon,
  PinIcon,
  ScreenIcon,
  TextIcon,
} from "@/components/icons";
import { FAQ_ITEMS } from "@/lib/faq";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blur Images Online for Free — Private & Easy",
  description: SITE.description,
};

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <h1>{SITE.tagline}</h1>
          <p className="lead">{SITE.support}</p>
        </div>
        <div className="container">
          <Tool />
        </div>
        <div className="container">
          <div className="trust-band" aria-label="Privacy promise">
            <strong>
              <LockIcon width={16} height={16} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
              Your image stays on your device.
            </strong>
            <span>BlurIt processes images locally in your browser. Nothing needs to be uploaded to use the tool.</span>
          </div>
        </div>
      </section>

      <AdSlot position="below-tool" />

      <section id="how-it-works" className="section container" aria-labelledby="how-it-works-heading">
        <span className="eyebrow">How it works</span>
        <h2 id="how-it-works-heading" style={{ marginTop: 14 }}>
          Blur in three steps
        </h2>
        <div className="steps">
          <div className="step">
            <h3>Choose an image</h3>
            <p>Pick a photo, screenshot, or document from your device — or paste it straight from your clipboard.</p>
          </div>
          <div className="step">
            <h3>Draw over what you want to hide</h3>
            <p>Draw a box over any face, name, address, or detail. Move it around, resize it, and pixelate as many areas as you like.</p>
          </div>
          <div className="step">
            <h3>Download the result</h3>
            <p>Choose PNG, JPG, or WebP and download. The pixelation is baked into the saved image — not just a preview.</p>
          </div>
        </div>
      </section>

      <section className="section container section--tight" aria-labelledby="good-for-heading">
        <span className="eyebrow">Good for</span>
        <h2 id="good-for-heading" style={{ marginTop: 14 }}>
          What can you blur?
        </h2>
        <div className="pill-grid">
          <div className="pill">
            <PersonIcon width={18} height={18} />
            Faces
          </div>
          <div className="pill">
            <ScreenIcon width={18} height={18} />
            Screenshots
          </div>
          <div className="pill">
            <TextIcon width={18} height={18} />
            Names
          </div>
          <div className="pill">
            <PinIcon width={18} height={18} />
            Addresses
          </div>
          <div className="pill">
            <CarPlateIcon width={18} height={18} />
            License plates
          </div>
          <div className="pill">
            <DocIcon width={18} height={18} />
            Documents
          </div>
          <div className="pill">
            <InfoIcon width={18} height={18} />
            Personal information
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="privacy-heading">
        <div className="prose">
          <span className="eyebrow">Privacy</span>
          <h2 id="privacy-heading" style={{ marginTop: 14 }}>
            Designed to keep your images private
          </h2>
          <p>
            Unlike server-based image editors, BlurIt processes your image directly in your browser using standard web
            technologies. Your image does not need to leave your device.
          </p>
          <p>
            There&rsquo;s no account, no upload, and no image storage. Close the tab and nothing remains.
          </p>
        </div>
      </section>

      <section id="faq" className="section container section--tight" aria-labelledby="faq-heading">
        <span className="eyebrow">FAQ</span>
        <h2 id="faq-heading" style={{ marginTop: 14 }}>
          Frequently asked questions
        </h2>
        <FAQList />
      </section>

      <AdSlot position="between-content" />

      <WebSiteSchema pageUrl={SITE.url} />
      <SoftwareAppSchema pageUrl={SITE.url} />
      <FAQSchema items={FAQ_ITEMS} />
    </>
  );
}