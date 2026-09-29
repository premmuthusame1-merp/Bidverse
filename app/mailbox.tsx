import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { Badge, Card, EmptyState, InfoCard, TopBar, kitStyles } from "@/components/ui/kit";
import { fullDate } from "@/lib/format";
import { useApp } from "@/lib/store";
import { T } from "@/lib/theme";

/**
 * Sandbox mailbox: this build has no SMTP server, so every transactional e-mail
 * (dealer approval with the temporary password, reset codes, registration
 * confirmation) is delivered here exactly as the recipient would read it.
 */
export default function MailboxScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; identifier?: string }>();
  const { state, account, dealer } = useApp();
  const [open, setOpen] = useState<string | null>(null);

  const address = useMemo(() => {
    if (params.email) return params.email;
    if (dealer?.email) return dealer.email;
    if (params.identifier?.includes("@")) return params.identifier;
    if (account?.email) return account.email;
    const matching = account
      ? state.accounts.find(
          (a) => a.username?.toLowerCase() === params.identifier?.toLowerCase(),
        )?.email
      : undefined;
    return matching;
  }, [params.email, params.identifier, account, dealer, state.accounts]);

  const mails = useMemo(
    () =>
      state.mail
        .filter((mail) => !address || mail.to.toLowerCase() === address.toLowerCase())
        .sort((a, b) => b.sentAt - a.sentAt),
    [state.mail, address],
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F8FAFA]">
      <TopBar
        title="Mailbox"
        subtitle={address ? `Inbox for ${address}` : "All e-mails sent by BidVerse"}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={kitStyles.scroll} showsVerticalScrollIndicator={false}>
        <InfoCard
          icon="✉"
          title="Dealer e-mails land here"
          body="Approval mails carry the username and the temporary password. Password reset codes are valid for 10 minutes."
        />

        {mails.length === 0 ? (
          <Card>
            <EmptyState
              icon=""
              title="No e-mails yet"
              body={
                address
                  ? `Nothing has been sent to ${address} yet. Register a dealer or request a password reset.`
                  : "Register a dealer or request a password reset to see the mails."
              }
              action="Back"
              onAction={() => router.back()}
            />
          </Card>
        ) : null}

        {mails.map((mail) => (
          <Pressable key={mail.id} onPress={() => setOpen(open === mail.id ? null : mail.id)}>
            <Card style={mail.category === "dealer_approval" ? { borderColor: T.success } : undefined}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={kitStyles.cardTitle}>{mail.subject}</Text>
                  <Text style={kitStyles.cardMeta}>To: {mail.to}</Text>
                </View>
                <Badge
                  tone={
                    mail.category === "dealer_approval"
                      ? "verified"
                      : mail.category === "password_reset"
                        ? "special"
                        : mail.category === "dealer_rejection"
                          ? "live"
                          : "brand"
                  }
                >
                  {mail.category.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </View>
              <Text style={[kitStyles.cardMeta, { marginTop: 8 }]}>{mail.preview}</Text>
              <Text style={styles.date}>
                {fullDate(mail.sentAt)} · {open === mail.id ? "hide ▲" : "read ▼"}
              </Text>
              {open === mail.id ? <Text style={styles.body}>{mail.body}</Text> : null}
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
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
});
