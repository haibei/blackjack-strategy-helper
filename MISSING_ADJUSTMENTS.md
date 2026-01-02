# Missing Card Counting Adjustments

## Currently Implemented ✅

1. ✅ Insurance - TC >= 3: Buy insurance
2. ✅ Hard 16 vs 10 - TC >= 1: Stand
3. ✅ Hard 12 vs 2/3 - TC >= 2: Stand
4. ✅ Hard 15 vs 10 - TC >= 4: Stand
5. ✅ Hard 13 vs 2 - TC >= -1: Stand

## Missing Top Priority Adjustments ❌

### 1. Hard 12 Adjustments (Incomplete)
**Current Code:**
```javascript
if (dealerValue >= 4 && dealerValue <= 6) {
    return { action: 'stand', ... }; // Basic strategy - always stands
}
```

**Missing:**
- ❌ Hard 12 vs 4 - TC >= 3: Stand (currently always stands, should hit if TC < 3)
- ❌ Hard 12 vs 5 - TC >= 1: Stand (currently always stands, should hit if TC < 1)
- ❌ Hard 12 vs 6 - TC >= -1: Stand (currently always stands, should hit if TC < -1)

### 2. Hard 15 Adjustments (Incomplete)
**Current Code:**
```javascript
if (dealerValue >= 2 && dealerValue <= 6) {
    return { action: 'stand', ... }; // Basic strategy
}
// Only has adjustment for vs 10
```

**Missing:**
- ❌ Hard 15 vs 9 - TC >= 2: Stand (currently hits)
- ❌ Hard 15 vs A - TC >= 1: Stand (currently hits)

### 3. Hard 14 Adjustments (Missing)
**Current Code:**
```javascript
if (dealerValue >= 2 && dealerValue <= 6) {
    return { action: 'stand', ... };
}
return { action: 'hit', ... }; // Always hits vs 7-A
```

**Missing:**
- ❌ Hard 14 vs 10 - TC >= 3: Stand (currently always hits)

### 4. Hard 11 Adjustments (Missing)
**Current Code:**
```javascript
if (canDouble) {
    return { action: 'double', ... }; // Always doubles
}
```

**Missing:**
- ❌ Hard 11 vs A - TC >= 1: Double (currently always doubles, should hit if TC < 1)

### 5. Hard 10 Adjustments (Missing)
**Current Code:**
```javascript
if (dealerValue >= 2 && dealerValue <= 9 && canDouble) {
    return { action: 'double', ... };
}
return { action: 'hit', ... }; // Hits vs 10 and A
```

**Missing:**
- ❌ Hard 10 vs 10 - TC >= 4: Double (currently always hits)
- ❌ Hard 10 vs A - TC >= 4: Double (currently always hits)

### 6. Hard 9 Adjustments (Missing)
**Current Code:**
```javascript
if (dealerValue >= 3 && dealerValue <= 6 && canDouble) {
    return { action: 'double', ... };
}
return { action: 'hit', ... }; // Hits vs 2, 7-A
```

**Missing:**
- ❌ Hard 9 vs 2 - TC >= 1: Double (currently always hits)

## Summary

**Total Missing: 10 adjustments**

All of these are from the **Illustrious 18** (most important card counting deviations) and should be implemented for optimal strategy.

