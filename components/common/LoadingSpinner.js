import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const LoadingSpinner = ({
  visible = true,
  size = 'large',
  color = '#3B82F6',
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  text = '',
  textStyle = {},
  overlay = true,
  fullScreen = false,
  style = {},
  animationType = 'fade',
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Spinner size configuration
  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'medium':
        return 30;
      case 'large':
        return 40;
      case 'xlarge':
        return 60;
      default:
        return 40;
    }
  };

  // Container styles based on type
  const getContainerStyles = () => {
    if (fullScreen) {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
        zIndex: 1000,
      };
    }
    
    if (overlay) {
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
      };
    }
    
    return {};
  };

  // Spinner content styles
  const getSpinnerContentStyles = () => {
    const baseStyles = {
      backgroundColor: overlay ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      minHeight: 100,
    };

    if (overlay || fullScreen) {
      return {
        ...baseStyles,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      };
    }

    return baseStyles;
  };

  const containerStyles = [
    styles.container,
    getContainerStyles(),
    {
      backgroundColor: overlay || fullScreen ? backgroundColor : 'transparent',
    },
    style,
  ];

  const spinnerContentStyles = [
    styles.spinnerContent,
    getSpinnerContentStyles(),
  ];

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        containerStyles,
        {
          opacity: fadeAnim,
        },
      ]}
      {...props}
    >
      <Animated.View
        style={[
          spinnerContentStyles,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ActivityIndicator
          size={getSpinnerSize()}
          color={color}
          style={styles.spinner}
        />
        {text && (
          <Text style={[styles.text, textStyle]}>
            {text}
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
};

// Preset spinner variants for common use cases
LoadingSpinner.Overlay = (props) => (
  <LoadingSpinner
    overlay={true}
    fullScreen={false}
    size="large"
    text="Loading..."
    {...props}
  />
);

LoadingSpinner.FullScreen = (props) => (
  <LoadingSpinner
    fullScreen={true}
    overlay={true}
    size="xlarge"
    text="Loading..."
    backgroundColor="rgba(0, 0, 0, 0.7)"
    {...props}
  />
);

LoadingSpinner.Inline = (props) => (
  <LoadingSpinner
    overlay={false}
    fullScreen={false}
    size="medium"
    backgroundColor="transparent"
    {...props}
  />
);

LoadingSpinner.Small = (props) => (
  <LoadingSpinner
    overlay={false}
    fullScreen={false}
    size="small"
    backgroundColor="transparent"
    {...props}
  />
);

// Custom spinner with dots animation
LoadingSpinner.Dots = ({ visible = true, color = '#3B82F6', size = 8 }) => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const createDotAnimation = (animValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      Animated.parallel([
        createDotAnimation(dot1Anim, 0),
        createDotAnimation(dot2Anim, 150),
        createDotAnimation(dot3Anim, 300),
      ]).start();
    }
  }, [visible, dot1Anim, dot2Anim, dot3Anim]);

  if (!visible) return null;

  return (
    <View style={styles.dotsContainer}>
      {[dot1Anim, dot2Anim, dot3Anim].map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              backgroundColor: color,
              opacity: anim,
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 3,
  },
});

export default LoadingSpinner;