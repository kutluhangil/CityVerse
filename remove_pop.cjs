const fs = require('fs');
const content = fs.readFileSync('components/IsoMap.tsx', 'utf-8');
const startMatch = "const clothesColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff'];";
const startIndex = content.indexOf(startMatch);
const endMatch = "    )\n};\n\n// Clouds & Birds";
const endIndex = content.indexOf(endMatch);
if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + "// Clouds & Birds" + content.substring(endIndex + endMatch.length - "// Clouds & Birds".length);
  fs.writeFileSync('components/IsoMap.tsx', newContent);
  console.log("Deleted PopulationSystem successfully");
} else {
  console.log("Could not find start or end match", {startIndex, endIndex});
}
