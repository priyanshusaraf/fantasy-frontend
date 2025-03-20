# Tailwind v4 to v3 Migration Guide

## Overview
This document outlines the process of migrating from Tailwind v4 (beta) to Tailwind v3 (stable) to ensure proper compatibility with shadcn/ui components and other UI libraries.

## Changes Made

### 1. Package Downgrades
```bash
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss@3.3.3 postcss@8.4.31 autoprefixer@10.4.15
```

### 2. Configuration Updates
- Updated `tailwind.config.js` to use HSL color format instead of OKLCH
- Added keyframes and animation configurations for shadcn components
- Fixed theme extension patterns for v3 compatibility

### 3. CSS Variable Format
- Changed from OKLCH format to HSL format
- Updated all references in globals.css

### 4. Component Updates
The following components were updated to ensure Tailwind v3 compatibility:
- Button.tsx - Updated variants and styling approach
- Card.tsx - Complete rewrite for v3 compatibility
- Badge.tsx - Updated to match v3 component patterns
- Alert.tsx - Restructured for v3 compatibility
- Sonner.tsx - Changed styling approach for toasts

### 5. Landing Page
- Completely rewrote the landing page with Tailwind v3 compatible classes
- Added gradient styling, card hover effects, and proper dark mode support

## Why We Migrated
- Tailwind v4 is in beta and not stable for production
- shadcn/ui and most React UI libraries are built for Tailwind v3
- v4 has limited browser support for some features (like OKLCH colors)
- v3 provides a stable, well-documented foundation for deployment

## Benefits of Using Tailwind v3
1. **Production Stability**: Tailwind v3 is the stable release used in production by thousands of companies
2. **Ecosystem Compatibility**: Full compatibility with shadcn, Radix UI, and other popular libraries
3. **Documentation & Support**: Extensive documentation and community support
4. **Performance**: Well-optimized CSS output for production builds

## Known Issues & Solutions
- Some components may require additional tweaking if they're using v4-specific classes
- The dark mode pattern has been standardized across components
- Custom color implementations should use the HSL format for consistency

## Deployment Recommendations
1. Always run a full build before deployment with `npm run build`
2. Check for any remaining CSS warnings during the build process
3. Test all components, especially those with complex interactions
4. Ensure dark mode is functioning correctly across all pages

## Future Considerations
If migrating to Tailwind v4 in the future (once stable):
1. Update color formats back to OKLCH
2. Review new utility classes and features offered in v4
3. Test shadcn and UI library compatibility before upgrading 