import { ComponentProps, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/core/theme/ThemeProvider";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  leadCatalogue,
  leadCategories,
  type Lead,
  type LeadCategory,
} from "@/features/home/data/leadData";
import { ProfileModal } from "@/features/home/components";
import { humanizeEnum } from "@/core/utils/format";

const quickActions: Array<{
  id: string;
  label: string;
  description: string;
  icon: ComponentProps<typeof MaterialIcons>["name"];
}> = [
  {
    id: "all-leads",
    label: "All Leads",
    description: "View every active relationship",
    icon: "group",
  },
  {
    id: "today-followups",
    label: "Today's Follow-ups",
    description: "Calls and tasks due today",
    icon: "today",
  },
];

export const HomeDashboardScreen = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { width } = useWindowDimensions();
  const horizontalPagerRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const user = useAuthStore((state) => state.user);

  const displayName = user?.name ?? "IPK Wealth";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const pageWidth = Math.max(width - theme.spacing.lg * 2, 280);

  const badgePalette = useMemo(
    () => ({
      primary: {
        backgroundColor: "rgba(70, 95, 255, 0.12)",
        color: theme.colors.primary,
      },
      success: {
        backgroundColor: "rgba(18, 183, 106, 0.12)",
        color: theme.colors.success,
      },
      error: {
        backgroundColor: "rgba(240, 68, 56, 0.12)",
        color: theme.colors.error,
      },
      muted: {
        backgroundColor: "rgba(102, 112, 133, 0.12)",
        color: theme.colors.muted,
      },
    }),
    [theme.colors]
  );

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
    horizontalPagerRef.current?.scrollTo({ x: index * pageWidth, animated: true });
  };

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={styles.stickyHeader}>
          <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text weight="semibold" tone="default">
              {initials}
            </Text>
          </View>
          <View style={styles.headerCopy}>
            <Text size="sm" tone="muted">
              Welcome back
            </Text>
            <Text size="lg" weight="semibold">
              {displayName}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.smallAvatar}
              onPress={() => setProfileVisible(true)}
              accessibilityRole="button"
            >
              <MaterialIcons
                name="person-outline"
                size={18}
                color={theme.colors.primary}
              />
            </Pressable>
            <View style={styles.smallAvatar}>
              <MaterialIcons
                name="verified-user"
                size={18}
                color={theme.colors.primary}
              />
            </View>
          </View>
          </View>

        <Card style={styles.quickCard}>
          <Text size="md" weight="semibold" style={styles.quickTitle}>
            Workspace shortcuts
          </Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <Pressable key={action.id} style={styles.quickAction}>
                <View style={styles.quickIcon}>
                  <MaterialIcons
                    name={action.icon}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.quickContent}>
                  <Text weight="semibold">{action.label}</Text>
                  <Text tone="muted" size="sm">
                    {action.description}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.muted}
                />
              </Pressable>
            ))}
          </View>
        </Card>
        </View>

        <View style={styles.pipelineHeader}>
          <Text size="lg" weight="bold">
            Lead pipeline
          </Text>
          <Text tone="muted" size="sm">
            Swipe through key segments and follow up faster.
          </Text>
        </View>

        {/* Category selector button */}
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={styles.selectorButton}
          accessibilityRole="button"
        >
          <Text weight="semibold" style={{ flex: 1 }}>
            {humanizeEnum(leadCategories[activeIndex] as string)}
          </Text>
          <View
            style={[
              styles.countCircle,
              {
                borderColor: theme.colors.success,
                backgroundColor: theme.scheme === "dark" ? "rgba(16,185,129,0.15)" : "transparent",
              },
            ]}
          >
            <Text weight="bold" style={styles.countCircleText}>
              {leadCatalogue[leadCategories[activeIndex]].length}
            </Text>
          </View>
          <MaterialIcons name="expand-more" size={22} color={theme.colors.muted} />
        </Pressable>

        {/* Quick access chips for Pending/Missed Calls */}
        <View style={styles.quickStatusRow}>
          {(() => {
            const label = "Pending Calls" as const;
            const index = leadCategories.indexOf(label);
            const count = index >= 0 ? (leadCatalogue[label]?.length ?? 0) : 0;
            if (index < 0) return null;
            return (
              <Pressable
                key={label}
                onPress={() => handleTabPress(index)}
                style={[styles.quickChip, styles.quickChipPending, theme.scheme === "dark" && { backgroundColor: "#0C111D" }]}
              >
                <Text weight="medium" style={{ flex: 1 }}>Pending Calls</Text>
                <View
                  style={[
                    styles.countCircle,
                    {
                      borderColor: theme.colors.primary,
                      backgroundColor: theme.scheme === "dark" ? "rgba(59,130,246,0.15)" : "transparent",
                    },
                  ]}
                >
                  <Text weight="bold" style={styles.countCircleText}>{count}</Text>
                </View>
              </Pressable>
            );
          })()}
          {(() => {
            const label = "Missed Calls" as const;
            const index = leadCategories.indexOf(label);
            const count = index >= 0 ? (leadCatalogue[label]?.length ?? 0) : 0;
            if (index < 0) return null;
            return (
              <Pressable
                key={label}
                onPress={() => handleTabPress(index)}
                style={[styles.quickChip, styles.quickChipMissed, theme.scheme === "dark" && { backgroundColor: "#0C111D" }]}
              >
                <Text weight="medium" style={{ flex: 1 }}>Missed Calls</Text>
                <View
                  style={[
                    styles.countCircle,
                    {
                      borderColor: theme.colors.error,
                      backgroundColor: theme.scheme === "dark" ? "rgba(239,68,68,0.15)" : "transparent",
                    },
                  ]}
                >
                  <Text weight="bold" style={styles.countCircleText}>{count}</Text>
                </View>
              </Pressable>
            );
          })()}
        </View>

        {/* Category picker modal */}
        <Modal
          visible={pickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPickerOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)} />
          <View style={styles.modalSheet}>
            <Text size="md" weight="semibold" style={{ marginBottom: 8 }}>
              Select pipeline
            </Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {leadCategories.map((category, index) => {
                if (category === "Pending Calls" || category === "Missed Calls") {
                  // These are shown as quick chips below; skip in selector list
                  return null;
                }
                const isActive = index === activeIndex;
                const count = leadCatalogue[category]?.length ?? 0;
                return (
                  <Pressable
                    key={category}
                    onPress={() => {
                      setPickerOpen(false);
                      handleTabPress(index);
                    }}
                    style={[styles.optionRow, isActive && styles.optionRowActive]}
                  >
                    <Text weight={isActive ? "semibold" : "medium"}>
                      {humanizeEnum(category as string)}
                    </Text>
                    <View
                      style={[
                        styles.countCircle,
                        {
                          borderColor: theme.colors.success,
                          backgroundColor: theme.scheme === "dark" ? "rgba(16,185,129,0.15)" : "transparent",
                        },
                      ]}
                    >
                      <Text weight="bold" style={styles.countCircleText}>{count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Modal>

        <View style={styles.carouselWrapper}>
          <ScrollView
            ref={horizontalPagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={[styles.carousel, { width: pageWidth }]}
            contentContainerStyle={styles.carouselContent}
            onMomentumScrollEnd={handleMomentumEnd}
            scrollEventThrottle={16}
          >
            {leadCategories.map((category: LeadCategory) => (
              <View
                key={category}
                style={[styles.carouselPage, { width: pageWidth }]}
              >
                <Text tone="muted" size="sm" style={styles.pageCaption}>
                  {leadCatalogue[category].length} records - {humanizeEnum(category)}
                </Text>
                {leadCatalogue[category].map((lead: Lead) => {
                  const palette = badgePalette[lead.tone];
                  return (
                    <Card key={lead.id} style={styles.leadCard}>
                      <View style={styles.leadRow}>
                        <View style={styles.leadAvatar}>
                          <MaterialIcons
                            name="person"
                            size={24}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={styles.leadDetails}>
                          <Text weight="semibold">{lead.name}</Text>
                          <Text tone="muted" size="sm">
                            {lead.phone}
                          </Text>
                          {lead.company ? (
                            <Text tone="muted" size="sm">
                              {lead.company}
                            </Text>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: palette.backgroundColor },
                          ]}
                        >
                          <Text
                            size="sm"
                            weight="medium"
                            style={[styles.badgeText, { color: palette.color }]}
                          >
                            {lead.status}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
      <ProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        user={user}
      />
    </SafeAreaView>
  );
};

const getInitials = (value: string) => {
  const initials = value
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "IP";
};

const makeStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
      paddingBottom: theme.spacing.xl * 1.5,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    avatar: {
      height: 56,
      width: 56,
      borderRadius: 28,
      backgroundColor: "rgba(70, 95, 255, 0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerCopy: {
      flex: 1,
      marginLeft: theme.spacing.md,
      gap: 4,
    },
    headerIcons: {
      flexDirection: "row",
      gap: theme.spacing.xs,
    },
    smallAvatar: {
      height: 36,
      width: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.card,
    },
    quickCard: {
      gap: theme.spacing.md,
      marginTop: theme.spacing.md,
    },
    quickTitle: {
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    quickActions: {
      gap: theme.spacing.sm,
    },
    quickAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    quickIcon: {
      height: 44,
      width: 44,
      borderRadius: 22,
      backgroundColor: "rgba(70, 95, 255, 0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    quickContent: {
      flex: 1,
      gap: 2,
    },
    pipelineHeader: {
      gap: 4,
    },
    stickyHeader: {
      backgroundColor: theme.colors.background,
      zIndex: 10,
      elevation: 2,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    pillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      justifyContent: "center",
    },
    pillRowHorizontal: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: 2,
    },
    selectorButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      borderRadius: theme.radii.lg,
      gap: theme.spacing.sm,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalSheet: {
      position: "absolute",
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      top: "20%",
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    optionRowActive: {
      backgroundColor: "rgba(70,95,255,0.08)",
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: "rgba(70,95,255,0.12)",
    },
    countCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      marginRight: theme.spacing.xs,
    },
    countCircleText: {
      color: theme.scheme === "dark" ? "#E5E7EB" : "#0F172A",
      fontSize: 12,
    },
    quickStatusRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    quickChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderRadius: theme.radii.lg,
      backgroundColor: theme.colors.card,
      gap: theme.spacing.sm,
    },
    quickChipPending: {
      borderColor: theme.colors.primary,
    },
    quickChipMissed: {
      borderColor: theme.colors.error,
    },
    pill: {
      borderRadius: 999,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pillActive: {
      borderColor: theme.colors.primary,
      backgroundColor: "rgba(70, 95, 255, 0.1)",
    },
    carouselWrapper: {
      alignItems: "center",
    },
    carousel: {
      borderRadius: theme.radii.lg,
    },
    carouselContent: {
      alignItems: "stretch",
    },
    carouselPage: {
      gap: theme.spacing.sm,
    },
    pageCaption: {
      textAlign: "center",
    },
    leadCard: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    leadRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    leadAvatar: {
      height: 48,
      width: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    leadDetails: {
      flex: 1,
      gap: 2,
    },
    badge: {
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 999,
    },
    badgeText: {
      textTransform: "capitalize",
    },
  });







