import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell, FooterNote, FormBlock } from "@/components/auth-shell";
import { Chip, Field, InfoCard, PrimaryButton, Stepper, TopBar } from "@/components/ui/kit";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

const STEPS = ["Account", "Verify code", "New password"];

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { requestPasswordReset, resetPassword } = useApp();

  const [role, setRole] = useState<"dealer" | "user">(params.role === "user" ? "user" : "dealer");
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const sendCode = () => {
    setError(null);
    const result = requestPasswordReset(identifier, role);
    if (!result.ok) {
      setError(result.error ?? "Unable to send the code.");
      return;
    }
    setDemoCode(result.code ?? null);
    setStep(2);
  };

  const verify = () => {
    setError(null);
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit verification code sent to your e-mail.");
      return;
    }
    setStep(3);
  };

  const save = () => {
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const result = resetPassword(identifier, code, password);
    if (!result.ok) {
      setError(result.error ?? "Unable to reset the password.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell back={false} centered compact>
        <View style={styles.iconOk}>
          <Text style={styles.iconOkText}>✓</Text>
        </View>
        <Text style={styles.title}>Password updated</Text>
        <InfoCard
          tone="success"
          title="Use your new password to sign in"
          body="For security all other sessions were signed out."
        />
        <PrimaryButton label="Go to login" onPress={() => router.replace("/auth/dealer-login")} />
        <Pressable onPress={() => router.replace("/auth/buyer-login")} style={styles.centerLink}>
          <Text style={styles.link}>Buyer login ›</Text>
        </Pressable>
      </AuthShell>
    );
  }

  return (
    <AuthShell back={false}>
      <TopBar title="Reset Password" onBack={() => (step > 1 ? setStep(step - 1) : router.back())} subtitle={STEPS[step - 1]} />
      <View style={{ paddingHorizontal: 16 }}>
        <Stepper steps={STEPS} current={step} />
      </View>

      <FormBlock style={{ paddingHorizontal: 16 }}>
        {step === 1 ? (
          <>
            <InfoCard
              icon="✉"
              title="We will e-mail a verification code"
              body="Enter your registered e-mail or dealer username. The code is valid for 10 minutes."
            />
            <View style={styles.roleRow}>
              <Chip label="Dealer / Store" selected={role === "dealer"} onPress={() => setRole("dealer")} />
              <Chip label="Buyer" selected={role === "user"} onPress={() => setRole("user")} />
            </View>
            <Field
              label={role === "dealer" ? "DEALER USERNAME OR E-MAIL" : "REGISTERED E-MAIL"}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder={role === "dealer" ? "techhub" : "your@email.com"}
              autoCapitalize="none"
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <InfoCard
              tone="success"
              title="Verification code sent"
              body={`Check the inbox of ${identifier}.`}
            />
            {demoCode ? (
              <InfoCard
                tone="warning"
                icon=""
                title={`Sandbox code: ${demoCode}`}
                body="This build has no SMTP server, so the e-mail is delivered to the in-app mailbox instead."
              />
            ) : null}
            <Field
              label="6-DIGIT CODE"
              value={code}
              onChangeText={setCode}
              placeholder="••••••"
              keyboardType="numeric"
            />
            <Pressable
              onPress={() => router.push({ pathname: "/mailbox", params: { identifier } })}
              style={styles.centerLink}
            >
              <Text style={styles.link}>Open the mailbox to read the e-mail ›</Text>
            </Pressable>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Field label="NEW PASSWORD" value={password} onChangeText={setPassword} placeholder="Minimum 6 characters" secure />
            <Field label="CONFIRM NEW PASSWORD" value={confirm} onChangeText={setConfirm} placeholder="Re-enter password" secure />
            <InfoCard
              title="Password reset uses the same flow"
              body="Whether you tapped Forgot password or Reset password, the code + new password steps are identical."
            />
          </>
        ) : null}

        {error ? <InfoCard tone="danger" title={error} /> : null}

        <PrimaryButton
          label={step === 1 ? "Send Code" : step === 2 ? "Verify Code" : "Save New Password"}
          onPress={step === 1 ? sendCode : step === 2 ? verify : save}
        />
      </FormBlock>

      <FooterNote>
        Remembered it?{" "}
        <Text style={styles.link} onPress={() => router.replace("/auth/dealer-login")}>
          Back to login
        </Text>
      </FooterNote>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  centerLink: { marginTop: 14, alignItems: "center" },
  link: { color: T.brand, fontWeight: "800", fontSize: 13, textDecorationLine: "underline" },
  title: { fontSize: 22, fontWeight: "800", color: T.text, textAlign: "center", marginBottom: 16 },
  iconOk: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: T.success,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  iconOkText: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
});
