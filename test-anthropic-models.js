#!/usr/bin/env node

/**
 * Test script to verify which Anthropic models are accessible with your API key
 * Usage: node test-anthropic-models.js
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Models to test (in order of release date)
const modelsToTest = [
  'claude-3-haiku-20240307',
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
];

async function testModel(modelName) {
  try {
    console.log(`\nTesting ${modelName}...`);

    const message = await anthropic.messages.create({
      model: modelName,
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Say "OK"',
        },
      ],
    });

    console.log(`✅ ${modelName} - WORKS`);
    return { model: modelName, status: 'success' };
  } catch (error) {
    if (error.status === 404) {
      console.log(`❌ ${modelName} - NOT FOUND (404)`);
      return { model: modelName, status: 'not_found' };
    } else if (error.status === 401 || error.status === 403) {
      console.log(`🔒 ${modelName} - NO ACCESS (${error.status})`);
      return { model: modelName, status: 'no_access' };
    } else {
      console.log(`⚠️  ${modelName} - ERROR: ${error.message}`);
      return { model: modelName, status: 'error', error: error.message };
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Testing Anthropic API Models');
  console.log('='.repeat(60));

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log(`API Key: ${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...`);

  const results = [];

  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));

  const working = results.filter(r => r.status === 'success');
  const notFound = results.filter(r => r.status === 'not_found');
  const noAccess = results.filter(r => r.status === 'no_access');

  if (working.length > 0) {
    console.log('\n✅ Working models:');
    working.forEach(r => console.log(`   - ${r.model}`));
  }

  if (notFound.length > 0) {
    console.log('\n❌ Models not found (404):');
    notFound.forEach(r => console.log(`   - ${r.model}`));
  }

  if (noAccess.length > 0) {
    console.log('\n🔒 Models without access:');
    noAccess.forEach(r => console.log(`   - ${r.model}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Recommendation:');
  console.log('='.repeat(60));

  if (working.length > 0) {
    // Recommend the best available model
    const recommended = working[working.length - 1]; // Last one is usually newest
    console.log(`\nUse this in your .env.local file:`);
    console.log(`ANTHROPIC_MODEL=${recommended.model}`);
  } else {
    console.log('\n⚠️  No working models found. Please check your API key.');
  }

  console.log('\n');
}

main().catch(console.error);
