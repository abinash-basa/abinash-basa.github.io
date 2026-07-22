/**
 * ════════════════════════════════════════════════════════════════
 *  SITE CONFIGURATION — Edit your content here
 * ════════════════════════════════════════════════════════════════
 *
 *  This file holds all the dynamic content on your portfolio.
 *  Change text, swap projects, update links — no need to touch
 *  the HTML, CSS, or JS files.
 *
 *  After editing, just refresh the browser (or push to GitHub).
 * ════════════════════════════════════════════════════════════════
 */

const SITE_CONFIG = {

  /* ── Contact & Social Links ──────────────────────────────────
   *  Replace the placeholder "#" values with your real URLs.
   *  To hide a link, set its value to "" (empty string).
   */
  contact: {
    email:    "abinashbasa15@gmail.com",
    linkedin: "https://www.linkedin.com/in/theabinashbasa",
    github:   "https://github.com/abinash-basa",
    twitter:  "https://x.com/AbinashBasa1",
    substack: "https://substack.com/@abinashbasa",
    youtube:  "https://www.youtube.com/@ventbyakb",
  },


  /* ── Projects ────────────────────────────────────────────────
   *  Add, remove, or reorder entries freely.
   *
   *  Fields:
   *    title       – project name
   *    description – one or two sentences
   *    tags        – array of short labels
   *    link        – URL (use "#" for placeholders)
   *    linkText    – button label ("View project", "PDF coming soon", etc.)
   *    type        – "research" | "product" | "code" | "writing"
   *                  (controls the accent color on the card)
   */
  projects: [
    {
      title:       "Sleep Recovery and Mathematical Modelling",
      description: "A term paper exploring the mathematics behind sleep debt recovery, modelling how the body restores cognitive function after sleep loss. Written during my 3rd semester at LPU.",
      tags:        ["Research", "Mathematics", "Writing Sample"],
      link:        "assets/termpaper3rd-sem.pdf.pdf",
      linkText:    "View Paper",
      type:        "research",
    },
    {
      title:       "Medical Insurance Cost Prediction",
      description: "A dissertation analysing the factors that drive medical insurance costs and building predictive models to estimate them. Written during my 4th semester at LPU.",
      tags:        ["Research", "Data Science", "Dissertation"],
      link:        "assets/dissertation4th-sem.pdf.pdf",
      linkText:    "View Dissertation",
      type:        "product",
    },
    {
      title:       "Mathematical Intuition for ML",
      description: "A series breaking down the core mathematical ideas behind machine learning, written for product thinkers, not engineers.",
      tags:        ["Mathematics", "Machine Learning", "Education"],
      link:        "#",
      linkText:    "Coming soon",
      type:        "code",
    },
    {
      title:       "Building in Public: Product Experiments",
      description: "Documenting small product experiments and what I learn from each one. Real outcomes, honest reflection, no theory.",
      tags:        ["Product", "Experiments", "Building in Public"],
      link:        "#",
      linkText:    "Coming soon",
      type:        "writing",
    },
  ],
};
