# GitHub OAuth App Walkthrough

This project is a minimal example of how to sign a user in with GitHub using a GitHub OAuth App, a small Express server, and a simple front end. The guide below walks through the whole process from the beginning:

1. Create a fake local test app.
2. Register that app in GitHub as an OAuth App.
3. Run this project on your machine.
4. Connect the app to GitHub with a client ID and client secret.
5. Test the full authentication flow locally.
6. Understand exactly what happens during the OAuth process.

This walkthrough uses the code in this repository exactly as it is now.

## What You Are Building

By the end of this guide, you will have a local app running at `http://localhost:3000` with a button that sends the user to GitHub. After the user signs in and approves access, GitHub sends the user back to your app with a temporary authorization code. Your server exchanges that code for an access token and then redirects the user back to the home page.

This repository uses these files:

- `index.js`: the Express server and GitHub OAuth logic.
- `static/index.html`: the login button and authorized screen.
- `static/main.js`: checks whether a token exists in the URL and switches the UI.
- `.env`: stores your GitHub client ID and secret.

## Before You Start

You need:

- A GitHub account.
- Node.js installed.
- npm installed.
- This project opened in VS Code or another editor.

To verify Node and npm are installed, run:

```powershell
node -v
npm.cmd -v
```

If those commands print version numbers, your environment is ready.

## Step 1: Create a Fake Test App Idea

Before touching GitHub settings, decide what your app is pretending to be. For local testing, this can be completely fake. In your case, a simple name like `test-app` is enough.

The point of the fake app is not to build a real product. The point is to give GitHub something to identify when users authorize access. To access the apps section of github, go to your account settings and scroll down to developer settings. Create a new OAuth app.

For this walkthrough, use:

- App name: `test-app`
- Local homepage: `http://localhost:3000`
- Callback URL: `http://localhost:3000/oauth-callback`

Those values matter because they must match what this project expects.

## Step 2: Install Project Dependencies

If you have not installed dependencies yet, run this inside the project folder:

```powershell
npm.cmd install
```

That installs the packages listed in `package.json`, including:

- `express` for the web server
- `axios` for the request to GitHub's token endpoint
- `dotenv` for loading environment variables from `.env`

## Step 3: Understand the Local App Before Connecting GitHub

It helps to understand what the code already does.

### Server behavior

In `index.js`, the server does four important things:

1. Loads environment variables from `.env`.
2. Serves the static files in the `static` folder.
3. Redirects the browser to GitHub when the user goes to `/auth`.
4. Handles the callback on `/oauth-callback` and exchanges the code for a token.

The key route that starts login is:

```js
app.get("/auth", (req, res) => {
    res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`
    );
});
```

That route sends the user to GitHub's authorization page.

### Front-end behavior

In `static/index.html`, the sign-in button is just a link:

```html
<a class="btn" href="/auth">SIGN IN WITH GITHUB</a>
```

That means clicking the button sends the browser to your own server first, not directly to GitHub.

Then `static/main.js` checks whether a token exists in the URL:

```js
const URL_PARAMS = new URLSearchParams(window.location.search);
const TOKEN = URL_PARAMS.get("token");
```

If a token is present, the app hides the unauthorized view and shows the authorized view.

## Step 4: Create a GitHub OAuth App

This is the part many people mix up. You need a GitHub OAuth App, not a GitHub App.

GitHub OAuth App is the correct choice for this project because the code uses:

- `client_id`
- `client_secret`
- `/login/oauth/authorize`
- `/login/oauth/access_token`

To create the OAuth App:

1. Sign in to GitHub.
2. Click your profile picture.
3. Go to `Settings`.
4. In the left sidebar, open `Developer settings`.
5. Click `OAuth Apps`.
6. Click `New OAuth App`.

Fill in the form like this:

- Application name: `test-app`
- Homepage URL: `http://localhost:3000`
- Application description: anything you want
- Authorization callback URL: `http://localhost:3000/oauth-callback`

Then click `Register application`.

After the app is created, GitHub shows you a page with:

- Client ID
- A button to generate a client secret

Click `Generate a new client secret`, then copy both values.

## Step 5: Add Your Credentials to `.env`

Open `.env` in the project root and make sure it looks like this:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_SECRET=your_client_secret_here
```

Important details:

- Both lines must include `=`.
- Do not put spaces around the `=`.
- Do not wrap the values in quotes unless you have a specific reason.
- The variable name in this project is `GITHUB_SECRET`, not `GITHUB_CLIENT_SECRET`.

Example:

```env
GITHUB_CLIENT_ID=Iv1.1234567890abcdef
GITHUB_SECRET=0123456789abcdef0123456789abcdef01234567
```

If either value is blank or malformed, GitHub will not know which app is requesting authentication.

## Step 6: Run the App Locally

Start the server with:

```powershell
npm.cmd start
```

You should see output similar to:

```text
App listening on port 3000
```

Now open your browser to:

```text
http://localhost:3000
```

You should see the landing page with the GitHub sign-in button.

## Step 7: Test the Full Login Flow Locally

Now test the actual OAuth process.

### What to do

1. Open `http://localhost:3000`.
2. Click `SIGN IN WITH GITHUB`.
3. Your browser should go to GitHub.
4. GitHub should show the authorization page for your app.
5. Approve the app.
6. GitHub should redirect you back to `http://localhost:3000/oauth-callback?code=...`
7. Your server should exchange the code for an access token.
8. Your server should redirect you to `http://localhost:3000/?token=...`
9. The page should switch to the authorized view.

### What you should see in the terminal

After a successful callback, this project logs the token in `index.js`:

```js
console.log("My token:", token);
```

So your terminal should print something like:

```text
My token: gho_xxxxxxxxxxxxxxxxxxxx
```

That confirms GitHub sent back a valid access token.

## Step 8: Understand the Authentication Process in Detail

This section explains exactly what happened during the login flow.

### Phase 1: The user starts on your site

The user loads:

```text
http://localhost:3000
```

Your Express server returns `static/index.html`.

### Phase 2: The user clicks the sign-in button

The browser requests:

```text
GET /auth
```

That hits this route in `index.js`:

```js
app.get("/auth", (req, res) => {
    res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`
    );
});
```

Your server responds with a redirect to GitHub's authorization endpoint.

### Phase 3: GitHub authenticates the user

GitHub now takes over temporarily. GitHub may ask the user to:

- sign in
- confirm identity
- approve the app

GitHub uses the `client_id` to figure out which OAuth App is asking for access.

### Phase 4: GitHub redirects back to your callback URL

After approval, GitHub sends the browser back to:

```text
http://localhost:3000/oauth-callback?code=SOME_TEMP_CODE
```

That temporary `code` is not the access token. It is just a short-lived authorization code.

### Phase 5: Your server exchanges the code for a token

This route handles the callback:

```js
app.get("/oauth-callback", ({ query: { code } }, res) => {
    const body = {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_SECRET,
        code,
    };
    const opts = { headers: { accept: "application/json" } };

    axios
        .post("https://github.com/login/oauth/access_token", body, opts)
        .then((_res) => _res.data.access_token)
        .then((token) => {
            console.log("My token:", token);
            res.redirect(`/?token=${token}`);
        });
});
```

Your server sends GitHub three things:

- `client_id`
- `client_secret`
- `code`

GitHub verifies them and returns an access token.

### Phase 6: The browser returns to the home page

After receiving the access token, your server redirects the browser to:

```text
/?token=ACCESS_TOKEN_HERE
```

Then `static/main.js` sees the token in the query string and switches the UI to the authorized state.

## Step 9: Common Mistakes and How to Fix Them

These are the most common issues when testing GitHub OAuth locally.

### Mistake 1: Using a GitHub App instead of an OAuth App

Symptom:

- GitHub pages do not match the tutorial.
- Your client ID does not behave correctly with `/login/oauth/authorize`.

Fix:

- Go to `Developer settings`.
- Use `OAuth Apps`.
- Do not use `GitHub Apps` for this project.

### Mistake 2: Empty or malformed `.env`

Symptom:

- GitHub shows a 404 page.
- The redirect URL contains an empty `client_id`.

Fix:

- Make sure `.env` contains valid assignments.
- Use:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_SECRET=your_client_secret_here
```

### Mistake 3: Callback URL does not match

Symptom:

- GitHub rejects the redirect.
- Authentication starts but never returns correctly.

Fix:

- In GitHub OAuth App settings, the callback URL must be exactly:

```text
http://localhost:3000/oauth-callback
```

It must match the route in `index.js`.

### Mistake 4: Server not restarted after editing `.env`

Symptom:

- You fixed `.env`, but the app still behaves like the old values are being used.

Fix:

- Stop the server.
- Start it again with `npm.cmd start`.

### Mistake 5: Wrong port

Symptom:

- Your browser opens one port but GitHub sends the callback to another.

Fix:

- This app listens on port `3000`.
- Use `http://localhost:3000` for both local testing and GitHub settings.

## Step 10: How to Verify That Authentication Really Worked

You can confirm success in several ways.

### Check 1: The browser URL

After the callback, the URL should contain a `token` query parameter because this sample app redirects to:

```text
http://localhost:3000/?token=...
```

### Check 2: The page content

The page should change from the unauthorized sign-in screen to the authorized success screen.

### Check 3: The server log

The terminal should show:

```text
My token: ...
```

That proves your server successfully exchanged the code for an access token.

## Step 11: Why This Demo Works but Is Still Simplified

This repository is intentionally small so it is easy to learn from. A production app would usually do more than this.

For example, a production app would usually:

- store tokens securely on the server
- avoid putting the token in the URL
- use sessions or secure cookies
- add a `state` parameter to defend against CSRF attacks
- request specific scopes when needed
- use the token to call GitHub APIs

This example is still useful because it teaches the core OAuth pattern very clearly.

## Step 12: Optional Next Improvement

Once this guide works end to end, a good next exercise is to call the GitHub API with the token and show the signed-in user's profile.

That would teach the next part of the OAuth story:

1. Authenticate the user.
2. Receive an access token.
3. Use the token to call a protected API.

## Full Local Test Checklist

Use this checklist any time you want to verify the project from scratch.

1. Install dependencies with `npm.cmd install`.
2. Create a GitHub OAuth App.
3. Set homepage URL to `http://localhost:3000`.
4. Set callback URL to `http://localhost:3000/oauth-callback`.
5. Copy the client ID and client secret into `.env`.
6. Start the app with `npm.cmd start`.
7. Open `http://localhost:3000`.
8. Click `SIGN IN WITH GITHUB`.
9. Approve the app on GitHub.
10. Confirm you are redirected back and see the authorized view.

## Short Summary

This project demonstrates the basic GitHub OAuth flow:

1. Your app sends the user to GitHub's authorize page.
2. GitHub sends back a temporary code.
3. Your server exchanges that code for an access token.
4. Your app uses the token to mark the user as authenticated.

If you can complete those steps locally, you understand the foundation of GitHub OAuth.
