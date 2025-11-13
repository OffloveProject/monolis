import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useState, useEffect } from 'react';
import { CreditCard as Edit, Trash2, Plus, Check, X, ArrowUp, ArrowDown } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Keyboard } from 'react-native';

const STORAGE_KEY = 'shopping_lists';

export default function HomeScreen() {
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSortMode, setIsSortMode] = useState(false);
  const [shoppingLists, setShoppingLists] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // データを読み込む
  useEffect(() => {
    loadShoppingLists();
  }, []);

  const loadShoppingLists = async () => {
    try {
      const savedLists = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLists) {
        setShoppingLists(JSON.parse(savedLists));
      } else {
        // 初回起動時のデフォルトデータ
        const defaultLists = [
          { id: 1, name: '今日の買い物' },
          { id: 2, name: '週末の準備' },
        ];
        setShoppingLists(defaultLists);
        await saveShoppingLists(defaultLists);
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveShoppingLists = async (lists: { id: number; name: string }[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('データの保存に失敗しました:', error);
    }
  };

  const toggleSortMode = () => {
    setIsSortMode(!isSortMode);
    setEditingListId(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newLists = [...shoppingLists];
    if (direction === 'up' && index > 0) {
      [newLists[index], newLists[index - 1]] = [newLists[index - 1], newLists[index]];
    } else if (direction === 'down' && index < newLists.length - 1) {
      [newLists[index], newLists[index + 1]] = [newLists[index + 1], newLists[index]];
    }
    setShoppingLists(newLists);
    saveShoppingLists(newLists);
  };

  const handleAddList = () => {
    const newId = shoppingLists.length > 0 ? Math.max(...shoppingLists.map(list => list.id)) + 1 : 1;
    const newList = { id: newId, name: `新しいリスト ${newId}` };
    const newLists = [...shoppingLists, newList];
    setShoppingLists(newLists);
    saveShoppingLists(newLists);
  };

  const handleEditList = (listId: number) => {
    const list = shoppingLists.find(l => l.id === listId);
    if (list) {
      setEditingListId(listId);
      setEditingText(list.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingListId && editingText.trim()) {
      const newLists = shoppingLists.map(list =>
        list.id === editingListId
          ? { ...list, name: editingText.trim() }
          : list
      );
      setShoppingLists(newLists);
      saveShoppingLists(newLists);
    }
    setEditingListId(null);
    setEditingText('');
    Keyboard.dismiss();
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditingText('');
    Keyboard.dismiss();
  };

  const handleDeleteList = async (listId: number) => {
    try {
      const newLists = shoppingLists.filter(list => list.id !== listId);
      setShoppingLists(newLists);
      await saveShoppingLists(newLists);

      const id = String(listId);
      await AsyncStorage.multiRemove([
        `shopping_items_${id}`,
        `checked_items_${id}`,
      ]);
    } catch (e) {
      console.error('リスト削除時のクリーンアップに失敗:', e);
    }
  };

  const handleListTap = (listId: number) => {
    const list = shoppingLists.find(l => l.id === listId);
    if (list) {
      router.push(`/detail?listId=${listId}&listName=${encodeURIComponent(list.name)}`);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>モノリス</Text>
          <Text style={styles.subtitle}>-お買い物リスト-</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>モノリス</Text>
        <Text style={styles.subtitle}>-お買い物リスト-</Text>
      </View>

     <View style={styles.content}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 72 : 0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
        <Text style={styles.sectionTitle}>買い物リスト一覧</Text>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.sortButton, isSortMode && styles.sortButtonActive]} 
            onPress={toggleSortMode}
          >
            <Text style={[styles.sortButtonText, isSortMode && styles.sortButtonTextActive]}>
              {isSortMode ? '✓完了' : '⇅並び替え'}
            </Text>
          </TouchableOpacity>
          </View>

         {!isSortMode && (
           <TouchableOpacity style={styles.addButton} onPress={handleAddList}>
             <Plus size={20} color="white" />
             <Text style={styles.addButtonText}>新しいリストを追加</Text>
           </TouchableOpacity>
         )}

        {shoppingLists.map((list, index) => (
          <View key={list.id} style={styles.listItem}>
            {isSortMode ? (
              <>
                <View style={styles.listContent}>
                  <Text style={styles.listName}>{list.name}</Text>
                </View>
                <View style={styles.sortButtonContainer}>
                  <TouchableOpacity
                    style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                    onPress={() => moveItem(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp size={16} color={index === 0 ? "#ccc" : "#007AFF"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moveButton, index === shoppingLists.length - 1 && styles.moveButtonDisabled]}
                    onPress={() => moveItem(index, 'down')}
                    disabled={index === shoppingLists.length - 1}
                  >
                    <ArrowDown size={16} color={index === shoppingLists.length - 1 ? "#ccc" : "#007AFF"} />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.listContent}
                  onPress={() => handleListTap(list.id)}
                >
                  {editingListId === list.id ? (
                    <TextInput
                      style={styles.editInput}
                      value={editingText}
                      onChangeText={setEditingText}
                      autoFocus
                      onSubmitEditing={handleSaveEdit}
                      blurOnSubmit
                      returnKeyType="done"
                    />
                  ) : (
                    <Text style={styles.listName}>{list.name}</Text>
                  )}
                </TouchableOpacity>
        
                <View style={styles.buttonContainer}>
                  {editingListId === list.id ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.saveButton]}
                        onPress={handleSaveEdit}
                      >
                        <Check size={16} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={handleCancelEdit}
                      >
                        <X size={16} color="white" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditList(list.id)}
                    >
                      <Edit size={16} color="white" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteList(list.id)}
                  >
                    <Trash2 size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ))}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 4,
  },
  sortButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  sortButtonContainer: {
    flexDirection: 'column',
    paddingRight: 12,
    gap: 4,
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  moveButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  listItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  listContent: {
    flex: 1,
    padding: 16,
  },
  listName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingRight: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#34C759',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editInput: {
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    paddingBottom: 2,
    minWidth: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});