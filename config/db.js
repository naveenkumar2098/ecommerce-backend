const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const clientOptions = {
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true,
            }
        };
        await mongoose.connect(process.env.MONGO_URI, clientOptions);
        console.log('MongoDB connected!')
    } catch (error) {
        console.error('MongoDB connection failed', error);
        process.exit(1);
    }
};

module.exports = connectDB;