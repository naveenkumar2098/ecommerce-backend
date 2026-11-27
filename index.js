const dotenv = require('dotenv');
dotenv.config();

const logger = require('./utils/logger');

// Fail fast when required configuration is missing
const missing = ['JWT_SECRET', 'MONGO_URI'].filter((key) => !process.env[key]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const connectDB = require('./config/db');
connectDB();

const app = require('./app');

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
