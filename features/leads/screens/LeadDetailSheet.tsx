import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useMemo } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { LEAD_DETAIL_WITH_TIMELINE } from "@/core/graphql/queries";
import { useTheme } from "@/core/theme/ThemeProvider";

type Props = {
  leadId: string | null;
  visible: boolean;
  onClose: () => void;
};

export default function LeadDetailSheet({ leadId, visible, onClose }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const { data, loading, refetch } = useQuery(LEAD_DETAIL_WITH_TIMELINE, {
    variables: { leadId: leadId!, eventsLimit: 30 },
    skip: !leadId || !visible,
    fetchPolicy: "cache-and-network",
  });

  const lead = data?.leadDetailWithTimeline;

  const title = lead?.name || "Lead details";

  const primaryPhone = useMemo(() => {
    if (!lead?.phones?.length) return lead?.phone;
    const primary = lead.phones.find((p: any) => p.isPrimary) ?? lead.phones[0];
    return primary?.number ?? lead?.phone;
  }, [lead]);

  const openTel = async (phone?: string | null) => {
    if (!phone) return;
    const normalized = (phone || "").replace(/\s|[-()]/g, "");
    const url = `tel:${normalized}`;
    if (await Linking.canOpenURL(url)) Linking.openURL(url);
  };

  const openWhatsApp = async (phone?: string | null) => {
    if (!phone) return;
    const normalized = (phone || "").replace(/\s|[-()]/g, "");
    const url = `whatsapp://send?phone=${normalized}`;
    if (await Linking.canOpenURL(url)) Linking.openURL(url);
  };

  const openEmail = async (email?: string | null) => {
    if (!email) return;
    const url = `mailto:${email}`;
    if (await Linking.canOpenURL(url)) Linking.openURL(url);
  };

  const copy = async (value?: string | null) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* header */}
          <View style={styles.header}>
            <Text size="lg" weight="bold">{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          {loading && (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          )}

          {!loading && !lead && (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <Text tone="muted">Unable to load lead.</Text>
            </View>
          )}

          {!!lead && (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {/* Quick facts */}
              <Card style={styles.card}>
                <Text weight="semibold" style={styles.sectionTitle}>Quick info</Text>
                <View style={styles.row}>
                  <MaterialIcons name="phone" size={18} color={theme.colors.primary} />
                  <Text style={styles.rowText}>{primaryPhone || "Not captured"}</Text>
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => openTel(primaryPhone)} style={styles.iconBtn}>
                      <MaterialIcons name="call" size={18} color="#fff" />
                    </Pressable>
                    <Pressable onPress={() => openWhatsApp(primaryPhone)} style={styles.iconBtn}>
                      <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
                    </Pressable>
                    <Pressable onPress={() => copy(primaryPhone)} style={[styles.iconBtn, { backgroundColor: theme.colors.muted }]}>
                      <MaterialIcons name="content-copy" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>

                {lead.email ? (
                  <View style={styles.row}>
                    <MaterialIcons name="email" size={18} color={theme.colors.primary} />
                    <Text style={styles.rowText}>{lead.email}</Text>
                    <View style={styles.rowActions}>
                      <Pressable onPress={() => openEmail(lead.email)} style={styles.iconBtn}>
                        <MaterialIcons name="send" size={18} color="#fff" />
                      </Pressable>
                      <Pressable onPress={() => copy(lead.email)} style={[styles.iconBtn, { backgroundColor: theme.colors.muted }]}>
                        <MaterialIcons name="content-copy" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {lead.location ? (
                  <View style={styles.row}>
                    <MaterialIcons name="location-on" size={18} color={theme.colors.primary} />
                    <Text style={styles.rowText}>{lead.location}</Text>
                  </View>
                ) : null}
              </Card>

              {/* Meta */}
              <Card style={styles.card}>
                <Text weight="semibold" style={styles.sectionTitle}>Lead meta</Text>
                <Meta line1="Lead code" line2={lead.leadCode || "—"} />
                <Meta line1="Stage" line2={slugToLabel(lead.clientStage)} />
                <Meta line1="Status" line2={lead.status} />
                <Meta line1="Lead source" line2={lead.leadSource || "—"} />
                {lead.referralName ? <Meta line1="Referral" line2={lead.referralName} /> : null}
                {lead.nextActionDueAt ? <Meta line1="Next follow-up" line2={new Date(lead.nextActionDueAt).toLocaleString()} /> : null}
              </Card>

              {/* Product/Investment */}
              <Card style={styles.card}>
                <Text weight="semibold" style={styles.sectionTitle}>Product & Investment</Text>
                <Meta line1="Product" line2={lead.product || "Not specified"} />
                <Meta line1="Investment range" line2={lead.investmentRange || "Not captured"} />
                {typeof lead.sipAmount === "number" ? <Meta line1="SIP (₹/mo)" line2={String(lead.sipAmount)} /> : null}
              </Card>

              {/* Remarks / Bio */}
              {(lead.remark || lead.bioText) ? (
                <Card style={styles.card}>
                  <Text weight="semibold" style={styles.sectionTitle}>Remarks</Text>
                  {lead.remark ? <Text style={{ marginTop: 6 }}>{String(lead.remark)}</Text> : null}
                  {lead.bioText ? <Text style={{ marginTop: 12 }} tone="muted">{lead.bioText}</Text> : null}
                </Card>
              ) : null}

              {/* Client QA */}
              {!!lead.clientQa?.length && (
                <Card style={styles.card}>
                  <Text weight="semibold" style={styles.sectionTitle}>Client Q&A</Text>
                  {lead.clientQa.map((qa: any) => (
                    <View key={qa.question} style={{ marginTop: 10 }}>
                      <Text weight="semibold">{qa.question}</Text>
                      <Text tone="muted" style={{ marginTop: 2 }}>{qa.answer || "—"}</Text>
                    </View>
                  ))}
                </Card>
              )}

              {/* Account application */}
              {!!lead.accountApps?.length && (
                <Card style={styles.card}>
                  <Text weight="semibold" style={styles.sectionTitle}>Account application</Text>
                  {lead.accountApps.map((a: any) => (
                    <Meta
                      key={a.id}
                      line1={`${a.applicationStatus} / KYC ${a.kycStatus}`}
                      line2={
                        a.approvedAt
                          ? `Approved ${new Date(a.approvedAt).toLocaleDateString()}`
                          : a.declinedAt
                          ? `Declined ${new Date(a.declinedAt).toLocaleDateString()}`
                          : a.reviewedAt
                          ? `Reviewed ${new Date(a.reviewedAt).toLocaleDateString()}`
                          : a.submittedAt
                          ? `Submitted ${new Date(a.submittedAt).toLocaleDateString()}`
                          : "—"
                      }
                    />
                  ))}
                </Card>
              )}

              {/* Timeline */}
              {!!lead.events?.length && (
                <Card style={[styles.card, { marginBottom: 24 }]}>
                  <Text weight="semibold" style={styles.sectionTitle}>Timeline</Text>
                  {lead.events.map((ev: any) => (
                    <View key={ev.id} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={{ flex: 1 }}>
                        <Text weight="semibold">{prettyType(ev.type)}</Text>
                        {ev.text ? <Text style={{ marginTop: 2 }} tone="muted">{ev.text}</Text> : null}
                        <Text size="sm" tone="muted" style={{ marginTop: 2 }}>
                          {new Date(ev.occurredAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </Card>
              )}
            </ScrollView>
          )}

          {/* Footer refresh */}
          {!!lead && (
            <View style={styles.footer}>
              <Pressable onPress={() => refetch()} style={styles.footerBtn}>
                <MaterialIcons name="refresh" size={18} color="#fff" />
                <Text weight="bold" size="sm" style={{ color: "#fff", marginLeft: 6 }}>Refresh</Text>
              </Pressable>
              <Pressable onPress={() => openTel(primaryPhone)} style={[styles.footerBtn, { backgroundColor: theme.colors.success }]}>
                <MaterialIcons name="call" size={18} color="#fff" />
                <Text weight="bold" size="sm" style={{ color: "#fff", marginLeft: 6 }}>Call</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function slugToLabel(stage?: string | null) {
  const s = (stage ?? "NEW_LEAD").split("_");
  return s.map(x => x.charAt(0) + x.slice(1).toLowerCase()).join(" ");
}

function prettyType(t: string) {
  return slugToLabel(t);
}

function Meta({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text size="sm" tone="muted">{line1}</Text>
      <Text>{line2}</Text>
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "92%",
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    card: { padding: theme.spacing.md },
    sectionTitle: { marginBottom: 6 },
    row: {
      flexDirection: "row", alignItems: "center",
      marginTop: 8, gap: 10,
    },
    rowText: { flex: 1 },
    rowActions: { flexDirection: "row", gap: 8 },
    iconBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14,
    },
    timelineItem: {
      flexDirection: "row", gap: 12, marginTop: 10,
    },
    timelineDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginTop: 6,
    },
    footer: {
      padding: theme.spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      flexDirection: "row",
      gap: 10,
      justifyContent: "flex-end",
    },
    footerBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 18,
      paddingHorizontal: 14, paddingVertical: 10,
      flexDirection: "row", alignItems: "center",
    },
  });
