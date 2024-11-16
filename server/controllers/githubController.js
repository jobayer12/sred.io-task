const axios = require('axios');
const Integration = require('../models/Integration');
const {generateToken} = require("../helpers/jwt");
const jwt = require("../helpers/jwt");

// Redirect User to GitHub for Authentication
exports.githubAuth = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,user:email`);
};

// Handle Callback and Fetch Token
exports.githubCallback = async (req, res) => {
    const { code } = req.query;
    try {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }, { headers: { Accept: 'application/json' } });

        const { access_token } = response.data;

        // Fetch User Info
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const username = userResponse.data['login'];
        const userData = {
            user: userResponse.data,
            username: username,
            token: access_token,
            connectedAt: new Date(),
        };

        const integration = await Integration.findOneAndUpdate(
            { username }, // Query to check if the username exists
            userData,    // Data to update or insert
            { upsert: true, new: true } // Options: create if not found, return the updated document
        );
        console.log(integration);
        const tokenInfo = {
            id: integration._id,
            username: username,
            connectedAt: userData.connectedAt
        }
        const jwtToken = await generateToken(tokenInfo);
        res.redirect(`${process.env.CLIENT_URI}/integrations/github?token=${jwtToken}`);
    } catch (error) {
        res.status(500).json({ data: null, status: 500, error: error.message });
    }
};

// Remove GitHub Integration
exports.removeIntegration = async (req, res) => {
    const response = {status: 200, data: {success: false}, error: ""};
    try {
        const id = req.loggedInUserInfo.id;
        console.log(req.loggedInUserInfo);
        await Integration.deleteOne({ _id: id });
        response.data.success = true;
        res.status(response.status).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(response.status).json(response);
    }
};

// Verify GitHub Integration JWT Token
exports.verifyToken = async (req, res) => {
    const response = {status: 200, data: false, error: ""};
    try {
        const token = req.params.token;
        const verifyToken = await jwt.verifyToken(token);
        if (verifyToken) {
            response.data = true;
        }
        res.status(response.status).json(response);
    } catch (error) {
        response.status = 500;
        response.error = error.message;
        res.status(response.status).json(response);
    }
}