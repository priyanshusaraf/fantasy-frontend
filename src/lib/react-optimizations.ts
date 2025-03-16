/**
 * React Optimization Guidelines
 * 
 * This file contains utility functions and guidelines to prevent common issues like
 * infinite update loops, excessive re-renders, and maximum update depth exceeded errors.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook that provides a state value that won't cause unnecessary re-renders
 * when setting the same value multiple times.
 * @param initialValue The initial state value 
 * @returns A tuple with the state value and an update function
 */
export function useStableState<T>(initialValue: T): [T, (newValue: T) => void] {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef<T>(state);
  
  const updateState = useCallback((newValue: T) => {
    // Only update state if the value has changed
    if (JSON.stringify(newValue) !== JSON.stringify(stateRef.current)) {
      stateRef.current = newValue;
      setState(newValue);
    }
  }, []);
  
  return [state, updateState];
}

/**
 * Custom hook to create a stable function that only changes when dependencies change.
 * This is a simple wrapper around useCallback with better defaults.
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T {
  return useCallback(callback, dependencies);
}

/**
 * This hook runs an effect only once, even if the component rerenders.
 * @param effect The effect to run
 */
export function useEffectOnce(effect: () => void | (() => void)) {
  useEffect(() => {
    return effect();
  }, []);
}

/**
 * A hook that runs an effect only when the component mounts and when specific
 * dependencies change, skipping the initial run if desired.
 * @param effect The effect to run
 * @param dependencies The dependencies for the effect
 * @param skipFirst Whether to skip the first run of the effect
 */
export function useUpdateEffect(
  effect: () => void | (() => void),
  dependencies: React.DependencyList,
  skipFirst = true
) {
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    if (skipFirst && isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    return effect();
  }, [...dependencies]);
}

/**
 * A hook that tracks the previous value of a variable.
 * Useful for comparing previous and current values.
 * @param value The value to track
 * @returns The previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * ⚠️ Common React Anti-patterns that lead to "Maximum update depth exceeded" errors ⚠️
 * 
 * 1. Updating state in render
 *    DON'T DO THIS: function Component() { setState(newValue); return <div>...</div> }
 * 
 * 2. Updating state without dependencies in useEffect
 *    DON'T DO THIS: useEffect(() => { setState(currentState + 1) })
 * 
 * 3. Using state updater function that references other state without listing all
 *    state dependencies
 *    DON'T DO THIS: useEffect(() => { setState(otherState + 1) }, [])
 * 
 * 4. Updating parent state too frequently from child components
 * 
 * 5. Changing props on children unnecessarily (especially objects or arrays
 *    that look the same but have different references)
 */

/**
 * Guidelines for preventing infinite loops and maximum update depth errors:
 * 
 * 1. Always use dependency arrays in useEffect, useCallback, and useMemo
 * 
 * 2. Use the functional update pattern for setState when new state depends on old state:
 *    setState(prevState => newState)
 * 
 * 3. Avoid creating new objects or arrays in render:
 *    const memoizedValue = useMemo(() => ({ complex: 'object' }), [dependencies])
 * 
 * 4. Use useCallback for functions passed to child components to prevent
 *    unnecessary re-renders
 * 
 * 5. Prefer local state over prop drilling or global state when possible
 * 
 * 6. Use useRef for values that should persist across renders but shouldn't
 *    trigger re-renders
 * 
 * 7. Batch related state updates together - consider using a reducer with useReducer
 *    instead of multiple useState calls
 * 
 * 8. For computed values, use useMemo instead of calculating in render
 * 
 * 9. Use React.memo, useMemo and useCallback judiciously - they come with their
 *    own performance costs
 */

/**
 * Debounces a function to prevent it from being called too frequently
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Throttles a function to limit how often it can be called
 * @param fn The function to throttle
 * @param limit The minimum time between function calls in milliseconds
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
} 