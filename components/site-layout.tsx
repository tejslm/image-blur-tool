import { LockIcon, LogoMark } from "./icons";
import { SITE } from "@/lib/site";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner container" style={{ display: "flex" }}>
        <Link href="/" aria-label={`${SITE.name} — home`} className="site-logo">
          <span className="site-logo__mark" aria-hidden>
            <LogoMark width={15} height={15} />
          </span>
          {SITE.name}
        </Link>

        <nav className="site-nav" aria-label="Site">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Link href="/" aria-label={`${SITE.name} — home`} className="site-logo">
              <span className="site-logo__mark" aria-hidden>
                <LogoMark width={15} height={15} />
              </span>
              {SITE.name}
            </Link>
            <p>Blur images privately in your browser.</p>
          </div>

          <div>
            <h3>Tool</h3>
            <ul>
              <li>
                <Link href="/#how-it-works">How it works</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3>More</h3>
            <ul>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>&copy; {year} {SITE.name}</span>
          <span>
            <LockIcon width={14} height={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />
            Processed in your browser, never uploaded.
          </span>
        </div>
      </div>
    </footer>
  );
}