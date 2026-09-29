import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthHeader, AuthShell, FooterNote, FormBlock } from "@/components/auth-shell";
import { Field, InfoCard, PrimaryButton } from "@/components/ui/kit";
import { SUPER_ADMIN_PASSWORD, SUPER_ADMIN_USERNAME } from "@/lib/domain/seed";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

export default function DealerLoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    const asDealer = login(username, password, "dealer");
    if (asDealer.ok) {
      if (asDealer.mustResetPassword) {
        router.replace("/auth/temp-password");
      } else {
        router.replace("/dealer/home");
      }
      return;
    }

    // The super admin signs in through the same form.
    const asAdmin = login(username, password, "admin");
    if (asAdmin.ok) {
      router.replace("/admin/dashboard");
      return;
    }

    setError(asDealer.error ?? "Unable to sign in.");
  };

  return (
    <AuthShell centered back>
      <AuthHeader
        title="Dealer Login"
        subtitle="Sign in with the username and password issued by the super admin"
        logoText="DA"
      />

      <FormBlock>
        <Field
          label="USERNAME"
          value={username}
          onChangeText={setUsername}
          placeholder="Your dealer username"
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

        {error ? <InfoCard tone="warning" title={error} /> : null}

        <PrimaryButton label="Login" icon="🔐" onPress={submit} />

        <Pressable onPress={() => router.push("/auth/forgot-password?role=dealer")} style={styles.forgot}>
          <Text style={styles.link}>Forgot password / Reset password</Text>
        </Pressable>
      </FormBlock>

      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>Super admin login also works here</Text>
        <Text style={styles.demoText}>
          {SUPER_ADMIN_USERNAME} / {SUPER_ADMIN_PASSWORD}
        </Text>
        <Text style={styles.demoText}>Dealer demo: techhub / dealer123</Text>
      </View>

      <FooterNote>
        Not registered yet?{" "}
        <Text style={styles.link} onPress={() => router.push("/auth/dealer-register")}>
          Register Now
        </Text>
      </FooterNote>

      <Pressable onPress={() => router.push("/mailbox")} style={styles.forgot}>
        <Text style={styles.switchText}>View sandbox mailbox (dealer e-mails) ›</Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/")} style={styles.forgot}>
        <Text style={styles.switchText}>← Back to Welcome</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: { marginTop: 14, alignItems: "center" },
  link: { color: "#188B8D", fontSize: 13, fontWeight: "800", textDecorationLine: "underline" },
  switchText: { color: T.textMuted, fontSize: 12, fontWeight: "600" },
  demoCard: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: T.specialBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  demoTitle: { color: T.special, fontWeight: "800", fontSize: 12 },
  demoText: { color: T.special, fontSize: 12, marginTop: 4 },
});
