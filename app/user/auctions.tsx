import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import { AuctionCard, DealRow } from "@/components/domain/cards";
import {
  Badge,
  Card,
  EmptyState,
  Fab,
  InfoCard,
  KeyValue,
  PrimaryButton,
  Segmented,
  kitStyles,
} from "@/components/ui/kit";
import { choose, notify } from "@/components/ui/action-sheet";
import { useNow } from "@/hooks/use-now";
import { compactCountdown, fullDate, money } from "@/lib/format";
import { categoryName } from "@/lib/domain/seed";
import {
  auctionClosesAt,
  auctionStatus,
  auctionsForBuyer,
  currentBestDeal,
  dealsOf,
  useApp,
} from "@/lib/store";
import { T } from "@/lib/theme";

type Tab = "live" | "previous";

export default function BuyerAuctionsScreen() {
  const router = useRouter();
  const { account, state, getDealer, extendAuction, closeAuction } = useApp();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("live");
  const [expanded, setExpanded] = useState<string | null>(null);

  const auctions = useMemo(
    () => (account ? auctionsForBuyer(state, account.id, now) : []),
    [account, state, now],
  );

  const open = auctions.filter((a) => auctionStatus(a, now) !== "closed");
  const past = auctions.filter((a) => auctionStatus(a, now) === "closed");
  const list = tab === "live" ? open : past;

  return (
    <AppShell role="user" active="auctions">
      <BrandHeader title="My Auctions" right={<NotificationBell />} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "live", label: "Live", count: open.length },
          { value: "previous", label: "Previous", count: past.length },
        ]}
      />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        {tab === "live" ? (
          <InfoCard
            title="Live auctions"
            body="Dealers matching your product category are bidding right now. Tap an auction to watch the live group chat."
          />
        ) : (
          <InfoCard
            tone="muted"
            title="Previous auctions"
            body="Every closed auction is stored with the full detail of the offers received."
          />
        )}

        {list.length === 0 ? (
          <Card>
            <EmptyState
              icon="♜"
              title={tab === "live" ? "No open auctions" : "No previous auctions"}
              body={
                tab === "live"
                  ? "Publish a requirement and matching stores will be notified."
                  : "Closed auctions will appear here with the winning offer."
              }
            />
          </Card>
        ) : null}

        {list.map((auction) => {
          const best = currentBestDeal(state.deals, auction.id);
          const offers = dealsOf(state.deals, auction.id);
          const isOpen = expanded === auction.id;
          const winner = auction.winningDealId
            ? state.deals.find((d) => d.id === auction.winningDealId)
            : undefined;
          return (
            <View key={auction.id}>
              <AuctionCard
                auction={auction}
                now={now}
                onPress={() => router.push(`/user/auction/${auction.id}`)}
                subtitle={`${categoryName(auction.categoryId)} · opens for ${auction.durationDays} days`}
              />
              {tab === "previous" ? (
                <>
                  <View style={styles.inlineActions}>
                    <Badge tone="muted">
                      Closed {auction.closedAt ? fullDate(auction.closedAt) : "—"}
                    </Badge>
                    <Text style={styles.toggle} onPress={() => setExpanded(isOpen ? null : auction.id)}>
                      {isOpen ? "Hide detail ▲" : "View full detail ▼"}
                    </Text>
                  </View>
                  {isOpen ? (
                    <Card>
                      <Text style={kitStyles.cardTitle}>{auction.productName}</Text>
                      <Text style={kitStyles.cardMeta}>{auction.specifications}</Text>
                      <View style={{ marginTop: 10 }}>
                        <KeyValue label="Category" value={categoryName(auction.categoryId)} />
                        <KeyValue label="Sub category" value={auction.subCategory ?? "—"} />
                        <KeyValue label="Deal amount" value={money(auction.budget)} />
                        <KeyValue label="Auction open" value={`${auction.durationDays} days`} />
                        <KeyValue label="Published" value={fullDate(auction.publishedAt)} />
                        <KeyValue label="First bid" value={auction.firstBidAt ? fullDate(auction.firstBidAt) : "No bids"} />
                        <KeyValue label="Closed" value={auction.closedAt ? fullDate(auction.closedAt) : "—"} />
                        <KeyValue label="Extensions" value={auction.extensionDays ? `${auction.extensionDays} days` : "None"} />
                        <KeyValue label="Offers received" value={String(offers.length)} />
                        <KeyValue
                          label="Winning offer"
                          value={winner ? `${money(winner.amount)} · ${getDealer(winner.dealerId)?.storeName ?? ""}` : "Not selected"}
                        />
                      </View>
                      {offers.map((deal) => (
                        <View key={deal.id} style={{ marginTop: 10 }}>
                          <DealRow
                            deal={deal}
                            now={now}
                            dealerName={getDealer(deal.dealerId)?.storeName ?? "Dealer"}
                            isBest={best?.id === deal.id}
                          />
                        </View>
                      ))}
                    </Card>
                  ) : null}
                </>
              ) : null}
              {tab === "live" ? (
                <View style={styles.quickActions}>
                  <PrimaryButton
                    label={`Watch live chat · ${compactCountdown(auctionClosesAt(auction) - now)}`}
                    onPress={() => router.push(`/user/auction/${auction.id}`)}
                    style={{ flex: 1, marginTop: 0 }}
                  />
                  <View style={{ width: 10 }} />
                  <PrimaryButton
                    label="Extend"
                    onPress={() =>
                      choose("Extend auction", `Add extra days to ${auction.productName}?`, [
                        {
                          label: "+1 day",
                          tone: "brand",
                          onPress: () => {
                            const result = extendAuction(auction.id, 1);
                            if (!result.ok) notify("Unable to extend", result.error);
                          },
                        },
                        {
                          label: "+2 days",
                          tone: "brand",
                          onPress: () => {
                            const result = extendAuction(auction.id, 2);
                            if (!result.ok) notify("Unable to extend", result.error);
                          },
                        },
                      ])
                    }
                    style={{ width: 110, marginTop: 0, backgroundColor: T.dark }}
                  />
                </View>
              ) : null}
              {tab === "previous" && auction.winningDealId ? (
                <PrimaryButton
                  label="Mark as completed"
                  onPress={() => {
                    const result = closeAuction(auction.id);
                    if (!result.ok) notify("Auction", result.error);
                  }}
                  style={{ backgroundColor: T.success }}
                />
              ) : null}
            </View>
          );
        })}

        <PrimaryButton
          label="Start a new auction"
          icon="+"
          onPress={() => router.push("/user/new-auction")}
        />
      </ScrollView>
      <Fab onPress={() => router.push("/user/new-auction")} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  inlineActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: -4,
  },
  toggle: { color: T.brand, fontWeight: "700", fontSize: 12 },
  quickActions: { flexDirection: "row", marginBottom: 14 },
});
