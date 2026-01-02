# Card Counting Adjustments Guide

## Currently Implemented ✅

1. **Insurance** - TC >= 3: Buy insurance
2. **Hard 16 vs 10** - TC >= 1: Stand (instead of Hit)
3. **Hard 12 vs 2/3** - TC >= 2: Stand (instead of Hit)
4. **Hard 15 vs 10** - TC >= 4: Stand (instead of Hit)
5. **Hard 13 vs 2** - TC >= -1: Stand (instead of Hit)

## Recommended Additional Adjustments

### High Priority (Illustrious 18 - Most Important)

#### Hard Hands - Stand Adjustments

6. **Hard 12 vs 4** - TC >= 3: Stand (basic: Hit)
   - Currently: Stand on 12 vs 4-6 (basic strategy)
   - Adjustment: At TC >= 3, stand on 12 vs 4

7. **Hard 12 vs 5** - TC >= 1: Stand (basic: Hit)
   - Currently: Stand on 12 vs 4-6 (basic strategy)
   - Adjustment: At TC >= 1, stand on 12 vs 5

8. **Hard 12 vs 6** - TC >= -1: Stand (basic: Hit)
   - Currently: Stand on 12 vs 4-6 (basic strategy)
   - Adjustment: At TC >= -1, stand on 12 vs 6

9. **Hard 15 vs 9** - TC >= 2: Stand (basic: Hit)
   - Currently: Hit 15 vs 7-A
   - Adjustment: At TC >= 2, stand on 15 vs 9

10. **Hard 15 vs A** - TC >= 1: Stand (basic: Hit)
    - Currently: Hit 15 vs 7-A
    - Adjustment: At TC >= 1, stand on 15 vs A

11. **Hard 14 vs 10** - TC >= 3: Stand (basic: Hit)
    - Currently: Hit 14 vs 7-A
    - Adjustment: At TC >= 3, stand on 14 vs 10

12. **Hard 13 vs 3** - TC >= -2: Stand (basic: Hit)
    - Currently: Stand on 13 vs 2-6 (basic strategy)
    - Adjustment: At TC >= -2, stand on 13 vs 3

13. **Hard 16 vs 9** - TC >= 5: Stand (basic: Hit)
    - Currently: Hit 16 vs 7-A (except 10 with TC >= 1)
    - Adjustment: At TC >= 5, stand on 16 vs 9

#### Hard Hands - Double Down Adjustments

14. **Hard 11 vs A** - TC >= 1: Double (basic: Hit)
    - Currently: Always double 11
    - Adjustment: At TC >= 1, double 11 vs A (otherwise hit)

15. **Hard 10 vs 10** - TC >= 4: Double (basic: Hit)
    - Currently: Double 10 vs 2-9
    - Adjustment: At TC >= 4, double 10 vs 10

16. **Hard 10 vs A** - TC >= 4: Double (basic: Hit)
    - Currently: Double 10 vs 2-9
    - Adjustment: At TC >= 4, double 10 vs A

17. **Hard 9 vs 2** - TC >= 1: Double (basic: Hit)
    - Currently: Double 9 vs 3-6
    - Adjustment: At TC >= 1, double 9 vs 2

#### Soft Hands - Double Down Adjustments

18. **Soft 18 vs 2** - TC >= 1: Double (basic: Stand)
    - Currently: Stand on soft 18 vs 2-6 (basic strategy)
    - Adjustment: At TC >= 1, double soft 18 vs 2

19. **Soft 18 vs 3** - TC >= 1: Double (basic: Stand)
    - Currently: Stand on soft 18 vs 2-6 (basic strategy)
    - Adjustment: At TC >= 1, double soft 18 vs 3

20. **Soft 18 vs 4** - TC >= 2: Double (basic: Stand)
    - Currently: Stand on soft 18 vs 2-6 (basic strategy)
    - Adjustment: At TC >= 2, double soft 18 vs 4

21. **Soft 18 vs 5** - TC >= 2: Double (basic: Stand)
    - Currently: Stand on soft 18 vs 2-6 (basic strategy)
    - Adjustment: At TC >= 2, double soft 18 vs 5

22. **Soft 18 vs 6** - TC >= 1: Double (basic: Stand)
    - Currently: Stand on soft 18 vs 2-6 (basic strategy)
    - Adjustment: At TC >= 1, double soft 18 vs 6

23. **Soft 19 vs 4** - TC >= 3: Double (basic: Stand)
    - Currently: Stand on soft 19
    - Adjustment: At TC >= 3, double soft 19 vs 4

24. **Soft 19 vs 5** - TC >= 3: Double (basic: Stand)
    - Currently: Stand on soft 19
    - Adjustment: At TC >= 3, double soft 19 vs 5

25. **Soft 19 vs 6** - TC >= 0: Double (basic: Stand)
    - Currently: Stand on soft 19
    - Adjustment: At TC >= 0, double soft 19 vs 6

#### Pair Splitting Adjustments

26. **Pair 10,10 vs 5** - TC >= 5: Stand (basic: Split)
    - Currently: Never split 10s (basic strategy)
    - Adjustment: At TC >= 5, stand on 10,10 vs 5 (don't split)

27. **Pair 10,10 vs 6** - TC >= 4: Stand (basic: Split)
    - Currently: Never split 10s (basic strategy)
    - Adjustment: At TC >= 4, stand on 10,10 vs 6 (don't split)

28. **Pair 9,9 vs 9** - TC >= 1: Split (basic: Stand)
    - Currently: Split 9s vs 2-6, 8, 9 (basic strategy)
    - Adjustment: At TC >= 1, split 9,9 vs 9

29. **Pair 9,9 vs A** - TC >= 1: Split (basic: Stand)
    - Currently: Stand on 9,9 vs 7, 9, 10, A (basic strategy)
    - Adjustment: At TC >= 1, split 9,9 vs A

30. **Pair 6,6 vs 2** - TC >= 1: Split (basic: Hit)
    - Currently: Split 6s vs 2-6 (basic strategy)
    - Adjustment: At TC >= 1, split 6,6 vs 2

31. **Pair 4,4 vs 4** - TC >= 2: Split (basic: Hit)
    - Currently: Split 4s vs 5-6 (basic strategy)
    - Adjustment: At TC >= 2, split 4,4 vs 4

32. **Pair 4,4 vs 5** - TC >= 3: Split (basic: Hit)
    - Currently: Split 4s vs 5-6 (basic strategy)
    - Adjustment: At TC >= 3, split 4,4 vs 5

### Medium Priority

33. **Hard 11 vs 10** - TC >= 1: Double (basic: Hit if can't double)
    - Currently: Always double 11
    - Adjustment: At TC >= 1, double 11 vs 10

34. **Hard 9 vs 7** - TC >= 3: Double (basic: Hit)
    - Currently: Double 9 vs 3-6
    - Adjustment: At TC >= 3, double 9 vs 7

## Implementation Priority

### Phase 1 (High Impact, Easy to Implement)
- Hard 12 vs 4/5/6 adjustments
- Hard 15 vs 9/A adjustments
- Hard 14 vs 10 adjustment
- Hard 11 vs A adjustment
- Hard 10 vs 10/A adjustments

### Phase 2 (Medium Impact)
- Soft hand double down adjustments
- Hard 9 vs 2 adjustment
- Pair splitting adjustments

### Phase 3 (Lower Priority)
- Edge cases and less common scenarios

## Notes

- All adjustments are based on **True Count (TC)**, not Running Count
- These deviations are from the **Illustrious 18** and **Fab 4** (insurance)
- Adjustments override basic strategy when count is favorable
- Negative TC adjustments (like Hard 13 vs 2 at TC >= -1) mean you can stand even with a slightly negative count

