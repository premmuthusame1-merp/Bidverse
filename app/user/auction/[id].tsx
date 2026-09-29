import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { DealRow, MessageBubble } from "@/components/domain/cards";
import {
  Badge,
  BigTimer,
  Card,
  EmptyState,
  InfoCard,
  KeyValue,
  PrimaryButton,
  kitStyles,
} from "@/components/ui/kit";
import { choose, confirmAction, notify } from "@/components/ui/action-sheet";
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

export default function BuyerAuctionRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, account, getDealer, extendAuction, closeAuction, sendMessage } = useApp();
  const now = useNow();
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<"offers" | "chat" | "detail">("offers");

  const auction = state.auctions.find((a) => a.id === id);
  const messages = useMemo(
    () => state.messages.filter((m) => m.auctionId === id).sort((a, b) => a.createdAt - b.createdAt),
    [state.messages, id],
  );

  if (!auction) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <EmptyState title="Auction not found" action="Back to auctions" onAction={() => router.replace("/user/auctions")} />
      </ScreenContainer>
    );
  }

  const status = auctionStatus(auction, now);
  const closesIn = auctionClosesAt(auction) - now;
  const best = currentBestDeal(state.deals, auction.id);
  const offers = dealsOf(state.deals, auction.id).sort((a, b) => a.amount - b.amount);
  const bidders = new Set(state.deals.filter((d) => d.auctionId === auction.id).map((d) => d.dealerId)).size;
  const isOwner = account?.id === auction.userId;

  const send = () => {
    if (!draft.trim()) return;
    const result = sendMessage(auction.id, draft);
    if (!result.ok) {
      notify("Message", result.error);
      return;
    }
    setDraft("");
  };

  const pickWinner = (dealId: string) => {
    confirmAction(
      "Select this offer?",
      "The auction closes and the participating stores are informed.",
      () => {
        const result = closeAuction(auction.id, dealId);
        if (!result.ok) notify("Auction", result.error);
      },
      "Select & close",
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-[#F8FAFA]">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/user/auctions")} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {auction.productName}
            </Text>
            <Text style={kitStyles.cardMeta}>
              {categoryName(auction.categoryId)}
              {auction.subCategory ? ` · ${auction.subCategory}` : ""}
            </Text>
          </View>
          {status === "closed" ? <Badge tone="muted">CLOSED</Badge> : <Badge tone="live">● LIVE</Badge>}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroKicker}>YOUR REQUIREMENT</Text>
                <Text style={styles.heroTitle}>{auction.productName}</Text>
                <Text style={styles.heroMeta}>{auction.specifications || "No special specifications"}</Text>
              </View>
              <View style={styles.heroBudget}>
                <Text style={styles.heroBudgetLabel}>YOUR DEAL AMOUNT</Text>
                <Text style={styles.heroBudgetValue}>{money(auction.budget)}</Text>
              </View>
            </View>

            <BigTimer
              tone="light"
              label={
                status === "scheduled"
                  ? "BIDDING OPENS IN"
                  : auction.firstBidAt
                    ? "REVERSE-BID WINDOW CLOSES IN"
                    : "AUCTION CLOSES IN"
              }
              msRemaining={status === "scheduled" ? auction.startsAt - now : closesIn}
            />

            <View style={styles.heroStats}>
              <HeroStat label="OFFERS" value={String(offers.length)} />
              <HeroStat label="STORES" value={String(bidders)} />
              <HeroStat label="BEST PRICE" value={best ? money(best.amount) : "—"} />
              <HeroStat label="DAYS OPEN" value={`${auction.durationDays}d`} />
            </View>
          </View>

          {status === "scheduled" ? (
            <InfoCard
              tone="warning"
              icon="◔"
              title="Stores have been notified"
              body={`Bidding starts 10 minutes after posting (${compactCountdown(auction.startsAt - now)}). The first bid then opens a 20 minute reverse-bidding window.`}
            />
          ) : null}

          {auction.firstBidAt && status !== "closed" ? (
            <InfoCard
              tone="success"
              icon="⚡"
              title="Reverse bidding is live"
              body={`First offer received ${compactCountdown(now - auction.firstBidAt)} ago. Dealers can keep beating each other with lower prices, freebies or special mentions.`}
            />
          ) : null}

          {status !== "closed" ? (
            <View style={styles.actionRow}>
              <PrimaryButton
                label="Extend closing time"
                onPress={() =>
                  choose("Extend auction", "How many extra days do you need?", [
                    { label: "+1 day", tone: "brand", onPress: () => run(() => extendAuction(auction.id, 1)) },
                    { label: "+2 days", tone: "brand", onPress: () => run(() => extendAuction(auction.id, 2)) },
                    { label: "+3 days", tone: "brand", onPress: () => run(() => extendAuction(auction.id, 3)) },
                  ])
                }
                style={{ flex: 1, marginTop: 0 }}
              />
              <View style={{ width: 10 }} />
              <PrimaryButton
                label={best ? "Accept best offer" : "Close auction"}
                disabled={!best}
                onPress={() => best && pickWinner(best.id)}
                style={{ flex: 1, marginTop: 0, backgroundColor: T.success }}
              />
            </View>
          ) : null}

          <View style={styles.tabs}>
            {(
              [
                { key: "offers", label: `Live offers (${offers.length})` },
                { key: "chat", label: `Group chat (${messages.length})` },
                { key: "detail", label: "Detail" },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.tabItem, tab === item.key && styles.tabItemActive]}
              >
                <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {tab === "offers" ? (
            <>
              {offers.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="◔"
                    title="No offers yet"
                    body="Dealers matching this category were notified the moment you published."
                  />
                </Card>
              ) : null}
              {offers.map((deal, index) => (
                <DealRow
                  key={deal.id}
                  deal={deal}
                  now={now}
                  dealerName={getDealer(deal.dealerId)?.storeName ?? "Dealer"}
                  isBest={index === 0}
                  actionLabel={isOwner && status !== "closed" ? "Select this offer →" : undefined}
                  onAction={() => pickWinner(deal.id)}
                />
              ))}
              {offers.length > 0 ? (
                <InfoCard
                  title="Reverse auction rule"
                  body="Every new offer must be lower than the current best price. Dealers can also add special freebies or mentions to win the deal."
                />
              ) : null}
            </>
          ) : null}

          {tab === "chat" ? (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mine={message.senderId === account?.id}
                />
              ))}
              {messages.length === 0 ? (
                <EmptyState icon="◌" title="Chat is empty" body="Say hello and share your expectations." />
              ) : null}
            </>
          ) : null}

          {tab === "detail" ? (
            <Card>
              <Text style={styles.blockTitle}>Full auction detail</Text>
              <KeyValue label="Product" value={auction.productName} />
              <KeyValue label="Category" value={categoryName(auction.categoryId)} />
              <KeyValue label="Sub category" value={auction.subCategory ?? "—"} />
              <KeyValue label="Specifications" value={auction.specifications || "—"} />
              <KeyValue label="Referral link" value={auction.referralLink || "—"} />
              <KeyValue label="Deal amount" value={money(auction.budget)} />
              <KeyValue label="Auction open for" value={`${auction.durationDays} days`} />
              <KeyValue label="Published" value={fullDate(auction.publishedAt)} />
              <KeyValue label="Bidding opened" value={fullDate(auction.startsAt)} />
              <KeyValue label="First bid" value={auction.firstBidAt ? fullDate(auction.firstBidAt) : "Awaiting first bid"} />
              <KeyValue label="Bidding window ends" value={auction.biddingEndsAt ? fullDate(auction.biddingEndsAt) : "—"} />
              <KeyValue label="Closes" value={fullDate(auction.endsAt)} />
              <KeyValue label="Extensions" value={auction.extensionDays ? `${auction.extensionDays} days` : "None"} />
              {auction.winningDealId ? (
                <KeyValue
                  label="Winning offer"
                  value={`${money(state.deals.find((d) => d.id === auction.winningDealId)?.amount)} · ${
                    getDealer(state.deals.find((d) => d.id === auction.winningDealId)?.dealerId ?? "")?.storeName ?? ""
                  }`}
                />
              ) : null}
            </Card>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message all participating stores…"
            placeholderTextColor={T.textFaint}
            style={styles.composerInput}
            onSubmitEditing={send}
          />
          <Pressable onPress={send} style={styles.sendButton}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );

  function run(action: () => { ok: boolean; error?: string }) {
    const result = action();
    if (!result.ok) notify("Auction", result.error);
  }
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 20, color: T.textMuted, marginTop: -2 },
  headerTitle: { fontSize: 15, fontWeight: "800", color: T.text },
  scroll: { padding: 14, paddingBottom: 40 },

  hero: { backgroundColor: T.brand, borderRadius: 18, padding: 16, marginBottom: 12 },
  heroTop: { flexDirection: "row", gap: 12 },
  heroKicker: { color: "#BFEDEC", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  heroTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: 6 },
  heroMeta: { color: "#D6F5F3", fontSize: 11, marginTop: 6, lineHeight: 16 },
  heroBudget: { alignItems: "flex-end" },
  heroBudgetLabel: { color: "#BFEDEC", fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  heroBudgetValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 4 },
  heroStats: { flexDirection: "row", gap: 8, marginTop: 12 },
  heroStat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 11,
    paddingVertical: 8,
    alignItems: "center",
  },
  heroStatLabel: { color: "#BFEDEC", fontSize: 8, fontWeight: "800", letterSpacing: 0.6 },
  heroStatValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", marginTop: 3 },

  actionRow: { flexDirection: "row", marginBottom: 6 },
  tabs: { flexDirection: "row", backgroundColor: "#E8E8E8", padding: 3, borderRadius: 14, marginVertical: 12 },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  tabItemActive: { backgroundColor: "#FFFFFF" },
  tabText: { fontSize: 11, fontWeight: "700", color: T.textMuted },
  tabTextActive: { color: T.brand },
  blockTitle: { fontSize: 14, fontWeight: "800", color: T.text, marginBottom: 8 },

  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: "#FFFFFF",
  },
  composerInput: {
    flex: 1,
    backgroundColor: T.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: T.text,
  },
  sendButton: { backgroundColor: T.brand, borderRadius: 13, paddingHorizontal: 18, paddingVertical: 12 },
  sendText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});
