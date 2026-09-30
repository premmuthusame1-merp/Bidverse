import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import { ProductCard } from "@/components/domain/cards";
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  Field,
  InfoCard,
  PrimaryButton,
  Select,
  kitStyles,
} from "@/components/ui/kit";
import { notify } from "@/components/ui/action-sheet";
import { useNow } from "@/hooks/use-now";
import { CATEGORIES, categoryName } from "@/lib/domain/seed";
import { money } from "@/lib/format";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

const DEAL_DAYS = [3, 5, 7, 10, 15, 30];

export default function PostProductScreen() {
  const router = useRouter();
  const { dealer, state, postProduct } = useApp();
  const now = useNow();

  const allowed = useMemo(
    () => CATEGORIES.filter((c) => dealer?.categoryIds.includes(c.id)),
    [dealer?.categoryIds],
  );

  const [categoryId, setCategoryId] = useState(allowed[0]?.id ?? CATEGORIES[0].id);
  const [subCategory, setSubCategory] = useState(allowed[0]?.subCategories[0] ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [isSpecialDeal, setIsSpecialDeal] = useState(false);
  const [specialDays, setSpecialDays] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = allowed.find((c) => c.id === categoryId) ?? allowed[0];
  const myProducts = dealer ? state.products.filter((p) => p.dealerId === dealer.id).slice(0, 4) : [];

  if (!dealer) {
    return (
      <AppShell role="dealer" active="post">
        <BrandHeader title="Post" />
        <EmptyState title="Dealer profile missing" />
      </AppShell>
    );
  }

  const submit = () => {
    setError(null);
    const result = postProduct({
      categoryId,
      subCategory,
      name,
      description,
      price: Number(price.replace(/[^0-9.]/g, "")),
      originalPrice: originalPrice ? Number(originalPrice.replace(/[^0-9.]/g, "")) : undefined,
      isSpecialDeal,
      specialDealDays: isSpecialDeal ? specialDays : undefined,
    });
    if (!result.ok) {
      setError(result.error ?? "Unable to post the product.");
      return;
    }
    notify(
      "Product posted",
      isSpecialDeal
        ? `Listed as a special deal with ${specialDays} days left. Buyers will see the days-left countdown.`
        : "Buyers can now see this product on their home page.",
    );
    setName("");
    setDescription("");
    setPrice("");
    setOriginalPrice("");
    setIsSpecialDeal(false);
    setSpecialDays(7);
  };

  return (
    <AppShell role="dealer" active="post">
      <BrandHeader title="Post a Product" right={<NotificationBell />} />
      <ScrollView contentContainerStyle={kitStyles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <InfoCard
          title="One entry, one category"
          body="You can only post in the categories you registered for. To sell in more categories, raise a request to the super admin from Settings."
        />

        {allowed.length === 0 ? (
          <Card>
            <EmptyState
              icon="◈"
              title="No approved categories"
              body="Request category access from Settings."
              action="Open settings"
              onAction={() => router.replace("/dealer/settings")}
            />
          </Card>
        ) : (
          <>
            <Card>
              <Text style={styles.blockTitle}>Category & product</Text>
              <View style={styles.chipWrap}>
                {allowed.map((category) => (
                  <Chip
                    key={category.id}
                    label={`${category.icon} ${category.name}`}
                    selected={categoryId === category.id}
                    onPress={() => {
                      setCategoryId(category.id);
                      setSubCategory(category.subCategories[0]);
                    }}
                  />
                ))}
              </View>

              <Select
                label="SPECIFIC CATEGORY OF THE PRODUCT *"
                value={subCategory}
                options={(selectedCategory?.subCategories ?? []).map((s) => ({ value: s, label: s }))}
                onChange={setSubCategory}
                placeholder="Select"
              />

              <Field
                label="PRODUCT NAME *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Samsung 7kg Front Load Washing Machine"
              />
              <Field
                label="OPTIONAL EXTRA DETAILS"
                value={description}
                onChangeText={setDescription}
                placeholder="Model, condition, warranty, delivery terms…"
                multiline
              />
            </Card>

            <Card>
              <Text style={styles.blockTitle}>Pricing</Text>
              <Field
                label="YOUR PRICE (₹) *"
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 42900"
                keyboardType="numeric"
              />
              <Field
                label="MRP / ORIGINAL PRICE (₹)"
                value={originalPrice}
                onChangeText={setOriginalPrice}
                placeholder="e.g. 54900"
                keyboardType="numeric"
                hint="Used to compute the discount shown in Top deals this week."
              />
              {price ? <Text style={styles.preview}>Listing price: {money(Number(price.replace(/[^0-9.]/g, "")))}</Text> : null}
            </Card>

            <Card>
              <Pressable onPress={() => setIsSpecialDeal((v) => !v)} style={styles.toggleRow}>
                <View style={[styles.checkbox, isSpecialDeal && styles.checkboxOn]}>
                  {isSpecialDeal ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>★ Special deal</Text>
                  <Text style={kitStyles.cardMeta}>
                    Adds a days-left countdown and lists the product under Special deals for buyers.
                  </Text>
                </View>
              </Pressable>

              {isSpecialDeal ? (
                <>
                  <Text style={styles.blockTitle}>Days left for the deal *</Text>
                  <View style={styles.chipWrap}>
                    {DEAL_DAYS.map((days) => (
                      <Chip
                        key={days}
                        label={`${days} days`}
                        selected={specialDays === days}
                        onPress={() => setSpecialDays(days)}
                      />
                    ))}
                  </View>
                  <Text style={kitStyles.cardMeta}>
                    Buyers will see “{specialDays} day{specialDays > 1 ? "s" : ""} left” on this product.
                  </Text>
                </>
              ) : null}
            </Card>

            {error ? <InfoCard tone="danger" title={error} /> : null}

            <PrimaryButton label="Publish product" icon="+" onPress={submit} />

            {myProducts.length > 0 ? (
              <>
                <Text style={styles.blockTitle}>Recently posted by you</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
                  {myProducts.map((product) => (
                    <ProductCard key={product.id} product={product} now={now} />
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Card style={{ backgroundColor: T.brandTint, borderColor: T.brand }}>
              <Text style={styles.tipTitle}>Need another category?</Text>
              <Text style={kitStyles.cardMeta}>
                Add a request in Settings → Categories. Your existing entry stays in its own category; use a new entry for
                each extra category.
              </Text>
              <PrimaryButton label="Request a category" onPress={() => router.replace("/dealer/settings")} />
            </Card>
          </>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  blockTitle: { fontSize: 14, fontWeight: "800", color: T.text, marginBottom: 10, marginTop: 4 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  preview: { color: T.brand, fontWeight: "800", fontSize: 13 },
  toggleRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  toggleTitle: { fontSize: 13, fontWeight: "800", color: T.text },
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
  hRow: { gap: 10, paddingBottom: 8 },
  tipTitle: { fontSize: 13, fontWeight: "800", color: T.brandDark, marginBottom: 4 },
});
