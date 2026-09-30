import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader } from "@/components/app-shell";
import { Badge, Card, EmptyState, InfoCard, PrimaryButton, kitStyles } from "@/components/ui/kit";
import { categoryName } from "@/lib/domain/seed";
import { dateOnly, relativeTime } from "@/lib/format";
import { notify } from "@/components/ui/action-sheet";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

export default function AdminCategoryRequestsScreen() {
  const router = useRouter();
  const { state, account, reviewCategoryRequest, getDealer } = useApp();

  if (!account || account.role !== "admin") {
    return (
      <AppShell role="admin" active="requests">
        <BrandHeader title="Category Requests" />
        <EmptyState
          title="Super admin sign-in required"
          action="Go to login"
          onAction={() => router.replace("/auth/dealer-login")}
        />
      </AppShell>
    );
  }

  const pending = state.categoryRequests.filter((r) => r.status === "pending");
  const reviewed = state.categoryRequests.filter((r) => r.status !== "pending");

  return (
    <AppShell role="admin" active="requests">
      <BrandHeader title="Category Requests" right={<Badge tone="special">{pending.length} pending</Badge>} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <InfoCard
          title="Dealers can only bid inside approved categories"
          body="Approve a request to add the category to the dealer's profile immediately — they are notified in the app."
        />

        {pending.length === 0 ? (
          <Card>
            <EmptyState icon="◈" title="No pending requests" />
          </Card>
        ) : null}

        {pending.map((request) => {
          const dealer = getDealer(request.dealerId);
          return (
            <Card key={request.id}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={kitStyles.cardTitle}>{categoryName(request.categoryId)}</Text>
                  <Text style={kitStyles.cardMeta}>
                    {dealer?.storeName ?? "Dealer"} · @{dealer?.recommendedUsername} · {dealer?.city}
                  </Text>
                </View>
                <Badge tone="special">PENDING</Badge>
              </View>

              <Text style={[kitStyles.cardMeta, { marginTop: 10 }]}>
                Reason: {request.reason || "Not specified"}
              </Text>
              <Text style={kitStyles.cardMeta}>
                Raised {dateOnly(request.requestedAt)} ({relativeTime(request.requestedAt)})
              </Text>
              <Text style={kitStyles.cardMeta}>
                Currently approved: {dealer?.categoryIds.map(categoryName).join(", ") || "—"}
              </Text>

              <View style={styles.actionRow}>
                <PrimaryButton
                  label="Approve"
                  onPress={() => {
                    const result = reviewCategoryRequest(request.id, true);
                    if (!result.ok) notify("Failed", result.error);
                  }}
                  style={{ flex: 1, marginTop: 0 }}
                />
                <View style={{ width: 10 }} />
                <PrimaryButton
                  label="Decline"
                  onPress={() => {
                    const result = reviewCategoryRequest(request.id, false);
                    if (!result.ok) notify("Failed", result.error);
                  }}
                  style={{ flex: 1, marginTop: 0, backgroundColor: T.danger }}
                />
              </View>
            </Card>
          );
        })}

        <Text style={styles.sectionLabel}>Reviewed</Text>
        {reviewed.length === 0 ? (
          <Card>
            <EmptyState icon="✓" title="Nothing reviewed yet" />
          </Card>
        ) : null}
        {reviewed.map((request) => (
          <Card key={request.id}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={kitStyles.cardTitle}>{categoryName(request.categoryId)}</Text>
                <Text style={kitStyles.cardMeta}>
                  {getDealer(request.dealerId)?.storeName} · reviewed {request.reviewedAt ? dateOnly(request.reviewedAt) : "—"}
                </Text>
              </View>
              <Badge tone={request.status === "approved" ? "verified" : "live"}>{request.status.toUpperCase()}</Badge>
            </View>
          </Card>
        ))}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  actionRow: { flexDirection: "row", marginTop: 14 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: T.text, marginTop: 18, marginBottom: 8 },
});
