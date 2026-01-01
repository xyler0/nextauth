export default () => ({
  port: parseInt(process.env.PORT || '', 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  maxPostsPerDay: parseInt(process.env.MAX_POSTS_PER_DAY || '', 10) || 3,
});