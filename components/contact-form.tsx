"use client";

import { useRef, useState } from "react";
import { SITE } from "@/lib/site";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!message) return;

    const subject = encodeURIComponent(`Message from ${name || "someone"} via ${SITE.name}`);
    const body = encodeURIComponent(message + (email ? `\n\nReply to: ${email}` : ""));
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
    formRef.current?.reset();
    setSent(true);
    window.setTimeout(() => setSent(false), 6000);
  }

  return (
    <form ref={formRef} className="form-card" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="contact-name">Your name</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="contact-email">Email <span style={{ fontWeight: 400, color: "var(--ink-faint)" }}>(optional)</span></label>
        <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          placeholder="How can we help?"
          style={{ resize: "vertical" }}
        />
      </div>
      <button type="submit" className="btn btn--primary">
        Send message
      </button>
      <p className="sr-only" role="status">
        {sent ? "Opening your email app to send the message." : ""}
      </p>
      {sent && (
        <p aria-live="polite" style={{ marginTop: 12, fontSize: "var(--text-sm)", color: "var(--ok)" }}>
          Your email app should have opened. If not, email us directly at {SITE.email}.
        </p>
      )}
    </form>
  );
}