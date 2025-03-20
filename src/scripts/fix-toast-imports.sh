#!/bin/bash
# Fix toast imports throughout the project
# This script finds all files that import toast directly from "sonner"
# and changes them to import from our custom wrapper "@/components/ui/sonner"

# Check if we're in the right directory
if [[ ! -d "src/components/ui" ]]; then
  echo "Error: This script must be run from the project root directory"
  exit 1
fi

# Find all TypeScript and JavaScript files in the src directory
echo "Scanning for files importing toast from sonner..."
FILES=$(grep -r --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" "import { toast } from \"sonner\"" src/)

# Process each file
echo "Found files with direct sonner imports:"
echo "$FILES"
echo ""
echo "Processing files..."

echo "$FILES" | while read -r line; do
  # Extract the file path
  FILE=$(echo "$line" | cut -d':' -f1)
  echo "Processing $FILE"
  
  # Replace the import with our custom wrapper
  sed -i '.bak' 's/import { toast } from "sonner"/import { toast } from "@\/components\/ui\/sonner"/' "$FILE"
  
  # Clean up backup files
  rm "${FILE}.bak"
done

# Look for combined imports like "import { toast, Toaster } from "sonner""
echo "Scanning for combined imports..."
COMBINED_FILES=$(grep -r --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" "import {.*toast.*} from \"sonner\"" src/ | grep -v "import { toast } from \"sonner\"")

echo "Found files with combined sonner imports:"
echo "$COMBINED_FILES"
echo ""
echo "Processing combined imports..."

echo "$COMBINED_FILES" | while read -r line; do
  # Extract the file path
  FILE=$(echo "$line" | cut -d':' -f1)
  echo "Processing $FILE"
  
  # Get the actual import line
  IMPORT_LINE=$(echo "$line" | cut -d':' -f2-)
  
  # Extract the other imports besides toast
  OTHER_IMPORTS=$(echo "$IMPORT_LINE" | sed -E 's/import \{(.*)\} from "sonner"/\1/' | sed -E 's/toast,|, toast|toast//' | sed -E 's/,[ ]*,/,/' | sed -E 's/^[ ,]*|[ ,]*$//')
  
  # If there are other imports, keep them from sonner, but import toast separately
  if [[ -n "$OTHER_IMPORTS" ]]; then
    # Replace the original import line
    sed -i '.bak' "s|$IMPORT_LINE|import { $OTHER_IMPORTS } from \"sonner\"\nimport { toast } from \"@/components/ui/sonner\"|" "$FILE"
  else
    # If toast was the only import, just replace it
    sed -i '.bak' "s|$IMPORT_LINE|import { toast } from \"@/components/ui/sonner\"|" "$FILE"
  fi
  
  # Clean up backup files
  rm "${FILE}.bak"
done

echo "All done! Toast imports have been fixed." 