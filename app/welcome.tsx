import { router } from "expo-router";
import { useRef } from "react";
import { LayoutChangeEvent, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { FooterLink, GlassPanel, MarketingIcon, SectionChip, SiteButton, SiteSection } from "@/components/marketing-site";
import { useProfile } from "@/contexts/profile-context";
import { buildUpgradePath } from "@/lib/upgrade-route";

type SectionKey = "hero" | "value" | "week" | "why" | "premium" | "trust" | "faq" | "cta";
type Tone = "default" | "workout" | "long";

const VALUE_POINTS = ["Structured weekly plans", "Built for real runners", "Progress that actually improves you"];

const WEEK_PREVIEW: { day: string; title: string; detail: string; tone: Tone }[] = [
  { day: "Mon", title: "Interval session", detail: "6 x 800m at 10K effort", tone: "workout" },
  { day: "Tue", title: "Easy mileage", detail: "45 min recovery rhythm", tone: "default" },
  { day: "Wed", title: "Threshold run", detail: "20 min tempo + strides", tone: "workout" },
  { day: "Thu", title: "Aerobic reset", detail: "40 min easy with drills", tone: "default" },
  { day: "Fri", title: "Rest and mobility", detail: "Leg reset before the long run", tone: "default" },
  { day: "Sat", title: "Long run", detail: "80 min steady with a strong finish", tone: "long" },
  { day: "Sun", title: "Recovery day", detail: "Light shakeout or full rest", tone: "default" },
];

const WHY_CARDS = [
  { icon: "P", title: "Structured training", body: "Every week has a purpose, so hard days, easy days, and long runs connect cleanly." },
  { icon: "F", title: "Real feedback", body: "You get guidance on what to do next, not just a record of what already happened." },
  { icon: "G", title: "Goal-based progress", body: "Plans and insights stay tied to your race goals so improvement feels directional." },
];

const PREMIUM_FEATURES = [
  { icon: "HR", title: "Heart rate guidance", body: "Stay in the right effort zone when pace alone does not tell the full story." },
  { icon: "FU", title: "Fueling guidance", body: "Know how to support longer runs and race blocks without guessing mid-cycle." },
  { icon: "AI", title: "Advanced insights", body: "Race prediction, readiness context, and deeper analytics when you want more precision." },
];

const TESTIMONIALS = [
  { quote: "The week finally makes sense. I know what today is for before I even lace up.", name: "Maya, half marathoner" },
  { quote: "It feels more like a coach than a tracker. The feedback is the reason I kept using it.", name: "Jordan, building toward a 10K PR" },
  { quote: "The structure is clean, and the long run progression feels intentional instead of random.", name: "Alex, marathon block" },
];

const FAQ_ITEMS = [
  { question: "Do I need experience?", answer: "No. NextStride works for newer runners and experienced racers by adapting structure to your level." },
  { question: "Is this built for individual runners?", answer: "Yes. NextStride is focused entirely on solo runners who want clearer structure and coaching-style guidance." },
  { question: "Is this personalized?", answer: "Yes. Your plan is shaped by goal event, mileage, recent results, consistency, and completed sessions." },
  { question: "What does premium include?", answer: "Premium adds heart rate guidance, fueling support, and deeper insights like race prediction and analytics." },
];

export default function Welcome() {
  const { isAuthenticated, profile, appHomeRoute } = useProfile();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});
  const isDesktop = width >= 1180;
  const isTablet = width >= 820;
  const padding = isDesktop ? 72 : isTablet ? 34 : 20;
  const heroTitleSize = isDesktop ? 78 : isTablet ? 58 : 42;
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
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: "#08111d" }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: padding, paddingTop: isDesktop ? 34 : 22, paddingBottom: 48 }} onLayout={setSectionOffset("hero")}>
        <TopNavigation
          isTablet={isTablet}
          onJump={scrollToSection}
          isAuthenticated={isAuthenticated}
          onLogin={() => router.push("/login")}
          onSignup={() => router.push("/signup")}
          onOpenApp={() => router.push(openAppRoute)}
        />

        <View style={{ marginTop: isDesktop ? 58 : 34, flexDirection: isDesktop ? "row" : "column", alignItems: "center", gap: isDesktop ? 68 : 34 }}>
          <View style={{ flex: 1, maxWidth: 620 }}>
            <SectionChip label="Modern running platform" />
            <Text style={{ color: "#f8fbff", fontSize: heroTitleSize, fontWeight: "800", lineHeight: heroTitleSize + 2, marginTop: 20 }}>
              Train smarter. Run faster.
            </Text>
            <Text style={{ color: "#9db2ca", fontSize: 19, lineHeight: 31, marginTop: 18, maxWidth: 560 }}>
              Personalized running plans, real feedback, and smarter training - all in one place.
            </Text>

            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: 30 }}>
              <SiteButton label={isAuthenticated ? "Open Training" : "Start Training Free"} onPress={() => router.push(isAuthenticated ? openAppRoute : "/signup")} />
              <SiteButton label="View Demo Week" variant="secondary" onPress={() => scrollToSection("week")} />
            </View>

            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: 28 }}>
              <MetricCard value="4.8x" label="clearer weekly structure" />
              <MetricCard value="3 views" label="to understand your week" />
              <MetricCard value="1 place" label="for plan, progress, and feedback" />
            </View>
          </View>

          <View style={{ flex: 1, width: "100%", maxWidth: 520 }}>
            <HeroMockup />
          </View>
        </View>
      </View>

      <View onLayout={setSectionOffset("value")} style={{ paddingHorizontal: padding, marginTop: 34 }}>
        <ValueStrip isTablet={isTablet} />
      </View>

      <View onLayout={setSectionOffset("week")}>
        <SiteSection
          eyebrow="Main Feature"
          title="See exactly how your training works"
          subtitle="A single weekly plan view makes the value obvious fast: what is hard, what is easy, and how the whole week moves you forward."
          padding={padding}
        >
          <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 26, alignItems: "stretch" }}>
            <View style={{ flex: 1.35 }}>
              <WeeklyPlanShowcase isTablet={isTablet} />
            </View>
            <View style={{ flex: 0.82, gap: 14 }}>
              <LargeFeatureBullet icon="DS" title="Daily structure" body="Every day has a role, so the week feels intentional the moment you open it." />
              <LargeFeatureBullet icon="BP" title="Built-in progression" body="The plan grows with your consistency instead of repeating the same flat schedule." />
              <LargeFeatureBullet icon="EP" title="Effort-based + pace-based training" body="You can train by feel, by pace, or both depending on the workout and your goals." />
            </View>
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("why")}>
        <SiteSection eyebrow="Why NextStride" title="Guidance that feels focused" subtitle="Three clear reasons runners understand the product quickly and keep scrolling." padding={padding}>
          <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 18 }}>
            {WHY_CARDS.map((card, index) => (
              <WhyCard key={card.title} {...card} active={index === 1} />
            ))}
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("premium")}>
        <SiteSection eyebrow="Premium" title="Unlock smarter training" subtitle="The upgrade stays clean and focused: better guidance, better fueling decisions, and deeper performance insight." padding={padding}>
          <PremiumSection isDesktop={isDesktop} />
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("trust")}>
        <SiteSection eyebrow="Trust" title="Built for runners chasing real progress" subtitle="A small proof section that shows momentum without turning the page into a wall of social proof." padding={padding}>
          <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 18 }}>
            <StatsPanel isTablet={isTablet} />
            <View style={{ flex: 1, gap: 14 }}>
              {TESTIMONIALS.map((item) => (
                <TestimonialCard key={item.name} quote={item.quote} name={item.name} />
              ))}
            </View>
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("faq")}>
        <SiteSection eyebrow="FAQ" title="A few quick answers before you start" subtitle="Short, clear answers for the questions most runners ask first." padding={padding}>
          <View style={{ gap: 14 }}>
            {FAQ_ITEMS.map((item) => (
              <FaqRow key={item.question} question={item.question} answer={item.answer} />
            ))}
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("cta")}>
        <SiteSection padding={padding} title="Start your next stride today" subtitle="Create your account, open your first week, and train with more clarity from day one." centered={true}>
          <FinalCta isTablet={isTablet} />
        </SiteSection>
      </View>

      <Footer padding={padding} isDesktop={isDesktop} onJump={scrollToSection} isAuthenticated={isAuthenticated} onLogin={() => router.push("/login")} onSignup={() => router.push("/signup")} onOpenApp={() => router.push(openAppRoute)} />
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
  return (
    <View style={{ flexDirection: isTablet ? "row" : "column", justifyContent: "space-between", alignItems: isTablet ? "center" : "flex-start", gap: 14 }}>
      <View>
        <Text style={{ color: "#f8fbff", fontSize: 26, fontWeight: "800" }}>NextStride</Text>
        <Text style={{ color: "#8ea5c2", marginTop: 4, fontSize: 13 }}>Premium training guidance for runners who want real progress.</Text>
      </View>

      <View style={{ flexDirection: isTablet ? "row" : "column", alignItems: isTablet ? "center" : "flex-start", gap: 12 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <NavLink label="Features" onPress={() => onJump("week")} />
          <NavLink label="Why" onPress={() => onJump("why")} />
          <NavLink label="Premium" onPress={() => onJump("premium")} />
          <NavLink label="FAQ" onPress={() => onJump("faq")} />
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {isAuthenticated ? <SiteButton label="Open App" variant="secondary" compact={true} onPress={onOpenApp} /> : <SiteButton label="Log In" variant="secondary" compact={true} onPress={onLogin} />}
          <SiteButton label={isAuthenticated ? "Create Account" : "Start Free"} compact={true} onPress={onSignup} />
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
  return (
    <GlassPanel padding={16} radius={22}>
      <Text style={{ color: "#f8fbff", fontSize: 22, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: "#90a7c3", fontSize: 13, marginTop: 4 }}>{label}</Text>
    </GlassPanel>
  );
}

function HeroMockup() {
  return (
    <View style={{ padding: 18 }}>
      <View
        style={{
          position: "absolute",
          top: 18,
          right: 6,
          width: 280,
          height: 280,
          borderRadius: 999,
          backgroundColor: "rgba(37, 99, 235, 0.24)",
          shadowColor: "#38bdf8",
          shadowOpacity: 0.35,
          shadowRadius: 42,
          shadowOffset: { width: 0, height: 0 },
        }}
      />

      <GlassPanel highlight={true} padding={20} radius={34}>
        <View style={{ backgroundColor: "#0a1525", borderRadius: 28, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 18 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>WEEKLY TRAINING</Text>
              <Text style={{ color: "#f8fbff", fontSize: 28, fontWeight: "800", marginTop: 8 }}>Demo Week</Text>
            </View>
            <View style={{ backgroundColor: "rgba(37, 99, 235, 0.18)", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#d9efff", fontSize: 12, fontWeight: "700" }}>Ready to train</Text>
            </View>
          </View>

          <View style={{ gap: 12, marginTop: 22 }}>
            {WEEK_PREVIEW.slice(0, 5).map((day) => (
              <MockupRow key={day.day} {...day} />
            ))}
          </View>

          <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SummaryPill label="Today" value="Threshold run" accent="#67e8f9" />
            </View>
            <View style={{ flex: 1 }}>
              <SummaryPill label="Next key day" value="Long run" accent="#93c5fd" />
            </View>
          </View>
        </View>
      </GlassPanel>
    </View>
  );
}

function MockupRow({ day, title, detail, tone }: { day: string; title: string; detail: string; tone: Tone }) {
  const accentColor = tone === "long" ? "#67e8f9" : tone === "workout" ? "#93c5fd" : "#90a7c3";

  return (
    <View style={{ backgroundColor: tone === "default" ? "rgba(15, 27, 45, 0.84)" : "rgba(15, 27, 45, 0.98)", borderRadius: 22, borderWidth: 1, borderColor: tone === "long" ? "rgba(103, 232, 249, 0.28)" : tone === "workout" ? "rgba(147, 197, 253, 0.22)" : "rgba(70, 102, 138, 0.3)", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: "rgba(8, 17, 29, 0.95)", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: accentColor, fontSize: 13, fontWeight: "800" }}>{day}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#f8fbff", fontSize: 15, fontWeight: "700" }}>{title}</Text>
        <Text style={{ color: "#94abc6", fontSize: 13, lineHeight: 19, marginTop: 4 }}>{detail}</Text>
      </View>
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

function ValueStrip({ isTablet }: { isTablet: boolean }) {
  return (
    <GlassPanel padding={14} radius={26}>
      <View style={{ flexDirection: isTablet ? "row" : "column", gap: 10 }}>
        {VALUE_POINTS.map((item) => (
          <View key={item} style={{ flex: 1, backgroundColor: "rgba(8, 17, 29, 0.62)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.1)", paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ color: "#dcecff", fontSize: 14, fontWeight: "700" }}>{item}</Text>
          </View>
        ))}
      </View>
    </GlassPanel>
  );
}

function WeeklyPlanShowcase({ isTablet }: { isTablet: boolean }) {
  return (
    <GlassPanel highlight={true} padding={26} radius={34}>
      <View style={{ flexDirection: isTablet ? "row" : "column", justifyContent: "space-between", gap: 18 }}>
        <View>
          <Text style={{ color: "#f8fbff", fontSize: 32, fontWeight: "800" }}>Weekly training view</Text>
          <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 10, maxWidth: 520 }}>
            The week reads like a premium training product at a glance, with key sessions highlighted and easier days visually quieter.
          </Text>
        </View>
        <SectionChip label="7-day plan" />
      </View>

      <View style={{ gap: 12, marginTop: 24 }}>
        {WEEK_PREVIEW.map((item) => (
          <WeekPlanRow key={item.day} {...item} />
        ))}
      </View>
    </GlassPanel>
  );
}

function WeekPlanRow({ day, title, detail, tone }: { day: string; title: string; detail: string; tone: Tone }) {
  return (
    <View style={{ backgroundColor: tone === "default" ? "rgba(8, 17, 29, 0.78)" : "rgba(9, 20, 33, 0.98)", borderRadius: 24, borderWidth: 1, borderColor: tone === "long" ? "rgba(103, 232, 249, 0.34)" : tone === "workout" ? "rgba(59, 130, 246, 0.28)" : "rgba(70, 102, 138, 0.22)", padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={{ width: 50, height: 50, borderRadius: 18, backgroundColor: tone === "long" ? "rgba(103, 232, 249, 0.15)" : tone === "workout" ? "rgba(37, 99, 235, 0.18)" : "rgba(15, 27, 45, 0.96)", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#f8fbff", fontSize: 14, fontWeight: "800" }}>{day}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#f8fbff", fontSize: 17, fontWeight: "700" }}>{title}</Text>
        <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 21, marginTop: 4 }}>{detail}</Text>
      </View>
      <View style={{ backgroundColor: tone === "long" ? "rgba(103, 232, 249, 0.16)" : tone === "workout" ? "rgba(37, 99, 235, 0.2)" : "rgba(15, 27, 45, 0.95)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ color: tone === "default" ? "#90a7c3" : "#e6f8ff", fontSize: 12, fontWeight: "700" }}>
          {tone === "long" ? "Key long run" : tone === "workout" ? "Workout day" : "Support day"}
        </Text>
      </View>
    </View>
  );
}

function LargeFeatureBullet({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <GlassPanel padding={20} radius={26}>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
        <MarketingIcon label={icon} active={true} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#f8fbff", fontSize: 20, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 8 }}>{body}</Text>
        </View>
      </View>
    </GlassPanel>
  );
}

function WhyCard({
  icon,
  title,
  body,
  active,
}: {
  icon: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  return (
    <GlassPanel highlight={active} padding={22} radius={28}>
      <MarketingIcon label={icon} active={active} />
      <Text style={{ color: "#f8fbff", fontSize: 22, fontWeight: "800", marginTop: 18 }}>{title}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 10 }}>{body}</Text>
    </GlassPanel>
  );
}

function PremiumSection({
  isDesktop,
}: {
  isDesktop: boolean;
}) {
  return (
    <Pressable onPress={() => router.push(buildUpgradePath({ plan: "elite" }))} style={({ pressed }) => ({ opacity: pressed ? 0.98 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] })}>
      <GlassPanel highlight={true} padding={isDesktop ? 30 : 22} radius={34}>
        <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 18, justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <SectionChip label="Plans and pricing" />
            <Text style={{ color: "#f8fbff", fontSize: 34, fontWeight: "800", marginTop: 18 }}>Choose the support level that fits your training</Text>
            <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 12, maxWidth: 620 }}>
              Compare Free, Pro, and Elite plans, switch monthly or yearly billing, and see exactly which tools unlock deeper guidance.
            </Text>
          </View>

          <View style={{ alignSelf: isDesktop ? "flex-start" : "stretch", backgroundColor: "rgba(8, 17, 29, 0.9)", borderRadius: 24, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.18)", paddingHorizontal: 20, paddingVertical: 18 }}>
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>STARTING AT</Text>
            <Text style={{ color: "#f8fbff", fontSize: 32, fontWeight: "800", marginTop: 8 }}>$2.50</Text>
            <Text style={{ color: "#91a7c3", fontSize: 14, marginTop: 4 }}>per month</Text>
            <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", marginTop: 10 }}>View plans -&gt;</Text>
          </View>
        </View>

        <View style={{ flexDirection: isDesktop ? "row" : "column", gap: 16, marginTop: 26 }}>
          {PREMIUM_FEATURES.map((feature) => (
            <PremiumCard key={feature.title} {...feature} />
          ))}
        </View>
      </GlassPanel>
    </Pressable>
  );
}

function PremiumCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(8, 17, 29, 0.82)", borderRadius: 26, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.12)", padding: 18 }}>
      <MarketingIcon label={icon} active={true} />
      <Text style={{ color: "#f8fbff", fontSize: 21, fontWeight: "800", marginTop: 16 }}>{title}</Text>
      <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 8 }}>{body}</Text>
    </View>
  );
}

function StatsPanel({ isTablet }: { isTablet: boolean }) {
  const stats = [
    { value: "12k+", label: "runs planned" },
    { value: "4.9/5", label: "runner-rated clarity" },
    { value: "92%", label: "say the week feels easier to follow" },
  ];

  return (
    <GlassPanel highlight={true} padding={24} radius={30}>
      <Text style={{ color: "#f8fbff", fontSize: 28, fontWeight: "800" }}>Built around clarity and follow-through</Text>
      <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 10, maxWidth: 520 }}>
        NextStride is designed so runners understand the week quickly, trust the structure, and keep coming back to it.
      </Text>

      <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: 22 }}>
        {stats.map((stat) => (
          <View key={stat.label} style={{ flex: 1, backgroundColor: "rgba(8, 17, 29, 0.76)", borderRadius: 22, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.1)", padding: 16 }}>
            <Text style={{ color: "#f8fbff", fontSize: 24, fontWeight: "800" }}>{stat.value}</Text>
            <Text style={{ color: "#9db2ca", fontSize: 13, lineHeight: 19, marginTop: 5 }}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </GlassPanel>
  );
}

function TestimonialCard({ quote, name }: { quote: string; name: string }) {
  return (
    <GlassPanel padding={20} radius={24}>
      <Text style={{ color: "#f8fbff", fontSize: 17, lineHeight: 27, fontWeight: "600" }}>{quote}</Text>
      <Text style={{ color: "#8ea5c2", fontSize: 13, marginTop: 12 }}>{name}</Text>
    </GlassPanel>
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

function FinalCta({ isTablet }: { isTablet: boolean }) {
  return (
    <View style={{ backgroundColor: "#0d1830", borderRadius: 38, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.2)", padding: 28, alignItems: "center", shadowColor: "#2563eb", shadowOpacity: 0.22, shadowRadius: 26, shadowOffset: { width: 0, height: 10 } }}>
      <View style={{ width: "100%", maxWidth: 760, backgroundColor: "rgba(8, 17, 29, 0.58)", borderRadius: 30, borderWidth: 1, borderColor: "rgba(103, 232, 249, 0.1)", padding: 22, alignItems: "center" }}>
        <Text style={{ color: "#67e8f9", fontSize: 12, fontWeight: "800", letterSpacing: 1.5 }}>READY TO START</Text>
        <Text style={{ color: "#f8fbff", fontSize: 34, fontWeight: "800", marginTop: 12, textAlign: "center" }}>Start your next stride today</Text>
        <Text style={{ color: "#9db2ca", fontSize: 15, lineHeight: 24, marginTop: 12, textAlign: "center", maxWidth: 560 }}>
          Open the app, set your goal, and see a cleaner training week built around what actually matters.
        </Text>
        <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12, marginTop: 24 }}>
          <SiteButton label="Create Free Account" onPress={() => router.push("/signup")} />
          <SiteButton label="View Premium" variant="secondary" onPress={() => router.push(buildUpgradePath({ plan: "elite" }))} />
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
  return (
    <View style={{ marginTop: 90, paddingHorizontal: padding, paddingTop: 34, paddingBottom: 18, borderTopWidth: 1, borderTopColor: "rgba(103, 232, 249, 0.1)" }}>
      <View style={{ flexDirection: isDesktop ? "row" : "column", justifyContent: "space-between", gap: 24 }}>
        <View style={{ maxWidth: 360 }}>
          <Text style={{ color: "#f8fbff", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
          <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            Personalized running plans, feedback, and clearer training flow in one premium dark interface.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>PRODUCT</Text>
          <FooterLink label="Value" onPress={() => onJump("value")} />
          <FooterLink label="Weekly plan" onPress={() => onJump("week")} />
          <FooterLink label="Premium" onPress={() => onJump("premium")} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>RESOURCES</Text>
          <FooterLink label="Why NextStride" onPress={() => onJump("why")} />
          <FooterLink label="Trust" onPress={() => onJump("trust")} />
          <FooterLink label="FAQ" onPress={() => onJump("faq")} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>ACCOUNT</Text>
          <FooterLink label={isAuthenticated ? "Open App" : "Log In"} onPress={isAuthenticated ? onOpenApp : onLogin} />
          <FooterLink label="Create Free Account" onPress={onSignup} />
        </View>
      </View>

      <Text style={{ color: "#6f89a6", fontSize: 13, marginTop: 28 }}>Copyright 2026 NextStride. Built for runners chasing real progress.</Text>
    </View>
  );
}
