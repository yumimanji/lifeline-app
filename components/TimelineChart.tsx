import React from 'react'
import { View, Text, Dimensions } from 'react-native'
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg'
import type { ForecastPoint } from '@/lib/types'
import { formatCurrency } from '@/lib/currencies'

interface TimelineChartProps {
  data: ForecastPoint[]
  currency?: string
  height?: number
}

export function TimelineChart({
  data,
  currency = 'CNY',
  height = 200,
}: TimelineChartProps) {
  const width = Dimensions.get('window').width - 32 // padding

  if (data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#71717a' }}>暂无数据</Text>
      </View>
    )
  }

  // Calculate chart dimensions
  const padding = { top: 20, right: 10, bottom: 30, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Get min/max values
  const balances = data.map((d) => d.balance)
  const minBalance = Math.min(...balances, 0)
  const maxBalance = Math.max(...balances)
  const range = maxBalance - minBalance || 1

  // Scale functions
  const scaleX = (index: number) =>
    padding.left + (index / (data.length - 1)) * chartWidth
  const scaleY = (value: number) =>
    padding.top + chartHeight - ((value - minBalance) / range) * chartHeight

  // Generate path
  const pathData = data
    .map((point, index) => {
      const x = scaleX(index)
      const y = scaleY(point.balance)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Generate area path (for gradient fill)
  const areaPath = `${pathData} L ${scaleX(data.length - 1)} ${
    padding.top + chartHeight
  } L ${padding.left} ${padding.top + chartHeight} Z`

  // Zero line position
  const zeroY = scaleY(0)

  // Determine color based on min balance
  const isNegative = minBalance < 0
  const strokeColor = isNegative ? '#f43f5e' : '#6366f1'
  const gradientId = isNegative ? 'negativeGradient' : 'positiveGradient'

  // X-axis labels (show every ~15 days)
  const xLabels: { index: number; label: string }[] = []
  const step = Math.max(1, Math.floor(data.length / 6))
  for (let i = 0; i < data.length; i += step) {
    xLabels.push({
      index: i,
      label: data[i].date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      }),
    })
  }

  // Y-axis labels
  const yLabels = [minBalance, (minBalance + maxBalance) / 2, maxBalance]

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </LinearGradient>
          <LinearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Zero line */}
        {minBalance < 0 && maxBalance > 0 && (
          <Line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#71717a"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.5}
          />
        )}

        {/* Area fill */}
        <Path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <Path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={2}
          fill="none"
        />

        {/* Current point */}
        <Circle
          cx={scaleX(0)}
          cy={scaleY(data[0].balance)}
          r={5}
          fill={strokeColor}
          stroke="#18181b"
          strokeWidth={2}
        />

        {/* X-axis labels */}
        {xLabels.map(({ index, label }) => (
          <SvgText
            key={index}
            x={scaleX(index)}
            y={height - 5}
            fontSize={10}
            fill="#71717a"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>

      {/* Y-axis labels (rendered as React Native Text for better styling) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: padding.top,
          height: chartHeight,
          justifyContent: 'space-between',
        }}
      >
        {yLabels.reverse().map((value, index) => (
          <Text
            key={index}
            style={{
              fontSize: 10,
              color: '#71717a',
              width: padding.left - 5,
              textAlign: 'right',
            }}
          >
            {formatCurrency(value, currency, false)}
          </Text>
        ))}
      </View>

      {/* X-axis labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: padding.left,
          marginTop: -25,
        }}
      >
        {xLabels.map(({ index, label }) => (
          <Text key={index} style={{ fontSize: 10, color: '#71717a' }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  )
}
