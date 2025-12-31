import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppStore } from '@/lib/store'
import { importBillFile } from '@/services/bill-importer'
import { formatCurrency } from '@/lib/currencies'
import type { Transaction } from '@/lib/types'

export default function ImportScreen() {
  const { settings, addTransactionBatch } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<Transaction[]>([])

  const handleImport = async () => {
    setIsLoading(true)
    try {
      const result = await importBillFile()

      if (result.success && result.transactions.length > 0) {
        setPreviewData(result.transactions)
      } else if (result.errors.length > 0) {
        Alert.alert('导入失败', result.errors.join('\n'))
      } else {
        Alert.alert('提示', '未找到可导入的交易记录')
      }
    } catch (error) {
      Alert.alert('错误', '导入过程中发生错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmImport = async () => {
    if (previewData.length === 0) return

    setIsLoading(true)
    try {
      await addTransactionBatch(previewData)
      Alert.alert('成功', `已导入 ${previewData.length} 条交易记录`)
      setPreviewData([])
    } catch (error) {
      Alert.alert('错误', '保存交易记录时发生错误')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelImport = () => {
    setPreviewData([])
  }

  const renderPreviewItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income'
    const date = new Date(item.date)

    return (
      <View style={styles.previewItem}>
        <View style={styles.previewLeft}>
          <Text style={styles.previewDescription}>
            {item.description || item.merchant || (isIncome ? '收入' : '支出')}
          </Text>
          <Text style={styles.previewDate}>
            {date.toLocaleDateString('zh-CN')}
          </Text>
        </View>
        <Text
          style={[
            styles.previewAmount,
            { color: isIncome ? '#10b981' : '#ef4444' },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(item.amount, settings.currency)}
        </Text>
      </View>
    )
  }

  if (previewData.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>
            预览 ({previewData.length} 条记录)
          </Text>
          <Text style={styles.previewSubtitle}>
            请确认以下交易记录是否正确
          </Text>
        </View>

        <FlatList
          data={previewData}
          renderItem={renderPreviewItem}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={styles.previewList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleCancelImport}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleConfirmImport}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>确认导入</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Import from File */}
        <TouchableOpacity
          style={styles.importCard}
          onPress={handleImport}
          disabled={isLoading}
        >
          <View style={styles.importIconContainer}>
            <Ionicons name="document-text-outline" size={32} color="#10b981" />
          </View>
          <Text style={styles.importTitle}>导入账单文件</Text>
          <Text style={styles.importDescription}>
            支持微信、支付宝导出的 CSV 账单文件
          </Text>
          {isLoading && (
            <ActivityIndicator
              color="#10b981"
              style={{ marginTop: 16 }}
            />
          )}
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>如何导出账单？</Text>

          <View style={styles.instructionItem}>
            <View style={styles.instructionBadge}>
              <Text style={styles.instructionBadgeText}>微信</Text>
            </View>
            <Text style={styles.instructionText}>
              我 → 服务 → 钱包 → 账单 → 常见问题 → 下载账单
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={[styles.instructionBadge, { backgroundColor: '#1677ff20' }]}>
              <Text style={[styles.instructionBadgeText, { color: '#1677ff' }]}>
                支付宝
              </Text>
            </View>
            <Text style={styles.instructionText}>
              我的 → 账单 → 右上角... → 开具交易流水证明
            </Text>
          </View>
        </View>

        {/* Future Features */}
        <View style={styles.futureFeatures}>
          <Text style={styles.futureFeaturesTitle}>即将支持</Text>
          <View style={styles.featureRow}>
            <Ionicons name="notifications-outline" size={20} color="#71717a" />
            <Text style={styles.featureText}>支付通知自动记账 (Android)</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="chatbubble-outline" size={20} color="#71717a" />
            <Text style={styles.featureText}>银行短信自动解析 (Android)</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  importCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    borderStyle: 'dashed',
  },
  importIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  importTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 8,
  },
  importDescription: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
  },
  instructions: {
    marginTop: 24,
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 16,
  },
  instructionItem: {
    marginBottom: 12,
  },
  instructionBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  instructionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  instructionText: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
  },
  futureFeatures: {
    marginTop: 24,
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  futureFeaturesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#71717a',
  },
  previewHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
  },
  previewSubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  previewList: {
    padding: 16,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  previewLeft: {
    flex: 1,
  },
  previewDescription: {
    fontSize: 14,
    color: '#fafafa',
  },
  previewDate: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  previewAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  previewActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#27272a',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fafafa',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})
