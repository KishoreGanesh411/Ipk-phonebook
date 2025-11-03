import { useQuery } from '@apollo/client/react';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { LEADS_BY_STAGE_QUERY, STAGE_SUMMARY_QUERY } from '@/core/graphql/queries';
import { useTheme } from '@/core/theme/ThemeProvider';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCallStore } from '@/features/phone/store/call.store';
import type { ActiveLeadSnapshot } from '@/features/phone/store/call.store';
import LeadDetailSheet from './LeadDetailSheet';
import type { LeadItem, StageKey } from './type';

const stageOrder: StageKey[] = [
  'NEW_LEAD',
  'FIRST_TALK_DONE',
  'FOLLOWING_UP',
  'CLIENT_INTERESTED',
  'ACCOUNT_OPENED',
  'NO_RESPONSE_DORMANT',
  'NOT_INTERESTED_DORMANT',
  'RISKY_CLIENT_DORMANT',
  'HIBERNATED',
];

const slugToLabel = (stage?: StageKey | null) =>
  (stage ?? 'NEW_LEAD')
    .split('_')
    .map((s) => s.charAt(0) + s.slice(1).toLowerCase())
    .join(' ');

export function StageLeadsScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const user = useAuthStore((s) => s.user);
  const [selectedStage, setSelectedStage] = useState<StageKey>('NEW_LEAD');
  const startCall = useCallStore((state) => state.startCall);

  const [simPicker, setSimPicker] = useState<{ visible: boolean; lead: LeadItem | null }>(
    { visible: false, lead: null }
  );

  // detail sheet state
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const { data: stageData, loading: summaryLoading, refetch: refetchSummary } = useQuery(STAGE_SUMMARY_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const leadArgs = useMemo(() => {
    const args: Record<string, any> = { page: 1, pageSize: 20 };
    if (user?.role === 'RM' && user?.id) {
      args.assignedRmId = user.id;
    }
    return args;
  }, [user?.role, user?.id]);

  const { data: leadsData, loading: leadsLoading, refetch: refetchLeads } = useQuery(
    LEADS_BY_STAGE_QUERY,
    {
      variables: { stage: selectedStage, args: leadArgs },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-and-network',
    }
  );

  // Pull-to-refresh both summary and current leads
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchSummary(), refetchLeads()]);
    } finally {
      setRefreshing(false);
    }
  };

  const stages: { key: StageKey; count: number }[] = useMemo(() => {
    const items: { stage: StageKey; count: number }[] =
      stageData?.leadStageSummary?.items ?? [];
    const map = new Map<StageKey, number>();
    items.forEach((item: any) => {
      map.set(item.stage as StageKey, Number(item.count));
    });
    return stageOrder.map((key) => ({ key, count: map.get(key) ?? 0 }));
  }, [stageData]);

  const leads: LeadItem[] = useMemo(() => {
    return (leadsData?.leadsByStage?.items ?? []).slice();
  }, [leadsData]);

  const requestCallPermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        {
          title: 'Phone permission',
          message: 'IPK Phonebook needs permission to place calls from your SIM.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.warn('Failed to request call permission', error);
      return false;
    }
  }, []);

  const openDialer = useCallback(async (raw: string) => {
    const normalized = raw?.replace(/\s|[-()]/g, '');
    if (!normalized) return;
    const scheme = Platform.OS === 'ios' ? `telprompt:${normalized}` : `tel:${normalized}`;
    try {
      const supported = await Linking.canOpenURL(scheme);
      if (supported) {
        await Linking.openURL(scheme);
      }
    } catch (error) {
      console.warn('Unable to open native dialer', error);
    }
  }, []);

  const beginCall = useCallback(
    async (lead: LeadItem, simLabel: string) => {
      const hasPermission = await requestCallPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission needed',
          'Enable phone permissions in Settings to place calls from the app.'
        );
        return;
      }

      const snapshot: ActiveLeadSnapshot = {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        clientStage: lead.clientStage ?? selectedStage,
        status: lead.status,
        leadSource: lead.leadSource,
        leadCode: lead.leadCode,
        assignedRM: lead.assignedRM,
        assignedRmId: lead.assignedRmId,
        lastContactedAt: lead.lastContactedAt,
        nextActionDueAt: lead.nextActionDueAt,
        selectedSim: simLabel,
      };

      startCall(lead.phone, snapshot);
      await openDialer(lead.phone);
    },
    [openDialer, requestCallPermission, selectedStage, startCall]
  );

  const handleCallPress = useCallback((lead: LeadItem) => {
    setSimPicker({ visible: true, lead });
  }, []);

  const handleSimSelection = useCallback(
    async (option: string | null) => {
      if (!option || !simPicker.lead) {
        setSimPicker({ visible: false, lead: null });
        return;
      }
      const lead = simPicker.lead;
      setSimPicker({ visible: false, lead: null });
      await beginCall(lead, option);
    },
    [beginCall, simPicker.lead]
  );

  const openLead = (id: string) => {
    setDetailId(id);
    setSheetVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text size="lg" weight="bold">Tap type of leads</Text>
          <Text tone="muted" size="sm">
            Role: {user?.role ?? 'Unknown'} {user?.role === 'RM' ? '(My assigned leads)' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={stages}
        keyExtractor={(it) => it.key}
        contentContainerStyle={styles.stageRow}
        renderItem={({ item }) => {
          const active = item.key === selectedStage;
          return (
            <Pressable
              onPress={() => setSelectedStage(item.key)}
              style={[styles.stageCard, active && styles.stageCardActive]}
            >
              <Text
                size="sm"
                weight={active ? 'bold' : 'semibold'}
                style={[styles.stageLabel, active && styles.stageLabelActive]}
              >
                {slugToLabel(item.key)}
              </Text>
              <Text style={[styles.stageCount, active && styles.stageCountActive]}>
                {item.count}
              </Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={summaryLoading ? (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null}
      />

      <FlatList
        data={leads}
        keyExtractor={(it) => it.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const initials = (item.name ?? 'NA')
            .split(' ')
            .filter(Boolean)
            .map((chunk) => chunk[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
          return (
            <Card style={styles.leadCard}>
              <Pressable style={styles.leadBody} onPress={() => openLead(item.id)}>
                <View style={styles.leadHeader}>
                  <View style={styles.leadAvatar}>
                    <Text weight="bold" style={styles.leadAvatarText}>
                      {initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold" style={styles.leadName} numberOfLines={1}>
                      {item.name ?? 'Unnamed lead'}
                    </Text>
                    <Text size="sm" tone="muted" numberOfLines={1}>
                      {item.leadCode ? `${item.leadCode} • ` : ''}
                      {item.phone}
                    </Text>
                  </View>
                  <View style={styles.stagePill}>
                    <Text style={styles.stagePillText}>{slugToLabel(item.clientStage)}</Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <MetaRow label="Status" value={item.status} />
                  <MetaRow label="Lead source" value={item.leadSource} />
                  <MetaRow
                    label="Last contact"
                    value={formatDateTime(item.lastContactedAt)}
                  />
                  <MetaRow
                    label="Next follow-up"
                    value={formatDateTime(item.nextActionDueAt)}
                  />
                  <MetaRow label="Assigned RM" value={item.assignedRM} />
                  <MetaRow label="Investment" value={item.investmentRange} />
                </View>
              </Pressable>

              <View style={styles.leadFooter}>
                <Text size="sm" tone="muted">
                  Tap to review details or place a call
                </Text>
                <TouchableOpacity
                  style={styles.callButton}
                  activeOpacity={0.85}
                  onPress={() => handleCallPress(item)}
                >
                  <MaterialIcons name="call" size={18} color="#fff" />
                  <Text weight="bold" size="sm" style={styles.callButtonLabel}>
                    Call
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={(
          <View style={{ padding: 24, alignItems: 'center' }}>
            {leadsLoading ? <ActivityIndicator /> : <Text tone="muted">No leads found for this stage.</Text>}
          </View>
        )}
      />

      {/* Detail bottom sheet */}
      <LeadDetailSheet
        leadId={detailId}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />

      <SimPickerModal
        visible={simPicker.visible}
        lead={simPicker.lead}
        onDismiss={() => setSimPicker({ visible: false, lead: null })}
        onSelect={handleSimSelection}
      />
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    stageRow: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: 12,
    },
    stageCard: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginRight: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      minWidth: 160,
    },
    stageCardActive: {
      borderColor: theme.colors.primary,
      backgroundColor: 'rgba(70,95,255,0.08)',
    },
    stageLabel: {
      textTransform: 'capitalize',
    },
    stageLabelActive: {
      color: theme.colors.primary,
    },
    stageCount: {
      marginTop: 12,
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    stageCountActive: {
      color: theme.colors.primary,
    },
    list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, gap: theme.spacing.md },
    leadCard: {
      padding: theme.spacing.md,
      borderRadius: 16,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    leadBody: {
      gap: 16,
    },
    leadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    leadAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(79,70,229,0.12)',
    },
    leadAvatarText: {
      color: theme.colors.primary,
    },
    leadName: {
      fontSize: 16,
    },
    stagePill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'rgba(79,70,229,0.12)',
    },
    stagePillText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    metaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 16,
      rowGap: 12,
    },
    leadFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.success,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 6,
    },
    callButtonLabel: {
      color: '#fff',
    },
    simOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15,23,42,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    simCard: {
      width: '100%',
      borderRadius: 20,
      padding: 20,
      backgroundColor: theme.colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      gap: 16,
    },
    simHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    simOptions: {
      gap: 12,
    },
    simOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    simOptionText: {
      fontWeight: '600',
    },
    simCancel: {
      marginTop: 4,
      alignItems: 'center',
      paddingVertical: 10,
    },
  });

export default StageLeadsScreen;

type MetaRowProps = {
  label: string;
  value?: string | number | null;
};

const MetaRow = ({ label, value }: MetaRowProps) => {
  const theme = useTheme();
  if (!value) return null;
  return (
    <View style={{ width: '48%', flexBasis: '48%', flexGrow: 1 }}>
      <Text
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: theme.colors.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          marginTop: 4,
          color: theme.colors.text,
          fontWeight: '600',
        }}
      >
        {value}
      </Text>
    </View>
  );
};

const formatDateTime = (input?: string | null) => {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

type SimPickerModalProps = {
  visible: boolean;
  lead: LeadItem | null;
  onDismiss: () => void;
  onSelect: (option: string | null) => void;
};

const simOptions = [
  { key: 'SIM 1', subtitle: 'Primary line' },
  { key: 'SIM 2', subtitle: 'Secondary line' },
];

const SimPickerModal = ({ visible, lead, onDismiss, onSelect }: SimPickerModalProps) => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.simOverlay} onPress={onDismiss}>
        <Pressable style={styles.simCard} onPress={() => {}}>
          <View style={styles.simHeader}>
            <View>
              <Text weight="semibold">Choose SIM</Text>
              <Text size="sm" tone="muted">
                {lead?.name ?? 'Unknown lead'}
              </Text>
            </View>
            <Pressable onPress={onDismiss} accessibilityLabel="Close">
              <MaterialIcons name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <View style={styles.simOptions}>
            {simOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                activeOpacity={0.85}
                style={styles.simOption}
                onPress={() => onSelect(option.key)}
              >
                <View>
                  <Text style={styles.simOptionText}>{option.key}</Text>
                  <Text size="sm" tone="muted">{option.subtitle}</Text>
                </View>
                <MaterialIcons name="sim-card" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.simCancel} onPress={() => onSelect(null)}>
            <Text tone="muted">Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
