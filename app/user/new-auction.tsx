import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { Badge, Card, Field, InfoCard, KeyValue, PrimaryButton, Select, TopBar, kitStyles } from "@/components/ui/kit";
import { CATEGORIES, categorySubs, categoryName } from "@/lib/domain/seed";
import { money } from "@/lib/format";
import { showSheet } from "@/components/ui/action-sheet";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

const DURATIONS = [
  { label: "1 day", days: 1 },
  { label: "2 days", days: 2 },
  { label: "3 days", days: 3 },
  { label: "5 days", days: 5 },
  { label: "7 days", days: 7 },
  { label: "10 days", days: 10 },
];

export default function NewAuctionScreen() {
  const router = useRouter();
  const { state, publishAuction } = useApp();

  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [subCategory, setSubCategory] = useState<string | undefined>(CATEGORIES[0].subCategories[0]);
  const [specifications, setSpecifications] = useState("");
  const [durationDays, setDurationDays] = useState("3 days");
  const [budget, setBudget] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const matchingDealers = useMemo(
    () => state.dealers.filter((d) => d.status === "approved" && d.categoryIds.includes(categoryId)),
    [state.dealers, categoryId],
  );

  const submit = () => {
    setError(null);
    const days = DURATIONS.find((d) => d.label === durationDays)?.days ?? 3;
    const amount = Number(budget.replace(/[^0-9.]/g, ""));
    const result = publishAuction({
      productName,
      categoryId,
      subCategory,
      specifications,
      durationDays: days,
      budget: amount,
      referralLink,
    });
    if (!result.ok) {
      setError(result.error ?? "Unable to publish the auction.");
      return;
    }
    showSheet({
      title: "Auction published",
      message: `${matchingDealers.length} matching store${matchingDealers.length === 1 ? "" : "s"} notified. Bidding opens 10 minutes after posting, and the first bid starts a 20 minute reverse-bidding window.`,
      options: [
        {
          label: "Open my auctions",
          tone: "brand",
          onPress: () => router.replace("/user/auctions"),
        },
      ],
      cancelLabel: null,
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F8FAFA]">
      <TopBar title="Start New Auction" onBack={() => router.back()} badge={<Badge tone="brand">REVERSE</Badge>} />
      <ScrollView contentContainerStyle={kitStyles.scroll} keyboardShouldPersistTaps="handled">
        <InfoCard
          icon=""
          title="Post what you need — dealers compete to give you the best price"
          body="Your product details are pushed only to stores registered for the matching category."
        />

        <Card>
          <Text style={styles.blockTitle}>Requirement</Text>
          <Field
            label="PRODUCT NAME *"
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. iPhone 15 Pro Max 256GB"
          />
          <Select
            label="CATEGORY *"
            value={categoryId}
            options={CATEGORIES.map((c) => ({
              value: c.id,
              label: `${c.icon} ${c.name}`,
              sublabel: `${c.subCategories.length} sub-categories`,
            }))}
            onChange={(value) => {
              setCategoryId(value);
              setSubCategory(categorySubs(value)[0]);
            }}
          />
          <Select
            label="SUB CATEGORY"
            value={subCategory}
            options={categorySubs(categoryId).map((s) => ({ value: s, label: s }))}
            onChange={setSubCategory}
            placeholder="Select the product family"
            hint="Electronics → Phones, Laptops, TV, Refrigerator and more."
          />
          <Field
            label="SPECIAL SPECIFICATIONS"
            value={specifications}
            onChangeText={setSpecifications}
            placeholder="Colour, model, condition, warranty expectations…"
            multiline
          />
          <Field
            label="REFERRAL LINK FOR THE PRODUCT"
            value={referralLink}
            onChangeText={setReferralLink}
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
          />
        </Card>

        <Card>
          <Text style={styles.blockTitle}>Auction rules</Text>
          <Select
            label="HOW MANY DAYS THE AUCTION CAN OPEN *"
            value={durationDays}
            options={DURATIONS.map((d) => ({ value: d.label, label: d.label }))}
            onChange={setDurationDays}
            hint="Bidding opens 10 minutes after publishing. The first bid opens a 20 minute reverse-bidding window."
          />
          <Field
            label="YOUR DEAL AMOUNT (₹) *"
            value={budget}
            onChangeText={setBudget}
            placeholder="e.g. 145000"
            keyboardType="numeric"
            hint="Dealers must quote at or below this amount, and each new bid must beat the previous one."
          />
          {budget ? <Text style={styles.preview}>Budget: {money(Number(budget.replace(/[^0-9.]/g, "")))}</Text> : null}
        </Card>

        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.blockTitle}>Stores that will be notified</Text>
            <Badge tone="verified">{matchingDealers.length} matching</Badge>
          </View>
          {matchingDealers.length === 0 ? (
            <Text style={kitStyles.cardMeta}>
              No approved dealer registered for {categoryName(categoryId)} yet. Your auction will still be published.
            </Text>
          ) : (
            matchingDealers.map((dealer) => (
              <View key={dealer.id} style={styles.dealerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={kitStyles.cardTitle}>{dealer.storeName}</Text>
                  <Text style={kitStyles.cardMeta}>
                    {dealer.city} · {dealer.categoryIds.map(categoryName).join(", ")}
                  </Text>
                </View>
                <Text style={styles.notified}>✉ notified</Text>
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text style={styles.blockTitle}>Review</Text>
          <KeyValue label="Product" value={productName || "—"} />
          <KeyValue label="Category" value={categoryName(categoryId)} />
          <KeyValue label="Sub category" value={subCategory ?? "—"} />
          <KeyValue label="Auction open" value={durationDays} />
          <KeyValue label="Deal amount" value={budget ? money(Number(budget.replace(/[^0-9.]/g, ""))) : "—"} />
          <KeyValue label="Referral link" value={referralLink || "—"} />
          <KeyValue label="Goes live" value="10 minutes after publishing" />
        </Card>

        {error ? <InfoCard tone="danger" title={error} /> : null}

        <PrimaryButton label="Publish Auction" onPress={submit} />

        <Pressable onPress={() => router.back()} style={styles.cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  blockTitle: { fontSize: 15, fontWeight: "800", color: T.text, marginBottom: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  preview: { color: T.brand, fontWeight: "800", fontSize: 13, marginTop: 4 },
  dealerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F5",
  },
  notified: { color: T.success, fontSize: 11, fontWeight: "700" },
  cancel: { marginTop: 14, alignItems: "center" },
  cancelText: { color: T.textMuted, fontWeight: "700", fontSize: 13 },
});
