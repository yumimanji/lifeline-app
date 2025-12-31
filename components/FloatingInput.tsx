import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface FloatingInputProps {
  onSubmit: (input: string) => void
  placeholder?: string
}

const quickTags = ['早餐', '午餐', '晚餐', '交通', '购物']

export function FloatingInput({
  onSubmit,
  placeholder = '午饭 35',
}: FloatingInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const inputRef = useRef<TextInput>(null)
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start()

    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isExpanded])

  const handleSubmit = () => {
    if (input.trim()) {
      onSubmit(input.trim())
      setInput('')
      setIsExpanded(false)
      Keyboard.dismiss()
    }
  }

  const handleTagPress = (tag: string) => {
    setInput((prev) => (prev ? `${prev} ${tag}` : tag))
  }

  const fabScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })

  const inputBarOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const inputBarTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  })

  return (
    <View style={styles.container}>
      {/* FAB Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: fabScale }], opacity: animatedValue.interpolate({
            inputRange: [0, 0.5],
            outputRange: [1, 0],
          }) },
        ]}
        pointerEvents={isExpanded ? 'none' : 'auto'}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsExpanded(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Input Bar */}
      <Animated.View
        style={[
          styles.inputBarContainer,
          {
            opacity: inputBarOpacity,
            transform: [{ translateY: inputBarTranslateY }],
          },
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setIsExpanded(false)
              setInput('')
              Keyboard.dismiss()
            }}
          >
            <Ionicons name="close" size={24} color="#71717a" />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={placeholder}
            placeholderTextColor="#71717a"
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.submitButton, !input.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!input.trim()}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Quick Tags */}
        <View style={styles.tagsContainer}>
          {quickTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.tag}
              onPress={() => handleTagPress(tag)}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inputBarContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fafafa',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#27272a',
  },
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(39, 39, 42, 0.8)',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#a1a1aa',
  },
})
