import type { Metadata } from "next";
import { FAQList } from "@/components/faq";
import { FAQSchema } from "@/components/structured-data";
import { LockIcon } from "@/components/icons";
import { FAQ_ITEMS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Blur images in three steps: choose an image, draw over what you want to hide, and download the result. Everything happens in your browser.",
};

export default function HowItWorksPage() {
  return (
    <article className="container">
      <header className="article-header">
        <span className="eyebrow">How it works</span>
        <h1>Blur images in three steps</h1>
        <p>
          Blur nothing more than what you choose to hide. The whole process takes seconds and never leaves your browser.
        </p>
      </header>

      <div className="prose" style={{ marginBottom: 48 }}>
        <h2>1. Choose an image</h2>
        <p>
          Pick a photo, screenshot, or document from your device by dragging it onto the tool, choosing a file, or pasting
          it from your clipboard. PNG, JPG, and WebP are supported.
        </p>

        <h2>2. Draw over what you want to hide</h2>
        <p>
          Once your image is open, drag a box over any area you want to blur — a face, a name, an address, a license plate,
          or anything else. You can add as many boxes as you like.
        </p>
        <p>Each box is independent, so you can:</p>
        <ul>
          <li>Move a box by dragging inside it</li>
          <li>Resize it using the corner and edge handles</li>
          <li>Remove it with the Delete key or the &ldquo;Delete area&rdquo; button</li>
          <li>Adjust its blur strength with the slider</li>
        </ul>

        <h2>3. Download the result</h2>
        <p>
          Choose PNG, JPG, or WebP and click <em>Download image</em>. The blur is applied at the full resolution of your
          original image and saved into the file — the exported image is truly blurred, not just a preview overlay.
        </p>

        <h2>Where does the processing happen?</h2>
        <p>
          Entirely in your browser. The image is decoded, blurred, and exported with standard in-browser capabilities
          (the Canvas and ImageBitmap APIs). Nothing is uploaded, logged, or stored by us.
        </p>
        <p>
          <LockIcon width={15} height={15} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
          You can disconnect from the internet after the page loads and the tool still works.
        </p>

        <h2>Undo, redo, and start over</h2>
        <p>
          Every action is undoable. Use the Undo and Redo buttons, or <kbd>Ctrl/Command + Z</kbd> and{" "}
          <kbd>Ctrl/Command + Shift + Z</kbd> on a keyboard. &ldquo;Start over&rdquo; returns you to the upload screen.
        </p>
      </div>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">Still curious?</h2>
        <FAQList />
      </section>

      <FAQSchema items={FAQ_ITEMS} />
    </article>
  );
}