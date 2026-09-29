import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthHeader, AuthShell, FormBlock } from "@/components/auth-shell";
import { Field, InfoCard, PrimaryButton } from "@/components/ui/kit";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

/**
 * Shown when a dealer signs in for the first time with the temporary password
 * e-mailed by the super admin. They must set their own password to continue.
 */
export default function TempPasswordScreen() {
  const router = useRouter();
  const { account, changeTempPassword, logout } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const result = changeTempPassword(current, next);
    if (!result.ok) {
      setError(result.error ?? "Unable to update the password.");
      return;
    }
    router.replace("/dealer/home");
  };

  return (
    <AuthShell back={false} centered compact>
      <AuthHeader
        title="Set a new password"
        subtitle={`Welcome ${account?.name ?? "dealer"}! Replace the temporary password we e-mailed you.`}
        logoText="🔑"
      />
      <FormBlock>
        <InfoCard
          icon="✉"
          title="Temporary password e-mail"
          body="Use the password from the approval e-mail as your current password. You can review it any time in the mailbox."
        />
        <Field label="TEMPORARY PASSWORD" value={current} onChangeText={setCurrent} placeholder="From the e-mail" secure />
        <Field label="NEW PASSWORD" value={next} onChangeText={setNext} placeholder="Minimum 6 characters" secure />
        <Field label="CONFIRM NEW PASSWORD" value={confirm} onChangeText={setConfirm} placeholder="Re-enter password" secure />
        {error ? <InfoCard tone="danger" title={error} /> : null}
        <PrimaryButton label="Save & Continue" onPress={submit} />
        <Pressable
          onPress={() => {
            logout();
            router.replace("/auth/dealer-login");
          }}
          style={styles.center}
        >
          <Text style={styles.link}>Sign out</Text>
        </Pressable>
      </FormBlock>
      <Pressable onPress={() => router.push("/mailbox")} style={styles.center}>
        <Text style={styles.link}>Open mailbox to read the approval e-mail ›</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  center: { marginTop: 16, alignItems: "center" },
  link: { color: T.brand, fontWeight: "800", fontSize: 13, textDecorationLine: "underline" },
});
