import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import { AuctionCard } from "@/components/domain/cards";
import { Avatar, Badge, Card, EmptyState, avatarColor, initialsOf, kitStyles } from "@/components/ui/kit";
import { useNow } from "@/hooks/use-now";
import { resetAllData } from "@/lib/demo";
import { dateOnly, money } from "@/lib/format";
import { auctionStatus, auctionsForBuyer, useApp } from "@/lib/store";
import { T } from "@/lib/theme";

export default function BuyerProfileScreen() {
  const router = useRouter();
  const { account, state, logout, resetDemoData, mailsFor } = useApp();
  const now = useNow();

  const auctions = useMemo(
    () => (account ? auctionsForBuyer(state, account.id, now) : []),
    [account, state, now],
  );

  if (!account) {
    return (
      <AppShell role="user" active="profile">
        <BrandHeader title="Profile" />
        <EmptyState title="Not signed in" action="Sign in" onAction={() => router.replace("/auth/buyer-login")} />
      </AppShell>
    );
  }

  const closed = auctions.filter((a) => auctionStatus(a, now) === "closed");
  const saved = auctions.reduce((total, auction) => {
    const winner = auction.winningDealId ? state.deals.find((d) => d.id === auction.winningDealId) : undefined;
    return total + (winner ? Math.max(0, auction.budget - winner.amount) : 0);
  }, 0);
  const mails = mailsFor(account.email);

  return (
    <AppShell role="user" active="profile">
      <BrandHeader title="Profile" right={<NotificationBell />} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.row}>
            <Avatar initials={initialsOf(account.name)} color="#D6F5F3" size={58} />
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.name}>{account.name}</Text>
                <Badge tone="verified">✓ Verified</Badge>
              </View>
              <Text style={styles.meta}>{account.email}</Text>
              {account.phone ? <Text style={styles.meta}>{account.phone}</Text> : null}
            </View>
          </View>
          <View style={styles.stats}>
            <Stat value={String(auctions.length)} label="Auctions" />
            <Stat value={String(closed.length)} label="Completed" />
            <Stat value={money(saved).replace("₹", "₹")} label="Saved" />
          </View>
        </View>

        {[
          { icon: "♜", title: "My Auctions", sub: "Live and previous auctions", to: "/user/auctions" },
          { icon: "★", title: "Special Deals", sub: "Deals with days-left counters", to: "/user/special-deals" },
          { icon: "＋", title: "Start an auction", sub: "Post a new requirement", to: "/user/new-auction" },
          { icon: "✉", title: "Mailbox", sub: "E-mails we sent you", to: "/mailbox" },
          { icon: "◔", title: "Notifications", sub: "Deal alerts and updates", to: "/notifications" },
        ].map((item) => (
          <Pressable
            key={item.title}
            onPress={() => router.push(item.to as never)}
            style={({ pressed }) => [styles.menuItem, pressed && kitStyles.pressed]}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={kitStyles.cardTitle}>{item.title}</Text>
              <Text style={kitStyles.cardMeta}>{item.sub}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}

        <Card>
          <Text style={styles.blockTitle}>Recent auctions</Text>
          {auctions.length === 0 ? (
            <Text style={kitStyles.cardMeta}>No auctions yet.</Text>
          ) : (
            auctions.slice(0, 3).map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                now={now}
                compact
                onPress={() => router.push(`/user/auction/${auction.id}`)}
              />
            ))
          )}
        </Card>

        {(mails.length > 0 || account) ? (
          <Card>
            <Text style={styles.blockTitle}>Account</Text>
            <Row label="Member since" value={dateOnly(account.createdAt)} />
            <Row label="E-mails received" value={String(mails.length)} />
            <Row label="Role" value="Buyer" />
          </Card>
        ) : null}

        <Pressable onPress={() => router.push("/auth/dealer-login")} style={styles.switchRow}>
          <Text style={styles.switchText}>Switch to dealer view ›</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            logout();
            router.replace("/");
          }}
          style={styles.logout}
        >
          <Text style={styles.logoutText}>↪  Logout</Text>
        </Pressable>

        <Pressable onPress={() => resetAllData(resetDemoData)} style={styles.reset}>
          <Text style={styles.resetText}>Reset demo data</Text>
        </Pressable>

        <Text style={styles.version}>BidVerse v2.0 · Made in India 🇮🇳</Text>
      </ScrollView>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={kitStyles.cardMeta}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  hero: { backgroundColor: T.brand, borderRadius: 18, padding: 18, marginBottom: 14 },
  name: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  meta: { color: "#D6F5F3", fontSize: 11, marginTop: 3 },
  stats: { flexDirection: "row", gap: 8, marginTop: 16 },
  stat: { flex: 1, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 12, padding: 10, alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  statLabel: { color: "#D6F5F3", fontSize: 10, marginTop: 2 },
  menuItem: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 9,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: T.brandTint,
    color: T.brand,
    textAlign: "center",
    lineHeight: 36,
    fontSize: 18,
    overflow: "hidden",
  },
  chevron: { color: T.textFaint, fontSize: 22 },
  blockTitle: { fontSize: 14, fontWeight: "800", color: T.text, marginBottom: 8 },
  kvRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  kvValue: { color: T.text, fontSize: 12, fontWeight: "700" },
  switchRow: { alignItems: "center", marginTop: 16 },
  switchText: { color: T.brand, fontWeight: "700", fontSize: 13 },
  logout: { backgroundColor: T.danger, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  logoutText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  reset: { alignItems: "center", marginTop: 14 },
  resetText: { color: T.textMuted, fontSize: 12, textDecorationLine: "underline" },
  version: { color: T.textFaint, textAlign: "center", fontSize: 10, marginTop: 18 },
});
