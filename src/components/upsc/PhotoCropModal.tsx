import React, { useState } from 'react';
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
import {
  Check,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react-native';

interface PhotoCropModalProps {
  visible: boolean;
  imageUri: string;
  isDark: boolean;
  onCancel: () => void;
  onApply: (params: { scale: number; offsetX: number; offsetY: number; rotation: number }) => void;
}

export function PhotoCropModal({
  visible,
  imageUri,
  isDark,
  onCancel,
  onApply,
}: PhotoCropModalProps) {
  const { width } = useWindowDimensions();
  const CROP_SIZE = Math.min(260, Math.floor(width * 0.72));

  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);

  // Pan Responder for smooth, responsive drag repositioning inside circular crop frame
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          setOffsetX((prev) => Math.max(-120, Math.min(120, prev + gestureState.dx * 0.1)));
          setOffsetY((prev) => Math.max(-120, Math.min(120, prev + gestureState.dy * 0.1)));
        },
      }),
    []
  );

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.0, +(prev + 0.2).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, +(prev - 0.2).toFixed(2)));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    setRotation(0);
  };

  const handleDone = () => {
    onApply({ scale, offsetX, offsetY, rotation });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalBackdrop}>
        {/* Top Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancel}
            style={styles.headerIconButton}>
            <X size={22} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Adjust Photo</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDone}
            style={styles.doneButton}>
            <Check size={18} color="#09090B" strokeWidth={2.6} />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Viewport Frame Container */}
        <View style={styles.cropWorkspace}>
          {/* Circular Mask Frame */}
          <View
            style={[
              styles.cropFrameCircle,
              { width: CROP_SIZE, height: CROP_SIZE, borderRadius: CROP_SIZE / 2 },
            ]}
            {...panResponder.panHandlers}>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.rawImage,
                {
                  transform: [
                    { scale },
                    { translateX: offsetX },
                    { translateY: offsetY },
                    { rotate: `${rotation}deg` },
                  ],
                },
              ]}
              resizeMode="cover"
            />
          </View>

          {/* Precision Alignment Guide Ring */}
          <View
            pointerEvents="none"
            style={[
              styles.alignmentRing,
              { width: CROP_SIZE, height: CROP_SIZE, borderRadius: CROP_SIZE / 2 },
            ]}>
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
          </View>

          <Text style={styles.guideTip}>
            Drag image to reposition · Pinch or use buttons to scale
          </Text>
        </View>

        {/* Bottom Professional Control Toolbar (Mobbin Studio Style) */}
        <View style={styles.bottomToolbar}>
          {/* Zoom Slider / Controls */}
          <View style={styles.zoomControlRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleZoomOut}
              disabled={scale <= 0.6}
              style={[styles.toolBtn, scale <= 0.6 && { opacity: 0.35 }]}>
              <ZoomOut size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.scalePercentBadge}>
              <Text style={styles.scalePercentText}>
                {Math.round(scale * 100)}%
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleZoomIn}
              disabled={scale >= 3.0}
              style={[styles.toolBtn, scale >= 3.0 && { opacity: 0.35 }]}>
              <ZoomIn size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Quick Action Pill Row */}
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRotate}
              style={styles.pillActionBtn}>
              <RotateCw size={15} color="#FFFFFF" />
              <Text style={styles.pillActionText}>Rotate 90°</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReset}
              style={styles.pillActionBtn}>
              <Maximize2 size={14} color="#FFFFFF" />
              <Text style={styles.pillActionText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#090B10',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#09090B',
  },
  cropWorkspace: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 'auto',
  },
  cropFrameCircle: {
    overflow: 'hidden',
    backgroundColor: '#1E2330',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  rawImage: {
    width: '100%',
    height: '100%',
  },
  alignmentRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  crosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  guideTip: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomToolbar: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  zoomControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scalePercentBadge: {
    minWidth: 50,
    alignItems: 'center',
  },
  scalePercentText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
