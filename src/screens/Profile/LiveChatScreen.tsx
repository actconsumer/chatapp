import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import * as apiHelper from '../../services/apiHelper';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  agentName?: string;
  type?: 'text' | 'suggestion' | 'email';
  suggestions?: string[];
}

const SUPPORT_EMAIL = 'support@projectchat.shakarparajuli.com.np';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    text: 'Hello! 👋 I\'m ProjectChat AI Assistant. I\'m here to help you with any questions or issues you might have. How can I assist you today?',
    isUser: false,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    agentName: 'AI Assistant',
  },
];

// Intelligent AI responses with context awareness
const AI_KNOWLEDGE_BASE = {
  // Account & Authentication
  login: {
    patterns: ['login', 'sign in', 'log in', 'cant login', 'unable to login'],
    response: '🔐 Having trouble logging in? Here are some quick fixes:\n\n1. Make sure your email and password are correct\n2. Check if Caps Lock is on\n3. Try "Forgot Password" to reset\n4. Clear app cache and try again\n\nIf you\'re still having issues, I can connect you with our support team.',
    suggestions: ['Forgot Password', 'Account Recovery', 'Contact Support'],
  },
  password: {
    patterns: ['password', 'reset password', 'forgot password', 'change password'],
    response: '🔑 Password Management:\n\n• To reset your password: Settings → Account → Change Password\n• Forgot password? Use "Forgot Password" on the login screen\n• Password must be at least 8 characters with letters and numbers\n• Enable 2FA for extra security!\n\nNeed help with account recovery?',
    suggestions: ['Enable 2FA', 'Account Security', 'Contact Support'],
  },
  twofa: {
    patterns: ['2fa', 'two factor', 'authentication', 'security code', 'verify'],
    response: '🛡️ Two-Factor Authentication:\n\n• Go to Settings → Two-Factor Authentication\n• Scan QR code with your authenticator app\n• Enter the 6-digit code to verify\n• Save backup codes in a safe place!\n\nThis adds an extra layer of security to your account.',
    suggestions: ['Security Guide', 'Backup Codes', 'Contact Support'],
  },

  // Features & Functionality
  calls: {
    patterns: ['call', 'video call', 'voice call', 'calling', 'audio', 'video'],
    response: '📞 Calling Features:\n\n• Voice & Video calls with HD quality\n• Echo cancellation & noise suppression\n• Settings → Call Settings to adjust quality\n• End-to-end encrypted calls\n\nHaving connection issues? Check your internet connection and call settings.',
    suggestions: ['Call Settings', 'Connection Issues', 'Contact Support'],
  },
  messages: {
    patterns: ['message', 'chat', 'send', 'receive', 'text'],
    response: '💬 Messaging Features:\n\n• Send text, images, videos, and documents\n• React to messages with emojis\n• Edit or delete messages\n• End-to-end encrypted chats\n\nMessages not sending? Check your internet connection.',
    suggestions: ['Message Issues', 'Media Upload', 'Contact Support'],
  },
  groups: {
    patterns: ['group', 'group chat', 'create group', 'add members'],
    response: '👥 Group Chats:\n\n• Tap the + button on Chats screen\n• Add members and set a group name\n• Upload a group photo\n• Manage members and admins\n\nNeed help managing your group?',
    suggestions: ['Create Group', 'Manage Members', 'Contact Support'],
  },
  stories: {
    patterns: ['story', 'stories', 'status', 'post'],
    response: '📸 Stories Feature:\n\n• Share photos, videos, or text stories\n• Stories disappear after 24 hours\n• Add text, stickers, and filters\n• See who viewed your story\n\nReady to share your moment?',
    suggestions: ['Create Story', 'Privacy Settings', 'Contact Support'],
  },

  // Technical Issues
  bug: {
    patterns: ['bug', 'error', 'crash', 'not working', 'broken', 'issue', 'problem'],
    response: '🐛 Sorry you\'re experiencing issues! To help us fix this faster:\n\n1. What were you doing when it happened?\n2. Does it happen every time?\n3. What device are you using?\n4. Try restarting the app\n\nPlease email us at support@projectchat.shakarparajuli.com.np with these details.',
    suggestions: ['Email Support', 'Report Details', 'App Version'],
  },
  slow: {
    patterns: ['slow', 'lag', 'laggy', 'frozen', 'freeze', 'performance'],
    response: '⚡ App running slow? Try these steps:\n\n1. Close other apps running in background\n2. Clear app cache: Settings → Account → Clear Cache\n3. Check your internet connection\n4. Update to the latest version\n5. Restart your device\n\nStill slow? Let me know your device model.',
    suggestions: ['Clear Cache', 'Update App', 'Contact Support'],
  },
  connection: {
    patterns: ['connection', 'connect', 'offline', 'internet', 'network'],
    response: '📡 Connection Issues:\n\n• Check if you have internet access\n• Try switching between WiFi and mobile data\n• Restart the app\n• Check if ProjectChat servers are online\n\nMessages will be sent when you\'re back online!',
    suggestions: ['Check Status', 'Retry Connection', 'Contact Support'],
  },

  // Privacy & Security
  privacy: {
    patterns: ['privacy', 'private', 'security', 'safe', 'encryption'],
    response: '🔒 Your Privacy Matters:\n\n• End-to-end encryption for all chats and calls\n• Control who can see your profile\n• Manage blocked users\n• Settings → Privacy for more options\n\nYour data is secure with us!',
    suggestions: ['Privacy Settings', 'Block Users', 'Learn More'],
  },
  delete: {
    patterns: ['delete account', 'remove account', 'deactivate'],
    response: '⚠️ Delete Account:\n\nBefore you go:\n• This action is permanent and cannot be undone\n• All your messages and data will be deleted\n• You can deactivate instead of deleting\n\nTo delete: Settings → Account → Delete Account\n\nAre you sure you want to proceed?',
    suggestions: ['Deactivate Instead', 'Keep Account', 'Contact Support'],
  },

  // Features & Updates
  features: {
    patterns: ['feature', 'new feature', 'suggest', 'suggestion', 'add'],
    response: '💡 Feature Requests:\n\nWe love hearing your ideas! We\'re constantly improving ProjectChat.\n\n• Share your suggestions with us\n• Vote on community requests\n• Check our roadmap for upcoming features\n\nEmail your ideas to support@projectchat.shakarparajuli.com.np',
    suggestions: ['Email Ideas', 'Roadmap', 'Contact Support'],
  },
  update: {
    patterns: ['update', 'version', 'latest', 'new version'],
    response: '🆕 App Updates:\n\n• Check Play Store/App Store for updates\n• Enable auto-updates for latest features\n• Current version: Check Settings → About\n\nAlways keep your app updated for the best experience!',
    suggestions: ['Check Updates', 'Release Notes', 'Contact Support'],
  },

  // General Help
  help: {
    patterns: ['help', 'support', 'assist', 'guide'],
    response: '❓ I\'m here to help! I can assist you with:\n\n• Account & Login issues\n• Features & How-to guides\n• Technical problems\n• Privacy & Security\n• Feature requests\n\nWhat would you like to know more about?',
    suggestions: ['Account Help', 'Features Guide', 'Report Issue', 'Contact Human'],
  },
  human: {
    patterns: ['human', 'real person', 'agent', 'representative', 'talk to someone'],
    response: '👨‍💼 Connect with Our Team:\n\nWhile I can help with most questions, sometimes you need a human touch!\n\nEmail us at: support@projectchat.shakarparajuli.com.np\n\nOur team typically responds within 24 hours.\n\nWould you like me to open your email app?',
    suggestions: ['Open Email', 'Keep Chatting', 'Get Phone Number'],
  },

  // Greetings
  greeting: {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    response: '👋 Hello! Great to see you here! I\'m your AI assistant, ready to help with anything you need.\n\nHow can I make your ProjectChat experience better today?',
    suggestions: ['Account Help', 'Features Guide', 'Report Issue'],
  },
  thanks: {
    patterns: ['thank', 'thanks', 'thank you', 'appreciate'],
    response: '😊 You\'re very welcome! I\'m glad I could help.\n\nIs there anything else you\'d like to know? I\'m here 24/7!',
    suggestions: ['Ask Another Question', 'Contact Support', 'Done'],
  },
  bye: {
    patterns: ['bye', 'goodbye', 'see you', 'later'],
    response: '👋 Goodbye! Thanks for chatting with me. Feel free to come back anytime you need help.\n\nHave a wonderful day! 🌟',
    suggestions: ['Start New Chat', 'Exit'],
  },
};

const DEFAULT_RESPONSE = {
  response: '🤔 I\'m not quite sure about that, but I want to help!\n\nYou can:\n• Rephrase your question\n• Try one of the suggestions below\n• Email our support team\n\nWhat would you like to do?',
  suggestions: ['Common Issues', 'Features Guide', 'Email Support', 'Talk to Human'],
};

export default function LiveChatScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Intelligent AI response system
  const getAIResponse = (text: string): { response: string; suggestions: string[] } => {
    const lowerText = text.toLowerCase().trim();
    
    // Check against knowledge base
    for (const [category, data] of Object.entries(AI_KNOWLEDGE_BASE)) {
      for (const pattern of data.patterns) {
        if (lowerText.includes(pattern)) {
          // Add to conversation context
          setConversationContext(prev => [...prev, category].slice(-5));
          return { response: data.response, suggestions: data.suggestions || [] };
        }
      }
    }
    
    // If no match, return default with context-aware suggestions
    return DEFAULT_RESPONSE;
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    const userQuery = inputText.trim();
    setInputText('');

    // Simulate AI thinking
    setIsTyping(true);

    // Realistic typing delay based on response length
    const { response, suggestions } = getAIResponse(userQuery);
    const typingDelay = Math.min(response.length * 15, 3000);

    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: 'AI Assistant',
        suggestions: suggestions,
      };

      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, typingDelay);
  };

  const handleSuggestionPress = (suggestion: string) => {
    if (suggestion === 'Open Email' || suggestion === 'Email Support' || suggestion === 'Email Ideas') {
      handleEmailSupport();
    } else if (suggestion === 'Exit' || suggestion === 'Done') {
      navigation.goBack();
    } else if (suggestion === 'Contact Human' || suggestion === 'Talk to Human') {
      handleEmailSupport();
    } else {
      // Send suggestion as user message
      setInputText(suggestion);
      setTimeout(() => handleSend(), 100);
    }
  };

  const handleEmailSupport = () => {
    Alert.alert(
      'Contact Support',
      `Would you like to email our support team?\n\n📧 ${SUPPORT_EMAIL}\n\nWe typically respond within 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Email',
          onPress: () => {
            const subject = 'Support Request - ProjectChat';
            const body = `Hi Support Team,\n\n[Describe your issue here]\n\n---\nUser: ${user?.username || 'Unknown'}\nEmail: ${user?.email || 'Unknown'}\nApp Version: 1.0.0`;
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userMessageWrapper}>
            <LinearGradient
              colors={theme.gradient}
              style={styles.userMessageBubble}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.userMessageText}>{item.text}</Text>
            </LinearGradient>
            <Text style={[styles.messageTime, { color: theme.textSecondary }]}>
              {item.timestamp}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.agentMessageContainer}>
        <View style={[styles.agentAvatar, { backgroundColor: theme.surface }]}>
          <Ionicons name="sparkles" size={20} color={theme.primary} />
        </View>
        <View style={styles.agentMessageWrapper}>
          {item.agentName && (
            <Text style={[styles.agentName, { color: theme.primary }]}>
              {item.agentName}
            </Text>
          )}
          <View style={[styles.agentMessageBubble, { backgroundColor: theme.surface }]}>
            <Text style={[styles.agentMessageText, { color: theme.text }]}>
              {item.text}
            </Text>
          </View>
          {item.suggestions && item.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {item.suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionChip, { 
                    backgroundColor: theme.primary + '15',
                    borderColor: theme.primary + '30'
                  }]}
                  onPress={() => handleSuggestionPress(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: theme.primary }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={[styles.messageTime, { color: theme.textSecondary }]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.agentMessageContainer}>
        <View style={[styles.agentAvatar, { backgroundColor: theme.surface }]}>
          <Ionicons name="person" size={20} color={theme.primary} />
        </View>
        <View style={[styles.typingBubble, { backgroundColor: theme.surface }]}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Live Support Chat</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              Support Available
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <TouchableOpacity 
        style={[styles.infoBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}
        onPress={handleEmailSupport}
      >
        <Ionicons name="mail" size={20} color={theme.primary} />
        <Text style={[styles.infoBannerText, { color: theme.primary }]}>
          Need human support? Tap here to email us! 📧
        </Text>
      </TouchableOpacity>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Type your message..."
              placeholderTextColor={theme.placeholder}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="attach" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? theme.gradient : ['#ccc', '#999']}
              style={styles.sendButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Quick Replies */}
      <View style={[styles.quickReplies, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { icon: 'help-circle', text: 'Help' },
            { icon: 'key', text: 'Login Issues' },
            { icon: 'bug', text: 'Report Bug' },
            { icon: 'mail', text: 'Email Support' },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickReplyButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => item.text === 'Email Support' ? handleEmailSupport() : setInputText(item.text)}
            >
              <Ionicons name={item.icon as any} size={16} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.quickReplyText, { color: theme.text }]}>{item.text}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
  },
  headerButton: {
    padding: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessageWrapper: {
    maxWidth: '80%',
    alignItems: 'flex-end',
  },
  userMessageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  agentMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentMessageWrapper: {
    maxWidth: '75%',
  },
  agentName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
  },
  agentMessageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  agentMessageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 12,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 80,
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
  },
  attachButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReplies: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
