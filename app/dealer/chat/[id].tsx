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
  Field,
  InfoCard,
  KeyValue,
  PrimaryButton,
  kitStyles,
} from "@/components/ui/kit";
import { notify } from "@/components/ui/action-sheet";
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

export default function DealerChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, account, dealer, getDealer, getAccount, placeDeal, withdrawDeal, sendMessage } = useApp();
  const now = useNow();

  const [amount, setAmount] = useState("");
  const [freebies, setFreebies] = useState("");
  const [mentions, setMentions] = useState("");
  const [draft, setDraft] = useState("");
  const [showDealForm, setShowDealForm] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const auction = state.auctions.find((a) => a.id === id);
  const messages = useMemo(
    () => state.messages.filter((m) => m.auctionId === id).sort((a, b) => a.createdAt - b.createdAt),
    [state.messages, id],
  );

  if (!auction || !dealer) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <EmptyState title="Auction not available" action="Back home" onAction={() => router.replace("/dealer/home")} />
      </ScreenContainer>
    );
  }

  const status = auctionStatus(auction, now);
  const remaining = auctionClosesAt(auction) - now;
  const best = currentBestDeal(state.deals, auction.id);
  const offers = dealsOf(state.deals, auction.id).sort((a, b) => a.amount - b.amount);
  const myOffers = offers.filter((d) => d.dealerId === dealer.id);
  const amLowest = best?.dealerId === dealer.id;
  const buyer = getAccount(auction.userId);
  const canBid = status === "live" || status === "extended";

  const suggested = best ? Math.max(0, best.amount - Math.max(500, Math.round(best.amount * 0.01))) : auction.budget;

  const submitDeal = () => {
    setFeedback(null);
    const value = Number(amount.replace(/[^0-9.]/g, ""));
    const result = placeDeal(auction.id, { amount: value, freebies, specialMentions: mentions });
    if (!result.ok) {
      setFeedback({ tone: "danger", text: result.error ?? "Unable to post the deal." });
      return;
    }
    setFeedback({ tone: "success", text: `Deal posted at ${money(value)}. The buyer was notified instantly.` });
    setAmount("");
    setFreebies("");
    setMentions("");
    setShowDealForm(false);
  };

  const send = () => {
    if (!draft.trim()) return;
    const result = sendMessage(auction.id, draft);
    if (!result.ok) {
      notify("Message", result.error);
      return;
    }
    setDraft("");
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-[#F8FAFA]">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/dealer/home")} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {auction.productName}
            </Text>
            <Text style={kitStyles.cardMeta}>
              Group chat · {offers.length} offers from {new Set(offers.map((o) => o.dealerId)).size} stores
            </Text>
          </View>
          <Badge tone="brand">{categoryName(auction.categoryId)}</Badge>
        </View>

        <View style={styles.timerBar}>
          <View style={{ flex: 1 }}>
            <Text style={kitStyles.microLabel}>AUCTION CLOSES IN</Text>
            <Text style={[styles.timerValue, remaining <= 0 && { color: T.live }]}>
              {remaining <= 0 ? "CLOSED" : compactCountdown(remaining)}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={kitStyles.microLabel}>LOWEST OFFER</Text>
            <Text style={styles.timerValue}>{best ? money(best.amount) : "No offers"}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.blockTitle}>Buyer requirement</Text>
              {canBid ? <Badge tone="live">● LIVE</Badge> : <Badge tone="muted">CLOSED</Badge>}
            </View>
            <Text style={kitStyles.cardMeta}>{auction.specifications || "No special specifications"}</Text>
            <View style={{ marginTop: 8 }}>
              <KeyValue label="Buyer" value={buyer?.name ?? "Buyer"} />
              <KeyValue label="Buyer deal amount" value={money(auction.budget)} />
              <KeyValue label="Auction open for" value={`${auction.durationDays} days`} />
              <KeyValue label="Bidding opened" value={fullDate(auction.startsAt)} />
              <KeyValue label="Closes" value={fullDate(auction.endsAt)} />
              <KeyValue label="Extensions by buyer" value={auction.extensionDays ? `${auction.extensionDays} days` : "None"} />
              {auction.referralLink ? <KeyValue label="Referral link" value={auction.referralLink} /> : null}
            </View>
          </Card>

          {status === "scheduled" ? (
            <InfoCard
              tone="warning"
              icon="◔"
              title="Auction starts soon"
              body={`Bidding opens in ${compactCountdown(auction.startsAt - now)}. You can still chat with the buyer.`}
            />
          ) : null}

          {auction.firstBidAt && canBid ? (
            <InfoCard
              tone="success"
              icon="⚡"
              title="Reverse-bidding window is open"
              body={`The first bid was received ${new Date(auction.firstBidAt).toLocaleTimeString("en-IN")}. Beat the current lowest offer with a lower price or add special freebies.`}
            />
          ) : null}

          {amLowest ? (
            <InfoCard tone="success" icon="★" title="You are currently the lowest offer" body="Keep an eye on the timer — another store can still outbid you." />
          ) : best ? (
            <InfoCard
              tone="warning"
              icon="!"
              title="You are outbid"
              body={`${getDealer(best.dealerId)?.storeName ?? "Another store"} is at ${money(best.amount)}. Post a better offer to lead again.`}
            />
          ) : null}

          {canBid ? (
            <>
              {!showDealForm ? (
                <PrimaryButton
                  label={myOffers.length ? "Update my deal" : "Make a deal"}
                  icon="⚡"
                  onPress={() => {
                    setShowDealForm(true);
                    setAmount(String(suggested));
                    setFeedback(null);
                  }}
                />
              ) : (
                <Card style={{ borderColor: T.brand }}>
                  <Text style={styles.blockTitle}>{myOffers.length ? "Update your offer" : "Your reverse bid"}</Text>
                  <Field
                    label="DEAL AMOUNT (₹) *"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={String(suggested)}
                    keyboardType="numeric"
                    hint={
                      best
                        ? `Must be lower than ${money(best.amount)}${amLowest ? " (your own current offer)" : ""}`
                        : `Must be at or below the buyer's amount ${money(auction.budget)}`
                    }
                  />
                  <Field
                    label="SPECIAL FREEBIES"
                    value={freebies}
                    onChangeText={setFreebies}
                    placeholder="e.g. Free cover + 1-year accidental protection"
                    multiline
                  />
                  <Field
                    label="SPECIAL MENTION ABOUT THE PRODUCT"
                    value={mentions}
                    onChangeText={setMentions}
                    placeholder="e.g. Sealed India unit, GST bill, same-day delivery"
                    multiline
                  />
                  <View style={styles.quickRow}>
                    <Text style={styles.quickLabel}>Quick fill:</Text>
                    {[
                      { label: "Free delivery", value: "Free home delivery" },
                      { label: "Extended warranty", value: "Extra 1-year brand warranty" },
                      { label: "GST bill", value: "GST invoice with input credit" },
                    ].map((item) => (
                      <Pressable key={item.label} onPress={() => setFreebies(item.value)} style={styles.quickChip}>
                        <Text style={styles.quickChipText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <PrimaryButton label="Post my deal" onPress={submitDeal} />
                  <Pressable onPress={() => setShowDealForm(false)} style={styles.cancel}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </Card>
              )}
            </>
          ) : (
            <InfoCard tone="muted" title="Bidding is closed" body="Watch the chat for the buyer's decision." />
          )}

          {feedback ? (
            <InfoCard
              tone={feedback.tone === "success" ? "success" : "danger"}
              title={feedback.tone === "success" ? "Deal posted" : "Offer rejected"}
              body={feedback.text}
            />
          ) : null}

          <Text style={styles.sectionLabel}>All offers in this auction</Text>
          {offers.length === 0 ? (
            <EmptyState icon="⚡" title="No offers yet" body="Be the first store to bid — the first bid opens the 20 minute reverse-bidding window." />
          ) : null}
          {offers.map((deal, index) => (
            <DealRow
              key={deal.id}
              deal={deal}
              now={now}
              dealerName={getDealer(deal.dealerId)?.storeName ?? "Dealer"}
              isBest={index === 0}
              actionLabel={
                deal.dealerId === dealer.id && canBid && !deal.withdrawn ? "Withdraw this offer" : undefined
              }
              onAction={() => {
                const result = withdrawDeal(deal.id);
                if (!result.ok) notify("Offer", result.error);
              }}
            />
          ))}

          <Text style={styles.sectionLabel}>Group chat with the buyer and other stores</Text>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} mine={message.senderId === account?.id} />
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message the buyer and other stores…"
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
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: T.dark,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timerValue: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 3, letterSpacing: 0.5 },
  scroll: { padding: 14, paddingBottom: 30 },
  blockTitle: { fontSize: 14, fontWeight: "800", color: T.text, marginBottom: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: T.text, marginTop: 18, marginBottom: 8 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 6 },
  quickLabel: { fontSize: 11, color: T.textMuted, fontWeight: "700" },
  quickChip: {
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.bg,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickChipText: { fontSize: 11, color: T.text, fontWeight: "600" },
  cancel: { marginTop: 10, alignItems: "center" },
  cancelText: { color: T.textMuted, fontWeight: "700", fontSize: 12 },
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
