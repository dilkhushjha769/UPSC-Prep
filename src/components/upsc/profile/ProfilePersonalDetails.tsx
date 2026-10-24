/// <reference path="../../../types/react-native-fix.d.ts" />
import React, { Fragment } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Briefcase,
  Calendar,
  Edit3,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react-native';
import { BW_THEME } from '@/constants/bwTheme';
import { useStudy } from '@/context/StudyContext';

interface ProfilePersonalDetailsProps {
  isDark: boolean;
  onNavigateToTab?: (tabKey: 'overview' | 'analytics' | 'settings') => void;
}

export function ProfilePersonalDetails({
  isDark,
  onNavigateToTab,
}: ProfilePersonalDetailsProps) {
  const { config } = useStudy();
  const { width } = useWindowDimensions();
  const theme = isDark ? BW_THEME.dark : BW_THEME.light;
  const isNarrow = width < 560;

  const firstName = config.firstName || 'Dipanker';
  const lastName = config.lastName || 'Biswas';
  const fullName = `${firstName} ${lastName}`.trim() || config.aspirantName || 'Dipanker Biswas';
  const email = config.email || 'dipanker.biswas@gmail.com';
  const mobile = config.mobile || '+91-9123456780';

  // Format DOB from YYYY-MM-DD to DD/MM/YYYY
  const formatDob = (dobStr?: string) => {
    if (!dobStr) return '01/01/1990';
    const parts = dobStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dobStr;
  };

  const dobDisplay = formatDob(config.dateOfBirth);
  const gender = config.gender || 'Male';
  const residentialStatus = config.residentialStatus || 'Indian';
  const profession = config.profession || 'Self Employeed';
  const organisationName = config.organisationName || 'Zendot';
  const fatherName = config.fatherName || 'Dipanker';

  // Avatar initials
  const initials = `${firstName[0] || 'D'}${lastName[0] || 'B'}`.toUpperCase();

  const detailsList = [
    { label: 'First Name', value: firstName, icon: User },
    { label: 'Last Name', value: lastName, icon: User },
    { label: 'Email', value: email, icon: Mail },
    { label: 'Mobile', value: mobile, icon: Phone },
    { label: 'Date of Birth', value: dobDisplay, icon: Calendar },
    { label: 'Gender', value: gender, icon: User },
    { label: 'Residential status', value: residentialStatus, icon: Globe },
    { label: 'Profession', value: profession, icon: Briefcase },
    { label: 'Organisation Name', value: organisationName, icon: Briefcase },
    { label: "Father's Name", value: fatherName, icon: User },
  ];

  return (
    <View style={styles.container}>
      {/* 1. Aspirant Hero Identity Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.heroRow}>
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: theme.buttonPrimaryBg,
                borderColor: theme.cardBorder,
              },
            ]}>
            <Text style={[styles.avatarText, { color: theme.buttonPrimaryText }]}>
              {initials}
            </Text>
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.heroName, { color: theme.textPrimary }]} numberOfLines={1}>
                {fullName}
              </Text>
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: isDark ? '#1C2028' : '#F1F5F9',
                    borderColor: theme.cardBorder,
                  },
                ]}>
                <ShieldCheck size={12} color={theme.textPrimary} />
                <Text style={[styles.verifiedText, { color: theme.textPrimary }]}>
                  Verified
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={12} color={theme.textMuted} />
              <Text style={[styles.locationText, { color: theme.textSecondary }]}>
                {config.place || 'New Delhi, India'} • {residentialStatus}
              </Text>
            </View>

            <Text style={[styles.professionSub, { color: theme.textMuted }]}>
              {profession} @ {organisationName}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigateToTab?.('settings')}
            style={[
              styles.editBtn,
              {
                backgroundColor: isDark ? '#1E222B' : '#F1F5F9',
                borderColor: theme.cardBorder,
              },
            ]}>
            <Edit3 size={13} color={theme.textPrimary} />
            <Text style={[styles.editBtnText, { color: theme.textPrimary }]}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Personal Details Card (Exact Match to Screenshot) */}
      <View
        style={[
          styles.detailsCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            Personal Details
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onNavigateToTab?.('settings')}>
            <Text style={[styles.headerActionLink, { color: theme.textSecondary }]}>
              Update Info →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsGrid}>
          {detailsList.map((item, index) => (
            <Fragment key={`detail-${index}-${item.label}`}>
              <View
                style={[
                  styles.detailCell,
                  isNarrow ? styles.cellFull : styles.cellHalf,
                ]}>
                <Text style={[styles.fieldLabel, { color: isDark ? '#8E95A5' : '#64748B' }]}>
                  {item.label}
                </Text>
                <Text
                  style={[styles.fieldValue, { color: theme.textPrimary }]}
                  numberOfLines={1}>
                  {item.value}
                </Text>
              </View>
            </Fragment>
          ))}
        </View>
      </View>

      {/* 3. Quick Action Banner to Switch to Current Preparation Overview */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onNavigateToTab?.('overview')}
        style={[
          styles.switchBanner,
          {
            backgroundColor: isDark ? '#141416' : '#F8FAFC',
            borderColor: theme.cardBorder,
          },
        ]}>
        <View style={styles.switchBannerLeft}>
          <Text style={[styles.switchBannerTitle, { color: theme.textPrimary }]}>
            Preparation Overview & Status
          </Text>
          <Text style={[styles.switchBannerSub, { color: theme.textSecondary }]}>
            Track today&apos;s goal, streak consistency, and live exam performance.
          </Text>
        </View>
        <Text style={[styles.switchBannerArrow, { color: theme.textPrimary }]}>
          View →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  heroCard: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  professionSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.12)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerActionLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 20,
    columnGap: 16,
  },
  detailCell: {
    gap: 4,
  },
  cellHalf: {
    width: '47%',
  },
  cellFull: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  switchBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  switchBannerLeft: {
    flex: 1,
    gap: 4,
  },
  switchBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  switchBannerArrow: {
    fontSize: 13,
    fontWeight: '800',
  },
});
