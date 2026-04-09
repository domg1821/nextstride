import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { LayoutChangeEvent, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FooterLink, FooterSocialLink, GlassPanel, MarketingIcon, SectionChip, SiteButton, SiteSection } from "@/components/marketing-site";
import { MarketingBackdrop, RunningSurfaceAccent } from "@/components/running-visuals";
import { useProfile } from "@/contexts/profile-context";
import { PREMIUM_PLANS, type BillingCycle, type PremiumTier } from "@/lib/premium-products";
import { useResponsiveLayout } from "@/lib/responsive";
import { buildUpgradePath } from "@/lib/upgrade-route";

type SectionKey = "hero" | "value" | "week" | "why" | "premium" | "faq" | "cta";
type DemoTone = "default" | "key" | "long";

const VALUE_STRIP = [
  "Structured training that is easy to follow",
  "Personalized guidance that keeps improving",
  "Post-run feedback that actually helps",
  "A more premium path when you want deeper support",
];

const WEEK_PREVIEW: { day: string; title: string; detail: string; tone: DemoTone }[] = [
  { day: "Mon", title: "Easy run", detail: "40 min at Easy 3-4/10", tone: "default" },
  { day: "Tue", title: "Intervals", detail: "5 x 3 min hard with jog recovery", tone: "key" },
  { day: "Wed", title: "Recovery", detail: "30 min light and relaxed", tone: "default" },
  { day: "Thu", title: "Tempo", detail: "20 min strong, controlled effort", tone: "key" },
  { day: "Fri", title: "Rest", detail: "Reset before the weekend long run", tone: "default" },
  { day: "Sat", title: "Long run", detail: "80 min steady with patient pacing", tone: "long" },
  { day: "Sun", title: "Shakeout", detail: "Optional easy jog or full rest", tone: "default" },
];

const WHY_NEXTSTRIDE = [
  {
    icon: "walk-outline",
    title: "Today's workout is obvious",
    body: "Open the app and see the session, the purpose, the effort, and what matters most right now.",
  },
  {
    icon: "trail-sign-outline",
    title: "Your week feels connected",
    body: "Hard days, easy days, and long runs work together instead of feeling like random mileage.",
  },
  {
    icon: "speedometer-outline",
    title: "Progress is easier to trust",
    body: "You get clearer reads on race goals, consistency, pacing, and what your next step should be.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Who is NextStride for?",
    answer: "Solo runners who want a clear plan, better feedback, and a training app that feels more useful than a basic tracker.",
  },
  {
    question: "Do I need to be an experienced runner?",
    answer: "No. The app is built to make training easier to understand for newer runners while still feeling useful for experienced racers.",
  },
  {
    question: "What makes Elite different?",
    answer: "Elite is the coach-like layer: adaptive training, post-run feedback, on-track goal reads, and deeper guidance across the week.",
  },
  {
    question: "Can I start free?",
    answer: "Yes. Free gives you the core training experience, and Pro or Elite unlock more guidance when you want it.",
  },
];

export default function Welcome() {
  const { isAuthenticated, profile, appHomeRoute } = useProfile();
  const layout = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const isDesktop = layout.isDesktop;
  const isTablet = layout.isTablet;
  const padding = isDesktop ? 72 : isTablet ? 34 : layout.pagePadding;
  const heroTitleSize = isDesktop ? 74 : isTablet ? 56 : layout.isPhone ? 36 : 42;
  const heroTopPadding = isDesktop ? 34 : isTablet ? 24 : Math.max(32, insets.top + 16);
  const pageBottomPadding = Math.max(44, insets.bottom + (layout.isPhone ? 88 : 64));
  const openAppRoute = isAuthenticated && !profile.onboardingComplete ? "/onboarding" : appHomeRoute;

  const setSectionOffset = (key: SectionKey) => (event: LayoutChangeEvent) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const scrollToSection = (key: SectionKey) => {
    const y = sectionOffsets.current[key];

    if (typeof y === "number") {
      scrollRef.current?.scrollTo({ y: Math.max(y - 24, 0), animated: true });
    }
  };

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: "#08111d" }} contentContainerStyle={{ paddingBottom: pageBottomPadding }} showsVerticalScrollIndicator={false}>
      <View style={{ position: "relative", paddingHorizontal: padding, paddingTop: heroTopPadding, paddingBottom: layout.isPhone ? 26 : 36 }} onLayout={setSectionOffset("hero")}>
        <MarketingBackdrop tone="hero" style={{ height: isDesktop ? 720 : 640 }} />
        <TopNavigation
          isTablet={isTablet}
          onJump={scrollToSection}
          isAuthenticated={isAuthenticated}
          onLogin={() => router.push("/login")}
          onSignup={() => router.push("/signup")}
          onOpenApp={() => router.push(openAppRoute)}
        />

        <View style={{ marginTop: isDesktop ? 56 : layout.isPhone ? 24 : 32, flexDirection: isDesktop ? "row" : "column", alignItems: "center", gap: isDesktop ? 68 : layout.isPhone ? 24 : 34 }}>
          <View style={{ flex: isDesktop ? 1 : undefined, width: "100%", minWidth: 0, maxWidth: isDesktop ? 630 : undefined }}>
            <SectionChip label="Built for solo runners" />
            <Text style={{ color: "#f8fbff", fontSize: heroTitleSize, fontWeight: "800", lineHeight: heroTitleSize + (layout.isPhone ? 4 : 2), marginTop: layout.isPhone ? 16 : 20 }}>
              Your running week, finally clear at a glance.
            </Text>
            <Text style={{ color: "#9db2ca", fontSize: layout.isPhone ? 17 : 19, lineHeight: layout.isPhone ? 28 : 31, marginTop: layout.isPhone ? 14 : 18, maxWidth: 560 }}>
              NextStride helps solo runners train with more structure, clearer guidance, smarter progression, and a more premium way to improve.
            </Text>

            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: layout.isPhone ? 24 : 30 }}>
              <SiteButton label={isAuthenticated ? "Open My Plan" : "Start Free"} onPress={() => router.push(isAuthenticated ? openAppRoute : "/signup")} />
              <SiteButton label="See The Product" variant="secondary" onPress={() => scrollToSection("week")} />
            </View>

            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: layout.isPhone ? 22 : 28 }}>
              <MetricCard value="Today" label="See the workout, pace, effort, and purpose fast" />
              <MetricCard value="This Week" label="Understand how the whole week fits together" />
              <MetricCard value="Next Step" label="Know what is improving and what comes next" />
            </View>
          </View>

          <View style={{ flex: isDesktop ? 1 : undefined, width: "100%", minWidth: 0, maxWidth: isDesktop ? 540 : undefined }}>
            <HeroPreview />
          </View>
        </View>
      </View>

      <View onLayout={setSectionOffset("value")} style={{ paddingHorizontal: padding, marginTop: layout.isPhone ? 10 : 18 }}>
        <QuickValueStrip isTablet={isTablet} />
      </View>

      <View onLayout={setSectionOffset("week")}>
        <SiteSection
          eyebrow="See Your Week"
          title="The clearest part of the product is the plan itself"
          subtitle="Today&apos;s workout matters, but the real value is seeing a full solo-runner week that feels structured, realistic, and easy to trust."
          padding={padding}
        >
          <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 24, alignItems: "stretch" }}>
            <View style={{ flex: isDesktop ? 1.2 : undefined, width: "100%", minWidth: 0 }}>
              <WeekShowcase />
            </View>
            <View style={{ flex: isDesktop ? 0.9 : undefined, width: "100%", minWidth: 0, gap: 14 }}>
              <StoryCard
                icon="footsteps-outline"
                title="Today is clear"
                body="Open the app and know whether the day is easy, hard, long, or recovery without second-guessing it."
              />
              <StoryCard
                icon="speedometer-outline"
                title="Effort stays simple"
                body="Pace guidance stays there when you want it, with effort-based guidance beside it so workouts still make sense on tired or windy days."
              />
              <StoryCard
                icon="map-outline"
                title="The week has shape"
                body="Key sessions stand out, support days stay quieter, and the full block feels more intentional."
              />
            </View>
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("why")}>
        <SiteSection
          eyebrow="Why NextStride"
          title="Built for runners who want more than a tracker"
          subtitle="The value stays focused: structured training, personalized guidance, useful post-run feedback, and progress that points toward real goals."
          padding={padding}
        >
          <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 18 }}>
            {WHY_NEXTSTRIDE.map((card, index) => (
              <WhyCard key={card.title} {...card} active={index === 0} />
            ))}
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("premium")} style={{ position: "relative" }}>
        <MarketingBackdrop tone="pricing" style={{ top: 28, height: isDesktop ? 720 : 820 }} />
        <SiteSection
          eyebrow="Premium Value"
          title="Choose the level of guidance you want"
          subtitle="Free gives you the core experience. Pro sharpens execution. Elite adds the most premium guidance and the strongest performance feedback."
          padding={padding}
        >
          <PremiumPlans
            billingCycle={billingCycle}
            onSelectBillingCycle={setBillingCycle}
            isDesktop={isDesktop}
            isTablet={isTablet}
          />
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("faq")}>
        <SiteSection
          eyebrow="FAQ"
          title="A few quick answers"
          subtitle="Short, runner-specific answers to the questions people usually have before starting."
          padding={padding}
        >
          <View style={{ gap: 14 }}>
            {FAQ_ITEMS.map((item) => (
              <FaqRow key={item.question} question={item.question} answer={item.answer} />
            ))}
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("cta")} style={{ position: "relative" }}>
        <MarketingBackdrop tone="cta" style={{ top: 16, height: 620 }} />
        <SiteSection
          padding={padding}
          title="Start with a clearer week"
          subtitle="Start free, open your first week, and train with a plan that feels cleaner, smarter, and easier to trust."
          centered={true}
        >
          <FinalCta
            isTablet={isTablet}
            isAuthenticated={isAuthenticated}
            onPrimaryAction={() => router.push(isAuthenticated ? openAppRoute : "/signup")}
          />
        </SiteSection>
      </View>

      <Footer
        padding={padding}
        isDesktop={isDesktop}
        onJump={scrollToSection}
        isAuthenticated={isAuthenticated}
        onLogin={() => router.push("/login")}
        onSignup={() => router.push("/signup")}
        onOpenApp={() => router.push(openAppRoute)}
      />
    </ScrollView>
  );
}

function TopNavigation({
  isTablet,
  isAuthenticated,
  onJump,
  onLogin,
  onSignup,
  onOpenApp,
}: {
  isTablet: boolean;
  isAuthenticated: boolean;
  onJump: (key: SectionKey) => void;
  onLogin: () => void;
  onSignup: () => void;
  onOpenApp: () => void;
}) {
  const layout = useResponsiveLayout();

  return (
    <View style={{ flexDirection: isTablet ? "row" : "column", justifyContent: "space-between", alignItems: isTablet ? "center" : "flex-start", gap: 14 }}>
      <View>
        <Text style={{ color: "#f8fbff", fontSize: 26, fontWeight: "800" }}>NextStride</Text>
        <Text style={{ color: "#8ea5c2", marginTop: 4, fontSize: 13 }}>A solo-runner training app built to make improvement feel clearer.</Text>
      </View>

      <View style={{ flexDirection: isTablet ? "row" : "column", alignItems: isTablet ? "center" : "flex-start", gap: 12 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <NavLink label="Week View" onPress={() => onJump("week")} />
          <NavLink label="Why It Works" onPress={() => onJump("why")} />
          <NavLink label="Pricing" onPress={() => onJump("premium")} />
          <NavLink label="FAQ" onPress={() => onJump("faq")} />
        </View>

        <View style={{ flexDirection: layout.isPhone ? "column" : "row", width: layout.isPhone ? "100%" : undefined, gap: 10 }}>
          {isAuthenticated ? <SiteButton label="Open App" variant="secondary" compact={true} onPress={onOpenApp} /> : <SiteButton label="Log In" variant="secondary" compact={true} onPress={onLogin} />}
          <SiteButton label={isAuthenticated ? "See Pricing" : "Start Free"} compact={true} onPress={isAuthenticated ? () => onJump("premium") : onSignup} />
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

function MetricCard({ value, label }: { value: string; label: string }) {
  const layout = useResponsiveLayout();

  return (
    <GlassPanel padding={layout.isPhone ? 14 : 16} radius={22}>
      <Text style={{ color: "#f8fbff", fontSize: layout.isPhone ? 18 : 20, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: "#90a7c3", fontSize: 13, marginTop: 6, lineHeight: layout.isPhone ? 18 : 19 }}>{label}</Text>
    </GlassPanel>
  );
}

function HeroPreview() {
  const layout = useResponsiveLayout();

  return (
    <View style={{ position: "relative", padding: layout.isPhone ? 4 : 18 }}>
      <MarketingBackdrop tone="hero" style={{ top: 8, height: layout.isPhone ? 420 : 500 }} />
      <RunningSurfaceAccent variant="track" />

      <GlassPanel highlight={true} padding={layout.isPhone ? 16 : 20} radius={34}>
        <View style={{ backgroundColor: "#0a1525", borderRadius: 28, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: layout.isPhone ? 16 : 18, gap: layout.isPhone ? 14 : 16 }}>
          <View style={{ flexDirection: layout.isPhone ? "column" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <View>
              <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>TODAY&apos;S WORKOUT</Text>
              <Text style={{ color: "#f8fbff", fontSize: layout.isPhone ? 24 : 28, fontWeight: "800", marginTop: 8 }}>Tempo Run</Text>
              <Text style={{ color: "#9db2ca", fontSize: 14, marginTop: 6 }}>20 min strong and controlled</Text>
            </View>
            <View style={{ backgroundColor: "rgba(37, 99, 235, 0.18)", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: "#f8fbff", fontSize: 12, fontWeight: "700" }}>Effort 6-7/10</Text>
            </View>
          </View>

          <View style={{ backgroundColor: "rgba(15, 27, 45, 0.94)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 16, gap: 8 }}>
            <Text style={{ color: "#dcecff", fontSize: 15, fontWeight: "700" }}>Purpose</Text>
            <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 21 }}>
              Improve stamina at faster effort while keeping the run smooth instead of forcing it.
            </Text>
            <Text style={{ color: "#67e8f9", fontSize: 13, fontWeight: "700" }}>Pace: 7:10-7:25 /mi</Text>
          </View>

          <View style={{ flexDirection: layout.isPhone ? "column" : "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SummaryPill label="Week shape" value="2 key days + long run" accent="#67e8f9" />
            </View>
            <View style={{ flex: 1 }}>
              <SummaryPill label="Progress read" value="Good rhythm this week" accent="#93c5fd" />
            </View>
          </View>
        </View>
      </GlassPanel>
    </View>
  );
}

function SummaryPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={{ backgroundColor: "rgba(15, 27, 45, 0.9)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 14 }}>
      <Text style={{ color: accent, fontSize: 11, fontWeight: "700", letterSpacing: 0.8 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: "#f8fbff", fontSize: 15, fontWeight: "700", marginTop: 6 }}>{value}</Text>
    </View>
  );
}

function QuickValueStrip({ isTablet }: { isTablet: boolean }) {
  const layout = useResponsiveLayout();

  return (
    <GlassPanel highlight={true} padding={layout.isPhone ? 12 : 14} radius={26}>
      <View style={{ flexDirection: isTablet ? "row" : "column", gap: 10 }}>
        {VALUE_STRIP.map((item, index) => (
          <View key={item} style={{ flex: 1, backgroundColor: index === 0 ? "rgba(20, 35, 57, 0.98)" : "rgba(8, 17, 29, 0.62)", borderRadius: 20, borderWidth: 1, borderColor: index === 0 ? "rgba(103, 232, 249, 0.2)" : "rgba(103, 232, 249, 0.08)", paddingHorizontal: layout.isPhone ? 14 : 16, paddingVertical: layout.isPhone ? 13 : 15 }}>
            <Text style={{ color: "#dcecff", fontSize: 14, fontWeight: "700", lineHeight: 20 }}>{item}</Text>
          </View>
        ))}
      </View>
    </GlassPanel>
  );
}

function WeekShowcase() {
  const layout = useResponsiveLayout();

  return (
    <View style={{ width: "100%", minWidth: 0 }}>
      <GlassPanel highlight={true} padding={28} radius={34}>
        <View style={{ flexDirection: layout.isPhone ? "column" : "row", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: "#f8fbff", fontSize: layout.isPhone ? 28 : 34, fontWeight: "800" }}>See your week in one glance</Text>
            <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 10, maxWidth: 540 }}>
              The key sessions stand out, support days stay calmer, and the whole week feels more intentional at first glance.
            </Text>
          </View>
          <SectionChip label="Most important view" />
        </View>

        <View style={{ gap: 12, marginTop: 24 }}>
          {WEEK_PREVIEW.map((item) => (
            <WeekPlanRow key={item.day} {...item} />
          ))}
        </View>
      </GlassPanel>
    </View>
  );
}

function WeekPlanRow({ day, title, detail, tone }: { day: string; title: string; detail: string; tone: DemoTone }) {
  const layout = useResponsiveLayout();
  const borderColor =
    tone === "long"
      ? "rgba(103, 232, 249, 0.34)"
      : tone === "key"
        ? "rgba(59, 130, 246, 0.28)"
        : "rgba(70, 102, 138, 0.22)";

  const badge =
    tone === "long" ? "Long run" : tone === "key" ? "Key workout" : "Support day";
  const icon = tone === "long" ? "footsteps-outline" : tone === "key" ? "flash-outline" : "partly-sunny-outline";

  return (
    <View style={{ backgroundColor: tone === "default" ? "rgba(8, 17, 29, 0.78)" : "rgba(9, 20, 33, 0.98)", borderRadius: 24, borderWidth: 1, borderColor, padding: 16, flexDirection: layout.isPhone ? "column" : "row", alignItems: layout.isPhone ? "flex-start" : "center", gap: 14, shadowColor: tone === "default" ? "#000000" : "#38bdf8", shadowOpacity: tone === "default" ? 0.05 : 0.12, shadowRadius: tone === "default" ? 8 : 18, shadowOffset: { width: 0, height: tone === "default" ? 2 : 8 } }}>
      <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: tone === "long" ? "rgba(103, 232, 249, 0.15)" : tone === "key" ? "rgba(37, 99, 235, 0.18)" : "rgba(15, 27, 45, 0.96)", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <MarketingIcon label={day} icon={icon} active={tone !== "default"} />
        <Text style={{ color: "#cfe1f7", fontSize: 11, fontWeight: "800" }}>{day}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#f8fbff", fontSize: 17, fontWeight: "700" }}>{title}</Text>
        <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 21, marginTop: 4 }}>{detail}</Text>
      </View>
      <View style={{ backgroundColor: "rgba(15, 27, 45, 0.95)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, alignSelf: layout.isPhone ? "flex-start" : "auto" }}>
        <Text style={{ color: tone === "default" ? "#90a7c3" : "#e6f8ff", fontSize: 12, fontWeight: "700" }}>{badge}</Text>
      </View>
    </View>
  );
}

function StoryCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={{ width: "100%", minWidth: 0 }}>
      <GlassPanel padding={20} radius={26}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
          <MarketingIcon label="" icon={icon} active={true} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: "#f8fbff", fontSize: 20, fontWeight: "700" }}>{title}</Text>
            <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 8 }}>{body}</Text>
          </View>
        </View>
      </GlassPanel>
    </View>
  );
}

function WhyCard({
  icon,
  title,
  body,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <GlassPanel highlight={active} padding={22} radius={28}>
      <MarketingIcon label="" icon={icon} active={active} />
      <Text style={{ color: "#f8fbff", fontSize: 22, fontWeight: "800", marginTop: 18 }}>{title}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 10 }}>{body}</Text>
    </GlassPanel>
  );
}

function PremiumPlans({
  billingCycle,
  onSelectBillingCycle,
  isDesktop,
  isTablet,
}: {
  billingCycle: BillingCycle;
  onSelectBillingCycle: (cycle: BillingCycle) => void;
  isDesktop: boolean;
  isTablet: boolean;
}) {
  return (
    <GlassPanel highlight={true} padding={isDesktop ? 30 : 22} radius={34}>
      <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", gap: 18, alignItems: isDesktop ? "center" : "stretch" }}>
        <View style={{ flex: 1 }}>
          <SectionChip label="Free vs Pro vs Elite" />
          <Text style={{ color: "#f8fbff", fontSize: 34, fontWeight: "800", marginTop: 18 }}>Start simple. Upgrade when you want more guidance.</Text>
          <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 12, maxWidth: 620 }}>
            Pro helps you train sharper. Elite adds adaptive coaching, post-run feedback, and goal-focused reads that feel much closer to a real coach.
          </Text>
        </View>

        <BillingSwitch billingCycle={billingCycle} onSelect={onSelectBillingCycle} />
      </View>

      <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 16, marginTop: 28 }}>
        {(["free", "pro", "elite"] as PremiumTier[]).map((tier) => (
          <PlanCard key={tier} tier={tier} billingCycle={billingCycle} compact={!isTablet} />
        ))}
      </View>
    </GlassPanel>
  );
}

function BillingSwitch({
  billingCycle,
  onSelect,
}: {
  billingCycle: BillingCycle;
  onSelect: (cycle: BillingCycle) => void;
}) {
  return (
    <View style={{ backgroundColor: "rgba(8, 17, 29, 0.9)", borderRadius: 999, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.14)", padding: 5, alignSelf: "flex-start" }}>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {(["monthly", "yearly"] as BillingCycle[]).map((cycle) => {
          const active = billingCycle === cycle;

          return (
            <Pressable
              key={cycle}
              onPress={() => onSelect(cycle)}
              style={{
                backgroundColor: active ? "#2563eb" : "transparent",
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 11,
              }}
            >
              <Text style={{ color: active ? "#ffffff" : "#c8d7ea", fontSize: 13, fontWeight: "700" }}>
                {cycle === "monthly" ? "Monthly" : "Yearly"}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PlanCard({
  tier,
  billingCycle,
  compact,
}: {
  tier: PremiumTier;
  billingCycle: BillingCycle;
  compact?: boolean;
}) {
  const plan = PREMIUM_PLANS[tier];
  const highlight = tier === "elite";
  const featurePoints =
    tier === "free"
      ? ["Weekly training plan", "Core dashboard", "Basic progress tracking"]
      : tier === "pro"
        ? ["Heart rate guidance", "Fueling suggestions", "Better race and workout insight"]
        : ["Adaptive training", "Post-run feedback", "On-track progress + coach-like guidance"];

  return (
    <View style={{ flex: 1, minWidth: compact ? 0 : 280, backgroundColor: highlight ? "#142339" : "rgba(8, 17, 29, 0.82)", borderRadius: 30, borderWidth: 1, borderColor: highlight ? "rgba(103, 232, 249, 0.24)" : "rgba(103, 232, 249, 0.1)", padding: 22, gap: 12, shadowColor: highlight ? "#38bdf8" : "#000000", shadowOpacity: highlight ? 0.14 : 0.05, shadowRadius: highlight ? 24 : 10, shadowOffset: { width: 0, height: highlight ? 10 : 4 } }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: plan.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>{plan.name.toUpperCase()}</Text>
          <Text style={{ color: "#f8fbff", fontSize: 28, fontWeight: "800", marginTop: 8 }}>{plan.name}</Text>
        </View>
        {highlight ? (
          <View style={{ backgroundColor: "rgba(103, 232, 249, 0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }}>
            <Text style={{ color: "#dffbff", fontSize: 11, fontWeight: "800" }}>COACH-LIKE</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ color: "#f8fbff", fontSize: 38, fontWeight: "800", marginTop: 2 }}>
        {plan.prices[billingCycle].label}
        <Text style={{ color: "#9db2ca", fontSize: 15 }}>{plan.prices[billingCycle].cadenceLabel}</Text>
      </Text>

      <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 21 }}>{plan.summary}</Text>
      <Text style={{ color: plan.accent, fontSize: 13, fontWeight: "700", lineHeight: 19 }}>{plan.audience}</Text>

      <View style={{ gap: 10, marginTop: 4 }}>
        {featurePoints.map((item) => (
          <Text key={item} style={{ color: "#dcecff", fontSize: 14, lineHeight: 20 }}>
            - {item}
          </Text>
        ))}
      </View>

      {plan.yearlySavingsLabel && billingCycle === "yearly" ? (
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", marginTop: 4 }}>{plan.yearlySavingsLabel}</Text>
      ) : null}

      {tier === "elite" ? (
        <View style={{ backgroundColor: "rgba(103, 232, 249, 0.08)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.14)", padding: 12 }}>
          <Text style={{ color: "#dffbff", fontSize: 12, fontWeight: "800" }}>BEST FOR RUNNERS WHO WANT THE MOST SUPPORT</Text>
          <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 19, marginTop: 6 }}>
            Elite adds adaptive guidance, deeper performance feedback, and a more premium training experience around every week.
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => {
          if (tier === "free") {
            router.push("/signup");
            return;
          }

          router.push(buildUpgradePath({ plan: tier }));
        }}
        style={{
          marginTop: 10,
          minHeight: 52,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: highlight ? "#2563eb" : "#0f1b2d",
          borderWidth: 1,
          borderColor: highlight ? "rgba(103, 232, 249, 0.32)" : "rgba(103, 232, 249, 0.12)",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "800" }}>{tier === "free" ? "Start Free" : `Choose ${plan.name}`}</Text>
      </Pressable>
    </View>
  );
}

function FaqRow({ question, answer }: { question: string; answer: string }) {
  return (
    <GlassPanel padding={20} radius={24}>
      <Text style={{ color: "#f8fbff", fontSize: 19, fontWeight: "700" }}>{question}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 23, marginTop: 10 }}>{answer}</Text>
    </GlassPanel>
  );
}

function FinalCta({
  isTablet,
  isAuthenticated,
  onPrimaryAction,
}: {
  isTablet: boolean;
  isAuthenticated: boolean;
  onPrimaryAction: () => void;
}) {
  return (
    <View style={{ position: "relative", backgroundColor: "#0d1830", borderRadius: 38, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.2)", padding: 28, alignItems: "center", shadowColor: "#2563eb", shadowOpacity: 0.22, shadowRadius: 26, shadowOffset: { width: 0, height: 10 }, overflow: "hidden" }}>
      <MarketingBackdrop tone="cta" style={{ height: 420 }} />
      <View style={{ width: "100%", maxWidth: 760, backgroundColor: "rgba(8, 17, 29, 0.58)", borderRadius: 30, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.1)", padding: 22, alignItems: "center" }}>
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.5 }}>READY TO RUN SMARTER</Text>
        <Text style={{ color: "#f8fbff", fontSize: 34, fontWeight: "800", marginTop: 12, textAlign: "center" }}>Start your next week with more clarity</Text>
        <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 12, textAlign: "center", maxWidth: 560 }}>
          Create your account, see your first week, and train with a product that feels cleaner, sharper, and more useful from the first run.
        </Text>
        <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: 24 }}>
          <SiteButton label={isAuthenticated ? "Open My Plan" : "Create Free Account"} onPress={onPrimaryAction} />
          <SiteButton label="See Elite" variant="secondary" onPress={() => router.push(buildUpgradePath({ plan: "elite" }))} />
        </View>
      </View>
    </View>
  );
}

function Footer({
  padding,
  isDesktop,
  isAuthenticated,
  onJump,
  onLogin,
  onSignup,
  onOpenApp,
}: {
  padding: number;
  isDesktop: boolean;
  isAuthenticated: boolean;
  onJump: (key: SectionKey) => void;
  onLogin: () => void;
  onSignup: () => void;
  onOpenApp: () => void;
}) {
  const openInstagram = () => {
    void Linking.openURL("https://instagram.com/NextStrideRunning");
  };

  return (
    <View style={{ marginTop: 90, paddingHorizontal: padding, paddingTop: 34, paddingBottom: 18, borderTopWidth: 1, borderTopColor: "rgba(103, 232, 249, 0.1)" }}>
      <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", gap: 24 }}>
        <View style={{ maxWidth: 360 }}>
          <Text style={{ color: "#f8fbff", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
          <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            A solo-runner training app built around clear plans, better feedback, and smarter progression.
          </Text>
          <View style={{ marginTop: 18 }}>
            <FooterSocialLink label="@NextStrideRunning" icon="logo-instagram" onPress={openInstagram} />
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>PRODUCT</Text>
          <FooterLink label="Week View" onPress={() => onJump("week")} />
          <FooterLink label="Why NextStride" onPress={() => onJump("why")} />
          <FooterLink label="Pricing" onPress={() => onJump("premium")} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>HELP</Text>
          <FooterLink label="FAQ" onPress={() => onJump("faq")} />
          <FooterLink label="Start Free" onPress={onSignup} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>ACCOUNT</Text>
          <FooterLink label={isAuthenticated ? "Open App" : "Log In"} onPress={isAuthenticated ? onOpenApp : onLogin} />
          <FooterLink label="Create Account" onPress={onSignup} />
        </View>
      </View>

      <Text style={{ color: "#6f89a6", fontSize: 13, marginTop: 28 }}>Copyright 2026 NextStride. Built for solo runners who want real progress.</Text>
    </View>
  );
}
