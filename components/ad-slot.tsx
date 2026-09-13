import { ADSENSE_CLIENT, ADSENSE_ENABLED } from "@/lib/config";

export type AdPosition = "below-tool" | "between-content";

const SLOTS: Record<AdPosition, string> = {
  "below-tool": "below-tool",
  "between-content": "between-content",
};

/**
 * Reserved placement for a future ad slot. Renders nothing until AdSense is
 * configured. When enabled, injection of the AdSense loader (once, in the
 * layout head) plus this <ins> markup is all that is required.
 */
export function AdSlot({ position }: { position: AdPosition }) {
  if (!ADSENSE_ENABLED || !ADSENSE_CLIENT) return null;

  return (
    <aside className="ad-slot" aria-label="Advertisement">
      <span className="ad-slot__label">Advertisement</span>
      <ins
        className="adsbygoogle"
        data-ad-client={`ca-pub-${ADSENSE_CLIENT}`}
        data-ad-slot={SLOTS[position]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}