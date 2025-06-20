import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';

const Header = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  onLeftPress,
  onRightPress,
  variant = 'default',
  height = 'auto',
  showStatusBar = true,
  statusBarStyle = 'dark-content',
  backgroundColor,
  style = {},
  titleStyle = {},
  subtitleStyle = {},
  ...props
}) => {
  // Header variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: backgroundColor || '#FFFFFF',
          borderBottomColor: '#E5E7EB',
          borderBottomWidth: 1,
        };
      case 'primary':
        return {
          backgroundColor: backgroundColor || '#3B82F6',
          borderBottomColor: '#2563EB',
          borderBottomWidth: 1,
        };
      case 'dark':
        return {
          backgroundColor: backgroundColor || '#1F2937',
          borderBottomColor: '#374151',
          borderBottomWidth: 1,
        };
      case 'transparent':
        return {
          backgroundColor: backgroundColor || 'transparent',
          borderBottomWidth: 0,
        };
      case 'gradient':
        return {
          backgroundColor: backgroundColor || '#4F46E5',
          borderBottomWidth: 0,
        };
      default:
        return {
          backgroundColor: backgroundColor || '#FFFFFF',
          borderBottomColor: '#E5E7EB',
          borderBottomWidth: 1,
        };
    }
  };

  // Text colors based on variant
  const getTextColors = () => {
    switch (variant) {
      case 'primary':
      case 'dark':
      case 'gradient':
        return {
          title: '#FFFFFF',
          subtitle: '#E5E7EB',
        };
      case 'transparent':
        return {
          title: '#111827',
          subtitle: '#6B7280',
        };
      default:
        return {
          title: '#111827',
          subtitle: '#6B7280',
        };
    }
  };

  // Header height styles
  const getHeightStyles = () => {
    const baseHeight = Platform.OS === 'ios' ? 44 : 56;
    const statusBarHeight = Platform.OS === 'ios' ? 20 : StatusBar.currentHeight || 0;
    
    switch (height) {
      case 'small':
        return {
          height: baseHeight + (showStatusBar ? statusBarHeight : 0),
          paddingTop: showStatusBar ? statusBarHeight : 0,
        };
      case 'medium':
        return {
          height: (baseHeight + 20) + (showStatusBar ? statusBarHeight : 0),
          paddingTop: showStatusBar ? statusBarHeight : 0,
        };
      case 'large':
        return {
          height: (baseHeight + 40) + (showStatusBar ? statusBarHeight : 0),
          paddingTop: showStatusBar ? statusBarHeight : 0,
        };
      case 'auto':
        return {
          minHeight: baseHeight + (showStatusBar ? statusBarHeight : 0),
          paddingTop: showStatusBar ? statusBarHeight : 0,
        };
      default:
        return {
          minHeight: baseHeight + (showStatusBar ? statusBarHeight : 0),
          paddingTop: showStatusBar ? statusBarHeight : 0,
        };
    }
  };

  const headerStyles = [
    styles.header,
    getVariantStyles(),
    getHeightStyles(),
    style,
  ];

  const textColors = getTextColors();

  const renderLeftComponent = () => {
    if (leftComponent) {
      if (onLeftPress) {
        return (
          <TouchableOpacity
            style={styles.leftAction}
            onPress={onLeftPress}
            activeOpacity={0.7}
          >
            {leftComponent}
          </TouchableOpacity>
        );
      }
      return <View style={styles.leftComponent}>{leftComponent}</View>;
    }
    return <View style={styles.leftSpacer} />;
  };

  const renderRightComponent = () => {
    if (rightComponent) {
      if (onRightPress) {
        return (
          <TouchableOpacity
            style={styles.rightAction}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            {rightComponent}
          </TouchableOpacity>
        );
      }
      return <View style={styles.rightComponent}>{rightComponent}</View>;
    }
    return <View style={styles.rightSpacer} />;
  };

  return (
    <>
      {showStatusBar && (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={getVariantStyles().backgroundColor}
          translucent={false}
        />
      )}
      <View style={headerStyles} {...props}>
        <View style={styles.container}>
          {renderLeftComponent()}
          
          <View style={styles.centerContent}>
            {title && (
              <Text
                style={[
                  styles.title,
                  { color: textColors.title },
                  titleStyle,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: textColors.subtitle },
                  subtitleStyle,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            )}
          </View>
          
          {renderRightComponent()}
        </View>
      </View>
    </>
  );
};

// Header sub-components for complex layouts
Header.Left = ({ children, onPress, style = {} }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.headerSection, style]}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    {children}
  </TouchableOpacity>
);

Header.Center = ({ children, style = {} }) => (
  <View style={[styles.headerCenter, style]}>
    {children}
  </View>
);

Header.Right = ({ children, onPress, style = {} }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.headerSection, style]}
    activeOpacity={onPress ? 0.7 : 1}
    disabled={!onPress}
  >
    {children}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 44,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  leftComponent: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 40,
  },
  rightComponent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 40,
  },
  leftAction: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 44,
  },
  rightAction: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 44,
  },
  leftSpacer: {
    minWidth: 40,
  },
  rightSpacer: {
    minWidth: 40,
  },
  // Sub-component styles
  headerSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;