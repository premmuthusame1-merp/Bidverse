import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { Badge, Card, EmptyState, PrimaryButton, TopBar, kitStyles } from "@/components/ui/kit";
import { useNow } from "@/hooks/use-now";
import { relativeTime } from "@/lib/format";
import { notificationsFor, useApp } from "@/lib/store";
import { T } from "@/lib/theme";
import type { NotificationType } from "@/lib/domain/types";

const TONE: Record<NotificationType, "brand" | "live" | "special" | "verified" | "muted"> = {
  auction_published: "brand",
  new_deal: "special",
  deal_updated: "special",
  auction_starting: "brand",
  auction_closing: "live",
  auction_closed: "muted",
  auction_extended: "special",
  dealer_registered: "brand",
  dealer_approved: "verified",
  dealer_rejected: "live",
  category_request: "brand",
  chat_message: "muted",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { account, state, markNotificationRead, markAllNotificationsRead } = useApp();
  const now = useNow(5000);

  const items = account ? notificationsFor(state, account.id) : [];

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F8FAFA]">
      <TopBar
        title="Notifications"
        onBack={() => router.back()}
        right={items.length ? <Text style={styles.markAll} onPress={markAllNotificationsRead}>Mark all read</Text> : undefined}
      />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Card>
            <EmptyState
              icon="◔"
              title="No notifications yet"
              body="You will be alerted when a matching auction is published, a dealer posts a deal or a category request is reviewed."
            />
          </Card>
        ) : null}

        {items.map((item) => (
          <Card
            key={item.id}
            onPress={() => {
              markNotificationRead(item.id);
              if (item.auctionId) {
                if (account?.role === "dealer") router.push(`/dealer/chat/${item.auctionId}`);
                else if (account?.role === "user") router.push(`/user/auction/${item.auctionId}`);
              }
            }}
            style={!item.read ? styles.unread : undefined}
          >
            <View style={styles.rowBetween}>
              <Badge tone={TONE[item.type]}>{item.type.replace(/_/g, " ").toUpperCase()}</Badge>
              {!item.read ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={kitStyles.cardMeta}>{item.body}</Text>
            <Text style={styles.date}>{relativeTime(item.createdAt, now)}</Text>
          </Card>
        ))}

        {account?.role === "dealer" ? (
          <PrimaryButton label="Back to dealer home" onPress={() => router.replace("/dealer/home")} />
        ) : account?.role === "admin" ? (
          <PrimaryButton label="Back to admin console" onPress={() => router.replace("/admin/dashboard")} />
        ) : account ? (
          <PrimaryButton label="Back to home" onPress={() => router.replace("/user/home")} />
        ) : (
          <PrimaryButton label="Sign in" onPress={() => router.replace("/")} />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "800", color: T.text, marginTop: 8 },
  date: { color: T.textFaint, fontSize: 10, marginTop: 8 },
  unread: { borderColor: T.brand, backgroundColor: "#FBFEFE" },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: T.live },
  markAll: { color: T.brand, fontWeight: "800", fontSize: 12 },
});
