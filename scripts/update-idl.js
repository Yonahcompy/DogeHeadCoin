const fs = require('fs');
const path = require('path');

// Read the generated IDL
const generatedIdlPath = path.join(__dirname, '../target/types/doge_presale.ts');
const outputPath = path.join(__dirname, '../contracts/solanaIdl.ts');

// Read the generated IDL content
const generatedContent = fs.readFileSync(generatedIdlPath, 'utf8');

// Create the new content with Anchor configuration
const newContent = `import { IdlTypes, Idl } from "@coral-xyz/anchor";

export type DogePresaleIDL = Idl & ${generatedContent.split('export type DogePresale =')[1].split('export const IDL')[0]};

export type DogePresaleTypes = IdlTypes<DogePresaleIDL>;

export const IDL: DogePresaleIDL = ${generatedContent.split('export const IDL: DogePresale =')[1]};`;

// Write the new content
fs.writeFileSync(outputPath, newContent);

console.log('Updated solanaIdl.ts with the latest IDL'); 