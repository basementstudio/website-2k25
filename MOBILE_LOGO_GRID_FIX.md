# Mobile Logo Grid Bug Fix

## Problem Description

The "Trusted by Visionaries" logo grid on mobile and tablet devices had a layout issue where new logos appearing during the animation rotation would not fill up the entire grid cell properly.

## Root Cause

The issue was in the `BrandsGrid` component in `src/app/(pages)/(home)/brands-mobile.tsx`:

1. **Inconsistent Height Calculation**: The outer container used `h-full` but relied on `auto-rows-fr` for height, which could become inconsistent during animation transitions.

2. **Nested Height Dependencies**: The inner container (containing the actual logo) used `h-full w-full` with `relative` positioning, creating a dependency chain where height calculations could fail during animations.

3. **Animation Timing Issues**: When logos switched between the two animation layers (`fade-in-out` and `fade-out-in`), the height wasn't being maintained consistently.

## Solution Applied

### Changes Made to `brands-mobile.tsx`:

1. **Fixed Outer Container**:
   - Replaced `h-full` with `aspect-[202/110] min-h-[110px]`
   - This ensures consistent sizing that matches the desktop version
   - Added minimum height as a fallback

2. **Fixed Inner Container**:
   - Changed from `relative grid h-full w-full` to `absolute inset-0 grid w-full`
   - Using `absolute inset-0` ensures the inner container always fills the parent completely
   - Removed height dependency issues

## Technical Details

- **Aspect Ratio**: `aspect-[202/110]` matches exactly what's used in the desktop version
- **Minimum Height**: `min-h-[110px]` provides a fallback for very small screens
- **Positioning**: `absolute inset-0` ensures the logo container always fills the parent

## Result

- Logo boxes now consistently fill the entire grid cell during animation transitions
- Maintains visual consistency with the desktop version
- No layout shifts or incomplete fills during logo rotation
- Responsive behavior preserved across all mobile and tablet breakpoints

## Files Modified

- `src/app/(pages)/(home)/brands-mobile.tsx`: Fixed the `BrandsGrid` component layout