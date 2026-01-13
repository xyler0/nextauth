export const mockOctokit = {
  rest: {
    repos: {
      listForAuthenticatedUser: jest.fn().mockResolvedValue({
        data: [],
      }),
    },
    users: {
      getAuthenticated: jest.fn().mockResolvedValue({
        data: { login: 'testuser' },
      }),
    },
  },
};