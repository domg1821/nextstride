import { router } from "expo-router";
import { useRef } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  FeatureCard,
  FooterLink,
  PreviewCard,
  SiteButton,
  SiteSection,
  StepCard,
  WeeklyPlanPreview,
} from "./components/marketing-site";

type SectionKey =
  | "hero"
  | "features"
  | "how"
  | "plan"
  | "why"
  | "premium"
  | "preview"
  | "cta";

export default function Welcome() {
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1100;
  const isTablet = width >= 760;
  const padding = isDesktop ? 60 : isTablet ? 32 : 20;
  const heroTitleSize = isDesktop ? 72 : isTablet ? 54 : 40;

  const setSectionOffset = (key: SectionKey) => (event: LayoutChangeEvent) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const scrollToSection = (key: SectionKey) => {
    const y = sectionOffsets.current[key];

    if (typeof y !== "number") {
      return;
    }

    scrollRef.current?.scrollTo({
      y: Math.max(y - 30, 0),
      animated: true,
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: "#06101d" }}
      contentContainerStyle={{ paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          paddingHorizontal: padding,
          paddingTop: isDesktop ? 34 : 20,
        }}
        onLayout={setSectionOffset("hero")}
      >
        <TopNavigation
          isTablet={isTablet}
          onJump={scrollToSection}
          onLogin={() => router.push("/login")}
          onSignup={() => router.push("/signup")}
          onPremium={() => scrollToSection("premium")}
        />

        <View
          style={{
            marginTop: 28,
            borderRadius: 38,
            borderWidth: 1,
            borderColor: "rgba(125, 211, 252, 0.12)",
            backgroundColor: "#091624",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -120,
              right: -40,
              width: 320,
              height: 320,
              borderRadius: 160,
              backgroundColor: "rgba(59, 130, 246, 0.12)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -120,
              left: -60,
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: "rgba(14, 165, 233, 0.08)",
            }}
          />

          <View
            style={{
              padding: isDesktop ? 38 : 24,
              flexDirection: isDesktop ? "row" : "column",
              gap: 24,
            }}
          >
            <View style={{ flex: isDesktop ? 1.08 : undefined }}>
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "rgba(59, 130, 246, 0.16)",
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    color: "#93c5fd",
                    fontSize: 12,
                    fontWeight: "800",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Running plans that actually coach
                </Text>
              </View>

              <Text
                style={{
                  color: "#f8fafc",
                  fontSize: heroTitleSize,
                  fontWeight: "800",
                  lineHeight: heroTitleSize + 6,
                  marginTop: 18,
                  maxWidth: 760,
                }}
              >
                Train smarter. Run faster. Stay consistent.
              </Text>

              <Text
                style={{
                  color: "#a8bdd7",
                  fontSize: 18,
                  lineHeight: 29,
                  marginTop: 18,
                  maxWidth: 700,
                }}
              >
                NextStride gives runners personalized weekly plans, cleaner workout logging,
                adaptive training guidance, and progress visibility that makes every week
                feel intentional.
              </Text>

              <View
                style={{
                  flexDirection: isTablet ? "row" : "column",
                  gap: 12,
                  marginTop: 30,
                }}
              >
                <SiteButton label="Get Started" onPress={() => router.push("/signup")} />
                <SiteButton
                  label="View Demo Plan"
                  variant="secondary"
                  onPress={() => scrollToSection("plan")}
                />
                <SiteButton
                  label="Start Premium"
                  variant="secondary"
                  onPress={() => scrollToSection("premium")}
                />
              </View>

              <View
                style={{
                  marginTop: 28,
                  flexDirection: isTablet ? "row" : "column",
                  gap: 12,
                }}
              >
                <HeroStat value="Personalized" label="weekly plans" />
                <HeroStat value="PR-aware" label="training logic" />
                <HeroStat value="Built for" label="consistent runners" />
              </View>
            </View>

            <View style={{ flex: isDesktop ? 0.92 : undefined, gap: 16 }}>
              <HeroPreview />
              <View
                style={{
                  flexDirection: isTablet ? "row" : "column",
                  gap: 16,
                }}
              >
                <HeroInsight
                  accent="#7dd3fc"
                  title="Adaptive structure"
                  body="Your week stays organized around goals, mileage, and workout feedback."
                />
                <HeroInsight
                  accent="#86efac"
                  title="Progress you can feel"
                  body="See what is planned, what is done, and how your training is moving."
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View onLayout={setSectionOffset("features")}>
        <SiteSection
          eyebrow="Features"
          title="A complete running product, not just a run tracker"
          subtitle="NextStride is designed to guide training blocks from setup to daily execution with a polished experience that feels calm, modern, and trustworthy."
          padding={padding}
        >
          <ResponsiveGrid isDesktop={isDesktop}>
            <FeatureCard
              badge="Plans"
              icon="P"
              title="Personalized Training Plans"
              body="Build toward your goal event with weekly structure shaped around your mileage, current level, and priorities."
            />
            <FeatureCard
              badge="Log"
              icon="L"
              title="Workout Logging"
              body="Capture distance, time, notes, splits, and effort without the product getting in the way after hard sessions."
            />
            <FeatureCard
              badge="Progress"
              icon="T"
              title="Progress Tracking"
              body="Track consistency, weekly volume, and momentum in a view that helps you keep training forward."
            />
            <FeatureCard
              badge="History"
              icon="A"
              title="Activities History"
              body="See what you completed, what is trending, and how recent sessions connect across the full block."
            />
            <FeatureCard
              badge="Stats"
              icon="S"
              title="Statistics Dashboard"
              body="Review mileage, effort patterns, logged sessions, and useful snapshots without clutter or noise."
            />
            <FeatureCard
              badge="Goals"
              icon="G"
              title="Goal-Based Running Plans"
              body="Train for the 800, mile, 5K, 10K, half marathon, or marathon with event-aware structure."
            />
            <FeatureCard
              badge="PR"
              icon="R"
              title="PR-Aware Workouts"
              body="Use your PRs to shape pacing guidance so hard days feel specific and training feels personal from day one."
            />
          </ResponsiveGrid>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("how")}>
        <SiteSection
          eyebrow="How It Works"
          title="A simple path from setup to stronger training"
          subtitle="NextStride stays easy to understand so runners can spend more time training well and less time figuring out the app."
          padding={padding}
        >
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: 16,
            }}
          >
            <StepCard
              step="01"
              title="Enter your PRs and goals"
              body="Tell NextStride what you are training for, how much you run, and where your fitness sits right now."
            />
            <StepCard
              step="02"
              title="Get a personalized weekly plan"
              body="Receive a structured week with track work, aerobic days, long runs, and recovery that feels purpose-built."
            />
            <StepCard
              step="03"
              title="Log completed workouts"
              body="Track what you actually finished so the app becomes more useful every time you come back."
            />
            <StepCard
              step="04"
              title="See progress over time"
              body="Use plan completion, activity history, and training trends to stay consistent through the whole block."
            />
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("plan")}>
        <SiteSection
          eyebrow="Weekly Plan Preview"
          title="See a week at a glance"
          subtitle="This is the kind of structure runners want the moment the app opens: clear workout types, useful pacing context, and a week that already makes sense."
          padding={padding}
        >
          <WeeklyPlanPreview
            days={[
              {
                day: "Monday",
                title: "Track workout",
                detail: "Intervals built around current fitness and goal pace.",
              },
              {
                day: "Tuesday",
                title: "Easy run",
                detail: "Relaxed aerobic mileage with room to recover well.",
              },
              {
                day: "Wednesday",
                title: "Tempo workout",
                detail: "Threshold work that builds fitness without random guessing.",
              },
              {
                day: "Thursday",
                title: "Aerobic run",
                detail: "Steady support mileage that keeps the week balanced.",
              },
              {
                day: "Friday",
                title: "Easy run",
                detail: "A calm day that keeps the legs moving without adding unnecessary stress.",
              },
              {
                day: "Saturday",
                title: "Long run",
                detail: "A key endurance session with a clear purpose and finish style.",
              },
              {
                day: "Sunday",
                title: "Recovery or rest",
                detail: "Space to absorb the week and get ready for the next one.",
              },
            ]}
          />
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("why")}>
        <SiteSection
          eyebrow="Why NextStride"
          title="Most apps only record runs. NextStride helps runners train better."
          subtitle="The difference is not more noise. It is better planning, clearer execution, and a product built to help runners stay consistent over time."
          padding={padding}
        >
          <View
            style={{
              backgroundColor: "rgba(14, 27, 48, 0.92)",
              borderRadius: 34,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.14)",
              padding: isDesktop ? 30 : 22,
              flexDirection: isDesktop ? "row" : "column",
              gap: 20,
            }}
          >
            <WhyPoint
              title="Planning, not just tracking"
              body="NextStride gives runners a reason to come back before the run, not only after it."
            />
            <WhyPoint
              title="Personalized around actual goals"
              body="Mileage, PRs, goal event, and consistency all help shape the week so it feels relevant."
            />
            <WhyPoint
              title="Built for consistency"
              body="The product stays clean and approachable so training feels easier to follow for months, not days."
            />
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("premium")}>
        <SiteSection
          eyebrow="Premium"
          title="Premium guidance for runners who want more precision"
          subtitle="NextStride Premium brings more detailed decision support into the app while keeping the product clean, focused, and runner-friendly."
          padding={padding}
        >
          <View
            style={{
              backgroundColor: "rgba(14, 27, 48, 0.92)",
              borderRadius: 34,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.14)",
              padding: isDesktop ? 30 : 22,
              gap: 20,
            }}
          >
            <View
              style={{
                flexDirection: isDesktop ? "row" : "column",
                justifyContent: "space-between",
                alignItems: isDesktop ? "center" : "flex-start",
                gap: 16,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#f8fafc", fontSize: 30, fontWeight: "800" }}>
                  $2.50/month
                </Text>
                <Text
                  style={{
                    color: "#9fb2cb",
                    fontSize: 15,
                    lineHeight: 23,
                    marginTop: 8,
                    maxWidth: 620,
                  }}
                >
                  A simple upgrade for runners who want heart rate guidance, fueling support,
                  smarter recommendations, and deeper training insight.
                </Text>
              </View>

              <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12 }}>
                <SiteButton label="Upgrade to Premium" onPress={() => router.push("/premium")} />
                <SiteButton
                  label="Log In to Upgrade"
                  variant="secondary"
                  onPress={() => router.push("/login")}
                />
              </View>
            </View>

            <ResponsiveGrid isDesktop={isDesktop}>
              <FeatureCard
                badge="Premium"
                icon="H"
                title="Heart rate based training guidance"
                body="See session-specific heart rate targets for easy runs, tempos, intervals, and long runs."
              />
              <FeatureCard
                badge="Premium"
                icon="F"
                title="Personalized fueling suggestions"
                body="Get lightweight runner-focused guidance for pre-run fuel, long-run carbs, and recovery meals."
              />
              <FeatureCard
                badge="Premium"
                icon="A"
                title="Smarter adaptive workout recommendations"
                body="Unlock more responsive guidance that helps the app coach the next session more intelligently."
              />
              <FeatureCard
                badge="Premium"
                icon="I"
                title="More detailed training insights"
                body="Use richer context around intensity, readiness, and training trends to make better weekly decisions."
              />
            </ResponsiveGrid>
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("preview")}>
        <SiteSection
          eyebrow="App Preview"
          title="A polished product experience runners can imagine using every day"
          subtitle="Even with placeholder visuals, the interface should already feel like a real product: thoughtful, organized, and worth returning to."
          padding={padding}
        >
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <PreviewCard
              title="Home Dashboard"
              subtitle="Today's workout, weekly progress, and training context the moment the app opens."
              accent="#7dd3fc"
              tall={true}
            />
            <PreviewCard
              title="Weekly Plan"
              subtitle="A full week of training with clear workout types, confidence, and pacing direction."
              accent="#60a5fa"
              tall={true}
            />
            <PreviewCard
              title="Workout Logging"
              subtitle="Fast post-run entry for distance, notes, splits, and effort."
              accent="#38bdf8"
            />
            <PreviewCard
              title="Progress & Stats"
              subtitle="Clear snapshots of momentum, mileage, and benchmarks over time."
              accent="#22c55e"
            />
            <PreviewCard
              title="Profile"
              subtitle="Goals, PRs, and identity settings in a simple layout that supports the training experience."
              accent="#f59e0b"
            />
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("cta")}>
        <SiteSection
          eyebrow="Start Strong"
          title="Get a cleaner, more intentional way to train"
          subtitle="NextStride is built for runners who want structure without clutter, better weekly clarity, and a product experience that feels ready from day one."
          padding={padding}
        >
          <View
            style={{
              backgroundColor: "#0b1b2e",
              borderRadius: 34,
              borderWidth: 1,
              borderColor: "rgba(96, 165, 250, 0.18)",
              padding: isDesktop ? 30 : 22,
              flexDirection: isDesktop ? "row" : "column",
              justifyContent: "space-between",
              alignItems: isDesktop ? "center" : "flex-start",
              gap: 18,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#f8fafc", fontSize: 32, fontWeight: "800" }}>
                Built for runners who want to know what comes next.
              </Text>
              <Text
                style={{
                  color: "#9fb2cb",
                  fontSize: 15,
                  lineHeight: 23,
                  marginTop: 10,
                  maxWidth: 640,
                }}
              >
                Create an account to start building your training profile, or explore the
                demo plan to see how NextStride organizes a full week.
              </Text>
            </View>

            <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12 }}>
              <SiteButton label="Get Started" onPress={() => router.push("/signup")} />
              <SiteButton
                label="View Demo Plan"
                variant="secondary"
                onPress={() => scrollToSection("plan")}
              />
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
        onPremium={() => scrollToSection("premium")}
      />
    </ScrollView>
  );
}

function TopNavigation({
  isTablet,
  onJump,
  onLogin,
  onSignup,
  onPremium,
}: {
  isTablet: boolean;
  onJump: (key: SectionKey) => void;
  onLogin: () => void;
  onSignup: () => void;
  onPremium: () => void;
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
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
        <Text style={{ color: "#8ea5c2", marginTop: 4, fontSize: 13 }}>
          Personalized running plans for athletes who want structure.
        </Text>
      </View>

      <View
        style={{
          flexDirection: isTablet ? "row" : "column",
          alignItems: isTablet ? "center" : "flex-start",
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <NavLink label="Features" onPress={() => onJump("features")} />
          <NavLink label="How It Works" onPress={() => onJump("how")} />
          <NavLink label="Demo Plan" onPress={() => onJump("plan")} />
          <NavLink label="Premium" onPress={onPremium} />
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

function ResponsiveGrid({
  children,
  isDesktop,
}: {
  children: React.ReactNode;
  isDesktop: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: isDesktop ? "row" : "column",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
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

function HeroPreview() {
  return (
    <View
      style={{
        backgroundColor: "rgba(14, 27, 48, 0.9)",
        borderRadius: 34,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.14)",
        padding: 18,
      }}
    >
      <View
        style={{
          backgroundColor: "#071321",
          borderRadius: 28,
          borderWidth: 1,
          borderColor: "rgba(96, 165, 250, 0.12)",
          padding: 18,
        }}
      >
        <View
          style={{
            width: 88,
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(148, 163, 184, 0.2)",
            alignSelf: "center",
          }}
        />

        <Text style={{ color: "#7dd3fc", fontSize: 12, fontWeight: "800", marginTop: 18 }}>
          TODAY IN NEXTSTRIDE
        </Text>
        <Text
          style={{
            color: "#f8fafc",
            fontSize: 28,
            fontWeight: "800",
            marginTop: 10,
          }}
        >
          6 x 1K track session
        </Text>
        <Text
          style={{
            color: "#9fb2cb",
            fontSize: 15,
            lineHeight: 22,
            marginTop: 10,
          }}
        >
          Your plan, your goal event, your progress, all in one place that feels ready for
          daily use.
        </Text>

        <View style={{ marginTop: 18, gap: 12 }}>
          <HeroPanelRow label="Goal" value="Sub-1:25 half marathon" />
          <HeroPanelRow label="This week" value="42 miles scheduled" />
          <HeroPanelRow label="Next up" value="Tempo Wednesday" />
        </View>
      </View>
    </View>
  );
}

function HeroPanelRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(9, 22, 36, 0.94)",
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.1)",
      }}
    >
      <Text style={{ color: "#6b85a4", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function HeroInsight({
  accent,
  title,
  body,
}: {
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(225, 236, 251, 0.96)",
        borderRadius: 26,
        padding: 20,
      }}
    >
      <Text style={{ color: accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
        NEXTSTRIDE
      </Text>
      <Text
        style={{
          color: "#0f172a",
          fontSize: 23,
          fontWeight: "800",
          marginTop: 10,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: "#334155",
          fontSize: 14,
          lineHeight: 21,
          marginTop: 10,
        }}
      >
        {body}
      </Text>
    </View>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(8, 18, 32, 0.94)",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.12)",
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700" }}>{value}</Text>
      <Text style={{ color: "#7390af", fontSize: 13, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function WhyPoint({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>{title}</Text>
      <Text
        style={{
          color: "#9fb2cb",
          fontSize: 15,
          lineHeight: 23,
          marginTop: 10,
        }}
      >
        {body}
      </Text>
    </View>
  );
}

function Footer({
  padding,
  isDesktop,
  onJump,
  onLogin,
  onSignup,
  onPremium,
}: {
  padding: number;
  isDesktop: boolean;
  onJump: (key: SectionKey) => void;
  onLogin: () => void;
  onSignup: () => void;
  onPremium: () => void;
}) {
  return (
    <View
      style={{
        marginTop: 78,
        paddingHorizontal: padding,
        paddingTop: 32,
        paddingBottom: 18,
        borderTopWidth: 1,
        borderTopColor: "rgba(96, 165, 250, 0.12)",
      }}
    >
      <View
        style={{
          flexDirection: isDesktop ? "row" : "column",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <View style={{ maxWidth: 340 }}>
          <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
          <Text style={{ color: "#9fb2cb", fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            Smarter running plans, clearer training weeks, and a product experience built to
            keep athletes consistent.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>NAVIGATION</Text>
          <FooterLink label="Features" onPress={() => onJump("features")} />
          <FooterLink label="How It Works" onPress={() => onJump("how")} />
          <FooterLink label="Demo Plan" onPress={() => onJump("plan")} />
          <FooterLink label="Premium" onPress={onPremium} />
          <FooterLink label="App Preview" onPress={() => onJump("preview")} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>ACCOUNT</Text>
          <FooterLink label="Log In" onPress={onLogin} />
          <FooterLink label="Get Started" onPress={onSignup} />
          <FooterLink label="Upgrade to Premium" onPress={onPremium} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>CONTACT</Text>
          <FooterLink label="hello@nextstride.app" />
          <FooterLink label="Instagram placeholder" />
          <FooterLink label="Strava club placeholder" />
          <FooterLink label="X placeholder" />
        </View>
      </View>

      <Text style={{ color: "#6f89a6", fontSize: 13, marginTop: 28 }}>
        Copyright 2026 NextStride. Built for runners who plan ahead.
      </Text>
    </View>
  );
}
