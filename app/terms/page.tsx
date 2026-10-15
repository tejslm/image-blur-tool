import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: `The terms for using ${SITE.name}, a free browser-based image blurring tool.`,
};

export default function TermsPage() {
  return (
    <article className="container">
      <header className="article-header">
        <span className="eyebrow">Legal</span>
        <h1>Terms of use</h1>
        <p>A few plain-terms guidelines for using the tool.</p>
      </header>

      <div className="prose" style={{ marginBottom: 40 }}>
        <h2>Use of the service</h2>
        <p>
          {SITE.name} provides a free, browser-based tool for blurring parts of an image. By using the tool you agree to
          these terms. The tool is provided for lawful purposes only.
        </p>

        <h2>Local processing</h2>
        <p>
          The tool processes images entirely on your device. Your image is not uploaded to our servers and is not stored
          by us. Because the processing happens in your browser, we cannot access, retrieve, or delete images you edit
          with the tool.
        </p>

        <h2>Your responsibility</h2>
        <p>
          You are responsible for the images you process and for making sure you have the right to use them. Please respect
          other people&rsquo;s privacy when blurring or sharing images.
        </p>

        <h2>No warranty</h2>
        <p>
          The tool is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express
          or implied. We do not guarantee that the tool will be uninterrupted, error-free, or that pixelating will make an
          image fully unrecognizable in every case. You should review the exported image yourself before sharing it if
          privacy matters.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {SITE.name} is not liable for any damages arising from your use of, or
          inability to use, the tool.
        </p>

        <h2>Changes</h2>
        <p>We may update these terms from time to time. Continued use of the tool after changes means you accept the updated terms.</p>
      </div>
    </article>
  );
}