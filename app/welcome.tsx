import { router } from "expo-router";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import {
  FeatureCard,
  FooterLink,
  PreviewCard,
  SiteButton,
  SiteSection,
  StepCard,
} from "./components/marketing-site";

export default function Welcome() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1080;
  const isTablet = width >= 760;
  const padding = isDesktop ? 56 : isTablet ? 32 : 20;
  const heroTitleSize = isDesktop ? 68 : isTablet ? 52 : 40;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#09111f" }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          paddingHorizontal: padding,
          paddingTop: isDesktop ? 34 : 22,
        }}
      >
        <TopNavigation />

        <View
          style={{
            marginTop: 28,
            flexDirection: isDesktop ? "row" : "column",
            gap: 22,
          }}
        >
          <View
            style={{
              flex: isDesktop ? 1.15 : undefined,
              backgroundColor: "#10203a",
              borderRadius: 36,
              borderWidth: 1,
              borderColor: "#22314a",
              padding: isDesktop ? 36 : 24,
            }}
          >
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#dbeafe",
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  color: "#1d4ed8",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                NextStride.app ready
              </Text>
            </View>

            <Text
              style={{
                color: "#f8fafc",
                fontSize: heroTitleSize,
                fontWeight: "800",
                lineHeight: heroTitleSize + 6,
                marginTop: 18,
                maxWidth: 720,
              }}
            >
              Personalized running plans that make you want to come back tomorrow.
            </Text>

            <Text
              style={{
                color: "#94a3b8",
                fontSize: 17,
                lineHeight: 27,
                marginTop: 18,
                maxWidth: 640,
              }}
            >
              NextStride is a modern training app for runners who want clearer planning,
              smarter workouts, better progress visibility, and a product experience that
              feels calm, premium, and trustworthy.
            </Text>

            <View
              style={{
                flexDirection: isTablet ? "row" : "column",
                gap: 12,
                marginTop: 28,
              }}
            >
              <SiteButton
                label="Create Account"
                onPress={() => router.push("/signup")}
              />
              <SiteButton
                label="Log In"
                variant="secondary"
                onPress={() => router.push("/login")}
              />
            </View>

            <View
              style={{
                flexDirection: isTablet ? "row" : "column",
                gap: 14,
                marginTop: 30,
              }}
            >
              <HeroStat value="Goal-based" label="running plans" />
              <HeroStat value="PR-aware" label="training guidance" />
              <HeroStat value="Ready for" label="nextstride.app" />
            </View>
          </View>

          <View style={{ flex: isDesktop ? 0.85 : undefined, gap: 18 }}>
            <HeroPanel />
            <TrustPanel />
          </View>
        </View>
      </View>

      <SiteSection
        title="Features that feel built for real runners"
        subtitle="NextStride is centered around practical training support, not generic fitness noise."
        padding={padding}
      >
        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <FeatureSlot isDesktop={isDesktop}>
            <FeatureCard
              badge="Plans"
              title="Personalized training plans"
              body="Weekly structure adapts around your mileage, goal event, and current level so the training always feels intentional."
            />
          </FeatureSlot>
          <FeatureSlot isDesktop={isDesktop}>
            <FeatureCard
              badge="Logging"
              title="Workout logging"
              body="Capture distance, time, splits, notes, and effort quickly after a session without the app getting in the way."
            />
          </FeatureSlot>
          <FeatureSlot isDesktop={isDesktop}>
            <FeatureCard
              badge="Progress"
              title="Progress tracking"
              body="See how your volume, consistency, and benchmark sessions are moving over time in one clean view."
            />
          </FeatureSlot>
          <FeatureSlot isDesktop={isDesktop}>
            <FeatureCard
              badge="Stats"
              title="Activities and statistics"
              body="Review recent runs, totals, and key performance snapshots with an interface that stays readable."
            />
          </FeatureSlot>
          <FeatureSlot isDesktop={isDesktop}>
            <FeatureCard
              badge="Goals"
              title="Goal-based running plans"
              body="Build toward the 800, 1600, 5K, 10K, half marathon, or marathon with workouts matched to the event."
            />
          </FeatureSlot>
          <FeatureSlot isDesktop={isDesktop}>
            <FeatureCard
              badge="PRs"
              title="PR-aware training"
              body="Use your PRs and training history to shape paces and weekly structure so the plan feels personal from day one."
            />
          </FeatureSlot>
        </View>
      </SiteSection>

      <SiteSection
        title="How NextStride works"
        subtitle="A clear path from setup to daily execution, built to feel useful immediately."
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
            body="Tell NextStride what you are training for, where your fitness is today, and how much volume you want to handle."
          />
          <StepCard
            step="02"
            title="Get a training plan"
            body="Receive a clean weekly structure with workouts built around your event focus, mileage, and progression."
          />
          <StepCard
            step="03"
            title="Log workouts"
            body="Record what you actually did so the app becomes more useful instead of becoming another thing to maintain."
          />
          <StepCard
            step="04"
            title="Track progress over time"
            body="Watch volume, effort, and personal bests come together in a way that helps you plan ahead with confidence."
          />
        </View>
      </SiteSection>

      <SiteSection
        title="A polished preview of the product"
        subtitle="Use these as launch-ready mockups today, and swap in real screenshots later without changing the structure."
        padding={padding}
      >
        <View
          style={{
            flexDirection: isDesktop ? "row" : "column",
            gap: 16,
          }}
        >
          <PreviewCard
            title="Home"
            subtitle="See today’s workout, weekly progress, and training focus the moment the app opens."
            accent="#60a5fa"
            tall={true}
          />
          <PreviewCard
            title="Plan"
            subtitle="A premium weekly plan view with quality days, long runs, and pacing context."
            accent="#38bdf8"
            tall={true}
          />
          <PreviewCard
            title="Progress"
            subtitle="Track totals, recent work, and personal bests in a way that actually helps you plan ahead."
            accent="#22c55e"
          />
        </View>
      </SiteSection>

      <SiteSection
        title="Why NextStride"
        subtitle="This is not a generic running app. It is a product for runners who care about progress, structure, and returning to an experience that feels thoughtfully made."
        padding={padding}
      >
        <View
          style={{
            backgroundColor: "#10203a",
            borderRadius: 30,
            borderWidth: 1,
            borderColor: "#22314a",
            padding: isDesktop ? 30 : 22,
            flexDirection: isDesktop ? "row" : "column",
            gap: 22,
          }}
        >
          <WhyPoint
            title="More personal than generic apps"
            body="NextStride begins with your goals, PRs, and weekly volume so the app feels like it understands why you are training."
          />
          <WhyPoint
            title="Built to think ahead"
            body="The product is designed around planning, not just recording. It gives runners a clearer sense of what is next and why."
          />
          <WhyPoint
            title="Designed to be worth returning to"
            body="The interface stays calm, premium, and motivating, which makes it easier to keep using the app through a full training block."
          />
        </View>
      </SiteSection>

      <SiteSection
        title="Take your next stride with intention"
        subtitle="Join the waitlist, explore the product, and get ready for a cleaner way to train."
        padding={padding}
      >
        <View
          style={{
            backgroundColor: "#10203a",
            borderRadius: 30,
            borderWidth: 1,
            borderColor: "#22314a",
            padding: isDesktop ? 30 : 22,
            flexDirection: isDesktop ? "row" : "column",
            justifyContent: "space-between",
            alignItems: isDesktop ? "center" : "flex-start",
            gap: 18,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#f8fafc", fontSize: 30, fontWeight: "700" }}>
              Built for runners who are serious about what comes next.
            </Text>
            <Text
              style={{
                color: "#94a3b8",
                fontSize: 15,
                lineHeight: 23,
                marginTop: 10,
                maxWidth: 620,
              }}
            >
              Create an account to set up your training profile, or log back in to pick up
              where you left off.
            </Text>
          </View>

          <View style={{ flexDirection: isTablet ? "row" : "column", gap: 12 }}>
            <SiteButton
              label="Create Account"
              onPress={() => router.push("/signup")}
            />
            <SiteButton
              label="Log In"
              variant="secondary"
              onPress={() => router.push("/login")}
            />
          </View>
        </View>
      </SiteSection>

      <Footer padding={padding} isDesktop={isDesktop} />
    </ScrollView>
  );
}

function TopNavigation() {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View>
        <Text style={{ color: "#f8fafc", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
        <Text style={{ color: "#94a3b8", marginTop: 4, fontSize: 13 }}>
          Modern training for runners who plan ahead
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "#10203a",
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: "#22314a",
        }}
      >
        <Text style={{ color: "#cbd5e1", fontSize: 13, fontWeight: "600" }}>
          nextstride.app
        </Text>
      </View>
    </View>
  );
}

function FeatureSlot({
  children,
  isDesktop,
}: {
  children: React.ReactNode;
  isDesktop: boolean;
}) {
  return <View style={{ width: isDesktop ? "48.9%" : "100%" }}>{children}</View>;
}

function HeroPanel() {
  return (
    <View
      style={{
        backgroundColor: "#10203a",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#22314a",
        padding: 20,
      }}
    >
      <Text style={{ color: "#60a5fa", fontSize: 12, fontWeight: "700" }}>NEXT UP</Text>
      <Text
        style={{
          color: "#f8fafc",
          fontSize: 28,
          fontWeight: "700",
          marginTop: 10,
        }}
      >
        Your week, simplified.
      </Text>
      <Text
        style={{
          color: "#94a3b8",
          fontSize: 15,
          lineHeight: 22,
          marginTop: 10,
        }}
      >
        Today’s workout, your mileage target, and the structure of the week all stay easy
        to scan so the product feels useful at a glance.
      </Text>

      <View style={{ marginTop: 18, gap: 12 }}>
        <PanelStat label="Goal" value="Half Marathon Build" />
        <PanelStat label="Mileage" value="42 mi / week" />
        <PanelStat label="Session" value="Threshold + strides" />
      </View>
    </View>
  );
}

function TrustPanel() {
  return (
    <View
      style={{
        backgroundColor: "#dbeafe",
        borderRadius: 28,
        padding: 22,
      }}
    >
      <Text style={{ color: "#1d4ed8", fontSize: 12, fontWeight: "700" }}>
        Why it feels different
      </Text>
      <Text
        style={{
          color: "#0f172a",
          fontSize: 26,
          fontWeight: "700",
          marginTop: 10,
        }}
      >
        Clean enough to trust every day.
      </Text>
      <Text
        style={{
          color: "#334155",
          fontSize: 15,
          lineHeight: 22,
          marginTop: 10,
        }}
      >
        NextStride is designed to feel like a serious product: calm structure, thoughtful
        pacing, and a brand experience runners will want to return to throughout a full block.
      </Text>
    </View>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View
      style={{
        backgroundColor: "#09111f",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#22314a",
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700" }}>{value}</Text>
      <Text style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function PanelStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: "#09111f",
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: "#22314a",
      }}
    >
      <Text style={{ color: "#64748b", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function WhyPoint({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "700" }}>{title}</Text>
      <Text
        style={{
          color: "#94a3b8",
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
}: {
  padding: number;
  isDesktop: boolean;
}) {
  return (
    <View
      style={{
        marginTop: 58,
        paddingHorizontal: padding,
        paddingTop: 28,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: "#1e3355",
      }}
    >
      <View
        style={{
          flexDirection: isDesktop ? "row" : "column",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <View style={{ maxWidth: 320 }}>
          <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "800" }}>NextStride</Text>
          <Text style={{ color: "#94a3b8", fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            Smarter training for runners who want thoughtful planning, cleaner execution,
            and a product that feels worth returning to.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "700" }}>NAV</Text>
          <FooterLink label="Features" />
          <FooterLink label="How it works" />
          <FooterLink label="App preview" />
          <FooterLink label="Why NextStride" />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "700" }}>SOCIAL</Text>
          <FooterLink label="Instagram placeholder" />
          <FooterLink label="Strava club placeholder" />
          <FooterLink label="X placeholder" />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "700" }}>CONTACT</Text>
          <FooterLink label="hello@nextstride.app" />
          <FooterLink label="nextstride.app" />
          <FooterLink label="Support placeholder" />
        </View>
      </View>
    </View>
  );
}
