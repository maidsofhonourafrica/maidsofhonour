import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { createStyles } from '@/theme/createStyles';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.muted,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    marginBottom: 12,
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: theme.card,
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: theme.primary,
  },
  messageText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
  messageTextLeft: {
    color: theme.text,
  },
  messageTextRight: {
    color: 'white',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: theme.fonts.regular,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    backgroundColor: theme.card,
    borderTopColor: theme.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    fontFamily: theme.fonts.regular,
    backgroundColor: theme.background,
    borderColor: theme.border,
    color: theme.text,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
  },
}));

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const styles = useStyles();

  const messages = [
    { id: 1, text: 'Hi! I would like to book you for next week.', isMine: false, time: '10:30 AM' },
    { id: 2, text: 'Hello! Sure, I am available. What days do you need help?', isMine: true, time: '10:32 AM' },
    { id: 3, text: 'Monday to Friday, 8am to 4pm. Is that okay?', isMine: false, time: '10:35 AM' },
  ];

  const handleSend = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={styles.headerName.color} />
          </TouchableOpacity>
          <Image 
            source={{ uri: `https://i.pravatar.cc/150?u=${id}` }} 
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Mary Johnson</Text>
            <Text style={styles.headerStatus}>Active now</Text>
          </View>
          <TouchableOpacity>
            <Feather name="more-vertical" size={24} color={styles.headerName.color} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => (
          <View 
            key={msg.id} 
            style={[
              styles.messageBubble,
              msg.isMine ? styles.messageBubbleRight : styles.messageBubbleLeft
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.isMine ? styles.messageTextRight : styles.messageTextLeft
            ]}>
              {msg.text}
            </Text>
            <Text style={[
              styles.messageTime,
              msg.isMine ? styles.messageTextRight : styles.messageTextLeft,
              { opacity: 0.7 }
            ]}>
              {msg.time}
            </Text>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView edges={['bottom']}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={styles.headerStatus.color}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Feather name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
