#!/usr/bin/env node

/**
 * This script scans React components for patterns that could lead to infinite update loops.
 * Usage: node find-potential-loops.js [directory]
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const glob = util.promisify(require('glob'));

// Directory to scan, default to src
const targetDirectory = process.argv[2] || 'src';

// Patterns that could indicate potential infinite loops
const dangerPatterns = [
  {
    name: 'setState in component body',
    regex: /function\s+\w+\([^)]*\)\s*{(?:(?!return|useEffect|if|switch|for).)*\bset\w+\s*\(/s,
    risk: 'high',
    description: 'State updates directly in component body (outside event handlers/effects) cause infinite loops'
  },
  {
    name: 'missing effect dependencies',
    regex: /useEffect\(\s*\(\)\s*=>\s*{[^{}]*\b(props|state|\[?[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*\]?)[^}]*}\s*,\s*\[\s*\]\s*\)/s,
    risk: 'high',
    description: 'useEffect with empty dependencies array but using component props/state inside'
  },
  {
    name: 'object creation in JSX',
    regex: /<\w+[^>]*\b(style|options|config|props)\s*=\s*{(\s*{[^}]*}\s*)}/,
    risk: 'medium',
    description: 'Creating new object literals in JSX props causes unnecessary re-renders'
  },
  {
    name: 'inline function in JSX',
    regex: /<\w+[^>]*\bon\w+\s*=\s*{(\s*\([^)]*\)\s*=>\s*{)(?!\s*\/\*\s*eslint-disable-next-line\s+react-hooks\/exhaustive-deps\s*\*\/)/,
    risk: 'medium',
    description: 'Inline functions in JSX props cause unnecessary re-renders'
  },
  {
    name: 'setState from props without deps',
    regex: /useEffect\(\s*\(\)\s*=>\s*{\s*set\w+\s*\(\s*props\.\w+\s*\)/,
    risk: 'high',
    description: 'Setting state from props in useEffect can cause infinite loops if dependencies aren\'t properly set'
  },
  {
    name: 'state update in render',
    regex: /\bconst\s+\[\w+,\s*set(\w+)\]\s*=\s*useState\([^)]*\)[^;]*;\s*(?:(?!return|if|switch).)*\bset\1\s*\(/s,
    risk: 'high',
    description: 'Updating state during render phase instead of in an effect or event handler'
  },
  {
    name: 'reference equality in deps',
    regex: /\buseEffect\(\s*\(\)\s*=>\s*{[^{}]*}\s*,\s*\[[^\]]*\{\s*[^\]]*\][^\]]*\]\s*\)/,
    risk: 'medium',
    description: 'Using objects or arrays in dependency arrays can cause infinite loops due to reference equality'
  },
  {
    name: 'missing cleanup in subscriptions',
    regex: /\buseEffect\(\s*\(\)\s*=>\s*{\s*(?:addEventListener|subscribe|on\()[^{}]*(?!return\s*\(\s*\)\s*=>)/s,
    risk: 'medium',
    description: 'Adding event listeners or subscriptions without cleanup functions'
  },
  {
    name: 'circular state updates',
    regex: /\buseEffect\(\s*\(\)\s*=>\s*{\s*set(\w+)[^{}]*}\s*,\s*\[\s*\w+\s*(,\s*\w+\s*)*\]\s*\)\s*;[^;]*\buseEffect\(\s*\(\)\s*=>\s*{\s*set(?!\1)\w+[^{}]*}\s*,\s*\[\s*\w+\s*(,\s*\w+\s*)*\]\s*\)/s,
    risk: 'high',
    description: 'Multiple useEffect hooks that may update each other\'s dependencies creating circular updates'
  }
];

// File extensions to scan
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

async function scanFiles() {
  // Get all files with specified extensions recursively
  let allFiles = [];
  
  for (const ext of extensions) {
    const files = await glob(`${targetDirectory}/**/*${ext}`);
    allFiles = [...allFiles, ...files];
  }
  
  console.log(`Scanning ${allFiles.length} files for potential infinite update loops...`);
  
  const issues = [];
  
  // Scan each file
  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Skip files that don't have React component patterns
      if (!content.includes('useState') && 
          !content.includes('useEffect') && 
          !content.includes('React.') && 
          !content.includes('function') && 
          !content.includes('=>')) {
        continue;
      }
      
      // Check for danger patterns
      for (const pattern of dangerPatterns) {
        const matches = content.match(new RegExp(pattern.regex, 'g'));
        
        if (matches) {
          // Get line numbers for each match
          const lines = content.split('\n');
          let lineNumber = 1;
          let charPos = 0;
          
          for (const match of matches) {
            const matchPosition = content.indexOf(match, charPos);
            charPos = matchPosition + 1;
            
            // Find the line number of the match
            let currentPos = 0;
            for (let i = 0; i < lines.length; i++) {
              currentPos += lines[i].length + 1; // +1 for the newline character
              if (currentPos > matchPosition) {
                lineNumber = i + 1;
                break;
              }
            }
            
            issues.push({
              file: file,
              pattern: pattern.name,
              risk: pattern.risk,
              description: pattern.description,
              line: lineNumber,
              preview: match.slice(0, 100).replace(/\s+/g, ' ') + (match.length > 100 ? '...' : '')
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  
  // Sort issues by risk level
  issues.sort((a, b) => {
    const riskPriority = { high: 0, medium: 1, low: 2 };
    return riskPriority[a.risk] - riskPriority[b.risk];
  });
  
  // Print report
  if (issues.length > 0) {
    console.log('\nPotential Infinite Loop Issues Found:');
    console.log('=====================================\n');
    
    const byRisk = {
      high: issues.filter(i => i.risk === 'high'),
      medium: issues.filter(i => i.risk === 'medium'),
      low: issues.filter(i => i.risk === 'low')
    };
    
    console.log(`🔴 High Risk Issues: ${byRisk.high.length}`);
    console.log(`🟠 Medium Risk Issues: ${byRisk.medium.length}`);
    console.log(`🟡 Low Risk Issues: ${byRisk.low.length}\n`);
    
    for (const risk of ['high', 'medium', 'low']) {
      if (byRisk[risk].length > 0) {
        const riskEmoji = risk === 'high' ? '🔴' : risk === 'medium' ? '🟠' : '🟡';
        console.log(`\n${riskEmoji} ${risk.toUpperCase()} RISK ISSUES:\n`);
        
        for (const issue of byRisk[risk]) {
          console.log(`File: ${issue.file}:${issue.line}`);
          console.log(`Issue: ${issue.pattern}`);
          console.log(`Description: ${issue.description}`);
          console.log(`Code: ${issue.preview}`);
          console.log('---');
        }
      }
    }
    
    console.log('\nTo fix these issues, review the React Best Practices document at:');
    console.log('src/docs/react-best-practices.md\n');
  } else {
    console.log('\n✅ No potential infinite loop issues found!');
  }
}

scanFiles().catch(console.error); 