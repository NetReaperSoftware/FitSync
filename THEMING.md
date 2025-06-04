# FitSync Theme System Documentation

## Overview

FitSync implements a comprehensive theming system that supports both light and dark modes with automatic system detection and user preference persistence. The theme system is built using React Context and provides a centralized way to manage colors, styles, and appearance across the entire application.

## Architecture

### Theme Context (`contexts/ThemeContext.tsx`)

The theme system is built around a React Context that provides:
- **Theme State Management**: Tracks current theme mode (light/dark/system)
- **Theme Objects**: Provides color schemes and styling values
- **Persistence**: Saves user preferences to AsyncStorage
- **System Integration**: Automatically detects and responds to system theme changes

### Theme Interface

```typescript
interface Theme {
  // Background colors
  background: string;           // Main app background
  surface: string;             // Card/component backgrounds
  surfaceElevated: string;     // Elevated component backgrounds
  cardBackground: string;      // Specific card background
  
  // Primary colors
  primary: string;             // Brand color (#4285F4)
  primaryVariant: string;      // Darker primary variant
  secondary: string;           // Secondary accent color
  
  // Text colors
  text: string;                // Primary text color
  textSecondary: string;       // Secondary text color
  textMuted: string;           // Muted/placeholder text
  
  // UI element colors
  border: string;              // Standard borders
  borderLight: string;         // Light borders
  success: string;             // Success states
  warning: string;             // Warning states
  error: string;               // Error states
  shadow: string;              // Shadow color
  
  // Navigation colors
  tabBarBackground: string;    // Tab bar background
  tabBarActive: string;        // Active tab color
  tabBarInactive: string;      // Inactive tab color
  
  // Input colors
  inputBackground: string;     // Text input backgrounds
  inputBorder: string;         // Text input borders
  modalBackground: string;     // Modal overlay background
}
```

## Color Schemes

### Light Theme
- **Background**: Light grays (#f5f5f5, #ffffff)
- **Text**: Dark colors (#333333, #666666, #999999)
- **Accent**: Google Blue (#4285F4)
- **Borders**: Light grays (#e0e0e0, #f0f0f0)

### Dark Theme
- **Background**: Deep grays and blacks (#121212, #1e1e1e, #2d2d2d)
- **Text**: White and light grays (#ffffff, #b3b3b3, #808080)
- **Accent**: Same Google Blue (#4285F4) for consistency
- **Borders**: Dark grays (#404040, #2d2d2d)

## Theme Modes

### 1. Light Mode
- Explicitly sets light theme regardless of system preference
- Stored as `'light'` in AsyncStorage

### 2. Dark Mode
- Explicitly sets dark theme regardless of system preference
- Stored as `'dark'` in AsyncStorage

### 3. System Mode (Default)
- Automatically follows device system preference
- Updates dynamically when system theme changes
- Stored as `'system'` in AsyncStorage
- Uses React Native's `useColorScheme()` hook

## Usage

### Basic Usage in Components

```typescript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  const styles = createStyles(theme);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.background,
  },
  text: {
    color: theme.text,
  },
});
```

### Theme Provider Setup

The app is wrapped in `ThemeProvider` in `App.tsx`:

```typescript
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
```

### Available Hook Properties

```typescript
const {
  theme,           // Current theme object with all colors
  themeMode,       // Current mode: 'light' | 'dark' | 'system'
  isDark,          // Boolean: true if currently using dark theme
  setThemeMode,    // Function to set specific theme mode
  toggleTheme,     // Function to toggle between light/dark (ignores system)
} = useTheme();
```

## Implementation Patterns

### 1. Dynamic Styles
Always create styles as functions that accept the theme:

```typescript
const createStyles = (theme: Theme) => StyleSheet.create({
  // styles using theme colors
});
```

### 2. Component Structure
```typescript
function MyScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Component logic
  
  return (
    // JSX using styles
  );
}
```

### 3. Input Components
For text inputs, always set `placeholderTextColor`:

```typescript
<TextInput
  style={styles.input}
  placeholder="Enter text"
  placeholderTextColor={theme.textMuted}
  // other props
/>
```

## Settings Integration

The Settings screen provides user controls for theme management:

### Dark Mode Toggle
- Direct toggle between light and dark modes
- Bypasses system preference when used
- Immediate visual feedback

### Theme Persistence
- User preferences automatically saved to AsyncStorage
- Restored on app launch
- Survives app restarts and updates

## Best Practices

### 1. Consistent Color Usage
- Use `theme.text` for primary text
- Use `theme.textSecondary` for secondary text
- Use `theme.textMuted` for placeholders and less important text
- Use `theme.primary` for brand elements and primary actions

### 2. Component Styling
- Always create styles as functions accepting theme
- Use theme colors instead of hardcoded values
- Apply appropriate shadows and elevations using theme values

### 3. Accessibility
- Ensure sufficient contrast ratios in both themes
- Test readability in both light and dark modes
- Use semantic color names (success, warning, error)

### 4. Performance
- Create styles inside component (React optimizes this)
- Avoid inline styles when possible
- Use theme values consistently across screens

## File Structure

```
contexts/
  └── ThemeContext.tsx          # Theme context and provider
screens/
  ├── HomeScreen.tsx           # Themed home screen
  ├── FoodTrackerScreen.tsx    # Themed food tracker
  ├── SettingsScreen.tsx       # Theme controls + themed UI
  ├── LoginScreen.tsx          # Themed authentication
  ├── SignupScreen.tsx         # Themed registration
  └── SplashScreen.tsx         # Themed loading screen
App.tsx                        # Theme provider setup
```

## Dependencies

- `@react-native-async-storage/async-storage`: Theme preference persistence
- `react-native`: Built-in `useColorScheme` for system theme detection

## Future Enhancements

### Potential Additions
1. **Custom Color Themes**: Allow users to choose accent colors
2. **High Contrast Mode**: Enhanced accessibility theme
3. **Theme Scheduling**: Automatic light/dark switching based on time
4. **Theme Animations**: Smooth transitions between theme changes
5. **Component Variants**: Theme-specific component variations

### Migration Guide
When adding new screens or components:
1. Import `useTheme` hook
2. Create styles as functions accepting theme parameter
3. Use theme colors instead of hardcoded values
4. Test in both light and dark modes
5. Ensure proper text input placeholder colors

## Troubleshooting

### Common Issues

**Theme not updating**: Ensure component uses `createStyles(theme)` pattern
**Inconsistent colors**: Check for hardcoded color values in styles
**Text not visible**: Verify text color matches theme (light text on dark backgrounds)
**Input placeholders**: Always set `placeholderTextColor={theme.textMuted}`

### Debug Tips
- Check AsyncStorage for saved theme preference
- Verify theme context is properly wrapped around app
- Test theme switching in Settings screen
- Ensure all screens import and use `useTheme` hook