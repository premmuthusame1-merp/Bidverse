/**
 * Cross-platform dialogs.
 *
 * React Native Web does not implement `Alert.alert`, so every confirmation and
 * chooser in the app goes through this tiny imperative action sheet. It renders
 * one host component mounted in the root layout and can be triggered from any
 * module (including store logic) without prop drilling.
 */
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { T } from "@/lib/theme";

export interface SheetOption {
  label: string;
  tone?: "default" | "danger" | "brand";
  onPress?: () => void;
}

export interface SheetConfig {
  title: string;
  message?: string;
  options: SheetOption[];
  cancelLabel?: string | null;
}

type Listener = (config: SheetConfig | null) => void;

let listener: Listener | null = null;
let queue: SheetConfig | null = null;

export function showSheet(config: SheetConfig) {
  if (listener) {
    listener(config);
  } else {
    queue = config;
  }
}

/** Simple informational dialog. */
export function notify(title: string, message?: string) {
  showSheet({ title, message, options: [{ label: "OK", tone: "brand" }], cancelLabel: null });
}

/** Confirmation with a destructive default. */
export function confirmAction(title: string, message: string, onConfirm: () => void, confirmLabel = "Confirm") {
  showSheet({
    title,
    message,
    options: [{ label: confirmLabel, tone: "danger", onPress: onConfirm }],
    cancelLabel: "Cancel",
  });
}

/** Chooser used for "extend by N days" style flows. */
export function choose(title: string, message: string, options: SheetOption[]) {
  showSheet({ title, message, options, cancelLabel: "Cancel" });
}

export function ActionSheetHost() {
  const [config, setConfig] = useState<SheetConfig | null>(null);

  useEffect(() => {
    listener = (next) => {
      if (next) setConfig(next);
      else setConfig(null);
    };
    if (queue) {
      setConfig(queue);
      queue = null;
    }
    return () => {
      listener = null;
    };
  }, []);

  const close = () => setConfig(null);

  return (
    <Modal visible={Boolean(config)} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{config?.title}</Text>
          {config?.message ? (
            <ScrollView style={{ maxHeight: 220 }}>
              <Text style={styles.message}>{config.message}</Text>
            </ScrollView>
          ) : null}
          <View style={{ marginTop: 14, gap: 8 }}>
            {config?.options.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  close();
                  option.onPress?.();
                }}
                style={({ pressed }) => [
                  styles.option,
                  option.tone === "danger" && styles.optionDanger,
                  option.tone === "brand" && styles.optionBrand,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.tone === "danger" && { color: "#FFFFFF" },
                    option.tone === "brand" && { color: "#FFFFFF" },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
            {config?.cancelLabel !== null ? (
              <Pressable onPress={close} style={styles.cancel}>
                <Text style={styles.cancelText}>{config?.cancelLabel ?? "Cancel"}</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(16,24,32,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 26,
    maxHeight: "85%",
  },
  handle: { width: 44, height: 4, borderRadius: 2, backgroundColor: "#DDE1E1", alignSelf: "center", marginBottom: 14 },
  title: { fontSize: 17, fontWeight: "800", color: T.text },
  message: { fontSize: 13, color: T.textMuted, marginTop: 8, lineHeight: 19 },
  option: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  optionDanger: { backgroundColor: T.danger, borderColor: T.danger },
  optionBrand: { backgroundColor: T.brand, borderColor: T.brand },
  optionText: { fontSize: 14, fontWeight: "800", color: T.text },
  cancel: { paddingVertical: 12, alignItems: "center" },
  cancelText: { color: T.textMuted, fontWeight: "700", fontSize: 13 },
});
