import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { CreditCard as Edit, Trash2, Plus, Check, X, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Keyboard } from 'react-native';

export default function DetailScreen() {
  const { listId, listName } = useLocalSearchParams();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSortMode, setIsSortMode] = useState(false);
  const [shoppingItems, setShoppingItems] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  //「文字列1個」に正規化
  const listIdStr = Array.isArray(listId) ? listId[0] : String(listId ?? '');

  const ITEMS_STORAGE_KEY = `shopping_items_${listIdStr}`;
  const CHECKED_STORAGE_KEY = `checked_items_${listIdStr}`;

  // データを読み込む
  useEffect(() => {
  loadShoppingItems();
  }, [listIdStr]);

  const loadShoppingItems = async () => {
    try {
      const savedItems = await AsyncStorage.getItem(ITEMS_STORAGE_KEY);
      const savedChecked = await AsyncStorage.getItem(CHECKED_STORAGE_KEY);
      
      if (savedItems) {
        setShoppingItems(JSON.parse(savedItems));
      } else {
        // 初回起動時のデフォルトデータ
        const defaultItems = [
          { id: 1, name: '牛乳' },
          { id: 2, name: 'パン' },
          { id: 3, name: '卵' },
          { id: 4, name: 'りんご' },
          { id: 5, name: 'トマト' },
        ];
        setShoppingItems(defaultItems);
        await saveShoppingItems(defaultItems);
      }
      
      if (savedChecked) {
        setCheckedItems(JSON.parse(savedChecked));
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveShoppingItems = async (items: { id: number; name: string }[]) => {
    try {
      await AsyncStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('商品データの保存に失敗しました:', error);
    }
  };

  const saveCheckedItems = async (checked: Record<string, boolean>) => {
    try {
      await AsyncStorage.setItem(CHECKED_STORAGE_KEY, JSON.stringify(checked));
    } catch (error) {
      console.error('チェック状態の保存に失敗しました:', error);
    }
  };

  const toggleSortMode = () => {
    setIsSortMode(!isSortMode);
    setEditingItemId(null);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...shoppingItems];
    if (direction === 'up' && index > 0) {
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
    } else if (direction === 'down' && index < newItems.length - 1) {
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    }
    setShoppingItems(newItems);
    saveShoppingItems(newItems);
  };

  const handleAddItem = () => {
    const newId = shoppingItems.length > 0 ? Math.max(...shoppingItems.map(item => item.id)) + 1 : 1;
    const newItem = { id: newId, name: `新しい商品 ${newId}` };
    const newItems = [...shoppingItems, newItem];
    setShoppingItems(newItems);
    saveShoppingItems(newItems);
    Keyboard.dismiss();
  };

  const handleEditItem = (itemId: number) => {
    const item = shoppingItems.find(i => i.id === itemId);
    if (item) {
      setEditingItemId(itemId);
      setEditingText(item.name);
    }
  };

  const handleSaveEdit = () => {
    if (editingItemId && editingText.trim()) {
      const newItems = shoppingItems.map(item =>
        item.id === editingItemId
          ? { ...item, name: editingText.trim() }
          : item
      );
      setShoppingItems(newItems);
      saveShoppingItems(newItems);
    }
    setEditingItemId(null);
    setEditingText('');
    Keyboard.dismiss();
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingText('');
    Keyboard.dismiss();
  };

  const handleDeleteItem = (itemId: number) => {
    const newItems = shoppingItems.filter(item => item.id !== itemId);
    setShoppingItems(newItems);
    saveShoppingItems(newItems);
    
    const newChecked = { ...checkedItems };
    delete newChecked[String(itemId)];
    setCheckedItems(newChecked);
    saveCheckedItems(newChecked);
  };

  const toggleCheck = (itemId: number) => {
    const newChecked = {
      ...checkedItems,
      [String(itemId)]: !checkedItems[String(itemId)]
    };
    setCheckedItems(newChecked);
    saveCheckedItems(newChecked);
  };

  const resetAllChecks = () => {
    const newChecked = {};
    setCheckedItems(newChecked);
    saveCheckedItems(newChecked);
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{decodeURIComponent(listName as string || '買い物リスト')}</Text>
          </View>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{decodeURIComponent(listName as string || '買い物リスト')}</Text>
          <Text style={styles.progress}>
            {checkedCount}/{shoppingItems.length} 完了
          </Text>
        </View>
      </View>

       <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 72 : 0}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.itemsContainer}>
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
            <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>新しい商品を追加</Text>
            </TouchableOpacity>
          )}
          
          {shoppingItems.map((item, index) => (
            <View
              key={item.id}
              style={styles.itemRow}
            >
              {!isSortMode && (
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => toggleCheck(item.id)}
                >
                  <View style={styles.checkbox}>
                    {checkedItems[String(item.id)] && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              
              <View style={styles.itemContent}>
                {editingItemId === item.id && !isSortMode ? (
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
                  <Text style={[
                    styles.itemText,
                    checkedItems[String(item.id)] && styles.itemTextChecked
                  ]}>
                    {item.name}
                  </Text>
                )}
              </View>
              
              <View style={styles.buttonContainer}>
                {isSortMode ? (
                  <>
                    <TouchableOpacity
                      style={[styles.moveButton, index === 0 && styles.moveButtonDisabled]}
                      onPress={() => moveItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp size={16} color={index === 0 ? "#ccc" : "#007AFF"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.moveButton, index === shoppingItems.length - 1 && styles.moveButtonDisabled]}
                      onPress={() => moveItem(index, 'down')}
                      disabled={index === shoppingItems.length - 1}
                    >
                      <ArrowDown size={16} color={index === shoppingItems.length - 1 ? "#ccc" : "#007AFF"} />
                    </TouchableOpacity>
                  </>
                ) : editingItemId === item.id ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.saveButton]}
                      onPress={handleSaveEdit}
                    >
                      <Check size={14} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={handleCancelEdit}
                    >
                      <X size={14} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditItem(item.id)}
                    >
                      <Edit size={14} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 size={14} color="white" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetAllChecks}
        >
          <Text style={styles.resetButtonText}>すべてのチェックを外す</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  progress: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  itemsContainer: {
    padding: 16,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  checkboxContainer: {
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    paddingVertical: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingRight: 12,
    gap: 6,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  resetButton: {
    backgroundColor: '#ff6b6b',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
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
    minWidth: 100,
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