require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
// Routes
const githubRoutes = require('./routes/githubRoutes');
const Integration = require('./models/Integration');
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use('/', express.static('frontend'))
app.use('/api/v1/github', githubRoutes);

// Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));