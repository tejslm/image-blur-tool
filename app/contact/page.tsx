import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { MailIcon } from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the people behind BlurIt.",
};

export default function ContactPage() {
  return (
    <article className="container">
      <header className="article-header">
        <span className="eyebrow">Contact</span>
        <h1>Get in touch</h1>
        <p>Questions, feedback, or something not working right? We read every message.</p>
      </header>

      <div className="prose" style={{ marginBottom: 40 }}>
        <p>
          The fastest way to reach us is by email:{" "}
          <a href={`mailto:${SITE.email}`}>
            <MailIcon width={14} height={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
            {SITE.email}
          </a>
          . Or use the form below — it opens your email app with the message pre-filled, so nothing you type here is ever
          stored by us.
        </p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-faint)" }}>
          Please don&rsquo;t include sensitive images when writing to us.
        </p>
      </div>

      <ContactForm />
    </article>
  );
}