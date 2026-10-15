import type { Metadata } from "next";
import { LockIcon, MailIcon } from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "BlurIt processes images entirely in your browser. Your image is never uploaded, stored, or shared. Here is exactly what that means.",
};

export default function PrivacyPage() {
  return (
    <article className="container">
      <header className="article-header">
        <span className="eyebrow">Privacy</span>
        <h1>Privacy policy</h1>
        <p>Short version: your image never leaves your device.</p>
      </header>

      <div className="prose" style={{ marginBottom: 40 }}>
        <h2>What we process</h2>
        <p>
          When you use the tool on {SITE.name}, the image you open is processed locally in your browser. Pixelating and
          export happen with browser-native capabilities directly on your device.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not upload your image anywhere.</li>
          <li>We do not store your image on our servers.</li>
          <li>We do not transmit image pixels or filenames to any third party, analytics service, or advertiser.</li>
          <li>We do not put image data into URLs, query parameters, or browser storage.</li>
          <li>We do not require an account.</li>
        </ul>
        <p>
          In practical terms, once you close the page, no trace of your image remains with us. Your image data lives only
          in memory while the page is open and is released when you leave or refresh.
        </p>

        <h2>Optional browser behaviors</h2>
        <p>
          Pasting an image is initiated by your browser&rsquo;s own clipboard feature. Pasting an image gives that image
          only to the open page — it is not sent anywhere.
        </p>

        <h2>Information we may collect</h2>
        <p>
          The tool itself does not collect any information. If usage analytics or advertising are added in the future,
          they will be isolated from the image editor and will never include image data, filenames, or selection content.
          We will update this page before introducing any such collection.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about privacy? Reach us at{" "}
          <a href={`mailto:${SITE.email}`}>
            <MailIcon width={14} height={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
            {SITE.email}
          </a>
          .
        </p>

        <p>
          <LockIcon width={14} height={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
          Effective date: September 2026.
        </p>
      </div>
    </article>
  );
}