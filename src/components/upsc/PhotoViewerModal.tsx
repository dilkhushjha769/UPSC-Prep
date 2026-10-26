import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Crop, X, ZoomIn, ZoomOut } from 'lucide-react-native';

interface PhotoViewerModalProps {
  visible: boolean;
  imageUri: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onEdit?: () => void;
}

export function PhotoViewerModal({
  visible,
  imageUri,
  title = 'Profile Photo',
  subtitle,
  onClose,
  onEdit,
}: PhotoViewerModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [scale, setScale] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // References to keep gesture handling responsive
  const stateRef = useRef({ scale, panX, panY });
  useEffect(() => {
    stateRef.current = { scale, panX, panY };
  }, [scale, panX, panY]);

  const initialDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const startPanXRef = useRef<number>(0);
  const startPanYRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const getDistance = (touches: readonly any[]) => {
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleResetZoom = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  const handleDoubleTap = useCallback(() => {
    setScale((s) => {
      if (s > 1) {
        setPanX(0);
        setPanY(0);
        return 1;
      }
      return 2.2;
    });
  }, []);

  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const now = evt.nativeEvent.timestamp || 0;
          if (now - lastTapRef.current < 300) {
            handleDoubleTap();
            lastTapRef.current = 0;
            return;
          }
          lastTapRef.current = now;

          startPanXRef.current = stateRef.current.panX;
          startPanYRef.current = stateRef.current.panY;

          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            initialDistRef.current = getDistance(evt.nativeEvent.touches);
            initialScaleRef.current = stateRef.current.scale;
          } else {
            initialDistRef.current = null;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            if (!initialDistRef.current) {
              initialDistRef.current = getDistance(evt.nativeEvent.touches);
              initialScaleRef.current = stateRef.current.scale;
              return;
            }
            const dist = getDistance(evt.nativeEvent.touches);
            const multiplier = dist / initialDistRef.current;
            const newScale = Math.max(1.0, Math.min(3.5, +(initialScaleRef.current * multiplier).toFixed(2)));
            setScale(newScale);
          } else if (stateRef.current.scale > 1) {
            // Only allow pan when zoomed in
            const maxOffset = (windowWidth * (stateRef.current.scale - 1)) / 2;
            const candidateX = startPanXRef.current + gestureState.dx;
            const candidateY = startPanYRef.current + gestureState.dy;
            setPanX(Math.max(-maxOffset, Math.min(maxOffset, candidateX)));
            setPanY(Math.max(-maxOffset, Math.min(maxOffset, candidateY)));
          }
        },
        onPanResponderRelease: () => {
          initialDistRef.current = null;
        },
        onPanResponderTerminate: () => {
          initialDistRef.current = null;
        },
      }),
    [windowWidth, handleDoubleTap]
  );

  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        {/* Top Floating Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            accessibilityLabel="Close photo viewer"
            style={styles.circleBtn}>
            <X size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{title}</Text>
            {Boolean(subtitle) && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>

          {onEdit ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                onEdit();
              }}
              accessibilityLabel="Edit and Crop photo"
              style={styles.circleBtn}>
              <Crop size={18} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Center Image Canvas */}
        <View style={styles.imageCanvas} {...panResponder.panHandlers}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.enlargedPhoto,
              {
                width: windowWidth,
                height: Math.min(windowHeight * 0.72, windowWidth),
                transform: [
                  { scale },
                  { translateX: panX },
                  { translateY: panY },
                ],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Floating Bar with Zoom Controls & Reset */}
        <View style={styles.bottomBar}>
          <View style={styles.zoomPill}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setScale((s) => Math.max(1, +(s - 0.3).toFixed(1)))}
              disabled={scale <= 1}
              accessibilityLabel="Zoom out"
              style={[styles.zoomBtn, scale <= 1 && { opacity: 0.35 }]}>
              <ZoomOut size={16} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} onPress={handleResetZoom} style={styles.scaleTextTouch}>
              <Text style={styles.scaleText}>{Math.round(scale * 100)}%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setScale((s) => Math.min(3.5, +(s + 0.3).toFixed(1)))}
              disabled={scale >= 3.5}
              accessibilityLabel="Zoom in"
              style={[styles.zoomBtn, scale >= 3.5 && { opacity: 0.35 }]}>
              <ZoomIn size={16} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.gestureHint}>
            Double-tap to zoom · Pinch to zoom in full resolution
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : (Platform.OS === 'android' ? 36 : 24),
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    zIndex: 10,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
    fontWeight: '500',
  },
  imageCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enlargedPhoto: {
    maxWidth: '100%',
  },
  bottomBar: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  zoomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleTextTouch: {
    minWidth: 48,
    alignItems: 'center',
  },
  scaleText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  gestureHint: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11.5,
    textAlign: 'center',
  },
});
