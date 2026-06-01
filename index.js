// We need dotenv to load the environment variables from the .env file, which contains the GitHub client ID and secret. We also need axios to make HTTP requests to GitHub's OAuth API, express to create the web server, and path to serve static files.
require('dotenv').config();
const axios = require('axios');
const express = require('express');
const path = require('path');

const app = express();

app.use(express.static('static'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/static/index.html'));
});

// When the user clicks the "Login with GitHub" button, they will be redirected to this route (if the button has a get request to /auth. remember, even a simple <a> tag with an href to /auth will work since it is also technically a GET request). This route will redirect the user to GitHub's OAuth page, where they can authorize the app to access their GitHub account. The client_id is passed as a query parameter to identify the app to GitHub.
app.get('/auth', (req, res) => {
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`,
  );
});

app.get('/oauth-callback', ({ query: { code } }, res) => {
  const body = {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_SECRET,
    code,
  };
  const opts = { headers: { accept: 'application/json' } };
  axios
    .post('https://github.com/login/oauth/access_token', body, opts)
    .then((_res) => _res.data.access_token)
    .then((token) => {
      // eslint-disable-next-line no-console
      console.log('My token:', token);

      res.redirect(`/?token=${token}`);
    })
    .catch((err) => res.status(500).json({ err: err.message }));
});

app.listen(3000);
// eslint-disable-next-line no-console
console.log('App listening on port 3000');
