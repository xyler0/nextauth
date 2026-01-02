export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Shipped new feature. System filters commits automatically.',
            },
          },
        ],
      }),
    },
  },
};

export const mockToneService = {
  applyTone: jest.fn().mockImplementation((text: string) => {
    // Simple mock: just truncate and remove fluff
    return text
      .replace(/\b(excited|thrilled|just|really|very)\b/gi, '')
      .substring(0, 100)
      .trim();
  }),
};