import { FAQ_ITEMS } from "@/lib/faq";

export function FAQList() {
  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}