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
} from "./components/marketing-site";

type SectionKey = "hero" | "how" | "features" | "preview" | "why" | "faq" | "cta";

const FAQ_ITEMS = [
  {
    question: "Who is NextStride for?",
    answer:
      "NextStride is designed for runners who want a clearer weekly plan, fast workout logging, and a better sense of progress without a cluttered training app.",
  },
  {
    question: "Does it replace workout logging?",
    answer:
      "No. It brings planning, logging, and progress into one cleaner flow so you do not need separate tools just to stay organized.",
  },
  {
    question: "Can I use it if I am still building consistency?",
    answer:
      "Yes. The product framing is meant to feel welcoming whether you are racing often or simply trying to train more consistently each week.",
  },
  {
    question: "Is there a premium tier?",
    answer:
      "Yes. The core experience stays focused, and premium layers in more detailed training guidance for runners who want extra precision.",
  },
];

export default function Welcome() {
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Partial<Record<SectionKey, number>>>({});
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1120;
  const isTablet = width >= 780;
  const padding = isDesktop ? 64 : isTablet ? 32 : 20;
  const heroTitleSize = isDesktop ? 70 : isTablet ? 52 : 38;

  const setSectionOffset = (key: SectionKey) => (event: LayoutChangeEvent) => {
    sectionOffsets.current[key] = event.nativeEvent.layout.y;
  };

  const scrollToSection = (key: SectionKey) => {
    const y = sectionOffsets.current[key];

    if (typeof y !== "number") {
      return;
    }

    scrollRef.current?.scrollTo({
      y: Math.max(y - 24, 0),
      animated: true,
    });
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: "#06101b" }}
      contentContainerStyle={{ paddingBottom: 34 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          paddingHorizontal: padding,
          paddingTop: isDesktop ? 36 : 20,
        }}
        onLayout={setSectionOffset("hero")}
      >
        <TopNavigation
          isTablet={isTablet}
          onJump={scrollToSection}
          onLogin={() => router.push("/login")}
          onSignup={() => router.push("/signup")}
        />

        <View
          style={{
            marginTop: 30,
            paddingTop: isDesktop ? 18 : 8,
            paddingBottom: isDesktop ? 10 : 0,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -50,
              right: isDesktop ? 60 : -20,
              width: isDesktop ? 340 : 220,
              height: isDesktop ? 340 : 220,
              borderRadius: 999,
              backgroundColor: "rgba(58, 130, 246, 0.14)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 10,
              left: -40,
              width: isDesktop ? 280 : 180,
              height: isDesktop ? 280 : 180,
              borderRadius: 999,
              backgroundColor: "rgba(14, 165, 233, 0.08)",
            }}
          />

          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              alignItems: "center",
              gap: isDesktop ? 42 : 28,
            }}
          >
            <View style={{ flex: 1, maxWidth: isDesktop ? 620 : undefined }}>
              <Text
                style={{
                  color: "#7dd3fc",
                  fontSize: 12,
                  fontWeight: "800",
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                }}
              >
                NextStride
              </Text>

              <Text
                style={{
                  color: "#f8fbff",
                  fontSize: heroTitleSize,
                  fontWeight: "800",
                  lineHeight: heroTitleSize + 4,
                  marginTop: 16,
                  maxWidth: 620,
                }}
              >
                Running plans that make the next step obvious.
              </Text>

              <Text
                style={{
                  color: "#a9bed4",
                  fontSize: 17,
                  lineHeight: 28,
                  marginTop: 16,
                  maxWidth: 560,
                }}
              >
                NextStride brings planning, logging, and progress into one clean training flow built for real weeks of running.
              </Text>

              <View
                style={{
                  flexDirection: isTablet ? "row" : "column",
                  alignItems: isTablet ? "center" : "stretch",
                  gap: 12,
                  marginTop: 28,
                }}
              >
                <SiteButton label="Get Started" onPress={() => router.push("/signup")} />
                <SiteButton
                  label="See Product Preview"
                  variant="secondary"
                  onPress={() => scrollToSection("preview")}
                />
              </View>

              <Text
                style={{
                  color: "#8fa8c4",
                  fontSize: 13,
                  lineHeight: 20,
                  marginTop: 16,
                  maxWidth: 560,
                }}
              >
                Built for runners who want structure, a cleaner weekly view, and a product that feels approachable from day one.
              </Text>

              <View
                style={{
                  flexDirection: isTablet ? "row" : "column",
                  gap: 14,
                  marginTop: 18,
                }}
              >
                <TrustPill label="Focused training workflow" />
                <TrustPill label="Fast workout logging" />
                <TrustPill label="Clear progress tracking" />
              </View>
            </View>

            <View style={{ flex: 1, width: "100%", maxWidth: 520 }}>
              <HeroPreview />
            </View>
          </View>
        </View>
      </View>

      <View onLayout={setSectionOffset("how")}>
        <SiteSection
          eyebrow="How It Works"
          title="Three simple steps, one calmer training loop"
          subtitle="Set up your runner profile, follow the week, and keep the app useful by logging what you actually complete."
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
              title="Set your goal"
              body="Tell NextStride what you are training for, how much you run, and the baseline fitness it should work from."
            />
            <StepCard
              step="02"
              title="Follow the week"
              body="See the next workout, the shape of the week, and the overall plan without hunting through clutter."
            />
            <StepCard
              step="03"
              title="Log and improve"
              body="Capture the work you finished so your training history and progress become more useful over time."
            />
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("features")}>
        <SiteSection
          eyebrow="Core Features"
          title="Everything important lives in one cleaner product"
          subtitle="The experience is built around the moments runners revisit most often: planning, checking the next session, logging the run, and seeing progress."
          padding={padding}
        >
          <ResponsiveGrid isDesktop={isDesktop}>
            <FeatureCard
              badge="Plans"
              icon="P"
              title="Personalized weekly structure"
              body="Goal-aware training plans that help the week feel intentional instead of stitched together."
            />
            <FeatureCard
              badge="Log"
              icon="L"
              title="Quick workout logging"
              body="Save distance, time, effort, splits, and notes without turning post-run entry into a chore."
            />
            <FeatureCard
              badge="Progress"
              icon="T"
              title="Progress you can read fast"
              body="Mileage, consistency, and recent training trends stay easy to scan on both mobile and desktop."
            />
            <FeatureCard
              badge="Profile"
              icon="R"
              title="A runner profile that matters"
              body="Goals, PRs, and identity settings stay connected to the parts of the app that actually use them."
            />
          </ResponsiveGrid>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("preview")}>
        <SiteSection
          eyebrow="Product Preview"
          title="A polished app runners can imagine using every day"
          subtitle="The product preview keeps the framing realistic: a calmer home view, a structured week, and progress that is easy to understand."
          padding={padding}
        >
          <View
            style={{
              flexDirection: isDesktop ? "row" : "column",
              gap: 18,
            }}
          >
            <PreviewCard
              title="Home Dashboard"
              subtitle="A cleaner welcome into today's workout, weekly momentum, and the next session."
              accent="#7dd3fc"
              tall={true}
            />
            <PreviewCard
              title="Weekly Plan"
              subtitle="A simple full-week view that helps runners understand the block at a glance."
              accent="#60a5fa"
              tall={true}
            />
            <View style={{ flex: 1, gap: 18 }}>
              <PreviewCard
                title="Workout Log"
                subtitle="Fast session entry for distance, time, effort, notes, and shoes."
                accent="#38bdf8"
              />
              <PreviewCard
                title="Progress"
                subtitle="Recent activity and trend snapshots that stay readable on small screens."
                accent="#22c55e"
              />
            </View>
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("why")}>
        <SiteSection
          eyebrow="Why NextStride"
          title="Designed to feel more like a product and less like a training spreadsheet"
          subtitle="NextStride focuses on clarity, rhythm, and trust so the app feels welcoming even when training is hard."
          padding={padding}
        >
          <View
            style={{
              gap: 18,
            }}
          >
            <WhyPoint
              title="Cleaner by default"
              body="The interface is intentionally quieter, with more space, fewer competing panels, and clearer reading order above the fold and throughout the site."
            />
            <WhyPoint
              title="Built around real runner habits"
              body="The product highlights the moments runners repeat most often: checking today, following the week, logging the run, and seeing if the plan is working."
            />
            <WhyPoint
              title="Welcoming without feeling generic"
              body="NextStride stays athletic and modern while keeping the product approachable for people who want guidance without overwhelming coaching software."
            />
          </View>
        </SiteSection>
      </View>

      <View onLayout={setSectionOffset("faq")}>
        <SiteSection
          eyebrow="FAQ"
          title="Questions runners usually ask first"
          subtitle="A few direct answers to help visitors understand what NextStride is trying to do."
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
          title="Start with a cleaner training experience"
          subtitle="Create an account to begin building your profile and weekly structure, or preview the product flow first."
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
            <Text
              style={{
                color: "#9eb3cc",
                fontSize: 15,
                lineHeight: 23,
                maxWidth: 640,
              }}
            >
              NextStride keeps training plans, workout logging, and progress in one simpler flow so the product feels calm before and after the run.
            </Text>

            <View
              style={{
                flexDirection: isTablet ? "row" : "column",
                gap: 12,
              }}
            >
              <SiteButton label="Create Account" onPress={() => router.push("/signup")} />
              <SiteButton
                label="View Preview"
                variant="secondary"
                onPress={() => scrollToSection("preview")}
              />
            </View>

            <Text style={{ color: "#88a2bf", fontSize: 13, lineHeight: 20 }}>
              Product preview available now. Core flows include training plans, workout logging, profile setup, and progress tracking.
            </Text>
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
          Running plans, logging, and progress in one calmer flow.
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
          <NavLink label="How It Works" onPress={() => onJump("how")} />
          <NavLink label="Features" onPress={() => onJump("features")} />
          <NavLink label="Preview" onPress={() => onJump("preview")} />
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

function TrustPill({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: "rgba(9, 24, 40, 0.88)",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(125, 211, 252, 0.12)",
        paddingHorizontal: 14,
        paddingVertical: 9,
      }}
    >
      <Text style={{ color: "#dceafd", fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

function HeroPreview() {
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
      <View
        style={{
          backgroundColor: "#09131f",
          borderRadius: 30,
          borderWidth: 1,
          borderColor: "rgba(96, 165, 250, 0.1)",
          padding: 18,
        }}
      >
        <View
          style={{
            width: 84,
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(148, 163, 184, 0.22)",
            alignSelf: "center",
          }}
        />

        <View
          style={{
            marginTop: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#f8fbff", fontSize: 21, fontWeight: "800" }}>Today</Text>
          <View
            style={{
              backgroundColor: "rgba(59, 130, 246, 0.14)",
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#8fd1ff", fontSize: 11, fontWeight: "800" }}>NEXTSTRIDE</Text>
          </View>
        </View>

        <Text style={{ color: "#f8fbff", fontSize: 28, fontWeight: "800", marginTop: 12 }}>
          6 x 1K track session
        </Text>
        <Text
          style={{
            color: "#9db2ca",
            fontSize: 14,
            lineHeight: 22,
            marginTop: 8,
          }}
        >
          One calm place to see the workout, understand the week, and keep your training history useful.
        </Text>

        <View style={{ marginTop: 18, gap: 12 }}>
          <PreviewStat label="Goal" value="Sub-1:25 half marathon" />
          <PreviewStat label="This week" value="42 miles planned" />
          <PreviewStat label="Progress" value="3 of 6 sessions logged" />
        </View>
      </View>
    </View>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
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
      <Text style={{ color: "#6f89a8", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "#f8fbff", fontSize: 16, fontWeight: "700", marginTop: 6 }}>
        {value}
      </Text>
    </View>
  );
}

function WhyPoint({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(10, 22, 37, 0.62)",
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: "rgba(96, 165, 250, 0.1)",
      }}
    >
      <Text style={{ color: "#f8fbff", fontSize: 22, fontWeight: "800" }}>{title}</Text>
      <Text
        style={{
          color: "#9db2ca",
          fontSize: 15,
          lineHeight: 23,
          marginTop: 10,
          maxWidth: 760,
        }}
      >
        {body}
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
      <Text
        style={{
          color: "#9db2ca",
          fontSize: 15,
          lineHeight: 23,
          marginTop: 10,
        }}
      >
        {answer}
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
      <View
        style={{
          flexDirection: isDesktop ? "row" : "column",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <View style={{ maxWidth: 340 }}>
          <Text style={{ color: "#f8fbff", fontSize: 24, fontWeight: "800" }}>NextStride</Text>
          <Text style={{ color: "#9db2ca", fontSize: 14, lineHeight: 22, marginTop: 10 }}>
            A cleaner training product for runners who want structure, progress, and a calmer weekly rhythm.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>SITE</Text>
          <FooterLink label="How It Works" onPress={() => onJump("how")} />
          <FooterLink label="Core Features" onPress={() => onJump("features")} />
          <FooterLink label="Product Preview" onPress={() => onJump("preview")} />
          <FooterLink label="FAQ" onPress={() => onJump("faq")} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>ACCOUNT</Text>
          <FooterLink label="Log In" onPress={onLogin} />
          <FooterLink label="Get Started" onPress={onSignup} />
        </View>

        <View style={{ gap: 12 }}>
          <Text style={{ color: "#6f89a6", fontSize: 12, fontWeight: "800" }}>TRUST</Text>
          <FooterLink label="Focused product preview" />
          <FooterLink label="Built around core runner flows" />
          <FooterLink label="No fake testimonials" />
        </View>
      </View>

      <Text style={{ color: "#6f89a6", fontSize: 13, marginTop: 28 }}>
        Copyright 2026 NextStride. Built for runners who like knowing what comes next.
      </Text>
    </View>
  );
}
