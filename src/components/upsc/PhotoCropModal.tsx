import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  Circle,
  FlipHorizontal,
  FlipVertical,
  Grid,
  Maximize2,
  RotateCcw,
  RotateCw,
  Square,
  Smartphone,
  Tv,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';
import * as ImageManipulator from 'expo-image-manipulator';

export interface PhotoCropResult {
  uri: string;
  width: number;
  height: number;
}

export type AspectRatioMode = 'circle' | 'square' | 'portrait' | 'landscape';

interface PhotoCropModalProps {
  visible: boolean;
  imageUri: string;
  isDark?: boolean;
  onCancel: () => void;
  onApplyCroppedImage: (result: PhotoCropResult) => void;
}

export function PhotoCropModal({
  visible,
  imageUri,
  onCancel,
  onApplyCroppedImage,
}: PhotoCropModalProps) {
  const { width: windowWidth } = useWindowDimensions();

  // Crop Viewport base sizing
  const BASE_SIZE = Math.min(320, Math.floor(windowWidth * 0.82));

  // State: Aspect Ratio
  const [aspectMode, setAspectMode] = useState<AspectRatioMode>('circle');

  // Original image intrinsic dimensions
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Transformations
  const [scaleFactor, setScaleFactor] = useState<number>(1); // 1.0 to 3.5 multiplier above coverScale
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0); // 0, 90, 180, 270
  const [isFlippedH, setIsFlippedH] = useState<boolean>(false);
  const [isFlippedV, setIsFlippedV] = useState<boolean>(false);

  // Dynamic Viewport Dimensions
  const { viewportW, viewportH, isCircle } = useMemo(() => {
    if (aspectMode === 'portrait') {
      return {
        viewportW: Math.round(BASE_SIZE * 0.8),
        viewportH: BASE_SIZE,
        isCircle: false,
      };
    }
    if (aspectMode === 'landscape') {
      return {
        viewportW: BASE_SIZE,
        viewportH: Math.round(BASE_SIZE * (9 / 16)),
        isCircle: false,
      };
    }
    if (aspectMode === 'square') {
      return {
        viewportW: BASE_SIZE,
        viewportH: BASE_SIZE,
        isCircle: false,
      };
    }
    // 'circle'
    return {
      viewportW: BASE_SIZE,
      viewportH: BASE_SIZE,
      isCircle: true,
    };
  }, [aspectMode, BASE_SIZE]);

  // References to keep gesture callbacks responsive and prevent stale closures
  const stateRef = useRef({
    panX,
    panY,
    scaleFactor,
    maxPanX: 0,
    maxPanY: 0,
  });

  // Track image change and adjust state during rendering per React guidelines
  const [prevUri, setPrevUri] = useState(imageUri);
  if (imageUri !== prevUri) {
    setPrevUri(imageUri);
    setScaleFactor(1);
    setPanX(0);
    setPanY(0);
    setRotationDegrees(0);
    setIsFlippedH(false);
    setIsFlippedV(false);
    setAspectMode('circle');
    setIsLoadingMeta(true);
  }

  // 1. Fetch image intrinsic dimensions when modal opens
  useEffect(() => {
    if (!visible || !imageUri) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const img = new (window as any).Image();
      img.onload = () => {
        setNaturalWidth(img.naturalWidth || img.width || 1000);
        setNaturalHeight(img.naturalHeight || img.height || 1000);
        setIsLoadingMeta(false);
      };
      img.onerror = () => {
        setNaturalWidth(1000);
        setNaturalHeight(1000);
        setIsLoadingMeta(false);
      };
      img.src = imageUri;
    } else {
      Image.getSize(
        imageUri,
        (w, h) => {
          setNaturalWidth(w);
          setNaturalHeight(h);
          setIsLoadingMeta(false);
        },
        (err) => {
          console.warn('Failed to retrieve image size:', err);
          setNaturalWidth(1000);
          setNaturalHeight(1000);
          setIsLoadingMeta(false);
        }
      );
    }
  }, [visible, imageUri]);

  // 2. Mathematically Sound Scaling Model:
  // Base cover scale guarantees image fills the crop viewport completely with zero empty gaps
  const isSideways = rotationDegrees === 90 || rotationDegrees === 270;
  const effectiveW = isSideways ? naturalHeight : naturalWidth;
  const effectiveH = isSideways ? naturalWidth : naturalHeight;

  const { baseWidth, baseHeight } = useMemo(() => {
    if (!effectiveW || !effectiveH) {
      return { baseWidth: viewportW, baseHeight: viewportH };
    }

    // Scale so both dimensions cover the active viewport
    const scaleToCover = Math.max(viewportW / effectiveW, viewportH / effectiveH);
    const bW = effectiveW * scaleToCover;
    const bH = effectiveH * scaleToCover;

    return { baseWidth: bW, baseHeight: bH };
  }, [effectiveW, effectiveH, viewportW, viewportH]);

  // Current visual dimension on screen
  const currentRenderWidth = baseWidth * scaleFactor;
  const currentRenderHeight = baseHeight * scaleFactor;

  // Exact Layout Dimensions for <Image>:
  // When rotated 90/270 deg, React Native rotates around center, swapping visual width and height.
  // By setting layout dimensions inversely when sideways, the natural aspect ratio is preserved 100%
  // without any squishing, distortion, or black bars.
  const imageLayoutWidth = isSideways ? currentRenderHeight : currentRenderWidth;
  const imageLayoutHeight = isSideways ? currentRenderWidth : currentRenderHeight;

  // Maximum allowed panning offsets (strictly prevents revealing empty space beyond viewport boundary)
  const maxPanX = Math.max(0, (currentRenderWidth - viewportW) / 2);
  const maxPanY = Math.max(0, (currentRenderHeight - viewportH) / 2);

  // Clamped Pan guarantees offsets are mathematically bounded at all times without extra renders
  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, panY));

  // Sync stateRef for gestures
  useEffect(() => {
    stateRef.current = {
      panX: clampedPanX,
      panY: clampedPanY,
      scaleFactor,
      maxPanX,
      maxPanY,
    };
  }, [clampedPanX, clampedPanY, scaleFactor, maxPanX, maxPanY]);

  // 3. Gesture Responder: supports 1-finger panning and 2-finger pinch zoom
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchScaleRef = useRef<number>(1);
  const startPanXRef = useRef<number>(0);
  const startPanYRef = useRef<number>(0);

  const getDistance = (touches: readonly any[]) => {
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          startPanXRef.current = stateRef.current.panX;
          startPanYRef.current = stateRef.current.panY;

          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            initialTouchDistanceRef.current = getDistance(evt.nativeEvent.touches);
            initialTouchScaleRef.current = stateRef.current.scaleFactor;
          } else {
            initialTouchDistanceRef.current = null;
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          // Two-finger pinch zoom
          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            if (!initialTouchDistanceRef.current) {
              initialTouchDistanceRef.current = getDistance(evt.nativeEvent.touches);
              initialTouchScaleRef.current = stateRef.current.scaleFactor;
              return;
            }
            const currentDist = getDistance(evt.nativeEvent.touches);
            const scaleMultiplier = currentDist / initialTouchDistanceRef.current;
            const newScale = Math.max(
              1.0,
              Math.min(3.5, +(initialTouchScaleRef.current * scaleMultiplier).toFixed(2))
            );
            setScaleFactor(newScale);
          } else {
            // One-finger panning constrained strictly to viewport edges
            const candidateX = startPanXRef.current + gestureState.dx;
            const candidateY = startPanYRef.current + gestureState.dy;
            const boundX = stateRef.current.maxPanX;
            const boundY = stateRef.current.maxPanY;

            setPanX(Math.max(-boundX, Math.min(boundX, candidateX)));
            setPanY(Math.max(-boundY, Math.min(boundY, candidateY)));
          }
        },
        onPanResponderRelease: () => {
          initialTouchDistanceRef.current = null;
        },
        onPanResponderTerminate: () => {
          initialTouchDistanceRef.current = null;
        },
      }),
    []
  );

  // Button Zoom Helpers
  const handleZoomIn = () => {
    setScaleFactor((prev) => Math.min(3.5, +(prev + 0.25).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScaleFactor((prev) => Math.max(1.0, +(prev - 0.25).toFixed(2)));
  };

  const handleRotateRight = () => {
    setRotationDegrees((prev) => (prev + 90) % 360);
    setPanX(0);
    setPanY(0);
  };

  const handleRotateLeft = () => {
    setRotationDegrees((prev) => (prev + 270) % 360);
    setPanX(0);
    setPanY(0);
  };

  const handleFlipHorizontal = () => {
    setIsFlippedH((prev) => !prev);
  };

  const handleFlipVertical = () => {
    setIsFlippedV((prev) => !prev);
  };

  const handleReset = () => {
    setScaleFactor(1);
    setPanX(0);
    setPanY(0);
    setRotationDegrees(0);
    setIsFlippedH(false);
    setIsFlippedV(false);
  };

  // 4. Mathematical Coordinate Mapping & Real Image Crop Execution
  const handleExecuteCrop = async () => {
    if (isProcessing || !naturalWidth || !naturalHeight) return;
    setIsProcessing(true);

    try {
      // Step A: Chain any rotation/flip actions first
      const preActions: ImageManipulator.Action[] = [];
      if (rotationDegrees !== 0) {
        preActions.push({ rotate: rotationDegrees });
      }
      if (isFlippedH) {
        preActions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
      if (isFlippedV) {
        preActions.push({ flip: ImageManipulator.FlipType.Vertical });
      }

      // Step B: Calculate the source image pixel crop rectangle
      const orientedWidth = isSideways ? naturalHeight : naturalWidth;
      const orientedHeight = isSideways ? naturalWidth : naturalHeight;

      // Scale between screen pixels and source image oriented pixels
      const screenToSourceRatio = orientedWidth / currentRenderWidth;

      // Top-left of viewport relative to the rendered image top-left in screen space:
      const screenCropOriginX = (currentRenderWidth - viewportW) / 2 - clampedPanX;
      const screenCropOriginY = (currentRenderHeight - viewportH) / 2 - clampedPanY;

      // Convert to natural source image pixels:
      let originX = Math.round(screenCropOriginX * screenToSourceRatio);
      let originY = Math.round(screenCropOriginY * screenToSourceRatio);
      let targetCropW = Math.round(viewportW * screenToSourceRatio);
      let targetCropH = Math.round(viewportH * screenToSourceRatio);

      // Clamp coordinates securely within boundary
      originX = Math.max(0, Math.min(originX, orientedWidth - 1));
      originY = Math.max(0, Math.min(originY, orientedHeight - 1));
      targetCropW = Math.min(targetCropW, orientedWidth - originX);
      targetCropH = Math.min(targetCropH, orientedHeight - originY);

      // For circle and square modes, enforce an exact 1:1 square crop
      if (isCircle || aspectMode === 'square') {
        const side = Math.min(targetCropW, targetCropH);
        if (originX + side > orientedWidth) {
          originX = Math.max(0, orientedWidth - side);
        }
        if (originY + side > orientedHeight) {
          originY = Math.max(0, orientedHeight - side);
        }
        targetCropW = Math.max(10, side);
        targetCropH = Math.max(10, side);
      }

      const cropAction: ImageManipulator.ActionCrop = {
        crop: {
          originX,
          originY,
          width: targetCropW,
          height: targetCropH,
        },
      };

      // Step C: Execute high-quality crop with expo-image-manipulator
      const allActions: ImageManipulator.Action[] = [...preActions, cropAction];

      const cropResult = await ImageManipulator.manipulateAsync(imageUri, allActions, {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      onApplyCroppedImage({
        uri: cropResult.uri,
        width: cropResult.width,
        height: cropResult.height,
      });
    } catch (error) {
      console.error('Failed to crop image:', error);
      Alert.alert('Crop Error', 'Failed to process cropped photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.modalBackdrop}>
        {/* Top Header Bar */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onCancel}
            disabled={isProcessing}
            accessibilityLabel="Cancel Crop"
            style={styles.headerIconBtn}>
            <X size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Crop Profile Photo</Text>
            <Text style={styles.headerSubtitle}>Drag & pinch to frame</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleExecuteCrop}
            disabled={isProcessing || isLoadingMeta}
            accessibilityLabel="Done Cropping"
            style={[
              styles.donePillBtn,
              (isProcessing || isLoadingMeta) && { opacity: 0.5 },
            ]}>
            {isProcessing ? (
              <ActivityIndicator size="small" color="#09090B" />
            ) : (
              <>
                <Check size={16} color="#09090B" strokeWidth={2.6} />
                <Text style={styles.doneBtnText}>Done</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Aspect Ratio Selector Row */}
        <View style={styles.aspectRatioRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAspectMode('circle')}
            style={[
              styles.aspectPill,
              aspectMode === 'circle' && styles.aspectPillActive,
            ]}>
            <Circle size={12} color={aspectMode === 'circle' ? '#09090B' : '#FFFFFF'} />
            <Text
              style={[
                styles.aspectPillText,
                aspectMode === 'circle' && styles.aspectPillTextActive,
              ]}>
              Circle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAspectMode('square')}
            style={[
              styles.aspectPill,
              aspectMode === 'square' && styles.aspectPillActive,
            ]}>
            <Square size={12} color={aspectMode === 'square' ? '#09090B' : '#FFFFFF'} />
            <Text
              style={[
                styles.aspectPillText,
                aspectMode === 'square' && styles.aspectPillTextActive,
              ]}>
              1:1
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAspectMode('portrait')}
            style={[
              styles.aspectPill,
              aspectMode === 'portrait' && styles.aspectPillActive,
            ]}>
            <Smartphone size={12} color={aspectMode === 'portrait' ? '#09090B' : '#FFFFFF'} />
            <Text
              style={[
                styles.aspectPillText,
                aspectMode === 'portrait' && styles.aspectPillTextActive,
              ]}>
              4:5
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAspectMode('landscape')}
            style={[
              styles.aspectPill,
              aspectMode === 'landscape' && styles.aspectPillActive,
            ]}>
            <Tv size={12} color={aspectMode === 'landscape' ? '#09090B' : '#FFFFFF'} />
            <Text
              style={[
                styles.aspectPillText,
                aspectMode === 'landscape' && styles.aspectPillTextActive,
              ]}>
              16:9
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center Workspace with Viewport */}
        <View style={styles.workspace}>
          {isLoadingMeta ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View
              style={[
                styles.cropViewport,
                {
                  width: viewportW,
                  height: viewportH,
                  borderRadius: isCircle ? viewportW / 2 : 12,
                },
              ]}
              {...panResponder.panHandlers}>
              {/* Actual Image Rendered Behind Crop Frame */}
              <View
                style={[
                  styles.imageWrapper,
                  {
                    width: currentRenderWidth,
                    height: currentRenderHeight,
                    transform: [
                      { translateX: clampedPanX },
                      { translateY: clampedPanY },
                    ],
                  },
                ]}
                pointerEvents="none">
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: imageLayoutWidth,
                    height: imageLayoutHeight,
                    transform: [
                      { rotate: `${rotationDegrees}deg` },
                      { scaleX: isFlippedH ? -1 : 1 },
                      { scaleY: isFlippedV ? -1 : 1 },
                    ],
                  }}
                  resizeMode="cover"
                />
              </View>

              {/* Composition Grid (Rule of Thirds Overlay) */}
              {showGrid && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.gridOverlay,
                    {
                      width: viewportW,
                      height: viewportH,
                      borderRadius: isCircle ? viewportW / 2 : 12,
                    },
                  ]}>
                  {/* Horizontal Grid lines */}
                  <View style={[styles.gridLineH, { top: '33.3%' }]} />
                  <View style={[styles.gridLineH, { top: '66.6%' }]} />
                  {/* Vertical Grid lines */}
                  <View style={[styles.gridLineV, { left: '33.3%' }]} />
                  <View style={[styles.gridLineV, { left: '66.6%' }]} />
                </View>
              )}
            </View>
          )}

          {/* Guide hint */}
          <Text style={styles.tipText}>
            Pinch to zoom · Drag image to position inside the frame
          </Text>
        </View>

        {/* Professional Bottom Toolbar */}
        <View style={styles.bottomBar}>
          {/* Zoom Slider / Controls */}
          <View style={styles.zoomControlsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleZoomOut}
              disabled={scaleFactor <= 1.0}
              accessibilityLabel="Zoom Out"
              style={[styles.zoomStepBtn, scaleFactor <= 1.0 && { opacity: 0.35 }]}>
              <ZoomOut size={16} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>

            <View style={styles.scaleBadge}>
              <Text style={styles.scaleBadgeText}>
                {Math.round(scaleFactor * 100)}%
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleZoomIn}
              disabled={scaleFactor >= 3.5}
              accessibilityLabel="Zoom In"
              style={[styles.zoomStepBtn, scaleFactor >= 3.5 && { opacity: 0.35 }]}>
              <ZoomIn size={16} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Secondary Action Toolbar: Rotate, Flip, Grid, Reset */}
          <View style={styles.actionToolsRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRotateLeft}
              accessibilityLabel="Rotate Left 90 Degrees"
              style={styles.toolBtn}>
              <RotateCcw size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.toolBtnLabel}>-90°</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRotateRight}
              accessibilityLabel="Rotate Right 90 Degrees"
              style={styles.toolBtn}>
              <RotateCw size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.toolBtnLabel}>+90°</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleFlipHorizontal}
              accessibilityLabel="Flip Horizontal"
              style={[styles.toolBtn, isFlippedH && styles.toolBtnActive]}>
              <FlipHorizontal size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.toolBtnLabel}>Flip H</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleFlipVertical}
              accessibilityLabel="Flip Vertical"
              style={[styles.toolBtn, isFlippedV && styles.toolBtnActive]}>
              <FlipVertical size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.toolBtnLabel}>Flip V</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowGrid((prev) => !prev)}
              accessibilityLabel="Toggle Grid Overlay"
              style={[styles.toolBtn, showGrid && styles.toolBtnActive]}>
              <Grid size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.toolBtnLabel}>Grid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReset}
              accessibilityLabel="Reset Transformations"
              style={styles.toolBtn}>
              <Maximize2 size={15} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.toolBtnLabel}>Reset</Text>
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
    backgroundColor: '#080A10',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  donePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#09090B',
  },
  aspectRatioRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  aspectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  aspectPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  aspectPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aspectPillTextActive: {
    color: '#09090B',
  },
  workspace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  cropViewport: {
    overflow: 'hidden',
    backgroundColor: '#111520',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  imageWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  tipText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11.5,
    marginTop: 22,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottomBar: {
    paddingHorizontal: 16,
    gap: 12,
  },
  zoomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoomStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleBadge: {
    minWidth: 46,
    alignItems: 'center',
  },
  scaleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionToolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 50,
    gap: 3,
  },
  toolBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  toolBtnLabel: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '600',
  },
});
