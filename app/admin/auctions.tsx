import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader } from "@/components/app-shell";
import { DealRow } from "@/components/domain/cards";
import {
  Badge,
  Card,
  EmptyState,
  InfoCard,
  KeyValue,
  Segmented,
  kitStyles,
} from "@/components/ui/kit";
import { useNow } from "@/hooks/use-now";
import { categoryName } from "@/lib/domain/seed";
import { compactCountdown, fullDate, money } from "@/lib/format";
import {
  auctionClosesAt,
  auctionStatus,
  currentBestDeal,
  dealsOf,
  useApp,
} from "@/lib/store";
import { T } from "@/lib/theme";

type Tab = "open" | "closed";

export default function AdminAuctionsScreen() {
  const router = useRouter();
  const { state, account, getAccount, getDealer } = useApp();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("open");
  const [expanded, setExpanded] = useState<string | null>(null);

  const open = useMemo(() => state.auctions.filter((a) => auctionStatus(a, now) !== "closed"), [state.auctions, now]);
  const closed = useMemo(() => state.auctions.filter((a) => auctionStatus(a, now) === "closed"), [state.auctions, now]);
  const list = tab === "open" ? open : closed;

  if (!account || account.role !== "admin") {
    return (
      <AppShell role="admin" active="auctions">
        <BrandHeader title="Auctions" />
        <EmptyState title="Super admin sign-in required" action="Go to login" onAction={() => router.replace("/auth/dealer-login")} />
      </AppShell>
    );
  }

  return (
    <AppShell role="admin" active="auctions">
      <BrandHeader title="All Auctions" right={<Badge tone="brand">{state.auctions.length} total</Badge>} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "open", label: "Open", count: open.length },
          { value: "closed", label: "Closed", count: closed.length },
        ]}
      />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <InfoCard
          title="Auction monitor"
          body="Every buyer requirement, its matching category, the offers received and the timer set by the buyer."
        />

        {list.length === 0 ? (
          <Card>
            <EmptyState icon="♜" title="No auctions in this view" />
          </Card>
        ) : null}

        {list.map((auction) => {
          const offers = dealsOf(state.deals, auction.id);
          const best = currentBestDeal(state.deals, auction.id);
          const status = auctionStatus(auction, now);
          const isOpen = expanded === auction.id;
          return (
            <Card key={auction.id}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <View style={styles.row}>
                    {status === "closed" ? <Badge tone="muted">CLOSED</Badge> : <Badge tone="live">● LIVE</Badge>}
                    <Badge tone="brand">{categoryName(auction.categoryId)}</Badge>
                  </View>
                  <Text style={styles.title}>{auction.productName}</Text>
                  <Text style={kitStyles.cardMeta}>
                    Buyer {getAccount(auction.userId)?.name} · {offers.length} offers ·{" "}
                    {new Set(offers.map((o) => o.dealerId)).size} stores
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={kitStyles.microLabel}>{status === "closed" ? "CLOSED" : "TIMER"}</Text>
                  <View style={[styles.timer, status === "closed" && { backgroundColor: "#3F3F46" }]}>
                    <Text style={[styles.timerText, status === "closed" && { color: "#FCA5A5" }]}>
                      {status === "closed" ? "—" : compactCountdown(auctionClosesAt(auction) - now)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.footer}>
                <View>
                  <Text style={kitStyles.microLabel}>BUDGET</Text>
                  <Text style={kitStyles.money}>{money(auction.budget)}</Text>
                </View>
                <View>
                  <Text style={kitStyles.microLabel}>BEST OFFER</Text>
                  <Text style={kitStyles.money}>{best ? money(best.amount) : "—"}</Text>
                </View>
                <View>
                  <Text style={kitStyles.microLabel}>OPEN FOR</Text>
                  <Text style={kitStyles.money}>{auction.durationDays}d</Text>
                </View>
                <Text style={kitStyles.link} onPress={() => setExpanded(isOpen ? null : auction.id)}>
                  {isOpen ? "Hide detail ▲" : "Detail ▼"}
                </Text>
              </View>

              {isOpen ? (
                <View style={{ marginTop: 10 }}>
                  <KeyValue label="Specifications" value={auction.specifications || "—"} />
                  <KeyValue label="Sub category" value={auction.subCategory ?? "—"} />
                  <KeyValue label="Referral link" value={auction.referralLink || "—"} />
                  <KeyValue label="Published" value={fullDate(auction.publishedAt)} />
                  <KeyValue label="Bidding opens" value={fullDate(auction.startsAt)} />
                  <KeyValue label="First bid" value={auction.firstBidAt ? fullDate(auction.firstBidAt) : "Awaiting"} />
                  <KeyValue label="Window ends" value={auction.biddingEndsAt ? fullDate(auction.biddingEndsAt) : "—"} />
                  <KeyValue label="Closes" value={fullDate(auction.endsAt)} />
                  <KeyValue label="Extensions" value={auction.extensionDays ? `${auction.extensionDays} days` : "None"} />
                  <KeyValue
                    label="Winning offer"
                    value={
                      auction.winningDealId
                        ? `${money(state.deals.find((d) => d.id === auction.winningDealId)?.amount)} · ${
                            getDealer(state.deals.find((d) => d.id === auction.winningDealId)?.dealerId ?? "")?.storeName ?? ""
                          }`
                        : "Not selected"
                    }
                  />
                  <View style={{ marginTop: 10 }}>
                    {offers.map((deal, index) => (
                      <DealRow
                        key={deal.id}
                        deal={deal}
                        now={now}
                        dealerName={getDealer(deal.dealerId)?.storeName ?? "Dealer"}
                        isBest={index === 0}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  row: { flexDirection: "row", gap: 6, marginBottom: 6 },
  title: { fontSize: 14, fontWeight: "800", color: T.text },
  timer: { backgroundColor: T.dark, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginTop: 3 },
  timerText: { color: T.success, fontSize: 11, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F4F4F4",
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
});
