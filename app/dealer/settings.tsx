import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  Field,
  InfoCard,
  KeyValue,
  PrimaryButton,
  kitStyles,
} from "@/components/ui/kit";
import { CATEGORIES, categoryName } from "@/lib/domain/seed";
import { resetAllData } from "@/lib/demo";
import { dateOnly, money } from "@/lib/format";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

export default function DealerSettingsScreen() {
  const router = useRouter();
  const { dealer, state, logout, requestCategory, updateProfile, mailsFor, resetDemoData } = useApp();
  const [reason, setReason] = useState("");
  const [requestedId, setRequestedId] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "danger">("success");
  const [storeName, setStoreName] = useState(dealer?.storeName ?? "");
  const [city, setCity] = useState(dealer?.city ?? "");
  const [savedProfile, setSavedProfile] = useState(false);

  if (!dealer) {
    return (
      <AppShell role="dealer" active="settings">
        <BrandHeader title="Settings" />
        <EmptyState title="Dealer profile missing" />
      </AppShell>
    );
  }

  const available = CATEGORIES.filter((c) => !dealer.categoryIds.includes(c.id));
  const myRequests = state.categoryRequests.filter((r) => r.dealerId === dealer.id);
  const mails = mailsFor(dealer.email);
  const myDeals = state.deals.filter((d) => d.dealerId === dealer.id);
  const won = myDeals.filter(
    (d) => state.auctions.find((a) => a.id === d.auctionId)?.winningDealId === d.id,
  ).length;

  const submitRequest = () => {
    if (!requestedId) {
      setFeedback("Select the category you want to add.");
      setFeedbackTone("danger");
      return;
    }
    const result = requestCategory(requestedId, reason);
    if (!result.ok) {
      setFeedback(result.error ?? "Unable to raise the request.");
      setFeedbackTone("danger");
      return;
    }
    setFeedback(`Request sent to the super admin for ${categoryName(requestedId)}.`);
    setFeedbackTone("success");
    setReason("");
    setRequestedId("");
  };

  return (
    <AppShell role="dealer" active="settings">
      <BrandHeader title="Dealer Settings" right={<NotificationBell />} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroKicker}>{dealer.fullName.toUpperCase()}</Text>
              <Text style={styles.heroTitle}>{dealer.storeName}</Text>
              <Text style={styles.heroBody}>
                @{dealer.recommendedUsername} · {dealer.city}, {dealer.state}
              </Text>
            </View>
            <Badge tone="verified">✓ VERIFIED DEALER</Badge>
          </View>
          <View style={styles.stats}>
            <Stat label="Offers" value={String(myDeals.length)} />
            <Stat label="Won" value={String(won)} />
            <Stat label="Products" value={String(state.products.filter((p) => p.dealerId === dealer.id).length)} />
          </View>
        </View>

        <Card>
          <Text style={styles.blockTitle}>Approved categories</Text>
          <Text style={kitStyles.cardMeta}>
            You can post products and bid only inside these categories.
          </Text>
          <View style={styles.chipWrap}>
            {dealer.categoryIds.length === 0 ? (
              <Text style={kitStyles.cardMeta}>No categories approved yet.</Text>
            ) : (
              dealer.categoryIds.map((id) => (
                <Chip key={id} label={`✓ ${categoryName(id)}`} selected onPress={() => {}} />
              ))
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.blockTitle}>Add a category (super admin approval)</Text>
          <Text style={kitStyles.cardMeta}>
            Request extra categories here. Once approved you can immediately post and bid in them.
          </Text>
          <View style={styles.chipWrap}>
            {available.map((category) => (
              <Chip
                key={category.id}
                label={`${category.icon} ${category.name}`}
                selected={requestedId === category.id}
                onPress={() => setRequestedId(category.id)}
              />
            ))}
            {available.length === 0 ? (
              <Text style={kitStyles.cardMeta}>You already cover every category on the platform.</Text>
            ) : null}
          </View>
          <Field
            label="REASON (OPTIONAL)"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. We are opening a camera counter this month"
            multiline
          />
          <PrimaryButton label="Send request to super admin" onPress={submitRequest} />
          {feedback ? (
            <InfoCard
              tone={feedbackTone === "success" ? "success" : "danger"}
              title={feedback}
            />
          ) : null}
        </Card>

        <Card>
          <Text style={styles.blockTitle}>My category requests</Text>
          {myRequests.length === 0 ? (
            <Text style={kitStyles.cardMeta}>No requests raised yet.</Text>
          ) : (
            myRequests.map((request) => (
              <View key={request.id} style={styles.requestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={kitStyles.cardTitle}>{categoryName(request.categoryId)}</Text>
                  <Text style={kitStyles.cardMeta}>
                    Raised {dateOnly(request.requestedAt)}
                    {request.reason ? ` · ${request.reason}` : ""}
                  </Text>
                </View>
                <Badge
                  tone={request.status === "approved" ? "verified" : request.status === "pending" ? "special" : "live"}
                >
                  {request.status.toUpperCase()}
                </Badge>
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text style={styles.blockTitle}>Store profile</Text>
          <Field label="STORE NAME" value={storeName} onChangeText={setStoreName} placeholder="Store name" />
          <Field label="CITY" value={city} onChangeText={setCity} placeholder="City" />
          <PrimaryButton
            label={savedProfile ? "Saved ✓" : "Save changes"}
            onPress={() => {
              updateProfile({ storeName, city });
              setSavedProfile(true);
              setTimeout(() => setSavedProfile(false), 1600);
            }}
          />
        </Card>

        <Card>
          <Text style={styles.blockTitle}>Registration & documents</Text>
          <KeyValue label="Dealer" value={dealer.fullName} />
          <KeyValue label="Login username" value={dealer.recommendedUsername} />
          <KeyValue label="E-mail" value={dealer.email} />
          <KeyValue label="Phone" value={dealer.phone} />
          <KeyValue label="PAN card" value={dealer.panCardNumber} />
          <KeyValue label="Aadhaar card" value={dealer.aadharCardNumber} />
          <KeyValue label="GST number" value={dealer.gstNumber || "—"} />
          <KeyValue
            label="Authorised store certificate"
            value={dealer.hasAuthorizedStoreCertificate ? dealer.authorizedStoreCertificateName ?? "Included" : "Not applicable"}
          />
          <KeyValue label="Store image" value={dealer.storeImageName ?? "—"} />
          <KeyValue label="Address" value={`${dealer.address}, ${dealer.city} ${dealer.pincode}`} />
          <KeyValue label="Submitted" value={dateOnly(dealer.submittedAt)} />
          <KeyValue label="Approved" value={dealer.reviewedAt ? dateOnly(dealer.reviewedAt) : "Pending"} />
        </Card>

        <Card>
          <Text style={styles.blockTitle}>E-mails sent to you</Text>
          {mails.length === 0 ? (
            <Text style={kitStyles.cardMeta}>No e-mails yet.</Text>
          ) : (
            mails.slice(0, 3).map((mail) => (
              <View key={mail.id} style={styles.requestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={kitStyles.cardTitle}>{mail.subject}</Text>
                  <Text style={kitStyles.cardMeta}>{mail.preview}</Text>
                </View>
                <Text style={styles.mailDate}>{dateOnly(mail.sentAt)}</Text>
              </View>
            ))
          )}
          <PrimaryButton label="Open sandbox mailbox" onPress={() => router.push({ pathname: "/mailbox", params: { email: dealer.email } })} />
        </Card>

        <Pressable onPress={() => router.push("/user/home")} style={styles.switchRow}>
          <Text style={styles.switchText}>Switch to buyer view ›</Text>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  hero: { backgroundColor: T.brand, borderRadius: 18, padding: 16, marginBottom: 12 },
  heroKicker: { color: "#BFEDEC", fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  heroTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", marginTop: 6 },
  heroBody: { color: "#D6F5F3", fontSize: 11, marginTop: 6 },
  stats: { flexDirection: "row", gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 12, padding: 10, alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  statLabel: { color: "#D6F5F3", fontSize: 10, marginTop: 2 },
  blockTitle: { fontSize: 14, fontWeight: "800", color: T.text, marginBottom: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F5",
  },
  mailDate: { color: T.textFaint, fontSize: 11 },
  switchRow: { alignItems: "center", marginTop: 16 },
  switchText: { color: T.brand, fontWeight: "700", fontSize: 13 },
  logout: { backgroundColor: T.danger, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  logoutText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  reset: { alignItems: "center", marginTop: 14 },
  resetText: { color: T.textMuted, fontSize: 12, textDecorationLine: "underline" },
  version: { color: T.textFaint, textAlign: "center", fontSize: 10, marginTop: 18 },
});
