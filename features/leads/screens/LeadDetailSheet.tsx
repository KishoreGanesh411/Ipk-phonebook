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
              {/* Overview */}
              <Card style={[styles.card, styles.summaryCard]}>
                <Text weight="semibold" style={styles.sectionTitle}>Lead snapshot</Text>
                <View style={styles.summaryHeader}>
                  <View style={{ flex: 1 }}>
                    <Text weight="bold" size="lg">{lead.name ?? 'Lead profile'}</Text>
                    <Text size="sm" tone="muted">{lead.leadCode ?? lead.id}</Text>
                  </View>
                  <View style={styles.summaryBadges}>
                    <SummaryChip icon="flag" label={slugToLabel(lead.clientStage)} />
                    <SummaryChip icon="verified" label={lead.status} tone="success" />
                    <SummaryChip icon="campaign" label={lead.leadSource} />
                  </View>
                </View>

                <View style={styles.summaryGrid}>
                  <SummaryItem label="Assigned RM" value={lead.assignedRM || 'Unassigned'} />
                  <SummaryItem label="Last contact" value={formatDateTime(lead.lastContactedAt)} />
                  <SummaryItem label="Next follow-up" value={formatDateTime(lead.nextActionDueAt)} />
                  <SummaryItem label="Referral" value={lead.referralName} />
                </View>
              </Card>

              {/* Contact */}
              <Card style={styles.card}>
                <Text weight="semibold" style={styles.sectionTitle}>Contact</Text>
                <View style={[styles.contactRow, { marginTop: 0 }]}>
                  <View style={styles.contactIcon}>
                    <MaterialIcons name="phone" size={18} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold">{primaryPhone || 'Not captured'}</Text>
                    <Text size="sm" tone="muted">Primary number</Text>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => openTel(primaryPhone)} style={styles.iconBtn}>
                      <MaterialIcons name="call" size={18} color="#fff" />
                    </Pressable>
                    <Pressable onPress={() => openWhatsApp(primaryPhone)} style={styles.iconBtn}>
                      <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => copy(primaryPhone)}
                      style={[styles.iconBtn, { backgroundColor: theme.colors.muted }]}
                    >
                      <MaterialIcons name="content-copy" size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>

                {lead.email ? (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIcon}>
                      <MaterialIcons name="email" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="semibold">{lead.email}</Text>
                      <Text size="sm" tone="muted">Email</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pressable onPress={() => openEmail(lead.email)} style={styles.iconBtn}>
                        <MaterialIcons name="send" size={18} color="#fff" />
                      </Pressable>
                      <Pressable
                        onPress={() => copy(lead.email)}
                        style={[styles.iconBtn, { backgroundColor: theme.colors.muted }]}
                      >
                        <MaterialIcons name="content-copy" size={16} color="#fff" />
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {lead.location ? (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIcon}>
                      <MaterialIcons name="location-on" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="semibold">{lead.location}</Text>
                      <Text size="sm" tone="muted">Location</Text>
                    </View>
                  </View>
                ) : null}
              </Card>

              {/* Product/Investment */}
              <Card style={styles.card}>
                <Text weight="semibold" style={styles.sectionTitle}>Product & Investment</Text>
                <DetailRow label="Product" value={lead.product || "Not specified"} />
                <DetailRow
                  label="Investment range"
                  value={lead.investmentRange || "Not captured"}
                />
                {typeof lead.sipAmount === "number" ? (
                  <DetailRow label="SIP (₹/mo)" value={`₹${lead.sipAmount.toLocaleString()}`} />
                ) : null}
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
                  {lead.accountApps.map((a: any) => {
                    const statusLabel = `${a.applicationStatus} / KYC ${a.kycStatus}`;
                    const timeline =
                      formatDateTime(a.approvedAt) ||
                      formatDateTime(a.declinedAt) ||
                      formatDateTime(a.reviewedAt) ||
                      formatDateTime(a.submittedAt) ||
                      '—';
                    return (
                      <View key={a.id} style={styles.applicationRow}>
                        <Text weight="semibold">{statusLabel}</Text>
                        <Text size="sm" tone="muted" style={{ marginTop: 2 }}>
                          {timeline}
                        </Text>
                      </View>
                    );
                  })}
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
                          {formatDateTime(ev.occurredAt) ?? '—'}
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

const formatDateTime = (input?: string | null) => {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ width: '48%', flexBasis: '48%', flexGrow: 1 }}>
      <Text
        size="sm"
        tone="muted"
        style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 11 }}
      >
        {label}
      </Text>
      <Text weight="semibold" style={{ marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={{ marginTop: 10 }}>
      <Text size="sm" tone="muted">{label}</Text>
      <Text style={{ marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function SummaryChip({
  icon,
  label,
  tone = 'default',
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label?: string | null;
  tone?: 'default' | 'success';
}) {
  const theme = useTheme();
  if (!label) return null;
  const background =
    tone === 'success' ? 'rgba(34,197,94,0.16)' : 'rgba(79,70,229,0.12)';
  const color = tone === 'success' ? '#15803D' : theme.colors.primary;
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: background,
    }}>
      <MaterialIcons name={icon} size={16} color={color} />
      <Text style={{ color, fontWeight: '600', fontSize: 12 }}>{label}</Text>
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
    card: { padding: theme.spacing.md, borderRadius: 16 },
    sectionTitle: { marginBottom: 12 },
    summaryCard: {
      backgroundColor: theme.scheme === 'dark' ? '#0F172A' : '#F8FAFF',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 16,
    },
    summaryBadges: {
      gap: 8,
      alignItems: 'flex-end',
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 12,
    },
    contactIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(79,70,229,0.12)',
    },
    rowActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 14,
    },
    applicationRow: {
      marginTop: 10,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
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
