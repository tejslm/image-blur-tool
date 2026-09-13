import type { Metadata } from "next";
import { LockIcon } from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "BlurIt is a small, independent, privacy-first image blurring tool. No accounts, no uploads, no image storage.",
};

export default function AboutPage() {
  return (
    <article className="container">
      <header className="article-header">
        <span className="eyebrow">About</span>
        <h1>A small tool for a simple problem</h1>
        <p>{SITE.name} was built because blurring sensitive details in an image should be a one-step thing.</p>
      </header>

      <div className="prose" style={{ marginBottom: 40 }}>
        <h2>Why this exists</h2>
        <p>
          Sharing a screenshot or a photo usually means hiding something first: a name, an address, a face, or a license
          plate. Most editors make that awkward — and many &ldquo;free&rdquo; image tools quietly upload the file you hand
          them.
        </p>
        <p>
          {SITE.name} keeps it honest. Everything runs in your browser, so there is nothing to upload and nothing to trust
          us with. No account, no queue, no &ldquo;processing on our servers&rdquo;.
        </p>

        <h2>How it&rsquo;s built</h2>
        <p>
          The site is a static Next.js application. Images are decoded with the browser&rsquo;s ImageBitmap API, blurred
          with the Canvas API, and exported as PNG, JPG, or WebP — all locally. There is no backend and no database.
        </p>

        <h2>What we don&rsquo;t do</h2>
        <ul>
          <li>We don&rsquo;t store your images.</li>
          <li>We don&rsquo;t collect your personal information.</li>
          <li>We don&rsquo;t claim to use AI or &ldquo;magic&rdquo; technology.</li>
          <li>We don&rsquo;t require an account.</li>
        </ul>

        <h2>An honest note on blurring</h2>
        <p>
          Blurring makes a selected area unreadable, but it is not a guarantee against every conceivable reconstruction
          technique. For truly sensitive material, consider fully deleting the area from the exported image as well. We
          simply give you a private tool that does what it says.
        </p>

        <p>
          <LockIcon width={15} height={15} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
          Want to say hello or report a problem?{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </div>
    </article>
  );
}