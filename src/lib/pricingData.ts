import type { ToolDefinition } from '@/types'

export const TOOLS = {
  cursor: {
    name: 'Cursor',
    plans: {
      hobby:    { label: 'Hobby',    pricePerSeat: 0,  maxSeats: 1 },
      pro:      { label: 'Pro',      pricePerSeat: 20, maxSeats: 1 },
      business: { label: 'Business', pricePerSeat: 40, maxSeats: null },
    }
  },
  github_copilot: {
    name: 'GitHub Copilot',
    plans: {
      individual:  { label: 'Individual',  pricePerSeat: 10,  maxSeats: 1 },
      business:    { label: 'Business',    pricePerSeat: 19,  maxSeats: null },
      enterprise:  { label: 'Enterprise',  pricePerSeat: 39,  maxSeats: null },
    }
  },
  claude: {
    name: 'Claude',
    plans: {
      free:       { label: 'Free',       pricePerSeat: 0,   maxSeats: 1 },
      pro:        { label: 'Pro',        pricePerSeat: 20,  maxSeats: 1 },
      max:        { label: 'Max',        pricePerSeat: 100, maxSeats: 1 },
      team:       { label: 'Team',       pricePerSeat: 30,  maxSeats: null },
      enterprise: { label: 'Enterprise', pricePerSeat: null, maxSeats: null },
    }
  },
  chatgpt: {
    name: 'ChatGPT',
    plans: {
      plus:       { label: 'Plus',       pricePerSeat: 20,  maxSeats: 1 },
      team:       { label: 'Team',       pricePerSeat: 30,  maxSeats: null },
      enterprise: { label: 'Enterprise', pricePerSeat: null, maxSeats: null },
    }
  },
  anthropic_api: {
    name: 'Anthropic API',
    plans: {
      usage: { label: 'Usage-based', pricePerSeat: null, maxSeats: null }
    }
  },
  openai_api: {
    name: 'OpenAI API',
    plans: {
      usage: { label: 'Usage-based', pricePerSeat: null, maxSeats: null }
    }
  },
  gemini: {
    name: 'Gemini',
    plans: {
      pro:   { label: 'Pro',   pricePerSeat: 20,  maxSeats: 1 },
      ultra: { label: 'Ultra', pricePerSeat: null, maxSeats: null },
      api:   { label: 'API',   pricePerSeat: null, maxSeats: null },
    }
  },
  windsurf: {
    name: 'Windsurf',
    plans: {
      free:  { label: 'Free',  pricePerSeat: 0,  maxSeats: 1 },
      pro:   { label: 'Pro',   pricePerSeat: 15, maxSeats: 1 },
      teams: { label: 'Teams', pricePerSeat: 35, maxSeats: null },
    }
  },
} as const satisfies Record<string, ToolDefinition>
