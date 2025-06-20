import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  onPress,
  variant = 'default',
  size = 'medium',
  shadow = true,
  style = {},
  headerStyle = {},
  contentStyle = {},
  ...props
}) => {
  // Card variant styles
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
      case 'transparent':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
        };
    }
  };

  // Card size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 12,
          borderRadius: 8,
        };
      case 'medium':
        return {
          padding: 16,
          borderRadius: 12,
        };
      case 'large':
        return {
          padding: 20,
          borderRadius: 16,
        };
      default:
        return {
          padding: 16,
          borderRadius: 12,
        };
    }
  };

  // Shadow styles
  const getShadowStyles = () => {
    if (!shadow) return {};
    
    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    };
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

  const cardStyles = [
    styles.card,
    getVariantStyles(),
    getSizeStyles(),
    getShadowStyles(),
    style,
  ];

  const textColors = getTextColors();

  const CardContent = () => (
    <View style={cardStyles} {...props}>
      {(title || subtitle || headerAction) && (
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
          {headerAction && (
            <View style={styles.headerAction}>
              {headerAction}
            </View>
          )}
        </View>
      )}
      {children && (
        <View style={[styles.content, contentStyle]}>
          {children}
        </View>
      )}
    </View>
  );

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

// Card sub-components for better organization
Card.Header = ({ children, style = {} }) => (
  <View style={[styles.cardHeader, style]}>
    {children}
  </View>
);

Card.Content = ({ children, style = {} }) => (
  <View style={[styles.cardContent, style]}>
    {children}
  </View>
);

Card.Footer = ({ children, style = {} }) => (
  <View style={[styles.cardFooter, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerAction: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  content: {
    flex: 1,
  },
  // Sub-component styles
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 12,
  },
});

export default Card;