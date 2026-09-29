import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader, NotificationBell } from "@/components/app-shell";
import { ProductCard } from "@/components/domain/cards";
import { Badge, Card, EmptyState, Fab, PrimaryButton, Segmented, kitStyles } from "@/components/ui/kit";
import { useNow } from "@/hooks/use-now";
import { categoryName } from "@/lib/domain/seed";
import { money, relativeTime } from "@/lib/format";
import { daysLeft, useApp } from "@/lib/store";
import { T } from "@/lib/theme";

type Tab = "all" | "special" | "regular";

export default function DealerProductsScreen() {
  const router = useRouter();
  const { dealer, state } = useApp();
  const now = useNow();
  const [tab, setTab] = useState<Tab>("all");

  const products = useMemo(() => {
    if (!dealer) return [];
    const mine = state.products.filter((p) => p.dealerId === dealer.id).sort((a, b) => b.postedAt - a.postedAt);
    if (tab === "special") return mine.filter((p) => p.isSpecialDeal);
    if (tab === "regular") return mine.filter((p) => !p.isSpecialDeal);
    return mine;
  }, [dealer, state.products, tab]);

  if (!dealer) {
    return (
      <AppShell role="dealer" active="products">
        <BrandHeader title="Products" />
        <EmptyState title="Dealer profile missing" />
      </AppShell>
    );
  }

  const all = state.products.filter((p) => p.dealerId === dealer.id);

  return (
    <AppShell role="dealer" active="products">
      <BrandHeader title="My Products" right={<NotificationBell />} />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "all", label: "All", count: all.length },
          { value: "special", label: "Special", count: all.filter((p) => p.isSpecialDeal).length },
          { value: "regular", label: "Regular", count: all.filter((p) => !p.isSpecialDeal).length },
        ]}
      />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        {products.length === 0 ? (
          <Card>
            <EmptyState
              icon="▤"
              title="Nothing here yet"
              body="Products you post appear on the buyer home page immediately."
              action="Post a product"
              onAction={() => router.replace("/dealer/post-product")}
            />
          </Card>
        ) : null}

        {products.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Preview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} now={now} />
              ))}
            </ScrollView>
          </>
        ) : null}

        {products.map((product) => (
          <Card key={product.id}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={kitStyles.cardTitle}>{product.name}</Text>
                <Text style={kitStyles.cardMeta}>
                  {categoryName(product.categoryId)} → {product.subCategory} · posted {relativeTime(product.postedAt, now)}
                </Text>
              </View>
              {product.isSpecialDeal ? <Badge tone="special">SPECIAL DEAL</Badge> : <Badge tone="muted">REGULAR</Badge>}
            </View>
            {product.description ? <Text style={[kitStyles.cardMeta, { marginTop: 8 }]}>{product.description}</Text> : null}
            <View style={styles.footer}>
              <View>
                <Text style={kitStyles.microLabel}>PRICE</Text>
                <Text style={kitStyles.money}>{money(product.price)}</Text>
              </View>
              <View>
                <Text style={kitStyles.microLabel}>MRP</Text>
                <Text style={kitStyles.money}>{money(product.originalPrice)}</Text>
              </View>
              <View>
                <Text style={kitStyles.microLabel}>DEAL DAYS LEFT</Text>
                <Text style={[kitStyles.money, product.isSpecialDeal && { color: T.special }]}>
                  {product.isSpecialDeal ? `${daysLeft(product.specialDealEndsAt, now)}d` : "—"}
                </Text>
              </View>
              <View>
                <Text style={kitStyles.microLabel}>STATUS</Text>
                <Text style={[kitStyles.money, { color: T.success }]}>Active</Text>
              </View>
            </View>
          </Card>
        ))}

        <PrimaryButton label="Post another product" icon="+" onPress={() => router.push("/dealer/post-product")} />
      </ScrollView>
      <Fab onPress={() => router.push("/dealer/post-product")} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 13, fontWeight: "800", color: T.text, marginBottom: 8 },
  hRow: { gap: 10, paddingBottom: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
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
});
