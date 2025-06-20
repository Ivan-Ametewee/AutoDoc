import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const Modal = ({
  visible = false,
  onClose,
  onBackdropPress,
  title,
  subtitle,
  children,
  variant = 'default',
  size = 'medium',
  position = 'center',
  animationType = 'fade',
  showCloseButton = true,
  closeOnBackdrop = true,
  scrollable = false,
  keyboardAvoidingView = true,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  style = {},
  contentStyle = {},
  headerStyle = {},
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        animationType === 'slide' ? 
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }) :
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
      ]).start();
    } else {
      // Hide animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        animationType === 'slide' ?
          Animated.timing(slideAnim, {
            toValue: height,
            duration: 200,
            useNativeDriver: true,
          }) :
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim, animationType]);

  // Modal size configurations
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: width * 0.8,
          maxHeight: height * 0.4,
        };
      case 'medium':
        return {
          width: width * 0.9,
          maxHeight: height * 0.6,
        };
      case 'large':
        return {
          width: width * 0.95,
          maxHeight: height * 0.8,
        };
      case 'fullScreen':
        return {
          width: width,
          height: height,
          margin: 0,
        };
      case 'auto':
        return {
          width: width * 0.9,
          maxHeight: height * 0.8,
        };
      default:
        return {
          width: width * 0.9,
          maxHeight: height * 0.6,
        };
    }
  };

  // Modal position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          justifyContent: 'flex-start',
          paddingTop: 50,
        };
      case 'bottom':
        return {
          justifyContent: 'flex-end',
          paddingBottom: 50,
        };
      case 'center':
        return {
          justifyContent: 'center',
        };
      default:
        return {
          justifyContent: 'center',
        };
    }
  };

  // Modal variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
        };
      case 'dark':
        return {
          backgroundColor: '#1F2937',
          borderColor: '#374151',
        };
      case 'primary':
        return {
          backgroundColor: '#EFF6FF',
          borderColor: '#DBEAFE',
        };
      case 'success':
        return {
          backgroundColor: '#F0FDF4',
          borderColor: '#DCFCE7',
        };
      case 'warning':
        return {
          backgroundColor: '#FFFBEB',
          borderColor: '#FEF3C7',
        };
      case 'danger':
        return {
          backgroundColor: '#FEF2F2',
          borderColor: '#FECACA',
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
        };
    }
  };

  // Text colors based on variant
  const getTextColors = () => {
    switch (variant) {
      case 'dark':
        return {
          title: '#F9FAFB',
          subtitle: '#D1D5DB',
        };
      case 'primary':
        return {
          title: '#1E40AF',
          subtitle: '#3730A3',
        };
      case 'success':
        return {
          title: '#166534',
          subtitle: '#15803D',
        };
      case 'warning':
        return {
          title: '#92400E',
          subtitle: '#B45309',
        };
      case 'danger':
        return {
          title: '#991B1B',
          subtitle: '#DC2626',
        };
      default:
        return {
          title: '#111827',
          subtitle: '#6B7280',
        };
    }
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop && onBackdropPress) {
      onBackdropPress();
    } else if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const handleClosePress = () => {
    if (onClose) {
      onClose();
    }
  };

  const overlayStyles = [
    styles.overlay,
    { backgroundColor },
    getPositionStyles(),
  ];

  const modalStyles = [
    styles.modal,
    getVariantStyles(),
    getSizeStyles(),
    style,
  ];

  const textColors = getTextColors();

  const getTransformStyle = () => {
    if (animationType === 'slide') {
      return [{ translateY: slideAnim }];
    }
    return [{ scale: scaleAnim }];
  };

  const ModalContent = () => (
    <Animated.View
      style={[
        modalStyles,
        {
          opacity: fadeAnim,
          transform: getTransformStyle(),
        },
      ]}
    >
      {/* Header */}
      {(title || subtitle || showCloseButton) && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerContent}>
            {title && (
              <Text style={[
                styles.title,
                { color: textColors.title }
              ]}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[
                styles.subtitle,
                { color: textColors.subtitle }
              ]}>
                {subtitle}
              </Text>
            )}
          </View>
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeButtonText, { color: textColors.title }]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, contentStyle]}>
        {scrollable ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </Animated.View>
  );

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClosePress}
      {...props}
    >
      <Animated.View style={[overlayStyles, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        {keyboardAvoidingView && Platform.OS === 'ios' ? (
          <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoid}>
            <ModalContent />
          </KeyboardAvoidingView>
        ) : (
          <ModalContent />
        )}
      </Animated.View>
    </RNModal>
  );
};

// Modal preset components
Modal.Alert = ({ title, message, buttons = [], ...props }) => (
  <Modal size="small" variant="default" {...props}>
    <View style={styles.alertContainer}>
      {title && <Text style={styles.alertTitle}>{title}</Text>}
      {message && <Text style={styles.alertMessage}>{message}</Text>}
      <View style={styles.alertButtons}>
        {buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.alertButton,
              button.style === 'destructive' && styles.alertButtonDestructive,
            ]}
            onPress={button.onPress}
          >
            <Text style={[
              styles.alertButtonText,
              button.style === 'destructive' && styles.alertButtonTextDestructive,
            ]}>
              {button.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </Modal>
);

Modal.ActionSheet = ({ actions = [], cancelAction, ...props }) => (
  <Modal
    position="bottom"
    animationType="slide"
    size="auto"
    {...props}
  >
    <View style={styles.actionSheetContainer}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.actionSheetItem,
            action.destructive && styles.actionSheetItemDestructive,
          ]}
          onPress={action.onPress}
        >
          <Text style={[
            styles.actionSheetText,
            action.destructive && styles.actionSheetTextDestructive,
          ]}>
            {action.title}
          </Text>
        </TouchableOpacity>
      ))}
      {cancelAction && (
        <TouchableOpacity
          style={[styles.actionSheetItem, styles.actionSheetCancel]}
          onPress={cancelAction.onPress}
        >
          <Text style={styles.actionSheetCancelText}>
            {cancelAction.title || 'Cancel'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
    margin: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Alert styles
  alertContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6B7280',
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    minWidth: 80,
  },
  alertButtonDestructive: {
    backgroundColor: '#EF4444',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  alertButtonTextDestructive: {
    color: '#FFFFFF',
  },
  // Action sheet styles
  actionSheetContainer: {
    width: '100%',
  },
  actionSheetItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionSheetItemDestructive: {
    backgroundColor: '#FEF2F2',
  },
  actionSheetText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#111827',
  },
  actionSheetTextDestructive: {
    color: '#EF4444',
  },
  actionSheetCancel: {
    marginTop: 8,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 0,
  },
  actionSheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#6B7280',
  },
});

export default Modal;