import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  style = {},
  textStyle = {},
  ...props
}) => {
  // Button variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? '#6B7280' : '#3B82F6',
          borderColor: disabled ? '#6B7280' : '#3B82F6',
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? '#6B7280' : '#3B82F6',
          borderWidth: 1,
        };
      case 'success':
        return {
          backgroundColor: disabled ? '#6B7280' : '#10B981',
          borderColor: disabled ? '#6B7280' : '#10B981',
        };
      case 'danger':
        return {
          backgroundColor: disabled ? '#6B7280' : '#EF4444',
          borderColor: disabled ? '#6B7280' : '#EF4444',
        };
      case 'warning':
        return {
          backgroundColor: disabled ? '#6B7280' : '#F59E0B',
          borderColor: disabled ? '#6B7280' : '#F59E0B',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? '#6B7280' : '#D1D5DB',
          borderWidth: 1,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: disabled ? '#6B7280' : '#3B82F6',
          borderColor: disabled ? '#6B7280' : '#3B82F6',
        };
    }
  };

  // Button size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
          minHeight: 36,
        };
      case 'medium':
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          minHeight: 44,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
          minHeight: 52,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
          minHeight: 44,
        };
    }
  };

  // Text color based on variant
  const getTextColor = () => {
    if (disabled) return '#9CA3AF';
    
    switch (variant) {
      case 'secondary':
      case 'outline':
        return '#3B82F6';
      case 'ghost':
        return '#374151';
      default:
        return '#FFFFFF';
    }
  };

  // Text size based on button size
  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const buttonStyles = [
    styles.button,
    getVariantStyles(),
    getSizeStyles(),
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: getTextSize(),
    },
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={getTextColor()} 
            style={styles.loadingSpinner}
          />
          {title && <Text style={textStyles}>{title}</Text>}
        </View>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.iconLeft}>{icon}</View>
          <Text style={textStyles}>{title}</Text>
        </View>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <View style={styles.contentContainer}>
          <Text style={textStyles}>{title}</Text>
          <View style={styles.iconRight}>{icon}</View>
        </View>
      );
    }

    return <Text style={textStyles}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default Button;