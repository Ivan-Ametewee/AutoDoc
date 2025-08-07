import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
// SafeAreaView removed - using View instead
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import OBDIIService from '../../services/obdii/OBDIIService';

interface TerminalEntry {
  id: string;
  type: 'command' | 'response' | 'error';
  content: string;
  timestamp: Date;
}

export default function TerminalScreen() {
  const { theme, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const [command, setCommand] = useState('');
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Get initial connection status
    const currentStatus = OBDIIService.getConnectionStatus();
    setIsConnected(currentStatus.status === 'connected');
    setConnectionInfo(currentStatus);

    // Subscribe to connection status changes
    const unsubscribe = OBDIIService.subscribe((event: string, data: any) => {
      if (event === 'connectionStatus') {
        setIsConnected(data.status === 'connected');
        setConnectionInfo(data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Add welcome messages with a small delay to ensure different timestamps
    addEntry('response', 'ELM327 Terminal - Send raw commands to the adapter');
    setTimeout(() => {
      addEntry('response', 'Connection status will be shown above');
    }, 10);
    
    // Listen for raw responses from OBDIIService
    const handleRawResponse = (response: any) => {
      if (response && response.rawResponse) {
        addEntry('response', response.rawResponse);
      }
    };

    // Subscribe to raw response events if they exist
    // Note: This assumes OBDIIService can emit raw responses
    // We'll implement this functionality in the service
    
    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const addEntry = (type: 'command' | 'response' | 'error', content: string) => {
    // Generate a more unique ID using timestamp, random number, and a counter
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.floor(Math.random() * 10000)}`;
    const newEntry: TerminalEntry = {
      id: uniqueId,
      type,
      content,
      timestamp: new Date(),
    };
    
    setEntries(prev => [...prev, newEntry]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendCommand = async () => {
    if (!command.trim()) return;
    
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect to an ELM327 adapter first');
      return;
    }

    const trimmedCommand = command.trim().toUpperCase();
    addEntry('command', `> ${trimmedCommand}`);
    
    // Add debug info about connection
    const connInfo = OBDIIService.getConnectionStatus();
    addEntry('response', `[DEBUG] Connection type: ${connInfo.type}, Status: ${connInfo.status}`);
    
    try {
      // Try both methods for comparison
      addEntry('response', `[DEBUG] Testing direct method first...`);
      
      // Test direct method (bypasses queue)
      if (OBDIIService.sendRawCommandDirect) {
        try {
          const directResponse = await OBDIIService.sendRawCommandDirect(trimmedCommand);
          addEntry('response', `[DIRECT] Response: ${JSON.stringify(directResponse)}`);
          if (directResponse.rawResponse) {
            addEntry('response', `[DIRECT] Raw: ${directResponse.rawResponse}`);
          }
        } catch (directError) {
          addEntry('error', `[DIRECT] Error: ${directError}`);
        }
      }
      
      addEntry('response', `[DEBUG] Now testing queue method...`);
      
      // Send raw command through normal queue system
      const response = await OBDIIService.sendRawCommand(trimmedCommand);
      
      addEntry('response', `[QUEUE] Full response: ${JSON.stringify(response)}`);
      
      if (response && response.rawResponse) {
        addEntry('response', `[QUEUE] Raw: ${response.rawResponse}`);
      } else if (response && response.data) {
        addEntry('response', `[QUEUE] Data: ${response.data}`);
      } else if (response && response.error) {
        addEntry('error', `[QUEUE] Error: ${response.error}`);
      } else {
        addEntry('error', 'No response received from queue method');
      }
    } catch (error) {
      addEntry('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addEntry('error', `[DEBUG] Error details: ${JSON.stringify(error)}`);
    }
    
    setCommand('');
  };

  const clearTerminal = () => {
    setEntries([]);
    addEntry('response', 'Terminal cleared');
  };

  const getEntryStyle = (type: string) => {
    switch (type) {
      case 'command':
        return styles.commandEntry;
      case 'error':
        return styles.errorEntry;
      default:
        return styles.responseEntry;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      {/* Connection Status */}
      <View style={[styles.statusBar, isConnected ? styles.connected : styles.disconnected]}>
        <Text style={styles.statusText}>
          {isConnected 
            ? `Connected via ${connectionInfo?.type || 'unknown'} ${connectionInfo?.device?.name || connectionInfo?.device?.ssid || ''}` 
            : 'Not Connected'
          }
        </Text>
      </View>

      {/* Terminal Output */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.terminal}
        showsVerticalScrollIndicator={true}
      >
        {entries.map((entry) => (
          <View key={entry.id} style={styles.entryContainer}>
            <Text style={styles.timestamp}>{formatTimestamp(entry.timestamp)}</Text>
            <Text style={[styles.entryText, getEntryStyle(entry.type)]}>
              {entry.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Command Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.commandInput}
          value={command}
          onChangeText={setCommand}
          placeholder="Enter ELM327 command (e.g., ATZ, 0100, ATDP)"
          placeholderTextColor="#666"
          autoCapitalize="characters"
          autoCorrect={false}
          onSubmitEditing={sendCommand}
          editable={isConnected}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !isConnected && styles.disabledButton]} 
          onPress={sendCommand}
          disabled={!isConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearTerminal}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Commands */}
      <View style={styles.quickCommands}>
        <Text style={styles.quickCommandsTitle}>Quick Commands:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ATZ', 'ATDP', 'ATRV', '0100', '0101', '010C', '010D', '0105'].map((cmd) => (
            <TouchableOpacity
              key={cmd}
              style={[styles.quickCommandButton, !isConnected && styles.disabledButton]}
              onPress={() => {
                setCommand(cmd);
                if (isConnected) {
                  // Auto-send quick commands
                  setTimeout(() => sendCommand(), 100);
                }
              }}
              disabled={!isConnected}
            >
              <Text style={styles.quickCommandText}>{cmd}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  statusBar: {
    padding: 10,
    alignItems: 'center',
  },
  connected: {
    backgroundColor: theme.colors.success || '#4CAF50',
  },
  disconnected: {
    backgroundColor: theme.colors.error || '#f44336',
  },
  statusText: {
    color: theme.colors.white || '#fff',
    fontWeight: 'bold',
  },
  terminal: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: 10,
  },
  entryContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  timestamp: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    width: 60,
    marginRight: 10,
    marginTop: 2,
  },
  entryText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  commandEntry: {
    color: theme.colors.success || '#00ff00',
    fontWeight: 'bold',
  },
  responseEntry: {
    color: theme.colors.text,
  },
  errorEntry: {
    color: theme.colors.error || '#ff6b6b',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: theme.colors.headerBackground,
    alignItems: 'center',
  },
  commandInput: {
    flex: 1,
    backgroundColor: theme.colors.cardSecondary,
    color: theme.colors.text,
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: theme.colors.success || '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  sendButtonText: {
    color: theme.colors.white || '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: theme.colors.warning || '#ff9800',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  clearButtonText: {
    color: theme.colors.white || '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled || '#666',
  },
  quickCommands: {
    backgroundColor: theme.colors.headerBackground,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  quickCommandsTitle: {
    color: theme.colors.text,
    fontSize: 12,
    marginBottom: 5,
  },
  quickCommandButton: {
    backgroundColor: theme.colors.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  quickCommandText: {
    color: theme.colors.text,
    fontSize: 10,
    fontFamily: 'monospace',
  },
});