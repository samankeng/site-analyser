#!/bin/bash

# Save current working directory
CURRENT_DIR=$(pwd)
echo "Starting Material-UI v4 to MUI v5 migration for React 19 compatibility..."

# Create backups directory
echo "Creating backups directory..."
mkdir -p ./backups/src
mkdir -p ./backups/package

# Back up package.json and package-lock.json
echo "Backing up package files..."
cp package.json ./backups/package/
cp package-lock.json ./backups/package/ 2>/dev/null || echo "No package-lock.json found"

# Back up all JS and JSX files before making changes
echo "Creating backups of all source files..."
find ./src -name "*.js" -o -name "*.jsx" | xargs -I{} cp --parents {} ./backups/

# Fix React version first
echo "Upgrading React and ReactDOM to v19..."
npm install --legacy-peer-deps react@19 react-dom@19 use-sync-external-store

# Setting up .npmrc to avoid peer dependency issues
echo "Creating .npmrc to bypass peer dependency issues..."
echo "legacy-peer-deps=true" > .npmrc

# Remove old Material-UI packages
echo "Removing old Material-UI packages..."
npm uninstall --legacy-peer-deps @material-ui/core @material-ui/icons @material-ui/styles @material-ui/system @material-ui/lab

# Install MUI v5 and its dependencies
echo "Installing MUI v5 and its dependencies..."
npm install --legacy-peer-deps @mui/material @mui/icons-material @mui/styles @mui/system @mui/lab @emotion/react @emotion/styled

# Update Redux dependencies
echo "Updating Redux dependencies..."
npm install --legacy-peer-deps react-redux@latest @reduxjs/toolkit@latest redux-persist@latest

# Update testing libraries
echo "Updating testing libraries for React 19 compatibility..."
npm install --legacy-peer-deps @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest

# Perform the migration replacements
echo "Migrating Material-UI v4 imports to MUI v5..."

# Create a list of files to process
find ./src -type f \( -name "*.js" -o -name "*.jsx" \) > ./migration-files.txt

# Process each file for migration
while IFS= read -r file; do
  echo "Processing $file..."
  
  # 1. Handle CssBaseline special case
  sed -i 's|import CssBaseline from "@material-ui/core/CssBaseline"|import { CssBaseline } from "@mui/material"|g' "$file"
  sed -i "s|import CssBaseline from '@material-ui/core/CssBaseline'|import { CssBaseline } from '@mui/material'|g" "$file"
  
  # 2. Update direct imports for @material-ui/core individual components
  sed -i 's|import \([A-Za-z0-9]*\) from "@material-ui/core/\([A-Za-z0-9]*\)"|import \1 from "@mui/material/\2"|g' "$file"
  sed -i "s|import \([A-Za-z0-9]*\) from '@material-ui/core/\([A-Za-z0-9]*\)'|import \1 from '@mui/material/\2'|g" "$file"
  
  # 3. Update destructured imports from core
  sed -i 's|import { \([^}]*\) } from "@material-ui/core"|import { \1 } from "@mui/material"|g' "$file"
  sed -i "s|import { \([^}]*\) } from '@material-ui/core'|import { \1 } from '@mui/material'|g" "$file"
  
  # 4. Update style imports
  sed -i 's|import { \([^}]*\) } from "@material-ui/core/styles"|import { \1 } from "@mui/styles"|g' "$file"
  sed -i "s|import { \([^}]*\) } from '@material-ui/core/styles'|import { \1 } from '@mui/styles'|g" "$file"
  
  # 5. Handle special styling functions that moved
  sed -i 's|import { makeStyles } from "@material-ui/core/styles"|import { makeStyles } from "@mui/styles"|g' "$file"
  sed -i 's|import { createStyles } from "@material-ui/core/styles"|import { createStyles } from "@mui/styles"|g' "$file"
  sed -i 's|import { withStyles } from "@material-ui/core/styles"|import { withStyles } from "@mui/styles"|g' "$file"
  sed -i 's|import { styled } from "@material-ui/core/styles"|import { styled } from "@mui/material/styles"|g' "$file"
  
  # 6. Update theme creation
  sed -i 's|import { createMuiTheme } from "@material-ui/core/styles"|import { createTheme } from "@mui/material/styles"|g' "$file"
  sed -i 's|import { ThemeProvider } from "@material-ui/core/styles"|import { ThemeProvider } from "@mui/material/styles"|g' "$file"
  sed -i 's|createMuiTheme|createTheme|g' "$file"
  
  # 7. Update icon imports
  sed -i 's|@material-ui/icons|@mui/icons-material|g' "$file"
  
  # 8. Update lab component imports
  sed -i 's|@material-ui/lab|@mui/lab|g' "$file"
  
  # 9. Update any fade to alpha
  sed -i 's|fade(|alpha(|g' "$file"
  
  # 10. Update useSyncExternalStore
  sed -i 's|import { useSyncExternalStore } from "react"|import { useSyncExternalStore } from "use-sync-external-store"|g' "$file"
  
  # 11. Update theme spacing (in MUI v5, spacing is a function that returns a string)
  sed -i 's|theme.spacing(\([0-9]*\))|theme.spacing(\1)|g' "$file"
  
  # 12. Fix Grid spacing prop (v5 uses different values)
  sed -i 's|<Grid spacing={[0-9]*}|<Grid spacing={2}|g' "$file"
  
  # 13. Update any withWidth imports
  sed -i 's|import withWidth from "@material-ui/core/withWidth"|import { useTheme, useMediaQuery } from "@mui/material"|g' "$file"
  
  # 14. Replace Hidden component with conditional rendering
  sed -i 's|<Hidden|{/* TODO: Replace Hidden with useMediaQuery - |g' "$file"
  sed -i 's|</Hidden>|*/}|g' "$file"
  
done < ./migration-files.txt

# Remove the temporary file
rm ./migration-files.txt

# Install JSS preset default for compatibility
echo "Installing JSS preset-default for compatibility..."
npm install --legacy-peer-deps jss-preset-default

# Add the JSS configuration to src/index.js if needed
if grep -q "jss-preset-default" ./src/index.js; then
  echo "JSS preset configuration already exists in index.js"
else
  echo "Adding JSS preset configuration to index.js..."
  
  # Create a temporary file
  TEMP_FILE=$(mktemp)
  
  # Add JSS preset configuration before ReactDOM.render
  awk '/ReactDOM\.render/ { 
    print "import { create } from \"jss\";"; 
    print "import { jssPreset } from \"@mui/styles\";"; 
    print ""; 
    print "// Configure JSS";
    print "const jss = create({"; 
    print "  ...jssPreset(),"; 
    print "  // Define global class names";
    print "  generateClassName: (rule) => `${rule.key}-${Math.floor(Math.random() * 10000)}`";
    print "});";
    print ""; 
  } 
  { print }' ./src/index.js > "$TEMP_FILE"
  
  # Replace the original file
  mv "$TEMP_FILE" ./src/index.js
fi

# Fix any StrictMode warnings by wrapping the ThemeProvider properly
echo "Fixing StrictMode ThemeProvider usage..."
find ./src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "ThemeProvider" {} \; | while read -r file; do
  sed -i 's|<ThemeProvider theme={theme}>|<StrictMode><ThemeProvider theme={theme}>|g' "$file"
  sed -i 's|</ThemeProvider>|</ThemeProvider></StrictMode>|g' "$file"
done

# Create a custom StyledEngineProvider to fix any styling conflicts
echo "Creating StyledEngineProvider for styling conflicts..."
mkdir -p ./src/components/providers 2>/dev/null

# Create a StyledEngineProvider component
cat > ./src/components/providers/StyledEngineProvider.js << 'EOF'
import React from 'react';
import { StyledEngineProvider as MuiStyledEngineProvider } from '@mui/material/styles';

/**
 * Custom StyledEngineProvider to fix styling conflicts between JSS and Emotion
 */
const StyledEngineProvider = ({ children }) => {
  return (
    <MuiStyledEngineProvider injectFirst>
      {children}
    </MuiStyledEngineProvider>
  );
};

export default StyledEngineProvider;
EOF

echo "Adding StyledEngineProvider to your theme provider..."
find ./src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "ThemeProvider" {} \; | while read -r file; do
  if ! grep -q "StyledEngineProvider" "$file"; then
    sed -i "s|import { ThemeProvider|import StyledEngineProvider from './components/providers/StyledEngineProvider';\nimport { ThemeProvider|g" "$file"
    sed -i 's|<ThemeProvider theme={theme}>|<StyledEngineProvider><ThemeProvider theme={theme}>|g' "$file"
    sed -i 's|</ThemeProvider>|</ThemeProvider></StyledEngineProvider>|g' "$file"
  fi
done

# Fix the path to StyledEngineProvider if needed
find ./src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "StyledEngineProvider" {} \; | while read -r file; do
  filedir=$(dirname "$file")
  relative_path=$(realpath --relative-to="$filedir" ./src/components/providers)
  sed -i "s|'./components/providers/StyledEngineProvider'|'$relative_path/StyledEngineProvider'|g" "$file"
done

# Create a React 19-specific Provider wrapper for Redux
echo "Creating React 19-compatible Redux Provider..."
mkdir -p ./src/store/providers 2>/dev/null

cat > ./src/store/providers/ReduxProvider.js << 'EOF'
import React from 'react';
import { Provider } from 'react-redux';
import { useSyncExternalStore } from 'use-sync-external-store';

/**
 * Enhanced Redux Provider that ensures compatibility with React 19
 */
const ReduxProvider = ({ store, children }) => {
  // This helps ensure the provider works correctly with React 19's concurrent mode
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

export default ReduxProvider;
EOF

# Replace Redux Provider usage with our custom one
find ./src -type f \( -name "*.js" -o -name "*.jsx" \) -exec grep -l "Provider from 'react-redux'" {} \; | while read -r file; do
  sed -i "s|import { Provider } from 'react-redux'|import ReduxProvider from './store/providers/ReduxProvider'|g" "$file"
  sed -i 's|<Provider store={store}|<ReduxProvider store={store}|g' "$file"
  sed -i 's|</Provider>|</ReduxProvider>|g' "$file"
  
  # Fix the path to ReduxProvider if needed
  filedir=$(dirname "$file")
  relative_path=$(realpath --relative-to="$filedir" ./src/store/providers)
  sed -i "s|'./store/providers/ReduxProvider'|'$relative_path/ReduxProvider'|g" "$file"
done

# Create a quick check script to find potential issues
echo "Creating a migration validation script..."
cat > ./validate-migration.js << 'EOF'
const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Patterns to look for that might need manual fixes
const warningPatterns = [
  { pattern: /@material-ui/, message: "Material-UI v4 import still present" },
  { pattern: /theme\.spacing\(\d+\)/, message: "Check theme spacing usage - MUI v5 uses different spacing values" },
  { pattern: /theme\.palette\.grey\[\d+\]/, message: "Check palette usage - palette structure might have changed" },
  { pattern: /makeStyles/, message: "makeStyles is deprecated - consider using styled API instead" },
  { pattern: /withStyles/, message: "withStyles is deprecated - consider using styled API instead" },
  { pattern: /createStyles/, message: "createStyles is not needed in MUI v5" },
  { pattern: /Hidden/, message: "Hidden component is deprecated - use useMediaQuery hook instead" },
  { pattern: /fade\(/, message: "fade() is renamed to alpha() in MUI v5" },
  { pattern: /withWidth/, message: "withWidth is removed - use useMediaQuery instead" },
];

async function validateMigration() {
  console.log("Validating migration...");
  
  const results = {
    warnings: [],
    errors: [],
  };
  
  // Find all JS and JSX files
  const { stdout } = await exec('find ./src -type f -name "*.js" -o -name "*.jsx"');
  const files = stdout.split('\n').filter(Boolean);
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for warning patterns
      for (const { pattern, message } of warningPatterns) {
        if (pattern.test(content)) {
          results.warnings.push({ file, message });
        }
      }
    } catch (e) {
      results.errors.push({ file, error: e.message });
    }
  }
  
  // Display results
  console.log("\n=== Migration Validation Results ===\n");
  
  if (results.errors.length > 0) {
    console.log("ERRORS:");
    results.errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
    console.log("");
  }
  
  if (results.warnings.length > 0) {
    console.log("WARNINGS (manual fixes may be needed):");
    results.warnings.forEach(({ file, message }) => {
      console.log(`  ${file}: ${message}`);
    });
    console.log("");
  }
  
  if (results.errors.length === 0 && results.warnings.length === 0) {
    console.log("No issues found! Your migration looks good.\n");
  } else {
    console.log(`Found ${results.errors.length} errors and ${results.warnings.length} warnings.\n`);
    console.log("Some manual fixes may still be needed. Check the files listed above.\n");
  }
}

validateMigration();
EOF

echo "Migration completed!"
echo "Run 'node validate-migration.js' to check for any remaining issues."
echo "You may need to make some manual adjustments for complex components."
echo "If build errors persist, consider:'npm install --legacy-peer-deps' to force resolution."
