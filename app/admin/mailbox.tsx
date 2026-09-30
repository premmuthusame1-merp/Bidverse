import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppShell, BrandHeader } from "@/components/app-shell";
import { Badge, Card, Chip, EmptyState, InfoCard, kitStyles } from "@/components/ui/kit";
import { fullDate } from "@/lib/format";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "dealer_approval", label: "Approvals" },
  { key: "dealer_rejection", label: "Rejections" },
  { key: "password_reset", label: "Reset codes" },
  { key: "registration", label: "Registrations" },
] as const;

export default function AdminMailboxScreen() {
  const router = useRouter();
  const { state, account, resetDemoData } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const mails = useMemo(
    () =>
      state.mail
        .filter((mail) => filter === "all" || mail.category === filter)
        .sort((a, b) => b.sentAt - a.sentAt),
    [state.mail, filter],
  );

  if (!account || account.role !== "admin") {
    return (
      <AppShell role="admin" active="mail">
        <BrandHeader title="Mailbox" />
        <EmptyState title="Super admin sign-in required" action="Go to login" onAction={() => router.replace("/auth/dealer-login")} />
      </AppShell>
    );
  }

  return (
    <AppShell role="admin" active="mail">
      <BrandHeader title="Outbound Mailbox" right={<Badge tone="brand">{state.mail.length}</Badge>} />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <InfoCard
          title="Every transactional e-mail the flows send"
          body="This sandbox has no SMTP server, so approval mails, reset codes and registration confirmations are captured here exactly as the dealer would receive them."
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {FILTERS.map((item) => (
            <Chip key={item.key} label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />
          ))}
        </ScrollView>

        {mails.length === 0 ? (
          <Card>
            <EmptyState icon="✉" title="No e-mails in this filter" body="Chip: approve a dealer or request a reset code to see the mail." />
          </Card>
        ) : null}

        {mails.map((mail) => (
          <Pressable key={mail.id} onPress={() => setOpen(open === mail.id ? null : mail.id)}>
            <Card>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={kitStyles.cardTitle}>{mail.subject}</Text>
                  <Text style={kitStyles.cardMeta}>To: {mail.to}</Text>
                </View>
                <Badge tone={mail.category === "dealer_approval" ? "verified" : mail.category === "password_reset" ? "special" : "brand"}>
                  {mail.category.replace("_", " ").toUpperCase()}
                </Badge>
              </View>
              <Text style={[kitStyles.cardMeta, { marginTop: 8 }]}>{mail.preview}</Text>
              <Text style={styles.date}>
                {fullDate(mail.sentAt)} · {open === mail.id ? "hide body ▲" : "read body ▼"}
              </Text>
              {open === mail.id ? <Text style={styles.body}>{mail.body}</Text> : null}
            </Card>
          </Pressable>
        ))}

        <Pressable onPress={resetDemoData} style={styles.reset}>
          <Text style={styles.resetText}>Reset demo data</Text>
        </Pressable>
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  chips: { gap: 8, paddingBottom: 10, paddingRight: 8 },
  date: { color: T.textFaint, fontSize: 10, marginTop: 8 },
  body: {
    marginTop: 10,
    backgroundColor: T.bg,
    borderRadius: 12,
    padding: 12,
    color: T.text,
    fontSize: 12,
    lineHeight: 18,
  },
  reset: { alignItems: "center", marginTop: 16 },
  resetText: { color: T.textMuted, fontSize: 12, textDecorationLine: "underline" },
});
