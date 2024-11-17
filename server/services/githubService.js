const axios = require('axios');
const Integration = require('../models/Integration');

exports.findOneAndUpdate = async data => {
    return Integration.findOneAndUpdate(
        { username: data.username }, // Query to check if the username exists
        data,    // Data to update or insert
        { upsert: true, new: true } // Options: create if not found, return the updated document
    );
}

exports.githubAccessToken = async code => {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
    }, { headers: { Accept: 'application/json' } });

    const { access_token } = response.data;
    return access_token;
}

exports.githubUserInfomation = async accessToken => {
    return axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
}

exports.findOneById = async id => {
    return Integration.findOne({_id: id});
}