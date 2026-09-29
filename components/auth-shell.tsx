import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconButton } from "@/components/ui/kit";
import { T } from "@/lib/theme";

export function AuthShell({
  children,
  centered,
  back = true,
  compact,
}: {
  children: React.ReactNode;
  centered?: boolean;
  back?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F8FAFA]">
      {back ? (
        <View style={styles.backRow}>
          <IconButton label="‹" onPress={() => router.back()} />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          centered && { flexGrow: 1, justifyContent: "center" },
          compact && { paddingHorizontal: 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </ScreenContainer>
  );
}

export function AuthHeader({
  title,
  subtitle,
  logoText,
  logo = true,
}: {
  title: string;
  subtitle: string;
  logoText?: string;
  logo?: boolean;
}) {
  return (
    <View style={styles.header}>
      {logo ? (
        <View style={styles.logo}>
          <Text style={styles.logoText}>{logoText ?? "⌁"}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function FormBlock({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.formBlock, style]}>{children}</View>;
}

export function LinkText({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle & { color?: string }>;
}) {
  return (
    <Text onPress={onPress} style={[styles.link, style as never]}>
      {children}
    </Text>
  );
}

export function FooterNote({ children }: { children: React.ReactNode }) {
  return <Text style={styles.footer}>{children}</Text>;
}

const styles = StyleSheet.create({
  backRow: { paddingHorizontal: 16, paddingTop: 8 },
  content: { paddingHorizontal: 28, paddingTop: 18, paddingBottom: 56, flexGrow: 1 },
  header: { alignItems: "center", marginTop: 8, marginBottom: 26 },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: T.brand,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", marginTop: -4 },
  title: { fontSize: 28, fontWeight: "800", color: "#11181C", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { color: "#687076", fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 },
  formBlock: { marginBottom: 8 },
  link: { color: "#188B8D", fontWeight: "800", textDecorationLine: "underline" },
  footer: { textAlign: "center", color: T.textMuted, marginTop: 20, fontSize: 13 },
});
