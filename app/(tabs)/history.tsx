import React from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/currencies'
import type { Transaction } from '@/lib/types'

export default function HistoryScreen() {
  const { transactions, settings, deleteTransaction } = useAppStore()

  const handleDelete = (id: number) => {
    Alert.alert('删除交易', '确定要删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteTransaction(id),
      },
    ])
  }

  const renderItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income'
    const date = new Date(item.date)

    const sourceIcon = {
      manual: 'create-outline',
      notification: 'notifications-outline',
      sms: 'chatbubble-outline',
      import: 'cloud-download-outline',
    }[item.source] as keyof typeof Ionicons.glyphMap

    return (
      <TouchableOpacity
        style={styles.item}
        onLongPress={() => item.id && handleDelete(item.id)}
      >
        <View style={styles.itemLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isIncome ? '#10b98120' : '#ef444420' },
            ]}
          >
            <Ionicons
              name={isIncome ? 'arrow-down' : 'arrow-up'}
              size={20}
              color={isIncome ? '#10b981' : '#ef4444'}
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemDescription}>
              {item.description || item.merchant || (isIncome ? '收入' : '支出')}
            </Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemDate}>
                {date.toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Ionicons
                name={sourceIcon}
                size={12}
                color="#71717a"
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
        <Text
          style={[
            styles.itemAmount,
            { color: isIncome ? '#10b981' : '#ef4444' },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(item.amount, settings.currency)}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#27272a" />
          <Text style={styles.emptyText}>暂无交易记录</Text>
          <Text style={styles.emptySubtext}>
            在首页点击 + 按钮添加记录
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  listContent: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    color: '#fafafa',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: '#71717a',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#71717a',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#52525b',
    marginTop: 8,
  },
})
