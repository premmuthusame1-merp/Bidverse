import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, Badge, Card, avatarColor, initialsOf, kitStyles } from "@/components/ui/kit";
import { compactCountdown, money, relativeTime } from "@/lib/format";
import { resolveProductImage } from "@/lib/domain/images";
import { categoryName } from "@/lib/domain/seed";
import {
  auctionClosesAt,
  auctionStatus,
  currentBestDeal,
  dealsOf,
  useApp,
} from "@/lib/store";
import type { Auction, ChatMessage, Deal, Product } from "@/lib/domain/types";
import { T } from "@/lib/theme";

export function StatusBadge({ auction, now }: { auction: Auction; now: number }) {
  const status = auctionStatus(auction, now);
  if (status === "closed") return <Badge tone="muted">CLOSED</Badge>;
  if (status === "scheduled") return <Badge tone="special">STARTS IN 10 MIN</Badge>;
  if (status === "extended") return <Badge tone="special">EXTENDED</Badge>;
  return <Badge tone="live">● LIVE</Badge>;
}

export function AuctionCard({
  auction,
  now,
  onPress,
  subtitle,
  compact,
}: {
  auction: Auction;
  now: number;
  onPress: () => void;
  subtitle?: string;
  compact?: boolean;
}) {
  const { state } = useApp();
  const best = currentBestDeal(state.deals, auction.id);
  const bids = dealsOf(state.deals, auction.id).length;
  const remaining = auctionClosesAt(auction) - now;
  const closed = remaining <= 0;
  const buyer = state.accounts.find((a) => a.id === auction.userId);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.auctionCard, pressed && kitStyles.pressed]}>
      <View style={styles.rowTop}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{auction.productName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowInline}>
            <StatusBadge auction={auction} now={now} />
            <Badge tone="brand">{categoryName(auction.categoryId)}</Badge>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {auction.productName}
          </Text>
          <Text style={kitStyles.cardMeta} numberOfLines={1}>
            {subtitle ?? `${buyer?.name ?? "Buyer"} · budget ${money(auction.budget)}`}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={kitStyles.microLabel}>{closed ? "STATUS" : "CLOSES IN"}</Text>
          <View style={[styles.timer, closed && { backgroundColor: "#3F3F46" }]}>
            <Text style={[styles.timerText, closed && { color: "#FCA5A5" }]}>
              {closed ? "CLOSED" : compactCountdown(remaining)}
            </Text>
          </View>
        </View>
      </View>

      {!compact ? (
        <View style={styles.auctionBottom}>
          <View>
            <Text style={kitStyles.microLabel}>BEST OFFER</Text>
            <Text style={kitStyles.money}>{best ? money(best.amount) : "No offers yet"}</Text>
          </View>
          <View>
            <Text style={kitStyles.microLabel}>DEALS</Text>
            <Text style={kitStyles.money}>{bids}</Text>
          </View>
          <View>
            <Text style={kitStyles.microLabel}>DAYS OPEN</Text>
            <Text style={kitStyles.money}>{auction.durationDays}d</Text>
          </View>
          <Text style={kitStyles.link}>{closed ? "View ›" : "Open chat ›"}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function DealRow({
  deal,
  dealerName,
  now,
  isBest,
  onPress,
  actionLabel,
  onAction,
}: {
  deal: Deal;
  dealerName: string;
  now: number;
  isBest?: boolean;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.dealCard, isBest && styles.dealCardBest]}>
      <View style={styles.rowBetween}>
        <View style={kitStyles.row}>
          <Avatar initials={initialsOf(dealerName)} color={avatarColor(deal.dealerId)} size={38} />
          <View>
            <View style={kitStyles.row}>
              <Text style={kitStyles.cardTitle}>{dealerName}</Text>
              {isBest ? <Badge tone="verified">★ LOWEST</Badge> : null}
            </View>
            <Text style={kitStyles.cardMeta}>{relativeTime(deal.createdAt, now)}</Text>
          </View>
        </View>
        <Text style={styles.dealAmount}>{money(deal.amount)}</Text>
      </View>

      {deal.freebies || deal.specialMentions ? (
        <View style={styles.offerFooter}>
          {deal.freebies ? <Text style={styles.perk}>★ {deal.freebies}</Text> : <View />}
          {deal.specialMentions ? (
            <Text style={styles.mention} numberOfLines={2}>
              {deal.specialMentions}
            </Text>
          ) : null}
        </View>
      ) : null}

      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.dealAction}>
          <Text style={styles.dealActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function ProductCard({
  product,
  now,
  onPress,
  width = 168,
}: {
  product: Product;
  now: number;
  onPress?: () => void;
  width?: number | `${number}%`;
}) {
  const { getDealer } = useApp();
  const dealer = getDealer(product.dealerId);
  const image = resolveProductImage(product.image);
  const days = product.specialDealEndsAt
    ? Math.max(0, Math.ceil((product.specialDealEndsAt - now) / (24 * 60 * 60 * 1000)))
    : 0;
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.productCard, { width }, pressed && kitStyles.pressed]}
    >
      <View style={styles.productImageWrap}>
        {image ? <Image source={image} style={styles.productImage} /> : null}
        <View style={styles.productBadges}>
          {product.isSpecialDeal ? <Badge tone="special">SPECIAL DEAL</Badge> : null}
          {discount > 0 ? <Badge tone="live">-{discount}%</Badge> : null}
        </View>
      </View>
      <View style={{ paddingHorizontal: 10 }}>
        <Text style={kitStyles.cardTitle} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={kitStyles.cardMeta} numberOfLines={1}>
          {dealer?.storeName ?? "Dealer"} · {product.subCategory}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          {product.originalPrice ? <Text style={styles.oldPrice}>{money(product.originalPrice)}</Text> : null}
        </View>
        {product.isSpecialDeal ? (
          <Text style={styles.daysLeft}>
            {days > 0 ? `${days} day${days > 1 ? "s" : ""} left` : "Ends today"}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function MessageBubble({
  message,
  mine,
  onOpenDeal,
}: {
  message: ChatMessage;
  mine: boolean;
  onOpenDeal?: () => void;
}) {
  const { getDealer, state } = useApp();

  if (message.kind === "system") {
    return (
      <View style={styles.systemBubble}>
        <Text style={styles.systemText}>{message.body}</Text>
        <Text style={styles.systemTime}>{relativeTime(message.createdAt)}</Text>
      </View>
    );
  }

  if (message.kind === "deal") {
    const deal = state.deals.find((d) => d.id === message.dealId);
    const dealer = deal ? getDealer(deal.dealerId) : undefined;
    return (
      <Pressable onPress={onOpenDeal} style={[styles.dealBubble, mine && styles.dealBubbleMine]}>
        <View style={styles.rowBetween}>
          <Text style={styles.dealBubbleTitle}>
            {dealer?.storeName ?? message.senderName} · {money(deal?.amount)}
          </Text>
          <Badge tone="dark">REVERSE BID</Badge>
        </View>
        {deal?.freebies ? <Text style={styles.dealBubblePerk}>★ {deal.freebies}</Text> : null}
        {deal?.specialMentions ? <Text style={styles.dealBubbleNote}>{deal.specialMentions}</Text> : null}
        <Text style={styles.systemTime}>{relativeTime(message.createdAt)}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.bubbleRow, mine && { justifyContent: "flex-end" }]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {!mine ? <Text style={styles.bubbleSender}>{message.senderName}</Text> : null}
        <Text style={[styles.bubbleText, mine && { color: "#FFFFFF" }]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, mine && { color: "rgba(255,255,255,0.75)" }]}>
          {relativeTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export function ProductPickerRow({
  product,
  now,
  selected,
  onPress,
}: {
  product: Product;
  now: number;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pickerRow, selected && styles.pickerRowActive]}>
      <Avatar initials={initialsOf(product.name)} color={avatarColor(product.id)} size={36} />
      <View style={{ flex: 1 }}>
        <Text style={kitStyles.cardTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={kitStyles.cardMeta}>
          {product.subCategory} · {money(product.price)}
          {product.isSpecialDeal ? ` · special deal` : ""}
        </Text>
      </View>
      {selected ? <Text style={styles.pickerCheck}>✓</Text> : null}
    </Pressable>
  );
}

export function BlockCard({
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card style={styles.blockCard}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.blockTitle}>{title}</Text>
          {subtitle ? <Text style={kitStyles.cardMeta}>{subtitle}</Text> : null}
        </View>
        {action ? (
          <Pressable onPress={onAction}>
            <Text style={kitStyles.link}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ marginTop: 10 }}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowInline: { flexDirection: "row", gap: 6, marginBottom: 4, flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: T.brandTint,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: T.brand, fontSize: 20, fontWeight: "800" },
  title: { color: T.text, fontSize: 14, fontWeight: "700", marginBottom: 2 },

  auctionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    marginBottom: 10,
  },
  auctionBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F4F4F4",
    marginTop: 12,
    paddingTop: 10,
    gap: 6,
  },
  timer: { backgroundColor: T.dark, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, marginTop: 3 },
  timerText: { color: T.success, fontSize: 11, fontWeight: "800" },

  dealCard: {
    backgroundColor: "#FFF9EA",
    borderWidth: 1,
    borderColor: T.specialBorder,
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
  },
  dealCardBest: { borderColor: T.success, backgroundColor: "#F6FEFB" },
  dealAmount: { color: T.special, fontSize: 16, fontWeight: "800" },
  offerFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    marginTop: 10,
    paddingTop: 8,
    gap: 4,
  },
  perk: { color: T.successText, fontSize: 11, fontWeight: "700" },
  mention: { color: T.textMuted, fontSize: 11 },
  dealAction: { marginTop: 10, alignItems: "flex-end" },
  dealActionText: { color: T.brand, fontWeight: "800", fontSize: 12 },

  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
    paddingBottom: 12,
  },
  productImageWrap: { height: 116, backgroundColor: T.bg, alignItems: "center", justifyContent: "center" },
  productImage: { width: "100%", height: "100%", resizeMode: "contain" },
  productBadges: { position: "absolute", top: 4, left: 4, gap: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  price: { fontSize: 15, fontWeight: "800", color: T.text },
  oldPrice: { color: T.textFaint, textDecorationLine: "line-through", fontSize: 11 },
  daysLeft: { color: T.special, fontSize: 11, fontWeight: "700", marginTop: 4 },

  bubbleRow: { flexDirection: "row", marginBottom: 10 },
  bubble: { maxWidth: "84%", borderRadius: 16, padding: 11 },
  bubbleMine: { backgroundColor: T.brand, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: T.border, borderBottomLeftRadius: 4 },
  bubbleSender: { fontSize: 10, fontWeight: "800", color: T.brand, marginBottom: 3 },
  bubbleText: { fontSize: 13, color: T.text, lineHeight: 19 },
  bubbleTime: { fontSize: 9, color: T.textFaint, marginTop: 5, textAlign: "right" },

  systemBubble: {
    backgroundColor: T.brandTint,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  systemText: { color: T.brandDark, fontSize: 11, textAlign: "center", lineHeight: 16, fontWeight: "600" },
  systemTime: { color: T.textFaint, fontSize: 9, marginTop: 4 },

  dealBubble: {
    backgroundColor: "#FFF9EA",
    borderWidth: 1,
    borderColor: T.specialBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  dealBubbleMine: { borderColor: T.brand },
  dealBubbleTitle: { color: T.special, fontSize: 13, fontWeight: "800", flexShrink: 1 },
  dealBubblePerk: { color: T.successText, fontSize: 11, fontWeight: "700", marginTop: 6 },
  dealBubbleNote: { color: T.textMuted, fontSize: 11, marginTop: 4 },

  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  pickerRowActive: { borderColor: T.brand, backgroundColor: T.brandTint },
  pickerCheck: { color: T.brand, fontSize: 16, fontWeight: "800" },

  blockCard: { marginBottom: 12 },
  blockTitle: { color: T.text, fontSize: 15, fontWeight: "800" },
});
