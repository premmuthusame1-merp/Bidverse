import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import { AuctionCard, ProductCard } from "@/components/domain/cards";
import {
  Badge,
  Card,
  EmptyState,
  Fab,
  InfoCard,
  Segmented,
  Stat,
  kitStyles,
} from "@/components/ui/kit";
import { useNow } from "@/hooks/use-now";
import { categoryName } from "@/lib/domain/seed";
import { compactCountdown, money, relativeTime } from "@/lib/format";
import {
  auctionClosesAt,
  auctionStatus,
  currentBestDeal,
  dealsOf,
  liveAuctionsForDealer,
  participatedAuctionsForDealer,
  useApp,
} from "@/lib/store";
import { T } from "@/lib/theme";

type Tab = "live" | "participated" | "posted";

export default function DealerHomeScreen() {
  const router = useRouter();
  const { dealer, state, getAccount } = useApp();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("live");

  const live = useMemo(() => (dealer ? liveAuctionsForDealer(state, dealer, now) : []), [dealer, state, now]);
  const participated = useMemo(
    () => (dealer ? participatedAuctionsForDealer(state, dealer, now) : []),
    [dealer, state, now],
  );
  const myProducts = useMemo(
    () => (dealer ? state.products.filter((p) => p.dealerId === dealer.id) : []),
    [dealer, state.products],
  );

  const openParticipated = participated.filter((a) => auctionStatus(a, now) !== "closed");
  const wonDeals = dealer
    ? state.deals.filter((d) => d.dealerId === dealer.id && state.auctions.find((a) => a.id === d.auctionId)?.winningDealId === d.id).length
    : 0;

  if (!dealer) {
    return (
      <AppShell role="dealer" active="home">
        <BrandHeader title="Dealer" />
        <EmptyState title="Dealer profile missing" body="Please sign in again." />
      </AppShell>
    );
  }

  return (
    <AppShell role="dealer" active="home">
      <BrandHeader title="Dealer Home" right={<NotificationBell />} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroKicker}>{dealer.storeName.toUpperCase()}</Text>
              <Text style={styles.heroTitle}>
                {live.length} live auction{live.length === 1 ? "" : "s"} in your categories
              </Text>
              <Text style={styles.heroBody}>
                {dealer.categoryIds.map(categoryName).join(" · ")}
              </Text>
            </View>
            <Badge tone="verified">✓ APPROVED</Badge>
          </View>
          <View style={styles.stats}>
            <Stat value={String(live.length)} label="Live auctions" />
            <Stat value={String(participated.length)} label="Participated" />
            <Stat value={String(myProducts.length)} label="Products" />
            <Stat value={String(wonDeals)} label="Won" />
          </View>
        </View>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "live", label: "Live auctions", count: live.length },
            { value: "participated", label: "Participated", count: participated.length },
            { value: "posted", label: "My posts", count: myProducts.length },
          ]}
          style={{ marginHorizontal: 0, marginTop: 14 }}
        />

        {tab === "live" ? (
          <>
            <InfoCard
              title="Auctions matched to your categories"
              body="Tap an auction to open the group chat. Once you post a deal it moves to Participated auctions."
            />
            {live.length === 0 ? (
              <Card>
                <EmptyState
                  icon="♜"
                  title="No live auction right now"
                  body={`You will be notified as soon as a buyer publishes in ${dealer.categoryIds.map(categoryName).join(", ")}.`}
                />
              </Card>
            ) : null}
            {live.map((auction) => (
              <View key={auction.id}>
                <AuctionCard
                  auction={auction}
                  now={now}
                  onPress={() => router.push(`/dealer/chat/${auction.id}`)}
                  subtitle={`${categoryName(auction.categoryId)} · budget ${money(auction.budget)}`}
                />
                {auctionStatus(auction, now) === "scheduled" ? (
                  <Text style={styles.notice}>
                    Bidding opens in {compactCountdown(auction.startsAt - now)} — the buyer already notified you.
                  </Text>
                ) : (
                  <Pressable
                    onPress={() => router.push(`/dealer/chat/${auction.id}`)}
                    style={styles.joinButton}
                  >
                    <Text style={styles.joinText}>Open chat & make a deal →</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </>
        ) : null}

        {tab === "participated" ? (
          <>
            <InfoCard
              title="Sorted by the running timer"
              body="Each chat shows a timer based on the closing time set by the buyer. Soonest closing first."
            />
            {participated.length === 0 ? (
              <Card>
                <EmptyState icon="◌" title="You have not joined any auction yet" body="Open a live auction and post your offer." />
              </Card>
            ) : null}
            {participated.map((auction) => {
              const myDeal = state.deals
                .filter((d) => d.auctionId === auction.id && d.dealerId === dealer.id && !d.withdrawn)
                .sort((a, b) => b.createdAt - a.createdAt)[0];
              const best = currentBestDeal(state.deals, auction.id);
              const status = auctionStatus(auction, now);
              return (
                <Pressable
                  key={auction.id}
                  onPress={() => router.push(`/dealer/chat/${auction.id}`)}
                  style={({ pressed }) => [styles.partCard, pressed && kitStyles.pressed]}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <View style={kitStyles.row}>
                        {status === "closed" ? <Badge tone="muted">CLOSED</Badge> : <Badge tone="live">● LIVE</Badge>}
                        <Badge tone="brand">{categoryName(auction.categoryId)}</Badge>
                      </View>
                      <Text style={styles.partTitle}>{auction.productName}</Text>
                      <Text style={kitStyles.cardMeta}>
                        {dealsOf(state.deals, auction.id).length} offers · buyer {getAccount(auction.userId)?.name}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={kitStyles.microLabel}>TIMER</Text>
                      <View style={[styles.timer, status === "closed" && { backgroundColor: "#3F3F46" }]}>
                        <Text style={[styles.timerText, status === "closed" && { color: "#FCA5A5" }]}>
                          {status === "closed" ? "CLOSED" : compactCountdown(auctionClosesAt(auction) - now)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.partFooter}>
                    <View>
                      <Text style={kitStyles.microLabel}>YOUR LAST OFFER</Text>
                      <Text style={kitStyles.money}>{myDeal ? money(myDeal.amount) : "—"}</Text>
                    </View>
                    <View>
                      <Text style={kitStyles.microLabel}>LOWEST OFFER</Text>
                      <Text style={kitStyles.money}>{best ? money(best.amount) : "—"}</Text>
                    </View>
                    <View>
                      <Text style={kitStyles.microLabel}>MY STATUS</Text>
                      <Text style={[kitStyles.money, { color: best?.dealerId === dealer.id ? T.success : T.textMuted }]}>
                        {best?.dealerId === dealer.id ? "Lowest" : "Outbid"}
                      </Text>
                    </View>
                    <Text style={kitStyles.link}>Open chat ›</Text>
                  </View>
                </Pressable>
              );
            })}
            {openParticipated.length > 0 ? (
              <InfoCard
                tone="warning"
                icon="⚡"
                title="Keep improving your offer"
                body="Reverse auction — you can beat the current lowest price with freebies or extra mentions any time before the timer ends."
              />
            ) : null}
          </>
        ) : null}

        {tab === "posted" ? (
          <>
            <InfoCard
              title="Products and deals you posted earlier"
              body="Buyers browsing their home page see these listings. Flag a product as a special deal to add days-left countdowns."
            />
            {myProducts.length === 0 ? (
              <Card>
                <EmptyState
                  icon="▤"
                  title="No products posted yet"
                  body="Use the Post tab to publish your regular products."
                  action="Post a product"
                  onAction={() => router.push("/dealer/post-product")}
                />
              </Card>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {myProducts.map((product) => (
                <ProductCard key={product.id} product={product} now={now} />
              ))}
            </ScrollView>
            {myProducts.map((product) => (
              <Card key={product.id}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={kitStyles.cardTitle}>{product.name}</Text>
                    <Text style={kitStyles.cardMeta}>
                      {categoryName(product.categoryId)} · {product.subCategory} · posted {relativeTime(product.postedAt, now)}
                    </Text>
                  </View>
                  {product.isSpecialDeal ? <Badge tone="special">SPECIAL</Badge> : <Badge tone="muted">REGULAR</Badge>}
                </View>
                <View style={styles.partFooter}>
                  <View>
                    <Text style={kitStyles.microLabel}>PRICE</Text>
                    <Text style={kitStyles.money}>{money(product.price)}</Text>
                  </View>
                  <View>
                    <Text style={kitStyles.microLabel}>DAYS LEFT</Text>
                    <Text style={kitStyles.money}>
                      {product.isSpecialDeal
                        ? `${Math.max(0, Math.ceil(((product.specialDealEndsAt ?? now) - now) / 86400000))}d`
                        : "—"}
                    </Text>
                  </View>
                  <View>
                    <Text style={kitStyles.microLabel}>CATEGORY</Text>
                    <Text style={kitStyles.money}>{product.subCategory.slice(0, 10)}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>
      <Fab onPress={() => router.push("/dealer/post-product")} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  hero: { backgroundColor: T.brand, borderRadius: 18, padding: 16 },
  heroKicker: { color: "#BFEDEC", fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  heroTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: 6 },
  heroBody: { color: "#D6F5F3", fontSize: 11, marginTop: 6 },
  stats: { flexDirection: "row", gap: 8, marginTop: 14 },

  notice: { color: T.special, fontSize: 11, fontWeight: "700", marginTop: -4, marginBottom: 12 },
  joinButton: { marginTop: -4, marginBottom: 12, alignItems: "flex-end" },
  joinText: { color: T.brand, fontWeight: "800", fontSize: 12 },

  partCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    marginBottom: 10,
  },
  partTitle: { color: T.text, fontSize: 14, fontWeight: "700", marginTop: 6, marginBottom: 2 },
  partFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F4F4F4",
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
  timer: { backgroundColor: T.dark, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginTop: 3 },
  timerText: { color: T.success, fontSize: 11, fontWeight: "800" },
  hRow: { gap: 10, paddingBottom: 8 },
});
