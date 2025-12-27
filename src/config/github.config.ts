export default () => ({
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
  mode: process.env.GITHUB_MODE || 'webhook',
});