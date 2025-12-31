# LifeLine 生命线

面向未来的个人财务预测应用 - "不做死账记录，只做活钱预测"

## 运行命令

### 开发模式

```bash
# 启动开发服务器（同时支持手机和网页）
npm start

# 或者指定平台启动
npm run android    # Android 设备/模拟器
npm run ios        # iOS 设备/模拟器 (需要 Mac)
npm run web        # 网页端
```

### 手机端运行

1. 安装 **Expo Go** 应用
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. 启动开发服务器
   ```bash
   npm start
   ```

3. 扫描终端中显示的二维码
   - Android: 使用 Expo Go 内置扫码
   - iOS: 使用系统相机扫码

4. 确保手机和电脑在同一局域网

### 网页端运行

```bash
npm run web
```

浏览器会自动打开 `http://localhost:8081`

> 注意：网页端部分原生功能不可用（如文件导入、通知监听等）

### 模拟器运行

**Android 模拟器：**
```bash
# 需要先安装 Android Studio 并配置模拟器
npm run android
```

**iOS 模拟器：**
```bash
# 仅限 macOS，需要安装 Xcode
npm run ios
```

## 构建发布版本

```bash
# 构建 Android APK
npx expo build:android

# 构建 iOS IPA (需要 Apple Developer 账号)
npx expo build:ios

# 或使用 EAS Build (推荐)
npx eas build --platform android
npx eas build --platform ios
```

## 功能特性

- 今日可用额度计算
- 90天财务预测曲线
- 发薪日倒计时
- 固定收支管理
- 多币种支持
- 账单导入（微信/支付宝 CSV）
- 快速记账输入

## 技术栈

- React Native + Expo
- Expo Router (文件系统路由)
- Zustand (状态管理)
- Expo SQLite (本地数据库)
- TypeScript
