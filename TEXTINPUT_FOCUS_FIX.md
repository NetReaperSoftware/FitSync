# TextInput Focus Loss Fix Pattern

## Problem
TextInput components in React Native lose focus immediately after typing when the component re-renders frequently. This happens when:
- TextInput `value` is directly bound to parent state
- `onChangeText` immediately calls parent state setters
- Parent component re-renders on every keystroke
- Common in forms with complex state management or frequent updates

## Symptoms
- User types one character, then TextInput loses focus
- Cursor disappears or jumps to different field
- User must tap TextInput again for each character
- Particularly affects numeric inputs (weight, reps, etc.)

## Solution Pattern
Replace direct state binding with local state + onBlur syncing:

### Before (Problematic)
```typescript
<TextInput
  value={parentState.weight?.toString() || '0'}
  onChangeText={(value) => updateParentState('weight', parseFloat(value) || 0)}
  keyboardType="numeric"
/>
```

### After (Fixed)
```typescript
// 1. Add local state in component
const [localWeight, setLocalWeight] = useState(parentState.weight?.toString() || '0');

// 2. Add effect to sync when parent data changes
React.useEffect(() => {
  setLocalWeight(parentState.weight?.toString() || '0');
}, [parentState.weight]);

// 3. Update TextInput to use local state with onBlur sync
<TextInput
  value={localWeight}
  onChangeText={setLocalWeight}
  onBlur={() => {
    const weightValue = parseFloat(localWeight) || 0;
    updateParentState('weight', weightValue);
  }}
  keyboardType="numeric"
/>
```

## Complete Implementation Steps

### 1. Import useState if not already imported
```typescript
import React, { useState } from 'react';
```

### 2. Add local state for each TextInput field
```typescript
const [localWeight, setLocalWeight] = useState(initialValue?.toString() || '0');
const [localReps, setLocalReps] = useState(initialValue?.toString() || '0');
```

### 3. Add useEffect to sync with parent data changes
```typescript
React.useEffect(() => {
  setLocalWeight(parentData.weight?.toString() || '0');
  setLocalReps(parentData.reps?.toString() || '0');
}, [parentData.weight, parentData.reps]);
```

### 4. Update TextInput components
```typescript
<TextInput
  value={localWeight}
  onChangeText={setLocalWeight}
  onBlur={() => {
    const weightValue = parseFloat(localWeight) || 0;
    onUpdateParentState('weight', weightValue);
  }}
  keyboardType="numeric"
  placeholder="0"
/>

<TextInput
  value={localReps}
  onChangeText={setLocalReps}
  onBlur={() => {
    const repsValue = parseInt(localReps) || 0;
    onUpdateParentState('reps', repsValue);
  }}
  keyboardType="numeric"
  placeholder="0"
/>
```

## Key Benefits
- ✅ TextInput maintains focus during typing
- ✅ Values sync to parent when user finishes editing
- ✅ Handles data updates from parent (switching records, etc.)
- ✅ No performance impact from constant state updates
- ✅ User can type continuously without interruption

## When to Apply This Fix
- Any TextInput that loses focus while typing
- Forms with numeric inputs (weight, reps, measurements)
- Components with frequent re-renders
- Modal forms with complex state management
- Lists with editable inline inputs

## Files Fixed with This Pattern
- `components/workout/ActiveWorkoutModal.tsx` - Workout weight/reps inputs
- `components/workout/RoutineCreationModal.tsx` - Routine weight/reps inputs

## Testing the Fix
1. Open the component with TextInput issues
2. Tap on a numeric input field
3. Type multiple characters continuously
4. Verify cursor stays in field and doesn't lose focus
5. Verify values save correctly when tapping elsewhere (onBlur)
6. Verify values update when switching between records