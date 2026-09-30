import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell, FooterNote, FormBlock } from "@/components/auth-shell";
import {
  Chip,
  Field,
  InfoCard,
  PrimaryButton,
  Stepper,
  TopBar,
} from "@/components/ui/kit";
import { CATEGORIES } from "@/lib/domain/seed";
import { notify } from "@/lib/demo";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

const STEPS = ["Account", "Verification", "Profile", "Preferences"];
const INTERESTS = CATEGORIES.flatMap((c) => c.subCategories.slice(0, 2)).slice(0, 8);

export default function BuyerRegisterScreen() {
  const router = useRouter();
  const { registerBuyer } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sentCode = "246810";

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim() || !email.trim() || !password) {
        setError("Name, e-mail and password are required.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (code.trim() !== sentCode) {
        setError("Enter the 6-digit code we sent to your e-mail (demo code 246810).");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    const result = registerBuyer({ name, email, phone, password });
    if (!result.ok) {
      setError(result.error ?? "Unable to create the account.");
      return;
    }
    router.replace("/user/home");
  };

  const back = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  return (
    <AuthShell back={false}>
      <TopBar title="Create Account" onBack={back} subtitle={`Step ${step} of 4`} />
      <View style={{ paddingHorizontal: 16 }}>
        <Stepper steps={STEPS} current={step} />
      </View>

      <FormBlock style={{ paddingHorizontal: 16 }}>
        {step === 1 ? (
          <>
            <Field label="FULL NAME *" value={name} onChangeText={setName} placeholder="Enter your full name" />
            <Field
              label="EMAIL *"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field label="PHONE" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
            <Field label="PASSWORD *" value={password} onChangeText={setPassword} placeholder="Create password" secure />
            <Field
              label="CONFIRM PASSWORD *"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              secure
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <InfoCard tone="success" icon="✓" title="Verification code sent" body={`We e-mailed a 6-digit code to ${email || "your e-mail"}.`} />
            <Field
              label="6-DIGIT CODE"
              value={code}
              onChangeText={setCode}
              placeholder="••••••"
              keyboardType="numeric"
            />
            <Text style={styles.centerText}>
              Didn&apos;t receive it?{" "}
              <Text style={styles.link} onPress={() => notify("Code re-sent", "Demo code: 246810")}>
                Resend code
              </Text>
            </Text>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <View style={styles.avatarUpload}>
              <Text style={styles.avatarText}>♙</Text>
              <Text style={styles.avatarHint}>Add Photo</Text>
            </View>
            <Field label="FULL NAME *" value={name} onChangeText={setName} placeholder="Your name" />
            <Field label="DATE OF BIRTH" value={dob} onChangeText={setDob} placeholder="DD / MM / YYYY" />
            <Field label="LOCATION" value={city} onChangeText={setCity} placeholder="City, State" />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.heading}>Select your interests</Text>
            <View style={styles.chipWrap}>
              {INTERESTS.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  selected={interests.includes(interest)}
                  onPress={() =>
                    setInterests((prev) =>
                      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest],
                    )
                  }
                />
              ))}
            </View>
            <Text style={styles.helper}>
              We use this to surface auctions and special deals relevant to you.
            </Text>
          </>
        ) : null}

        {error ? <InfoCard tone="danger" title={error} /> : null}

        <PrimaryButton label={step === 4 ? "Finish" : "Next  →"} onPress={next} />

        {step === 4 ? (
          <Pressable onPress={() => notify("Privacy", "Your data is stored locally in this demo.")} style={styles.terms}>
            <Text style={styles.helper}>
              By continuing you agree to the BidVerse terms and privacy policy.
            </Text>
          </Pressable>
        ) : null}
      </FormBlock>

      <FooterNote>
        Already registered?{" "}
        <Text style={styles.link} onPress={() => router.replace("/auth/buyer-login")}>
          Sign in
        </Text>
      </FooterNote>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  centerText: { textAlign: "center", color: T.textMuted, fontSize: 12, marginTop: 10 },
  link: { color: T.brand, fontWeight: "800", textDecorationLine: "underline" },
  avatarUpload: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderStyle: "dashed",
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  avatarText: { color: T.textFaint, fontSize: 24 },
  avatarHint: { color: T.textMuted, fontSize: 11, marginTop: 2 },
  heading: { fontSize: 15, fontWeight: "800", color: T.text, marginBottom: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  helper: { color: T.textMuted, fontSize: 12, marginTop: 14, textAlign: "center", lineHeight: 18 },
  terms: { marginTop: 14 },
});
