import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { T } from "@/lib/theme";
import { compactCountdown, countdown } from "@/lib/format";

/* ------------------------------------------------------------------ badges */

export type BadgeTone = "brand" | "live" | "special" | "verified" | "dark" | "muted";

export function Badge({
  children,
  tone = "brand",
  style,
  textStyle,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={[styles.badge, toneStyles[tone].container, style]}>
      <Text style={[styles.badgeText, toneStyles[tone].text, textStyle]}>{children}</Text>
    </View>
  );
}

const toneStyles: Record<BadgeTone, { container: ViewStyle; text: TextStyle }> = {
  brand: { container: { backgroundColor: T.brandTint }, text: { color: T.brand } },
  live: { container: { backgroundColor: T.liveBg }, text: { color: T.live } },
  special: { container: { backgroundColor: T.specialBg }, text: { color: T.special } },
  verified: { container: { backgroundColor: T.successBg }, text: { color: T.successText } },
  dark: { container: { backgroundColor: T.dark }, text: { color: "#FFFFFF" } },
  muted: { container: { backgroundColor: "#F1F3F4" }, text: { color: T.textMuted } },
};

export function LiveBadge({ label = "● LIVE" }: { label?: string }) {
  return (
    <Badge tone="live" style={styles.liveBadge}>
      {label}
    </Badge>
  );
}

/* ---------------------------------------------------------------- buttons */

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
  icon,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: string;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.primaryButtonText}>
        {icon ? `${icon}  ` : ""}
        {label}
      </Text>
    </Pressable>
  );
}

export function OutlineButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.outlineButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.outlineButtonText}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  tone = "brand",
  style,
}: {
  label: string;
  onPress?: () => void;
  tone?: "brand" | "danger" | "muted";
  style?: StyleProp<ViewStyle>;
}) {
  const color = tone === "danger" ? T.danger : tone === "muted" ? T.textMuted : T.brand;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed, style]}>
      <Text style={[styles.ghostButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  label,
  onPress,
  badge,
}: {
  label: string;
  onPress?: () => void;
  badge?: number;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Text style={styles.iconButtonText}>{label}</Text>
      {badge ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ inputs */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  autoCapitalize,
  multiline,
  hint,
  editable = true,
  right,
}: {
  label?: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  autoCapitalize?: "none" | "sentences" | "words";
  multiline?: boolean;
  hint?: string;
  editable?: boolean;
  right?: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.textFaint}
          secureTextEntry={secure ? hidden : false}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize={autoCapitalize ?? "sentences"}
          multiline={multiline}
          editable={editable}
          style={[styles.input, multiline && styles.inputMultiline, !editable && styles.inputDisabled]}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} style={styles.eyeButton}>
            <Text style={styles.eyeText}>{hidden ? "◌" : "◉"}</Text>
          </Pressable>
        ) : null}
        {right}
      </View>
      {hint ? <Text style={styles.inputHint}>{hint}</Text> : null}
    </View>
  );
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  hint,
}: {
  label?: string;
  value?: string;
  options: { value: string; label: string; sublabel?: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => [styles.select, pressed && styles.pressed]}>
        <Text style={[styles.selectText, !selected && { color: T.textFaint }]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.selectCaret}>⌄</Text>
      </Pressable>
      {hint ? <Text style={styles.inputHint}>{hint}</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <ScrollView style={{ maxHeight: 380 }}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.sheetItem, active && styles.sheetItemActive, pressed && styles.pressed]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetItemText, active && { color: T.brand, fontWeight: "700" }]}>
                        {option.label}
                      </Text>
                      {option.sublabel ? <Text style={styles.cardMeta}>{option.sublabel}</Text> : null}
                    </View>
                    {active ? <Text style={styles.sheetCheck}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------- cards */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  action,
  onPress,
  subtitle,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.cardMeta}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function InfoCard({
  title,
  body,
  tone = "brand",
  icon,
}: {
  title: string;
  body?: string;
  tone?: "brand" | "warning" | "success" | "danger" | "muted";
  icon?: string;
}) {
  const palette = {
    brand: { bg: T.brandTint, border: T.brand, text: T.brandDark },
    warning: { bg: T.specialSurface, border: T.specialBorder, text: T.special },
    success: { bg: T.successBg, border: "#A7F3D0", text: T.successText },
    danger: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" },
    muted: { bg: "#F1F3F4", border: T.border, text: T.textMuted },
  }[tone];
  return (
    <View style={[styles.infoCard, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.infoTitle, { color: palette.text }]}>
        {icon ? `${icon}  ` : ""}
        {title}
      </Text>
      {body ? <Text style={[styles.cardMeta, { marginTop: 4 }]}>{body}</Text> : null}
    </View>
  );
}

export function EmptyState({
  icon = "◌",
  title,
  body,
  action,
  onAction,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={[styles.cardMeta, { textAlign: "center" }]}>{body}</Text> : null}
      {action ? (
        <Pressable onPress={onAction} style={{ marginTop: 12 }}>
          <Text style={styles.link}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Avatar({ initials, color, size = 40 }: { initials: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: size / 2.9 }}>{initials}</Text>
    </View>
  );
}

/** Deterministic avatar colour from any id/name. */
export function avatarColor(seed: string): string {
  const palette = ["#0F8B8D", "#F97316", "#7C3AED", "#2563EB", "#DB2777", "#059669", "#D97706"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return palette[hash % palette.length];
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* ------------------------------------------------------------------ timers */

export function TimerPill({ msRemaining, label }: { msRemaining: number; label?: string }) {
  const closed = msRemaining <= 0;
  return (
    <View style={{ alignItems: "flex-end" }}>
      {label ? <Text style={styles.microLabel}>{label}</Text> : null}
      <View style={[styles.timer, closed && { backgroundColor: "#3F3F46" }]}>
        <Text style={[styles.timerText, closed && { color: "#FCA5A5" }]}>
          {closed ? "CLOSED" : compactCountdown(msRemaining)}
        </Text>
      </View>
    </View>
  );
}

export function BigTimer({
  msRemaining,
  label,
  tone = "dark",
}: {
  msRemaining: number;
  label: string;
  tone?: "dark" | "light";
}) {
  const closed = msRemaining <= 0;
  const light = tone === "light";
  return (
    <View
      style={[
        styles.bigTimer,
        light ? { backgroundColor: "rgba(255,255,255,0.14)" } : { backgroundColor: T.dark },
      ]}
    >
      <Text style={[styles.microLabel, light && { color: "#D6F5F3" }]}>{label}</Text>
      <Text
        style={[
          styles.bigTimerText,
          light && { color: "#FFFFFF" },
          closed && { color: "#FCA5A5", letterSpacing: 1 },
        ]}
      >
        {closed ? "CLOSED" : countdown(msRemaining)}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ layout */

export function StatusBarMock() {
  return (
    <View style={styles.status}>
      <Text style={styles.statusTime}>9:41</Text>
      <Text style={styles.statusIcons}>▮▮▮   Wi-Fi   ▰</Text>
    </View>
  );
}

export function TopBar({
  title,
  onBack,
  right,
  subtitle,
  badge,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      {onBack ? <IconButton label="‹" onPress={onBack} /> : null}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.pageTitle}>{title}</Text>
          {badge}
        </View>
        {subtitle ? <Text style={styles.cardMeta}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.segment, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {option.label}
              {option.count !== undefined ? ` (${option.count})` : ""}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={styles.stepper}>
      {steps.map((label, index) => {
        const done = index + 1 < current;
        const active = index + 1 === current;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepCircle, (done || active) && styles.stepCircleActive]}>
              <Text style={[styles.stepCircleText, (done || active) && { color: "#FFFFFF" }]}>
                {done ? "✓" : index + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

export function Fab({ label = "＋", onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Text style={styles.fabText}>{label}</Text>
    </Pressable>
  );
}

export const kitStyles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: T.text, fontSize: 14, fontWeight: "700" },
  cardMeta: { color: T.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  microLabel: { color: T.textFaint, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  pressed: { opacity: 0.82 },

  money: { color: T.text, fontSize: 16, fontWeight: "800", marginTop: 2 },
  link: { color: T.brand, fontWeight: "700", fontSize: 12 },
});

const styles = StyleSheet.create({
  microLabel: { color: T.textFaint, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.3 },
  liveBadge: { paddingHorizontal: 8 },

  primaryButton: {
    backgroundColor: T.brand,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    shadowColor: T.brand,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: T.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  outlineButtonText: { color: T.brand, fontWeight: "700", fontSize: 14 },
  ghostButton: { paddingVertical: 12, alignItems: "center" },
  ghostButtonText: { fontWeight: "700", fontSize: 13 },
  buttonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.82 },

  iconButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonText: { color: T.textMuted, fontSize: 20, fontWeight: "600" },
  iconBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.live,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  iconBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },

  fieldWrap: { marginBottom: 12 },
  inputLabel: {
    color: T.text,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 7,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: T.borderStrong,
    borderRadius: 14,
  },
  inputRowMultiline: { alignItems: "flex-start" },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: T.text,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 92, textAlignVertical: "top" },
  inputDisabled: { backgroundColor: "#F4F6F6", color: T.textFaint },
  inputHint: { color: T.textFaint, fontSize: 11, marginTop: 6 },
  eyeButton: { padding: 12 },
  eyeText: { color: T.textFaint, fontSize: 20 },

  select: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: T.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: T.text, fontSize: 15 },
  selectCaret: { color: T.textFaint, fontSize: 18 },

  sheetBackdrop: { flex: 1, backgroundColor: "rgba(16,24,32,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DDE1E1",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: T.text, marginBottom: 10 },
  sheetItem: {
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sheetItemActive: { backgroundColor: T.brandTint },
  sheetItemText: { color: T.text, fontSize: 14, fontWeight: "600" },
  sheetCheck: { color: T.brand, fontSize: 16, fontWeight: "800" },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: T.border,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: { backgroundColor: T.brand, borderColor: T.brand },
  chipText: { color: T.textMuted, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: "#FFFFFF" },

  card: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: { color: T.text, fontSize: 15, fontWeight: "800" },
  cardMeta: { color: T.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  link: { color: T.brand, fontWeight: "700", fontSize: 12 },

  infoCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 },
  infoTitle: { fontSize: 12, fontWeight: "800" },

  empty: { alignItems: "center", paddingVertical: 34, paddingHorizontal: 16, gap: 4 },
  emptyIcon: { fontSize: 30, color: T.textFaint, marginBottom: 6 },
  emptyTitle: { color: T.text, fontWeight: "700", fontSize: 14 },

  stat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 13,
    padding: 11,
    alignItems: "center",
  },
  statNumber: { color: "#FFFFFF", fontSize: 19, fontWeight: "800" },
  statLabel: { color: T.brandTintSoft, fontSize: 10, marginTop: 2 },

  timer: {
    backgroundColor: T.dark,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 3,
  },
  timerText: { color: T.success, fontSize: 11, fontWeight: "800" },
  bigTimer: { borderRadius: 14, padding: 12, marginTop: 10 },
  bigTimerText: { color: T.success, fontSize: 26, fontWeight: "800", letterSpacing: 2, marginTop: 4 },

  status: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  statusTime: { fontSize: 12, fontWeight: "700", color: T.text },
  statusIcons: { fontSize: 11, color: T.textMuted },

  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pageTitle: { fontSize: 19, fontWeight: "800", color: T.text },

  segment: {
    flexDirection: "row",
    backgroundColor: "#E8E8E8",
    padding: 3,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  segmentItemActive: { backgroundColor: "#FFFFFF" },
  segmentText: { color: T.textMuted, fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: T.brand },

  stepper: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  stepItem: { alignItems: "center", flex: 1 },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  stepCircleActive: { borderColor: T.brand, backgroundColor: T.brand },
  stepCircleText: { fontSize: 11, color: T.textMuted, fontWeight: "700" },
  stepLabel: { fontSize: 9, color: T.textFaint, marginTop: 5, textAlign: "center" },
  stepLabelActive: { color: T.brand, fontWeight: "700" },

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F5",
  },
  kvLabel: { color: T.textMuted, fontSize: 12, flexShrink: 0 },
  kvValue: { color: T.text, fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },

  fab: {
    position: "absolute",
    right: 16,
    bottom: 96,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: T.brand,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: T.brand,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  fabText: { color: "#FFFFFF", fontSize: 28, marginTop: -2 },
});
