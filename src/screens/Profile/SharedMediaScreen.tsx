import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SharedMediaScreenProps {
  route: any;
  navigation: any;
}

interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'file' | 'link';
  uri: string;
  name?: string;
  size?: string;
  timestamp: Date;
}

type TabType = 'photos' | 'videos' | 'files' | 'links';

export default function SharedMediaScreen({ route, navigation }: SharedMediaScreenProps) {
  const { theme } = useTheme();
  const { chatName } = route.params || {};
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Mock data
  const mockPhotos: MediaItem[] = Array(12).fill(0).map((_, i) => ({
    id: `photo-${i}`,
    type: 'photo' as const,
    uri: `https://picsum.photos/400/400?random=${i}`,
    timestamp: new Date(Date.now() - i * 86400000),
  }));

  const mockVideos: MediaItem[] = Array(6).fill(0).map((_, i) => ({
    id: `video-${i}`,
    type: 'video' as const,
    uri: `https://picsum.photos/400/400?random=${i + 20}`,
    timestamp: new Date(Date.now() - i * 172800000),
  }));

  const mockFiles: MediaItem[] = [
    {
      id: 'file-1',
      type: 'file',
      uri: '',
      name: 'Project_Report.pdf',
      size: '2.5 MB',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: 'file-2',
      type: 'file',
      uri: '',
      name: 'Invoice_2024.xlsx',
      size: '1.2 MB',
      timestamp: new Date(Date.now() - 172800000),
    },
    {
      id: 'file-3',
      type: 'file',
      uri: '',
      name: 'Presentation.pptx',
      size: '5.8 MB',
      timestamp: new Date(Date.now() - 259200000),
    },
  ];

  const mockLinks: MediaItem[] = [
    {
      id: 'link-1',
      type: 'link',
      uri: 'https://example.com',
      name: 'Interesting Article About Technology',
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: 'link-2',
      type: 'link',
      uri: 'https://github.com',
      name: 'GitHub Repository',
      timestamp: new Date(Date.now() - 172800000),
    },
  ];

  const getMediaData = () => {
    switch (activeTab) {
      case 'photos':
        return mockPhotos;
      case 'videos':
        return mockVideos;
      case 'files':
        return mockFiles;
      case 'links':
        return mockLinks;
      default:
        return [];
    }
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    if (item.type === 'photo' || item.type === 'video') {
      return (
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => setSelectedMedia(item)}
          activeOpacity={0.8}
        >
          <Image source={{ uri: item.uri }} style={styles.gridImage} />
          {item.type === 'video' && (
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={40} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (item.type === 'file') {
      return (
        <TouchableOpacity
          style={[styles.fileItem, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <View style={[styles.fileIcon, { backgroundColor: `${theme.primary}15` }]}>
            <Ionicons name="document" size={24} color={theme.primary} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.fileSize, { color: theme.textSecondary }]}>{item.size}</Text>
          </View>
          <Ionicons name="download-outline" size={22} color={theme.primary} />
        </TouchableOpacity>
      );
    }

    if (item.type === 'link') {
      return (
        <TouchableOpacity
          style={[styles.linkItem, { backgroundColor: theme.surface }]}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: `${theme.primary}15` }]}>
            <Ionicons name="link" size={20} color={theme.primary} />
          </View>
          <View style={styles.linkInfo}>
            <Text style={[styles.linkName, { color: theme.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.linkUrl, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.uri}
            </Text>
          </View>
          <Ionicons name="open-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      );
    }

    return null;
  };

  const TabButton = ({ tab, label, icon }: { tab: TabType; label: string; icon: any }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && [styles.tabButtonActive, { borderBottomColor: theme.primary }],
      ]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === tab ? theme.primary : theme.textSecondary}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: activeTab === tab ? theme.primary : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const mediaData = getMediaData();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.title, { color: theme.text }]}><Text>Shared Media</Text></Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            <Text>{chatName}</Text>
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.card }]}>
        <TabButton tab="photos" label="Photos" icon="images-outline" />
        <TabButton tab="videos" label="Videos" icon="videocam-outline" />
        <TabButton tab="files" label="Files" icon="document-outline" />
        <TabButton tab="links" label="Links" icon="link-outline" />
      </View>

      {/* Content */}
      <FlatList
        data={mediaData}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={activeTab === 'photos' || activeTab === 'videos' ? 3 : 1}
        key={activeTab === 'photos' || activeTab === 'videos' ? 'grid' : 'list'}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No {activeTab} shared yet
            </Text>
          </View>
        )}
      />

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <Modal
          visible={!!selectedMedia}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMedia(null)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedMedia(null)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: selectedMedia.uri }} style={styles.modalImage} resizeMode="contain" />
          </View>
        </Modal>
      )}
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 4,
    flexGrow: 1,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 16) / 3,
    height: (SCREEN_WIDTH - 16) / 3,
    padding: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
});
