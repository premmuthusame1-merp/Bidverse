import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import { AuctionCard, ProductCard } from "@/components/domain/cards";
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  Fab,
  InfoCard,
  SectionHeader,
  kitStyles,
} from "@/components/ui/kit";
import { CATEGORIES } from "@/lib/domain/seed";
import { useNow } from "@/hooks/use-now";
import {
  auctionStatus,
  auctionsForBuyer,
  specialDeals,
  topDealsOfWeek,
  useApp,
} from "@/lib/store";
import { T } from "@/lib/theme";

export default function BuyerHomeScreen() {
  const router = useRouter();
  const { account, state } = useApp();
  const now = useNow();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const myAuctions = useMemo(
    () => (account ? auctionsForBuyer(state, account.id, now) : []),
    [account, state, now],
  );
  const liveAuctions = myAuctions.filter((a) => auctionStatus(a, now) !== "closed");
  const deals = useMemo(() => topDealsOfWeek(state), [state]);
  const specials = useMemo(
    () => specialDeals(state, categoryFilter === "all" ? undefined : categoryFilter),
    [state, categoryFilter],
  );
  const products = useMemo(
    () =>
      state.products
        .filter((p) => categoryFilter === "all" || p.categoryId === categoryFilter)
        .sort((a, b) => b.postedAt - a.postedAt),
    [state, categoryFilter],
  );

  if (!account) {
    return (
      <AppShell role="user" active="home">
        <BrandHeader title="Discover" right={<NotificationBell />} />
        <ScrollView contentContainerStyle={kitStyles.scroll}>
          <Card>
            <EmptyState
              icon="♙"
              title="Sign in to post requirements"
              body="Buyers can publish an auction and watch verified stores compete with reverse bids."
              action="Login as user"
              onAction={() => router.replace("/auth/buyer-login")}
            />
          </Card>
        </ScrollView>
      </AppShell>
    );
  }

  return (
    <AppShell role="user" active="home">
      <BrandHeader title="Discover" right={<NotificationBell />} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>SMARTER SHOPPING</Text>
          <Text style={styles.heroTitle}>Let dealers compete{"\n"}for your need.</Text>
          <Text style={styles.heroBody}>
            Post what you need. Nearby verified stores send their best reverse bids within minutes.
          </Text>
          <Pressable onPress={() => router.push("/user/new-auction")} style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Start an auction  →</Text>
          </Pressable>
          <View style={styles.heroStats}>
            <Text style={styles.heroStat}>
              {state.dealers.filter((d) => d.status === "approved").length} verified stores
            </Text>
            <Text style={styles.heroStat}>·</Text>
            <Text style={styles.heroStat}>{state.products.length} live listings</Text>
          </View>
        </View>

        {liveAuctions.length > 0 ? (
          <>
            <SectionHeader
              title="Your live auctions"
              action="See all"
              onPress={() => router.push("/user/auctions")}
              subtitle="Live updates from every participating store"
            />
            {liveAuctions.slice(0, 2).map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                now={now}
                onPress={() => router.push(`/user/auction/${auction.id}`)}
                subtitle={`Your requirement · budget ₹${auction.budget.toLocaleString("en-IN")}`}
              />
            ))}
          </>
        ) : (
          <Card>
            <EmptyState
              icon="♜"
              title="No live auction yet"
              body="Publish your requirement — matching stores are notified instantly."
              action="Start an auction"
              onAction={() => router.push("/user/new-auction")}
            />
          </Card>
        )}

        <SectionHeader
          title="Top deals this week"
          action="Special deals"
          onPress={() => router.push("/user/special-deals")}
          subtitle="Highest discounts published by verified stores"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
          {deals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              now={now}
              onPress={() => router.push("/user/special-deals")}
            />
          ))}
        </ScrollView>

        <SectionHeader title="Browse by category" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="All" selected={categoryFilter === "all"} onPress={() => setCategoryFilter("all")} />
          {CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon} ${category.name}`}
              selected={categoryFilter === category.id}
              onPress={() => setCategoryFilter(category.id)}
            />
          ))}
        </ScrollView>

        {specials.length > 0 ? (
          <InfoCard
            tone="warning"
            icon="★"
            title={`${specials.length} special deal${specials.length > 1 ? "s" : ""} running`}
            body={`Ending soonest: ${specials[0].name} — ${Math.max(
              0,
              Math.ceil(((specials[0].specialDealEndsAt ?? now) - now) / (24 * 60 * 60 * 1000)),
            )} day(s) left.`}
          />
        ) : null}

        <View style={styles.grid}>
          {products.map((product) => (
            <View key={product.id} style={styles.gridItem}>
              <ProductCard
                product={product}
                now={now}
                width="100%"
                onPress={() => router.push("/user/special-deals")}
              />
            </View>
          ))}
        </View>

        {products.length === 0 ? (
          <EmptyState icon="▤" title="No products in this category yet" body="Dealers will publish here soon." />
        ) : null}

        <Card style={styles.verifiedCard}>
          <Badge tone="verified">✓</Badge>
          <View style={{ flex: 1 }}>
            <Text style={styles.verifiedTitle}>Verified stores, better deals</Text>
            <Text style={kitStyles.cardMeta}>
              Every dealer is document-verified (PAN, Aadhaar, GST and store image) by our super admin before they can
              bid.
            </Text>
          </View>
        </Card>

        <SectionHeader title="How an auction works" />
        <Card>
          <Step n="1" title="Post your requirement" body="Product, category, specifications, days open and your deal amount." />
          <Step n="2" title="Stores are notified (10 min)" body="Only dealers registered for that category get the alert; bidding opens 10 minutes after posting." />
          <Step n="3" title="First bid starts a 20 min window" body="Dealers post reverse bids — lower price with special freebies or mentions." />
          <Step n="4" title="Pick the best offer" body="Watch live updates in the group chat, extend the closing time if you need more offers." />
        </Card>
      </ScrollView>

      <Fab onPress={() => router.push("/user/new-auction")} />
    </AppShell>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={kitStyles.cardTitle}>{title}</Text>
        <Text style={kitStyles.cardMeta}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: T.brand, borderRadius: 18, padding: 20, marginBottom: 6 },
  heroKicker: { color: "#BFEDEC", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  heroTitle: { color: "#FFFFFF", fontSize: 23, lineHeight: 29, fontWeight: "800", marginTop: 10 },
  heroBody: { color: "#D6F5F3", fontSize: 13, lineHeight: 19, marginTop: 10 },
  heroButton: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  heroButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  heroStats: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  heroStat: { color: "#BFEDEC", fontSize: 11, fontWeight: "600" },
  hRow: { gap: 10, paddingBottom: 4, paddingRight: 8 },
  chipRow: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  gridItem: { width: "48%" },
  verifiedCard: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 16, backgroundColor: T.successBg, borderColor: "#A7F3D0" },
  verifiedTitle: { color: T.successText, fontWeight: "800", fontSize: 13 },
  step: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: T.brandTint,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: T.brand, fontWeight: "800", fontSize: 12 },
});
