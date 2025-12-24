import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export default anthropic;

// Helper to get the model from settings or use default
export function getAnthropicModel(): string {
  // Try different models in order of preference
  // Using Claude 3 Opus as fallback since 3.5 Sonnet might not be available on all API keys
  return process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
}
