import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { OutlineButton, PrimaryButton } from "@/components/ui/kit";
import { resetAllData } from "@/lib/demo";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

const DEMO_ACCOUNTS: { role: string; detail: string; username: string; password: string; href: Href }[] = [
  { role: "Buyer", detail: "Arun Prakash · posts auctions", username: "arun.prakash@email.com", password: "buyer@123", href: "/auth/buyer-login" },
  { role: "Dealer", detail: "TechHub Chennai · Electronics", username: "techhub", password: "dealer123", href: "/auth/dealer-login" },
  { role: "Dealer", detail: "Senthil Motors · Vehicles", username: "senthilmotors", password: "dealer123", href: "/auth/dealer-login" },
  { role: "Super Admin", detail: "Approves dealers & categories", username: "superadmin", password: "admin@123", href: "/auth/dealer-login" },
];

export default function SplashScreen() {
  const router = useRouter();
  const { resetDemoData } = useApp();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F8FAFA]">
      <ScrollView contentContainerStyle={styles.wrap}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>⌁</Text>
        </View>
        <Text style={styles.title}>BidVerse</Text>
        <Text style={styles.subtitle}>Reverse Auctions. Better Deals.</Text>

        <View style={styles.actions}>
          <PrimaryButton
            label="Login as User"
            icon="♙"
            onPress={() => router.push("/auth/buyer-login")}
            style={styles.action}
          />
          <OutlineButton
            label="Login as Dealer"
            onPress={() => router.push("/auth/dealer-login")}
            style={styles.action}
          />
          <Pressable onPress={() => router.push("/auth/register")} style={styles.socialButton}>
            <Text style={styles.socialButtonText}>Create Account</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/auth/dealer-register")} style={styles.socialButton}>
            <Text style={styles.socialButtonText}>Register your Store</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setShowDemo(true)} style={styles.demoLink}>
          <Text style={styles.demoLinkText}>Demo accounts & reset data</Text>
        </Pressable>

        <Text style={styles.footnote}>
          Customers post what they need, nearby verified stores compete in a live reverse auction.
        </Text>
      </ScrollView>

      <Modal visible={showDemo} transparent animationType="fade" onRequestClose={() => setShowDemo(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowDemo(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Demo accounts</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {DEMO_ACCOUNTS.map((account) => (
                <Pressable
                  key={`${account.role}-${account.username}`}
                  style={styles.accountRow}
                  onPress={() => {
                    setShowDemo(false);
                    router.push(account.href);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.accountRole}>{account.role}</Text>
                    <Text style={styles.accountDetail}>{account.detail}</Text>
                    <Text style={styles.accountCreds}>
                      {account.username} · {account.password}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </ScrollView>
            <PrimaryButton
              label="Reset demo data"
              onPress={() => {
                resetAllData(resetDemoData);
                setShowDemo(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: T.bg,
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 22,
    backgroundColor: T.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoText: { color: "#FFFFFF", fontSize: 54, fontWeight: "800", marginTop: -6 },
  title: { fontSize: 32, fontWeight: "800", color: T.text, letterSpacing: -0.6 },
  subtitle: { color: T.textMuted, fontSize: 14, marginTop: 6, marginBottom: 34 },
  actions: { width: "100%", maxWidth: 320, gap: 2 },
  action: { marginTop: 12, alignSelf: "stretch" },
  socialButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: T.border,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  socialButtonText: { color: T.text, fontSize: 15, fontWeight: "700" },
  demoLink: { marginTop: 26, paddingVertical: 8 },
  demoLinkText: { color: T.brand, fontWeight: "700", fontSize: 13, textDecorationLine: "underline" },
  footnote: {
    color: T.textFaint,
    fontSize: 11,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 17,
    maxWidth: 300,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(16,24,32,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDE1E1",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: T.text, marginBottom: 10 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F5",
  },
  accountRole: { fontSize: 13, fontWeight: "800", color: T.text },
  accountDetail: { fontSize: 11, color: T.textMuted, marginTop: 2 },
  accountCreds: { fontSize: 11, color: T.brand, marginTop: 3, fontWeight: "600" },
  chevron: { color: T.textFaint, fontSize: 20 },
});
