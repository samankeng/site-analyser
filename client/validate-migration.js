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
