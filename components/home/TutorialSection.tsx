import Image from "next/image";

interface TutorialSectionProps {
  t: (key: string) => string;
}

const steps = [
  {
    key: "overview",
    image: "/tutorial-overview.svg",
    labelKey: "upload.tutorial_step1_label",
    titleKey: "upload.tutorial_step1_title",
    bodyKey: "upload.tutorial_step1_body",
  },
  {
    key: "points",
    image: "/tutorial-points.svg",
    labelKey: "upload.tutorial_step2_label",
    titleKey: "upload.tutorial_step2_title",
    bodyKey: "upload.tutorial_step2_body",
  },
  {
    key: "exports",
    image: "/tutorial-export.svg",
    labelKey: "upload.tutorial_step3_label",
    titleKey: "upload.tutorial_step3_title",
    bodyKey: "upload.tutorial_step3_body",
  },
] as const;

export default function TutorialSection({ t }: TutorialSectionProps) {
  return (
    <section
      style={{ width: "100%", maxWidth: 1100, marginTop: 56, marginBottom: 40 }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            color: "#666",
            fontSize: 11,
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          {t("upload.tutorial_label")}
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 900,
            letterSpacing: 0.5,
            color: "#fff",
          }}
        >
          {t("upload.tutorial_title")}
        </h2>
        <p
          style={{
            margin: "12px auto 0",
            maxWidth: 680,
            color: "#7b7b7b",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          {t("upload.tutorial_intro")}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {steps.map((step, index) => (
          <article
            key={step.key}
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
              border: "1px solid var(--border)",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 12 }}>
              <div
                style={{
                  position: "relative",
                  height: 220,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "#171717",
                }}
              >
                <Image
                  src={step.image}
                  alt={t(step.titleKey)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
            <div style={{ padding: "6px 18px 18px" }}>
              <div
                style={{
                  color: "#bfe23a",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  marginBottom: 10,
                }}
              >
                {String(index + 1).padStart(2, "0")} · {t(step.labelKey)}
              </div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 19,
                  fontWeight: 800,
                  lineHeight: 1.25,
                  marginBottom: 10,
                }}
              >
                {t(step.titleKey)}
              </div>
              <p
                style={{
                  color: "#8a8a8a",
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {t(step.bodyKey)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
