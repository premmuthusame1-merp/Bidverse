import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthHeader, AuthShell, FooterNote, FormBlock } from "@/components/auth-shell";
import { Field, InfoCard, PrimaryButton } from "@/components/ui/kit";
import { notify } from "@/lib/demo";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

export default function BuyerLoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    const result = login(email, password, "user");
    if (!result.ok) {
      setError(result.error ?? "Unable to sign in.");
      return;
    }
    router.replace("/user/home");
  };

  return (
    <AuthShell centered back>
      <AuthHeader title="Welcome Back" subtitle="Sign in to post requirements and watch dealers compete" />

      <FormBlock>
        <Field
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field
          label="PASSWORD"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secure
          autoCapitalize="none"
        />

        {error ? <InfoCard tone="danger" title={error} /> : null}

        <View style={styles.remember}>
          <Pressable onPress={() => setRemember((r) => !r)} style={styles.checkRow}>
            <View style={[styles.checkbox, remember && styles.checkboxOn]}>
              {remember ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/auth/forgot-password?role=user")}>
            <Text style={styles.link}>Forgot Password?</Text>
          </Pressable>
        </View>

        <PrimaryButton label="Sign In" onPress={submit} />
      </FormBlock>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.line} />
      </View>

      {[
        { icon: "G", label: "Continue with Google", color: "#4285F4" },
        { icon: "●", label: "Continue with Apple", color: T.text },
        { icon: "f", label: "Continue with Facebook", color: "#1877F2" },
      ].map((item) => (
        <Pressable
          key={item.label}
          onPress={() => notify(item.label, "Social sign-in is not enabled in this build.")}
          style={styles.social}
        >
          <Text style={[styles.socialIcon, { color: item.color }]}>{item.icon}</Text>
          <Text style={styles.socialText}>{item.label}</Text>
        </Pressable>
      ))}

      <FooterNote>
        Don&apos;t have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/auth/register")}>
          Register
        </Text>
      </FooterNote>
      <Pressable onPress={() => router.push("/auth/dealer-login")} style={styles.switchRow}>
        <Text style={styles.switchText}>Are you a store owner? Dealer login ›</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  remember: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 14 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#C9CFD2",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: T.brand, borderColor: T.brand },
  checkmark: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  rememberText: { color: T.text, fontSize: 13 },
  link: { color: "#188B8D", fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
  divider: { flexDirection: "row", alignItems: "center", gap: 14, marginVertical: 26 },
  line: { flex: 1, height: 1, backgroundColor: "#DDE1E1" },
  dividerText: { color: T.textFaint, fontSize: 13 },
  social: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginBottom: 12,
  },
  socialIcon: { fontSize: 22, fontWeight: "800" },
  socialText: { color: "#11181C", fontSize: 15, fontWeight: "700" },
  switchRow: { marginTop: 18, alignItems: "center" },
  switchText: { color: T.textMuted, fontSize: 12, fontWeight: "600" },
});
