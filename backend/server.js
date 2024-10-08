const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: 'http://localhost:3000' // Replace with your frontend URL
}));

app.use(express.json());

//middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next(); // Pass the request to the next middleware/route handler
});

// Connect to MongoDB Atlas using the connection string from the .env file
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error);
});

const visitSchema = new mongoose.Schema({
    page: String,
    count: { type: Number, default: 0 },
});

const Visit = mongoose.model('Visit', visitSchema);

// Initialize visit counters for each page if not already present
const initializeVisits = async () => {
    const pages = ['page1', 'page2', 'page3'];
    for (let page of pages) {
        const existingVisit = await Visit.findOne({ page });
        if (!existingVisit) {
            await Visit.create({ page });
        }
    }
};

initializeVisits();

// API endpoint to determine the route
app.get('/route', async (req, res) => {
    try {
        // Get the page with the minimum count
        const visit = await Visit.find().sort({ count: 1 }).limit(1);
        const selectedPage = visit[0];

        // Increment the count for the selected page
        await Visit.updateOne({ _id: selectedPage._id }, { $inc: { count: 1 } });

        res.json({ route: selectedPage.page });
    } catch (error) {
        console.error("Error determining the route", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
