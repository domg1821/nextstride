import { router } from "expo-router";
import { useRef } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { FeatureCard, FooterLink, SiteButton, SiteSection, WeeklyPlanPreview } from "./components/marketing-site";

type SectionKey = "hero" | "why" | "week" | "premium" | "faq" | "cta";

const FAQ_ITEMS = [
  {
    question: "How are plans generated?",
    answer:
      "NextStride builds your week around goal event, mileage, recent effort, consistency, and completed sessions so the structure stays useful instead of generic.",
  },
  {
    question: "Is this for beginners or racers?",
    answer:
      "Both. The product is designed for runners who want more structure and better decisions, whether they are building consistency or sharpening for race day.",
  },
  {
    question: "What does Premium include?",
    answer:
      "Premium adds heart rate guided training, fueling guidance, deeper adaptive adjustments, stronger race prediction context, and more advanced coach feedback.",
  },
  {
    question: "Do I need a watch?",
    answer:
      "No. You can use NextStride with simple workout logging, though watch data can make heart rate and readiness guidance more useful later.",
  },
];

const WEEK_PREVIEW = [
  { day: "Monday", title: "Track / Intervals", detail: "Controlled quality with pace focus and a clear purpose for the day." },
  { day: "Tuesday", title: "Easy Run", detail: "Relaxed aerobic work to absorb the harder session and keep momentum." },
  { day: "Wednesday", title: "Tempo Workout", detail: "Steady threshold work that builds strength without racing every rep." },
  { day: "Thursday", title: "Aerobic Run", detail: "A calmer volume day to reinforce consistency and aerobic rhythm." },
  { day: "Friday", title: "Easy Run", detail: "Soft effort before the weekend load starts to build." },
  { day: "Saturday", title: "Long Run", detail: "The key durability session with a little more visual emphasis in the week." },
  { day: "Sunday", title: "Recovery / Rest", detail: "Space to reset, recover, and set up the next week well." },
];

export default function Welcome() {
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1120;
  const isTablet = width >= 780;
  const padding = isDesktop ? 64 : isTablet ? 32 : 20;
  const heroTitleSize = isDesktop ? 72 : isTablet ? 54 : 40;

  const setSectionOffset = (key: SectionKey) => (event: LayoutChangeEvent) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const scrollToSection = (key: SectionKey) => {
    const y = sectionOffsets.current[key];

    if (typeof y !== "number") {
      return;
    }

    scrollRef.current?.scrollTo({ y: Math.max(y - 24, 0), animated: true });
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: "#06101b" }}
      contentContainerStyle={{ paddingBottom: 34 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: padding, paddingTop: isDesktop ? 36 : 20 }} onLayout={setSectionOffset("hero")}>
        <TopNavigation
          isTablet={isTablet}
          onJump={scrollToSection}
          onLogin={() => router.push("/login")}
          onSignup={() => router.push("/signup")}
        />

        <View
          style={{
            marginTop: 36,
            flexDirection: isDesktop ? "row" : "column",
            alignItems: "center",
            gap: isDesktop ? 56 : 28,
          }}
        >
          <View style={{ flex: 1, maxWidth: 620 }}>
            <Text style={{ color: "#7dd3fc", fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" }}>
              NextStride
            </Text>
            <Text style={{ color: "#f8fbff", fontSize: heroTitleSize, fontWeight: "800", lineHeight: heroTitleSize + 4, marginTop: 18 }}>
              Train smarter. Run faster.
            </Text>
            <Text style={{ color: "#a9bed4", fontSize: 18, lineHeight: 29, marginTop: 16, maxWidth: 560 }}>
              Personalized plans, daily guidance, workout logging, and progress tracking built around real running goals.
            </Text>

            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: 28 }}>
              <SiteButton label="Get Started" onPress={() => router.push("/signup")} />
              <SiteButton label="View Demo" variant="secondary" onPress={() => scrollToSection("week")} />
            </View>

            <Text style={{ color: "#8fa8c4", fontSize: 13, lineHeight: 20, marginTop: 16, maxWidth: 520 }}>
              More than a run tracker. NextStride helps runners train with structure, feedback, and better decisions.
            </Text>
          </View>

          <View style={{ flex: 1, width: "100%", maxWidth: 500 }}>
            <HeroShowcase />
          </View>
        </View>
      </View>

      <View onLayout={setSectionOffset("why")}>
        <SiteSection
          eyebrow="Why NextStride"
          title="Most apps track your runs. NextStride trains you."
          subtitle="The product is built to help runners improve with better weekly structure, clearer feedback, and training intelligence that goes beyond logging."
          padding={padding}
        >
          <ResponsiveGrid isDesktop={isDesktop}>
            <FeatureCard
              badge="Structure"
              icon="W"
              title="Personalized weekly structure"
              body="Your training week is organized around real runner rhythms so the plan feels usable, motivating, and easy to follow."
            />
            <FeatureCard
              badge="Feedback"
              icon="F"
              title="Real training feedback"
              body="Effort, consistency, missed days, and recent workouts all feed back into smarter guidance instead of sitting idle in a history list."
            />
            <FeatureCard
              badge="Race Prep"
              icon="R"
              title="Smarter race preparation"
              body="Plans, predictions, and coaching stay connected to your goals so the product helps you train toward something specific."
            />
            <FeatureCard
              badge="Built for runners"
              icon="N"
              title="Built for runners, not just tracking"
              body="NextStride is designed around what runners revisit every week: what is next, how the plan is going, and what to do now."
            />
          </ResponsiveGrid>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("week")}>
        <SiteSection
          eyebrow="See Your Week"
          title="A training week that feels structured and motivating"
          subtitle="This preview makes the product immediately understandable: one week, one flow, and a clear reason for each day."
          padding={padding}
        >
          <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 24, alignItems: "flex-start" }}>
            <View style={{ flex: 1, maxWidth: isDesktop ? 380 : undefined }}>
              <Text style={{ color: "#f8fbff", fontSize: 28, fontWeight: "800" }}>Know what the week is trying to do</Text>
              <Text style={{ color: "#9fb2cb", fontSize: 15, lineHeight: 24, marginTop: 12 }}>
                Hard days stand out, easy days look calmer, and the whole week reads like a real plan instead of a random list of workouts.
              </Text>

              <View style={{ gap: 12, marginTop: 20 }}>
                <WeekHighlight title="Hard days are obvious" body="Track, tempo, and long run days carry stronger visual emphasis so the structure is easy to scan." />
                <WeekHighlight title="Easy days still matter" body="Recovery and aerobic work look lighter, but still feel intentional inside the training week." />
                <WeekHighlight title="The app feels like a coach" body="Visitors can quickly understand that NextStride is about guidance, not just tracking miles." />
              </View>
            </View>

            <View style={{ flex: 1.2, width: "100%" }}>
              <WeeklyPlanPreview days={WEEK_PREVIEW} />
            </View>
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("premium")}>
        <SiteSection
          eyebrow="Premium"
          title="Train better. Race better. For $2.50/month."
          subtitle="Premium is positioned around smarter decisions and more useful guidance, not generic feature stuffing."
          padding={padding}
        >
          <View
            style={{
              backgroundColor: "rgba(10, 22, 37, 0.76)",
              borderRadius: 34,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.12)",
              padding: isDesktop ? 28 : 22,
              gap: 22,
            }}
          >
            <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", gap: 18 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fbff", fontSize: 32, fontWeight: "800" }}>Smarter training guidance for serious improvement</Text>
                <Text style={{ color: "#9fb2cb", fontSize: 15, lineHeight: 24, marginTop: 12, maxWidth: 620 }}>
                  Heart rate control, fueling support, adaptive adjustments, stronger insights, deeper coach feedback, and better readiness context.
                </Text>
              </View>
              <View
                style={{
                  alignSelf: isDesktop ? "flex-start" : "stretch",
                  backgroundColor: "#081220",
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: "rgba(96, 165, 250, 0.12)",
                  paddingHorizontal: 22,
                  paddingVertical: 18,
                  minWidth: 180,
                }}
              >
                <Text style={{ color: "#7dd3fc", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>PREMIUM</Text>
                <Text style={{ color: "#f8fbff", fontSize: 34, fontWeight: "800", marginTop: 8 }}>$2.50</Text>
                <Text style={{ color: "#9fb2cb", fontSize: 14, marginTop: 4 }}>per month</Text>
              </View>
            </View>

            <ResponsiveGrid isDesktop={isDesktop}>
              <FeatureCard badge="HR" icon="H" title="Heart Rate Guided Training" body="Target zones make it easier to hold the right aerobic, tempo, and harder-day effort." />
              <FeatureCard badge="Fuel" icon="F" title="Fueling Guidance" body="Practical pre-run, long-run, and recovery fueling advice that feels runner-specific." />
              <FeatureCard badge="Adaptive" icon="A" title="Adaptive Training Adjustments" body="Plans respond to completed workouts, missed days, effort levels, and consistency." />
              <FeatureCard badge="Insights" icon="I" title="Race Predictor + Insights" body="Updated predictions, clearer confidence signals, and trend-based explanations from your recent training." />
              <FeatureCard badge="Coach" icon="C" title="Advanced Coach Features" body="Deeper coach feedback, more personalized answers, and sharper suggestions from your profile and training history." />
              <FeatureCard badge="Recovery" icon="R" title="Recovery & Readiness" body="High-effort follow-up suggestions, recovery recommendations, and warnings when training load starts looking high." />
            </ResponsiveGrid>

            <FreePremiumComparison />

            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12 }}>
              <SiteButton label="Unlock Premium" onPress={() => router.push("/premium")} />
              <SiteButton label="See Premium Details" variant="secondary" onPress={() => router.push("/premium")} />
            </View>
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("faq")}>
        <SiteSection
          eyebrow="FAQ"
          title="A few questions visitors usually ask first"
          subtitle="Short, practical answers that support trust without overloading the page."
          padding={padding}
        >
          <View style={{ gap: 14 }}>
            {FAQ_ITEMS.map((item) => (
              <FaqRow key={item.question} question={item.question} answer={item.answer} />
            ))}
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("cta")}>
        <SiteSection
          eyebrow="Start Training"
          title="Start with a product that actually helps you improve"
          subtitle="Create an account to start building your profile and weekly structure, or explore the premium value first."
          padding={padding}
        >
          <View
            style={{
              backgroundColor: "#0b1727",
              borderRadius: 34,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.16)",
              padding: isDesktop ? 32 : 24,
              gap: 18,
            }}
          >
            <Text style={{ color: "#f8fbff", fontSize: isDesktop ? 34 : 28, fontWeight: "800" }}>
              Built for runners who want to know what comes next.
            </Text>
            <Text style={{ color: "#9eb3cc", fontSize: 15, lineHeight: 23, maxWidth: 640 }}>
              NextStride keeps planning, logging, coaching, and progress in one cleaner flow so the product feels focused before and after the run.
            </Text>
            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12 }}>
              <SiteButton label="Create Account" onPress={() => router.push("/signup")} />
              <SiteButton label="Explore Premium" variant="secondary" onPress={() => router.push("/premium")} />
            </View>
          </View>
        </SiteSection>
      </View>

      <Footer
        padding={padding}
        isDesktop={isDesktop}
        onJump={scrollToSection}
        onLogin={() => router.push("/login")}
        onSignup={() => router.push("/signup")}
      />
    </ScrollView>
  );
}

function TopNavigation({
  isTablet,
  onJump,
  onLogin,
  onSignup,
}: {
  isTablet: boolean;
  onJump: (key: SectionKey) => void;
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: isTablet ? "row" : "column",
        justifyContent: "space-between",
        alignItems: isTablet ? "center" : "flex-start",
        gap: 14,
      }}
    >
      <View>
        <Text style={{ color: "#f8fbff", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
        <Text style={{ color: "#8ea5c2", marginTop: 4, fontSize: 13 }}>
          More than tracking. Built to help runners improve.
        </Text>
      </View>

      <View style={{ flexDirection: isTablet ? "row" : "column", alignItems: isTablet ? "center" : "flex-start", gap: 12 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <NavLink label="Why" onPress={() => onJump("why")} />
          <NavLink label="See Your Week" onPress={() => onJump("week")} />
          <NavLink label="Premium" onPress={() => onJump("premium")} />
          <NavLink label="FAQ" onPress={() => onJump("faq")} />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <SiteButton label="Log In" variant="secondary" onPress={onLogin} />
          <SiteButton label="Get Started" onPress={onSignup} />
        </View>
      </View>
    </View>
  );
}

function NavLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={{ color: "#d7e3f4", fontSize: 14, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function ResponsiveGrid({ children, isDesktop }: { children: React.ReactNode; isDesktop: boolean }) {
  return (
    <View style={{ flexDirection: isDesktop ? "row" : "column", flexWrap: "wrap", gap: 16 }}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <View key={index} style={{ width: isDesktop ? "48.9%" : "100%" }}>
              {child}
            </View>
          ))
        : children}
    </View>
  );
}

function HeroShowcase() {
  return (
    <View
      style={{
        backgroundColor: "rgba(10, 21, 37, 0.92)",
        borderRadius: 36,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.14)",
        padding: 18,
      }}
    >
      <View style={{ backgroundColor: "#09131f", borderRadius: 30, borderWidth: 1, borderColor: "rgba(96, 165, 250, 0.1)", padding: 18 }}>
        <View style={{ width: 84, height: 6, borderRadius: 999, backgroundColor: "rgba(148, 163, 184, 0.22)", alignSelf: "center" }} />
        <Text style={{ color: "#7dd3fc", fontSize: 12, fontWeight: "800", marginTop: 18 }}>NEXTSTRIDE</Text>
        <Text style={{ color: "#f8fbff", fontSize: 28, fontWeight: "800", marginTop: 10 }}>Your week at a glance</Text>
        <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 8 }}>
          A cleaner way to see what today is for, where the week is headed, and how training is trending.
        </Text>

        <View style={{ marginTop: 18, gap: 10 }}>
          <ShowcaseRow label="Monday" value="Track / intervals" accent="#60a5fa" />
          <ShowcaseRow label="Wednesday" value="Tempo workout" accent="#38bdf8" />
          <ShowcaseRow label="Saturday" value="Long run" accent="#22c55e" />
        </View>
      </View>
    </View>
  );
}

function ShowcaseRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(13, 26, 43, 0.94)",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.08)",
        padding: 14,
      }}
    >
      <Text style={{ color: accent, fontSize: 12, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: "#f8fbff", fontSize: 16, fontWeight: "700", marginTop: 6 }}>{value}</Text>
    </View>
  );
}

function WeekHighlight({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(10, 22, 37, 0.62)",
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.1)",
      }}
    >
      <Text style={{ color: "#f8fbff", fontSize: 18, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 8 }}>{body}</Text>
    </View>
  );
}

function FreePremiumComparison() {
  const rows = [
    ["Basic training plan", "Included", "Included"],
    ["Workout logging", "Included", "Included"],
    ["Progress tracking", "Included", "Included"],
    ["AI coach basics", "Included", "Included"],
    ["Heart rate guidance", "-", "Included"],
    ["Fueling guidance", "-", "Included"],
    ["Adaptive plan adjustments", "Basic", "Advanced"],
    ["Race predictor", "Basic", "Deeper insights"],
    ["Advanced insights", "-", "Included"],
  ];

  return (
    <View
      style={{
        backgroundColor: "#081220",
        borderRadius: 28,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.12)",
        overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row", backgroundColor: "rgba(59, 130, 246, 0.08)", padding: 16 }}>
        <ComparisonHeader title="Feature" />
        <ComparisonHeader title="Free" />
        <ComparisonHeader title="Premium" />
      </View>
      {rows.map((row, index) => (
        <View
          key={row[0]}
          style={{
            flexDirection: "row",
            padding: 16,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: "rgba(96, 165, 250, 0.08)",
          }}
        >
          <ComparisonCell value={row[0]} flex={1.4} strong={true} />
          <ComparisonCell value={row[1]} />
          <ComparisonCell value={row[2]} premium={true} />
        </View>
      ))}
    </View>
  );
}

function ComparisonHeader({ title }: { title: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#f8fbff", fontSize: 13, fontWeight: "800" }}>{title}</Text>
    </View>
  );
}

function ComparisonCell({
  value,
  flex = 1,
  strong,
  premium,
}: {
  value: string;
  flex?: number;
  strong?: boolean;
  premium?: boolean;
}) {
  return (
    <View style={{ flex }}>
      <Text style={{ color: premium ? "#7dd3fc" : strong ? "#f8fbff" : "#9fb2cb", fontSize: 13, fontWeight: strong || premium ? "700" : "500" }}>
        {value}
      </Text>
    </View>
  );
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(10, 22, 37, 0.7)",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.1)",
        padding: 20,
      }}
    >
      <Text style={{ color: "#f8fbff", fontSize: 19, fontWeight: "700" }}>{question}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 23, marginTop: 10 }}>{answer}</Text>
    </View>
  );
}

function Footer({
  padding,
  isDesktop,
  onJump,
  onLogin,
  onSignup,
}: {
  padding: number;
  isDesktop: boolean;
  onJump: (key: SectionKey) => void;
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <View
      style={{
        marginTop: 80,
        paddingHorizontal: padding,
        paddingTop: 34,
        paddingBottom: 18,
        borderTopWidth: 1,
        borderTopColor: "rgba(96, 165, 250, 0.12)",
      }}
    >
      <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", gap: 24 }}>
        <View style={{ maxWidth: 340 }}>
          <Text style={{ color: "#f8fbff", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
          <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            A cleaner running platform built around training guidance, not just tracking.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>PRODUCT</Text>
          <FooterLink label="Why NextStride" onPress={() => onJump("why")} />
          <FooterLink label="See Your Week" onPress={() => onJump("week")} />
          <FooterLink label="Premium" onPress={() => onJump("premium")} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>SUPPORT</Text>
          <FooterLink label="FAQ" onPress={() => onJump("faq")} />
          <FooterLink label="Contact" />
          <FooterLink label="Premium details" onPress={() => router.push("/premium")} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>ACCOUNT</Text>
          <FooterLink label="Log In" onPress={onLogin} />
          <FooterLink label="Get Started" onPress={onSignup} />
        </View>
      </View>

      <Text style={{ color: "#6f89a6", fontSize: 13, marginTop: 28 }}>
        Copyright 2026 NextStride. Built for runners who want to train better and race better.
      </Text>
    </View>
  );
}
