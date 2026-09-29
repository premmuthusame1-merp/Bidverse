import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AuthShell, FooterNote, FormBlock } from "@/components/auth-shell";
import {
  Badge,
  Chip,
  Field,
  InfoCard,
  KeyValue,
  PrimaryButton,
  Stepper,
  TopBar,
} from "@/components/ui/kit";
import { CATEGORIES } from "@/lib/domain/seed";
import { notify } from "@/lib/demo";
import { useApp, type DealerRegistrationInput } from "@/lib/store";
import { T } from "@/lib/theme";

const STEPS = ["Basic Info", "Documents", "Business", "Review"];

const EMPTY: DealerRegistrationInput = {
  fullName: "",
  email: "",
  phone: "",
  recommendedUsername: "",
  panCardNumber: "",
  aadharCardNumber: "",
  gstNumber: "",
  hasAuthorizedStoreCertificate: false,
  authorizedStoreCertificateName: undefined,
  storeImageName: undefined,
  storeName: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  latitude: 13.0827,
  longitude: 80.2707,
  categoryIds: [],
};

export default function DealerRegisterScreen() {
  const router = useRouter();
  const { registerDealer } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DealerRegistrationInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof DealerRegistrationInput>(key: K, value: DealerRegistrationInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
        setError("Full name, e-mail and phone number are required.");
        return;
      }
      if (form.recommendedUsername.trim().length < 3) {
        setError("Enter the username you want for your dealer login (minimum 3 characters).");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!form.panCardNumber.trim() || !form.aadharCardNumber.trim()) {
        setError("PAN card and Aadhaar card are mandatory.");
        return;
      }
      if (!form.storeImageName) {
        setError("Upload a store / shop image for verification.");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!form.storeName.trim() || !form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
        setError("Store name, address, city and pincode are required.");
        return;
      }
      setStep(4);
      return;
    }
    if (form.categoryIds.length === 0) {
      setError("Select at least one category that you can deal in.");
      return;
    }
    const result = registerDealer(form);
    if (!result.ok) {
      setError(result.error ?? "Unable to submit the registration.");
      return;
    }
    setSubmitted(true);
  };

  const back = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  if (submitted) {
    return (
      <AuthShell back={false} centered compact>
        <View style={styles.successIcon}>
          <Text style={styles.successGlyph}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Registration submitted</Text>
        <InfoCard
          tone="warning"
          icon="⏳"
          title="Will get the login after the approve within 24 Hours"
          body="Our super admin will verify your PAN, Aadhaar, GST and store documents. Once approved, your username and a temporary password are e-mailed to you."
        />
        <View style={styles.summaryCard}>
          <KeyValue label="Store" value={form.storeName} />
          <KeyValue label="Username requested" value={form.recommendedUsername} />
          <KeyValue label="E-mail" value={form.email} />
          <KeyValue label="Categories" value={form.categoryIds.map(labelOf).join(", ")} />
        </View>
        <PrimaryButton
          label="View the e-mail we sent"
          onPress={() => router.push({ pathname: "/mailbox", params: { email: form.email } })}
        />
        <Pressable onPress={() => router.replace("/auth/dealer-login")} style={styles.backLink}>
          <Text style={styles.link}>Go to dealer login ›</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/")} style={styles.backLink}>
          <Text style={styles.helper}>← Back to welcome</Text>
        </Pressable>
      </AuthShell>
    );
  }

  return (
    <AuthShell back={false}>
      <TopBar title="Dealer Registration" onBack={back} subtitle={STEPS[step - 1]} />
      <View style={{ paddingHorizontal: 16 }}>
        <Stepper steps={STEPS} current={step} />
      </View>

      <FormBlock style={{ paddingHorizontal: 16 }}>
        {step === 1 ? (
          <>
            <InfoCard
              title="Your login is created by the super admin"
              body="Submit the documents below and recommend the username you want. We issue the password after verification."
            />
            <Field label="FULL NAME *" value={form.fullName} onChangeText={(v) => set("fullName", v)} placeholder="Enter your full name" />
            <Field
              label="EMAIL ID *"
              value={form.email}
              onChangeText={(v) => set("email", v)}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="PHONE NUMBER *"
              value={form.phone}
              onChangeText={(v) => set("phone", v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
            />
            <Field
              label="RECOMMENDED ADMIN USERNAME *"
              value={form.recommendedUsername}
              onChangeText={(v) => set("recommendedUsername", v)}
              placeholder="Choose a username"
              autoCapitalize="none"
              hint="This is the username the super admin issues once your documents are verified."
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.heading}>📋 Documents</Text>
            <Field
              label="PAN CARD NUMBER *"
              value={form.panCardNumber}
              onChangeText={(v) => set("panCardNumber", v.toUpperCase())}
              placeholder="ABCDE1234F"
              autoCapitalize="none"
            />
            <UploadRow label="PAN Card *" uploaded={Boolean(form.panCardNumber)} onPress={() => notify("PAN card", "Attach the scanned copy in the mobile app.")} />
            <Field
              label="AADHAAR CARD NUMBER *"
              value={form.aadharCardNumber}
              onChangeText={(v) => set("aadharCardNumber", v)}
              placeholder="1234 5678 9012"
              keyboardType="numeric"
            />
            <UploadRow label="Aadhaar Card *" uploaded={Boolean(form.aadharCardNumber)} onPress={() => notify("Aadhaar card", "Attach the scanned copy in the mobile app.")} />
            <Field
              label="GST NUMBER"
              value={form.gstNumber}
              onChangeText={(v) => set("gstNumber", v.toUpperCase())}
              placeholder="33ABCDE1234F1Z5"
              autoCapitalize="none"
            />
            <UploadRow label="GST Certificate" uploaded={Boolean(form.gstNumber)} onPress={() => notify("GST certificate", "Attach the certificate copy in the mobile app.")} />

            <Pressable
              onPress={() => set("hasAuthorizedStoreCertificate", !form.hasAuthorizedStoreCertificate)}
              style={styles.toggleRow}
            >
              <View style={[styles.checkbox, form.hasAuthorizedStoreCertificate && styles.checkboxOn]}>
                {form.hasAuthorizedStoreCertificate ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Authorized store of the official product company</Text>
                <Text style={styles.helper}>Tick if you hold an authorised dealership certificate.</Text>
              </View>
            </Pressable>

            {form.hasAuthorizedStoreCertificate ? (
              <UploadRow
                label="Authorized Store Certificate"
                uploaded={Boolean(form.authorizedStoreCertificateName)}
                value={form.authorizedStoreCertificateName}
                onPress={() => set("authorizedStoreCertificateName", "authorized-store-certificate.pdf")}
              />
            ) : null}

            <UploadRow
              label="Store / Shop Image *"
              uploaded={Boolean(form.storeImageName)}
              value={form.storeImageName}
              onPress={() => set("storeImageName", "store-front.jpg")}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.heading}>🏬 Store details</Text>
            <Field label="STORE NAME *" value={form.storeName} onChangeText={(v) => set("storeName", v)} placeholder="e.g. TechHub Chennai" />
            <Field label="ADDRESS *" value={form.address} onChangeText={(v) => set("address", v)} placeholder="Street, area" multiline />
            <View style={styles.twoCol}>
              <View style={styles.half}>
                <Field label="CITY *" value={form.city} onChangeText={(v) => set("city", v)} placeholder="Chennai" />
              </View>
              <View style={styles.half}>
                <Field label="STATE" value={form.state} onChangeText={(v) => set("state", v)} placeholder="Tamil Nadu" />
              </View>
            </View>
            <Field
              label="PINCODE *"
              value={form.pincode}
              onChangeText={(v) => set("pincode", v)}
              placeholder="600018"
              keyboardType="numeric"
            />
            <InfoCard
              title="Location is used to notify nearby stores"
              body={`Latitude ${form.latitude.toFixed(4)}, longitude ${form.longitude.toFixed(4)} (auto-detected in the mobile app).`}
            />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Text style={styles.heading}>◈ Categories you can deal in</Text>
            <Text style={styles.helper}>
              You can only post products and bid in the categories selected here. Extra categories can be requested from
              Settings after approval.
            </Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={form.categoryIds.includes(category.id)}
                  onPress={() =>
                    set(
                      "categoryIds",
                      form.categoryIds.includes(category.id)
                        ? form.categoryIds.filter((c) => c !== category.id)
                        : [...form.categoryIds, category.id],
                    )
                  }
                />
              ))}
            </View>

            <Text style={styles.heading}>Review</Text>
            <View style={styles.summaryCard}>
              <KeyValue label="Dealer" value={form.fullName} />
              <KeyValue label="Store" value={form.storeName} />
              <KeyValue label="Username requested" value={form.recommendedUsername} />
              <KeyValue label="PAN" value={form.panCardNumber || "—"} />
              <KeyValue label="Aadhaar" value={form.aadharCardNumber || "—"} />
              <KeyValue label="GST" value={form.gstNumber || "Not provided"} />
              <KeyValue label="Authorised certificate" value={form.hasAuthorizedStoreCertificate ? "Included" : "Not applicable"} />
              <KeyValue label="Store image" value={form.storeImageName ?? "—"} />
              <KeyValue label="Location" value={`${form.city}, ${form.state} ${form.pincode}`} />
              <KeyValue label="Categories" value={form.categoryIds.map(labelOf).join(", ") || "—"} />
            </View>
          </>
        ) : null}

        {error ? <InfoCard tone="danger" title={error} /> : null}

        <PrimaryButton label={step === 4 ? "Submit for Review" : "Next  →"} onPress={next} />
        {step === 4 ? (
          <Text style={styles.helper}>
            On approval you will receive an e-mail with your username and a temporary password. You will be asked to set
            a new password on first login.
          </Text>
        ) : null}
      </FormBlock>

      <FooterNote>
        Already approved?{" "}
        <Text style={styles.link} onPress={() => router.replace("/auth/dealer-login")}>
          Dealer login
        </Text>
      </FooterNote>
    </AuthShell>
  );
}

function UploadRow({
  label,
  uploaded,
  value,
  onPress,
}: {
  label: string;
  uploaded?: boolean;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.uploadCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.uploadTitle}>{label}</Text>
        <Text style={styles.helper}>{uploaded ? value ?? "Attached" : "📤 Tap to upload document"}</Text>
      </View>
      {uploaded ? <Badge tone="verified">✓ Added</Badge> : <Badge tone="muted">Pending</Badge>}
    </Pressable>
  );
}

function labelOf(categoryId: string) {
  return CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
}

const styles = StyleSheet.create({
  heading: { fontSize: 15, fontWeight: "800", color: T.text, marginTop: 16, marginBottom: 10 },
  twoCol: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  uploadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  uploadTitle: { fontSize: 13, fontWeight: "700", color: T.text },
  helper: { color: T.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  toggleRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 6, marginBottom: 14 },
  toggleTitle: { fontSize: 13, fontWeight: "700", color: T.text },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C9CFD2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: T.brand, borderColor: T.brand },
  checkmark: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  successIcon: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: T.success,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  successGlyph: { color: "#FFFFFF", fontSize: 36, fontWeight: "800" },
  successTitle: { fontSize: 22, fontWeight: "800", color: T.text, textAlign: "center", marginBottom: 18 },
  backLink: { marginTop: 14, alignItems: "center" },
  link: { color: T.brand, fontWeight: "800", fontSize: 13, textDecorationLine: "underline" },
});
