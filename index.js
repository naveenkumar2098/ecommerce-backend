const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const logger = require('./utils/logger'); 

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// All HTTP request logging middleware
app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
);

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Global error handler
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message })
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));