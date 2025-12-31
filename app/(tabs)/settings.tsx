import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppStore } from '@/lib/store'
import { currencies, formatCurrency } from '@/lib/currencies'
import type { RecurrenceFrequency } from '@/lib/types'

type SettingsView = 'main' | 'recurring' | 'add-rule' | 'currency' | 'payday'

export default function SettingsScreen() {
  const {
    settings,
    recurringRules,
    accounts,
    updateSettings,
    addRecurringRule,
    deleteRecurringRule,
  } = useAppStore()

  const [view, setView] = useState<SettingsView>('main')
  const [newRule, setNewRule] = useState({
    name: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    frequency: 'monthly' as RecurrenceFrequency,
    dayOfMonth: 1,
  })

  const handleAddRule = async () => {
    const amount = parseFloat(newRule.amount)
    if (!newRule.name || !amount || accounts.length === 0) {
      Alert.alert('错误', '请填写完整信息')
      return
    }

    await addRecurringRule({
      accountId: accounts[0].id!,
      name: newRule.name,
      amount,
      type: newRule.type,
      frequency: newRule.frequency,
      dayOfMonth: newRule.dayOfMonth,
      startDate: Date.now(),
      autoConfirm: true,
      nextOccurrence: Date.now(),
    })

    setNewRule({
      name: '',
      amount: '',
      type: 'expense',
      frequency: 'monthly',
      dayOfMonth: 1,
    })
    setView('recurring')
  }

  const handleDeleteRule = (id: number) => {
    Alert.alert('删除规则', '确定要删除这条规则吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => deleteRecurringRule(id),
      },
    ])
  }

  const renderMainView = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Recurring Rules */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setView('recurring')}
      >
        <View style={[styles.menuIcon, { backgroundColor: '#10b98120' }]}>
          <Ionicons name="repeat-outline" size={20} color="#10b981" />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>固定收支</Text>
          <Text style={styles.menuSubtitle}>{recurringRules.length} 条规则</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#71717a" />
      </TouchableOpacity>

      {/* Payday */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setView('payday')}
      >
        <View style={[styles.menuIcon, { backgroundColor: '#6366f120' }]}>
          <Ionicons name="calendar-outline" size={20} color="#6366f1" />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>发薪日</Text>
          <Text style={styles.menuSubtitle}>每月 {settings.paydayOfMonth} 号</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#71717a" />
      </TouchableOpacity>

      {/* Currency */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setView('currency')}
      >
        <View style={[styles.menuIcon, { backgroundColor: '#f59e0b20' }]}>
          <Ionicons name="cash-outline" size={20} color="#f59e0b" />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>货币</Text>
          <Text style={styles.menuSubtitle}>
            {settings.currency} ({settings.currencySymbol})
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#71717a" />
      </TouchableOpacity>

      {/* About */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>LifeLine 生命线</Text>
        <Text style={styles.aboutVersion}>版本 1.0.0</Text>
        <Text style={styles.aboutDescription}>
          面向未来的个人财务预测应用
        </Text>
      </View>
    </ScrollView>
  )

  const renderRecurringView = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Income Rules */}
      <Text style={styles.sectionTitle}>固定收入</Text>
      {recurringRules.filter((r) => r.type === 'income').length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无固定收入</Text>
        </View>
      ) : (
        recurringRules
          .filter((r) => r.type === 'income')
          .map((rule) => (
            <TouchableOpacity
              key={rule.id}
              style={styles.ruleItem}
              onLongPress={() => rule.id && handleDeleteRule(rule.id)}
            >
              <Text style={styles.ruleName}>{rule.name}</Text>
              <Text style={[styles.ruleAmount, { color: '#10b981' }]}>
                +{formatCurrency(rule.amount, settings.currency)}
              </Text>
            </TouchableOpacity>
          ))
      )}

      {/* Expense Rules */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>固定支出</Text>
      {recurringRules.filter((r) => r.type === 'expense').length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>暂无固定支出</Text>
        </View>
      ) : (
        recurringRules
          .filter((r) => r.type === 'expense')
          .map((rule) => (
            <TouchableOpacity
              key={rule.id}
              style={styles.ruleItem}
              onLongPress={() => rule.id && handleDeleteRule(rule.id)}
            >
              <Text style={styles.ruleName}>{rule.name}</Text>
              <Text style={[styles.ruleAmount, { color: '#ef4444' }]}>
                -{formatCurrency(rule.amount, settings.currency)}
              </Text>
            </TouchableOpacity>
          ))
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setView('add-rule')}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>添加固定收支</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  const renderAddRuleView = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Type Selection */}
      <Text style={styles.inputLabel}>类型</Text>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            newRule.type === 'income' && styles.typeButtonActive,
            newRule.type === 'income' && { backgroundColor: '#10b981' },
          ]}
          onPress={() => setNewRule({ ...newRule, type: 'income' })}
        >
          <Text
            style={[
              styles.typeButtonText,
              newRule.type === 'income' && styles.typeButtonTextActive,
            ]}
          >
            收入
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            newRule.type === 'expense' && styles.typeButtonActive,
            newRule.type === 'expense' && { backgroundColor: '#ef4444' },
          ]}
          onPress={() => setNewRule({ ...newRule, type: 'expense' })}
        >
          <Text
            style={[
              styles.typeButtonText,
              newRule.type === 'expense' && styles.typeButtonTextActive,
            ]}
          >
            支出
          </Text>
        </TouchableOpacity>
      </View>

      {/* Name */}
      <Text style={styles.inputLabel}>名称</Text>
      <TextInput
        style={styles.input}
        value={newRule.name}
        onChangeText={(text) => setNewRule({ ...newRule, name: text })}
        placeholder="例如：工资、房租"
        placeholderTextColor="#71717a"
      />

      {/* Amount */}
      <Text style={styles.inputLabel}>金额</Text>
      <TextInput
        style={styles.input}
        value={newRule.amount}
        onChangeText={(text) => setNewRule({ ...newRule, amount: text })}
        placeholder="0.00"
        placeholderTextColor="#71717a"
        keyboardType="decimal-pad"
      />

      {/* Day of Month */}
      <Text style={styles.inputLabel}>每月几号</Text>
      <TextInput
        style={styles.input}
        value={String(newRule.dayOfMonth)}
        onChangeText={(text) =>
          setNewRule({
            ...newRule,
            dayOfMonth: Math.min(31, Math.max(1, parseInt(text) || 1)),
          })
        }
        keyboardType="number-pad"
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleAddRule}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  const renderPaydayView = () => (
    <View style={styles.scrollView}>
      <Text style={styles.inputLabel}>发薪日（每月几号）</Text>
      <TextInput
        style={styles.input}
        value={String(settings.paydayOfMonth)}
        onChangeText={(text) => {
          const day = Math.min(31, Math.max(1, parseInt(text) || 1))
          updateSettings({ paydayOfMonth: day })
        }}
        keyboardType="number-pad"
      />
    </View>
  )

  const renderCurrencyView = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {currencies.map((currency) => (
        <TouchableOpacity
          key={currency.code}
          style={[
            styles.currencyItem,
            settings.currency === currency.code && styles.currencyItemActive,
          ]}
          onPress={() =>
            updateSettings({
              currency: currency.code,
              currencySymbol: currency.symbol,
            })
          }
        >
          <View>
            <Text style={styles.currencyName}>{currency.name}</Text>
            <Text style={styles.currencyCode}>{currency.code}</Text>
          </View>
          <Text style={styles.currencySymbol}>{currency.symbol}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )

  const getTitle = () => {
    switch (view) {
      case 'recurring':
        return '固定收支'
      case 'add-rule':
        return '添加规则'
      case 'payday':
        return '发薪日'
      case 'currency':
        return '货币'
      default:
        return '设置'
    }
  }

  return (
    <View style={styles.container}>
      {/* Custom Header for sub-views */}
      {view !== 'main' && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (view === 'add-rule') {
                setView('recurring')
              } else {
                setView('main')
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {view === 'main' && renderMainView()}
        {view === 'recurring' && renderRecurringView()}
        {view === 'add-rule' && renderAddRuleView()}
        {view === 'payday' && renderPaydayView()}
        {view === 'currency' && renderCurrencyView()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#fafafa',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  emptyText: {
    fontSize: 14,
    color: '#71717a',
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  ruleName: {
    fontSize: 16,
    color: '#fafafa',
  },
  ruleAmount: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inputLabel: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fafafa',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#27272a',
  },
  typeButtonActive: {
    backgroundColor: '#10b981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717a',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  currencyItemActive: {
    borderColor: '#10b981',
  },
  currencyName: {
    fontSize: 16,
    color: '#fafafa',
  },
  currencyCode: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  currencySymbol: {
    fontSize: 20,
    color: '#71717a',
  },
  aboutSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 24,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
  },
  aboutVersion: {
    fontSize: 14,
    color: '#71717a',
    marginTop: 4,
  },
  aboutDescription: {
    fontSize: 12,
    color: '#52525b',
    marginTop: 8,
  },
})
