const express = require('express');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();
app.use(express.json({ limit: '100kb' }));

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
const orderRoutes = require('./routes/orderRoutes');
const issueRoutes = require('./routes/issueRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/issues', issueRoutes);

// Global error handler
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Malformed JSON body' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Payload too large' });
    }
    logger.error(err.stack);
    const body = { message: 'Internal Server Error' };
    if (process.env.NODE_ENV === 'development') {
        body.detail = err.message;
    }
    res.status(err.status || 500).json(body);
});

module.exports = app;
