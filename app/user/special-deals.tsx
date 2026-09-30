import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import { ProductCard } from "@/components/domain/cards";
import {
  Badge,
  Card,
  EmptyState,
  InfoCard,
  Select,
  kitStyles,
} from "@/components/ui/kit";
import { useNow } from "@/hooks/use-now";
import { CATEGORIES, categoryName } from "@/lib/domain/seed";
import { money } from "@/lib/format";
import { daysLeft, specialDeals, useApp } from "@/lib/store";
import { T } from "@/lib/theme";

export default function SpecialDealsScreen() {
  const router = useRouter();
  const { state, getDealer } = useApp();
  const now = useNow();
  const [categoryId, setCategoryId] = useState("all");

  const deals = useMemo(
    () => specialDeals(state, categoryId === "all" ? undefined : categoryId),
    [state, categoryId],
  );

  return (
    <AppShell role="user" active="deals">
      <BrandHeader title="Special Deals" right={<NotificationBell />} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <InfoCard
          icon="★"
          title="Every special deal in one place"
          body="Each listing shows how many days are left before the deal closes. Filter by category below."
        />

        <Card>
          <Select
            label="CATEGORY"
            value={categoryId}
            options={[
              { value: "all", label: "All categories", sublabel: `${specialDeals(state).length} special deals` },
              ...CATEGORIES.map((c) => ({
                value: c.id,
                label: `${c.icon} ${c.name}`,
                sublabel: `${specialDeals(state, c.id).length} special deals`,
              })),
            ]}
            onChange={setCategoryId}
          />
          <Text style={kitStyles.cardMeta}>
            {deals.length} special deal{deals.length === 1 ? "" : "s"}
            {categoryId === "all" ? " across all categories" : ` in ${categoryName(categoryId)}`}
          </Text>
        </Card>

        {deals.length === 0 ? (
          <Card>
            <EmptyState
              icon="★"
              title="No special deals here yet"
              body="Check another category — dealers publish new special deals every day."
              action="Show all categories"
              onAction={() => setCategoryId("all")}
            />
          </Card>
        ) : null}

        {deals.map((product) => (
          <Card key={product.id}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.badges}>
                  <Badge tone="special">SPECIAL DEAL</Badge>
                  <Badge tone="brand">{categoryName(product.categoryId)}</Badge>
                  <Badge
                    tone={
                      daysLeft(product.specialDealEndsAt, now) <= 2
                        ? "live"
                        : daysLeft(product.specialDealEndsAt, now) <= 5
                          ? "special"
                          : "verified"
                    }
                  >
                    {daysLeft(product.specialDealEndsAt, now)} DAYS LEFT
                  </Badge>
                </View>
                <Text style={styles.title}>{product.name}</Text>
                <Text style={kitStyles.cardMeta}>
                  {getDealer(product.dealerId)?.storeName ?? "Dealer"} · {product.subCategory}
                </Text>
                {product.description ? (
                  <Text style={[kitStyles.cardMeta, { marginTop: 6 }]}>{product.description}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.footer}>
              <View>
                <Text style={kitStyles.microLabel}>DEAL PRICE</Text>
                <Text style={kitStyles.money}>{money(product.price)}</Text>
              </View>
              <View>
                <Text style={kitStyles.microLabel}>MRP</Text>
                <Text style={[kitStyles.money, { color: T.textFaint, textDecorationLine: "line-through" }]}>
                  {money(product.originalPrice)}
                </Text>
              </View>
              <View>
                <Text style={kitStyles.microLabel}>YOU SAVE</Text>
                <Text style={[kitStyles.money, { color: T.success }]}>
                  {money((product.originalPrice ?? product.price) - product.price)}
                </Text>
              </View>
              <Text style={kitStyles.link}>Post an auction for this ›</Text>
            </View>
          </Card>
        ))}

        <Card style={{ backgroundColor: T.brandTint, borderColor: T.brand }}>
          <Text style={styles.ctaTitle}>Want a better price?</Text>
          <Text style={kitStyles.cardMeta}>
            Publish an auction for this product and let every matching store compete with reverse bids.
          </Text>
          <Text style={styles.ctaLink} onPress={() => router.push("/user/new-auction")}>
            Start an auction →
          </Text>
        </Card>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: "800", color: T.text },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F4F4F4",
    marginTop: 12,
    paddingTop: 10,
    gap: 8,
  },
  ctaTitle: { fontSize: 14, fontWeight: "800", color: T.brandDark },
  ctaLink: { color: T.brand, fontWeight: "800", marginTop: 10, fontSize: 13 },
});
