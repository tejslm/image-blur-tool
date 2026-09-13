export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What image formats are supported?",
    answer:
      "PNG, JPG, and WebP images work with BlurIt. If you have a different format, most image editors can convert it to one of these first.",
  },
  {
    question: "Can I blur multiple parts of an image?",
    answer:
      "Yes. Draw a box over each area you want to hide — faces, text, license plates and anything else — and each one can be moved, resized, or deleted afterwards.",
  },
  {
    question: "Does BlurIt upload my image?",
    answer:
      "No. Your image is processed entirely in your browser on your device. It is never sent to our servers, and nothing is stored anywhere.",
  },
  {
    question: "Can I use BlurIt on my phone?",
    answer:
      "Yes. BlurIt works in the browser on phones and tablets. You can pick a photo from your device, draw over the areas to hide, and download the result.",
  },
  {
    question: "Is BlurIt free?",
    answer: "Yes. BlurIt is completely free to use, with no account or sign-up required.",
  },
];