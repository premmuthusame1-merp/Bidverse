import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader } from "@/components/app-shell";
import {
  Badge,
  Card,
  EmptyState,
  Field,
  InfoCard,
  KeyValue,
  PrimaryButton,
  Segmented,
  kitStyles,
} from "@/components/ui/kit";
import { notify } from "@/components/ui/action-sheet";
import { useNow } from "@/hooks/use-now";
import { CATEGORIES, categoryName } from "@/lib/domain/seed";
import { dateOnly, money, relativeTime } from "@/lib/format";
import { auctionStatus, useApp } from "@/lib/store";
import { T } from "@/lib/theme";

type Tab = "pending" | "approved" | "rejected";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { state, account, logout, approveDealer, rejectDealer } = useApp();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("pending");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [lastApproval, setLastApproval] = useState<string | null>(null);

  const dealers = useMemo(
    () => state.dealers.filter((d) => d.status === tab).sort((a, b) => b.submittedAt - a.submittedAt),
    [state.dealers, tab],
  );

  if (!account || account.role !== "admin") {
    return (
      <AppShell role="admin" active="dealers">
        <BrandHeader title="Super Admin" />
        <EmptyState
          title="Super admin sign-in required"
          body="Use superadmin / admin@123 on the dealer login screen."
          action="Go to login"
          onAction={() => router.replace("/auth/dealer-login")}
        />
      </AppShell>
    );
  }

  const pendingCount = state.dealers.filter((d) => d.status === "pending").length;
  const pendingRequests = state.categoryRequests.filter((r) => r.status === "pending").length;
  const liveAuctions = state.auctions.filter((a) => auctionStatus(a, now) !== "closed").length;
  const gmv = state.deals.reduce((total, deal) => total + deal.amount, 0);

  return (
    <AppShell role="admin" active="dealers">
      <BrandHeader title="Super Admin" right={<Badge tone="verified">● ONLINE</Badge>} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>PLATFORM OVERVIEW</Text>
          <Text style={styles.heroTitle}>Dealer verification desk</Text>
          <View style={styles.stats}>
            <Stat value={String(pendingCount)} label="Pending" />
            <Stat value={String(state.dealers.filter((d) => d.status === "approved").length)} label="Approved" />
            <Stat value={String(liveAuctions)} label="Live auctions" />
            <Stat value={String(pendingRequests)} label="Cat. requests" />
          </View>
          <Text style={styles.heroFoot}>Total value of offers: {money(gmv)}</Text>
        </View>

        {lastApproval ? <InfoCard tone="success" icon="✉" title="Approval e-mail sent" body={lastApproval} /> : null}

        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "pending", label: "Pending", count: pendingCount },
            { value: "approved", label: "Approved", count: state.dealers.filter((d) => d.status === "approved").length },
            { value: "rejected", label: "Rejected", count: state.dealers.filter((d) => d.status === "rejected").length },
          ]}
          style={{ marginHorizontal: 0 }}
        />

        {dealers.length === 0 ? (
          <Card>
            <EmptyState
              icon="▥"
              title={tab === "pending" ? "No dealers awaiting verification" : `No ${tab} dealers`}
              body={tab === "pending" ? "New registrations will appear here with their documents." : undefined}
            />
          </Card>
        ) : null}

        {dealers.map((dealer) => (
          <Card key={dealer.id}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={kitStyles.cardTitle}>{dealer.storeName}</Text>
                <Text style={kitStyles.cardMeta}>
                  {dealer.fullName} · @{dealer.recommendedUsername} · {dealer.city}
                </Text>
              </View>
              <Badge
                tone={dealer.status === "approved" ? "verified" : dealer.status === "pending" ? "special" : "live"}
              >
                {dealer.status.toUpperCase()}
              </Badge>
            </View>

            <View style={{ marginTop: 10 }}>
              <KeyValue label="E-mail" value={dealer.email} />
              <KeyValue label="Phone" value={dealer.phone} />
              <KeyValue label="PAN card" value={dealer.panCardNumber} />
              <KeyValue label="Aadhaar card" value={dealer.aadharCardNumber} />
              <KeyValue label="GST number" value={dealer.gstNumber || "Not provided"} />
              <KeyValue
                label="Authorised store certificate"
                value={dealer.hasAuthorizedStoreCertificate ? "Yes — attached" : "Not applicable"}
              />
              <KeyValue label="Store image" value={dealer.storeImageName ?? "Not attached"} />
              <KeyValue label="Address" value={`${dealer.address}, ${dealer.city} ${dealer.pincode}`} />
              <KeyValue
                label="Categories requested"
                value={dealer.categoryIds.map(categoryName).join(", ") || "—"}
              />
              <KeyValue label="Submitted" value={`${dateOnly(dealer.submittedAt)} (${relativeTime(dealer.submittedAt, now)})`} />
              {dealer.reviewedAt ? <KeyValue label="Reviewed" value={dateOnly(dealer.reviewedAt)} /> : null}
              {dealer.rejectionReason ? <KeyValue label="Reason" value={dealer.rejectionReason} /> : null}
            </View>

            <View style={styles.docRow}>
              {["PAN card.pdf", "Aadhaar.pdf", "GST.pdf", dealer.storeImageName ?? "store.jpg"].map((doc) => (
                <Pressable
                  key={doc}
                  onPress={() => notify(doc, "Document preview is available in the mobile build.")}
                  style={styles.docChip}
                >
                  <Text style={styles.docChipText}>{doc}</Text>
                </Pressable>
              ))}
            </View>

            {dealer.status === "pending" ? (
              <View style={styles.actionRow}>
                <PrimaryButton
                  label="Approve & issue login"
                  onPress={() => {
                    const result = approveDealer(dealer.id);
                    if (!result.ok) {
                      notify("Approval failed", result.error);
                      return;
                    }
                    setLastApproval(
                      `${dealer.email} received the username @${dealer.recommendedUsername} with a temporary password.`,
                    );
                  }}
                  style={{ flex: 1, marginTop: 0 }}
                />
                <View style={{ width: 10 }} />
                <PrimaryButton
                  label="Reject"
                  onPress={() => {
                    setRejecting(dealer.id);
                    setReason("");
                  }}
                  style={{ width: 110, marginTop: 0, backgroundColor: T.danger }}
                />
              </View>
            ) : null}

            {dealer.status === "approved" ? (
              <InfoCard
                tone="success"
                title="Login issued"
                body={`Username @${dealer.recommendedUsername} — the dealer must set a new password on first login.`}
              />
            ) : null}
          </Card>
        ))}

        <Card>
          <Text style={styles.blockTitle}>Platform snapshot</Text>
          <KeyValue label="Categories" value={String(CATEGORIES.length)} />
          <KeyValue label="Products listed" value={String(state.products.length)} />
          <KeyValue label="Auctions created" value={String(state.auctions.length)} />
          <KeyValue label="Deals posted" value={String(state.deals.length)} />
          <KeyValue label="E-mails sent" value={String(state.mail.length)} />
          <PrimaryButton label="Open sandbox mailbox" onPress={() => router.push("/admin/mailbox")} />
        </Card>

        <Pressable
          onPress={() => {
            logout();
            router.replace("/");
          }}
          style={styles.logout}
        >
          <Text style={styles.logoutText}>↪  Sign out of admin</Text>
        </Pressable>
        <Text style={styles.version}>Super admin console · BidVerse v2.0</Text>
      </ScrollView>

      <Modal visible={Boolean(rejecting)} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setRejecting(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Reject registration</Text>
            <Field
              label="REASON"
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. GST certificate could not be verified"
              multiline
            />
            <PrimaryButton
              label="Send rejection e-mail"
              onPress={() => {
                if (!rejecting) return;
                const result = rejectDealer(rejecting, reason);
                if (!result.ok) notify("Failed", result.error);
                setRejecting(null);
              }}
            />
            <Pressable onPress={() => setRejecting(null)} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AppShell>
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
  hero: { backgroundColor: T.dark, borderRadius: 18, padding: 16, marginBottom: 14 },
  heroKicker: { color: "#9BA4AE", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  heroTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: 6 },
  heroFoot: { color: "#9BA4AE", fontSize: 11, marginTop: 12 },
  stats: { flexDirection: "row", gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 10, alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  statLabel: { color: "#9BA4AE", fontSize: 9, marginTop: 2, textAlign: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  docRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  docChip: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docChipText: { fontSize: 11, color: T.textMuted },
  actionRow: { flexDirection: "row", marginTop: 14 },
  blockTitle: { fontSize: 14, fontWeight: "800", color: T.text, marginBottom: 8 },
  logout: { backgroundColor: T.danger, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  logoutText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  version: { color: T.textFaint, textAlign: "center", fontSize: 10, marginTop: 18 },
  backdrop: { flex: 1, backgroundColor: "rgba(16,24,32,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 28 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: T.text, marginBottom: 12 },
  cancel: { marginTop: 12, alignItems: "center" },
  cancelText: { color: T.textMuted, fontWeight: "700", fontSize: 13 },
});
