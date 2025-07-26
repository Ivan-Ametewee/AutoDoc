import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OBDIIService from '../../services/obdii/OBDIIService';

interface TerminalEntry {
  id: string;
  type: 'command' | 'response' | 'error';
  content: string;
  timestamp: Date;
}

export default function TerminalScreen() {
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
    // Add welcome message
    addEntry('response', 'ELM327 Terminal - Send raw commands to the adapter');
    addEntry('response', 'Connection status will be shown above');
    
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
    const newEntry: TerminalEntry = {
      id: Date.now().toString(),
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
    
    try {
      // Send raw command through OBDIIService
      const response = await OBDIIService.sendRawCommand(trimmedCommand);
      
      if (response && response.rawResponse) {
        addEntry('response', response.rawResponse);
      } else if (response && response.error) {
        addEntry('error', `Error: ${response.error}`);
      } else {
        addEntry('error', 'No response received');
      }
    } catch (error) {
      addEntry('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statusBar: {
    padding: 10,
    alignItems: 'center',
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#f44336',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  terminal: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  entryContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  timestamp: {
    color: '#666',
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
    color: '#00ff00',
    fontWeight: 'bold',
  },
  responseEntry: {
    color: '#fff',
  },
  errorEntry: {
    color: '#ff6b6b',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#111',
    alignItems: 'center',
  },
  commandInput: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  quickCommands: {
    backgroundColor: '#111',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  quickCommandsTitle: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },
  quickCommandButton: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  quickCommandText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});