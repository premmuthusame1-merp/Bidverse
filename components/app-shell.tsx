import { useRouter, type Href } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconButton } from "@/components/ui/kit";
import { unreadCount, useApp } from "@/lib/store";
import { T } from "@/lib/theme";

export type NavRole = "user" | "dealer" | "admin";

interface NavItem {
  key: string;
  icon: string;
  label: string;
  href: Href;
}

export const NAV_ITEMS: Record<NavRole, NavItem[]> = {
  user: [
    { key: "home", icon: "⌂", label: "Home", href: "/user/home" },
    { key: "auctions", icon: "♜", label: "Auctions", href: "/user/auctions" },
    { key: "deals", icon: "★", label: "Special", href: "/user/special-deals" },
    { key: "profile", icon: "♙", label: "Profile", href: "/user/profile" },
  ],
  dealer: [
    { key: "home", icon: "⌂", label: "Home", href: "/dealer/home" },
    { key: "post", icon: "＋", label: "Post", href: "/dealer/post-product" },
    { key: "products", icon: "▤", label: "Products", href: "/dealer/products" },
    { key: "settings", icon: "⚙", label: "Settings", href: "/dealer/settings" },
  ],
  admin: [
    { key: "dealers", icon: "▥", label: "Dealers", href: "/admin/dashboard" },
    { key: "requests", icon: "◈", label: "Requests", href: "/admin/category-requests" },
    { key: "auctions", icon: "♜", label: "Auctions", href: "/admin/auctions" },
    { key: "mail", icon: "✉", label: "Mailbox", href: "/admin/mailbox" },
  ],
};

export function BottomNav({ role, active }: { role: NavRole; active: string }) {
  const router = useRouter();
  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS[role].map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => router.replace(item.href)}
            style={styles.navItem}
          >
            <View style={[styles.navIcon, isActive && styles.navIconActive]}>
              <Text style={[styles.navGlyph, isActive && styles.navGlyphActive]}>{item.icon}</Text>
            </View>
            <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function AppShell({
  role,
  active,
  children,
  edges = ["top", "left", "right"],
}: {
  role: NavRole;
  active: string;
  children: React.ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
}) {
  return (
    <ScreenContainer edges={edges} containerClassName="bg-[#F8FAFA]">
      <View style={styles.app}>
        {children}
        <BottomNav role={role} active={active} />
      </View>
    </ScreenContainer>
  );
}

/** Top bar with the notification bell wired to the store. */
export function NotificationBell() {
  const router = useRouter();
  const { account, state } = useApp();
  const count = account ? unreadCount(state, account.id) : 0;
  return <IconButton label="◔" badge={count} onPress={() => router.push("/notifications")} />;
}

export function BrandHeader({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <View style={styles.brandHeader}>
      {onBack ? <IconButton label="‹" onPress={() => router.back()} /> : <View style={{ width: 6 }} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.brand}>BIDVERSE</Text>
        <Text style={styles.brandTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: T.bg },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: Platform.OS === "web" ? 70 : 74,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: 1,
    borderTopColor: T.border,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: { alignItems: "center", gap: 2, minWidth: 62, paddingVertical: 4 },
  navIcon: { width: 34, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navIconActive: { backgroundColor: T.brandTint },
  navGlyph: { color: T.textFaint, fontSize: 20 },
  navGlyphActive: { color: T.brand },
  navText: { color: T.textFaint, fontSize: 10, fontWeight: "700" },
  navTextActive: { color: T.brand },

  brandHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brand: { fontSize: 10, fontWeight: "900", color: T.brand, letterSpacing: 1.7 },
  brandTitle: { fontSize: 24, fontWeight: "800", color: T.text, marginTop: 2 },
});
