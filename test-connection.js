require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
    try {
        console.log('Testing MongoDB connection...');
        console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
        });

        console.log('✅ MongoDB connection successful!');

        // Test creating a simple document
        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);

        const testDoc = new TestModel({ test: 'Connection test' });
        await testDoc.save();
        console.log('✅ Database write test successful!');

        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('✅ Database delete test successful!');

        await mongoose.connection.close();
        console.log('✅ All tests passed! Database is ready.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
};

testConnection();