import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeftRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  Heart,
  MessageSquare,
  X,
} from 'lucide-react-native';
import { CommunityNotification } from '@/types/community';
import { CommunityService } from '@/services/communityService';

interface CommunityNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onNotificationHandled?: (notif: CommunityNotification) => void;
}

export function CommunityNotificationsModal({
  isOpen,
  onClose,
  isDark,
  onNotificationHandled,
}: CommunityNotificationsModalProps) {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (isOpen) {
      CommunityService.getNotifications()
        .then((list) => {
          if (!cancelled) setNotifications(list);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    await CommunityService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleTapNotification = async (notif: CommunityNotification) => {
    if (!notif.is_read) {
      await CommunityService.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    if (onNotificationHandled) {
      onNotificationHandled(notif);
    }
    onClose();
  };

  const bg = isDark ? '#0B1018' : '#FAF9F6';
  const surface = isDark ? '#141C28' : '#FFFFFF';
  const surfaceSubtle = isDark ? '#1B2433' : '#F4F2EC';
  const border = isDark ? '#232D3F' : '#E8E3DA';
  const textPrimary = isDark ? '#F8FAFC' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const textMuted = isDark ? '#64748B' : '#94A3B8';
  const accent = '#FF9500';

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={16} color="#EF4444" fill="#EF4444" />;
      case 'comment':
      case 'reply':
        return <MessageSquare size={16} color={accent} />;
      case 'exchange_accepted':
      case 'partner_uploaded':
        return <ArrowLeftRight size={16} color="#3B82F6" />;
      case 'review_completed':
      case 'exchange_completed':
        return <CheckCircle2 size={16} color="#10B981" />;
      default:
        return <Bell size={16} color={accent} />;
    }
  };

  return (
    <Modal visible={isOpen} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Community Notifications</Text>
            <Text style={[styles.headerSub, { color: textSecondary }]}>
              {unreadCount} unread updates
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAllRead}
              style={[styles.markAllBtn, { backgroundColor: surfaceSubtle, borderColor: border }]}>
              <CheckCheck size={14} color={textPrimary} />
              <Text style={[styles.markAllText, { color: textPrimary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Bell size={36} color={textMuted} />
              <Text style={[styles.emptyText, { color: textSecondary }]}>
                No notifications right now. When peers interact with your answer sheets or accept review requests, you&apos;ll see alerts here!
              </Text>
            </View>
          ) : (
            notifications.map((notif) => {
              return (
                <TouchableOpacity
                  key={notif.id}
                  activeOpacity={0.85}
                  onPress={() => handleTapNotification(notif)}
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: notif.is_read ? surface : surfaceSubtle,
                      borderColor: notif.is_read ? border : accent,
                    },
                  ]}>
                  <View style={[styles.iconBox, { backgroundColor: `${accent}12` }]}>
                    {getIconForType(notif.type)}
                  </View>

                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.notifTitle, { color: textPrimary }]}>{notif.title}</Text>
                      {!notif.is_read && <View style={[styles.unreadDot, { backgroundColor: accent }]} />}
                    </View>
                    <Text style={[styles.notifMessage, { color: textSecondary }]}>{notif.message}</Text>
                    <Text style={[styles.notifTime, { color: textMuted }]}>
                      {new Date(notif.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifMessage: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  notifTime: {
    fontSize: 10.5,
    marginTop: 2,
  },
});

