<?php
/**
 * This file is the starting point.
 * A user goes to the application and gets redirected to the Spotify Login page.
 * If the user already allowed access for the app, no new login is required.
 * Either way, the user will be redirected to the specified redirect url.
 * In this case, the user gets redirected to the landing page. The landing page adds a layer of flexibility.
 * Scopes must also be specified here. The Web API Console helps you find the required scopes.
 */

// Register an application in Spotify's Developer Dashboard and paste the CLIENT ID here. CLIENT SECRET is not required.
const CLIENT_ID = "YOUR_CLIENT_ID";
// Specify a REDIRECT URI here. Also add it to the application in Spotify's Developer Dashboard.
const REDIRECT_URI = "http://example.com/auth_landing.html";
// Specify the needed scopes here. They can be space separated since they'll be url encoded later.
const SCOPE = "playlist-read-private playlist-modify-public playlist-modify-private";

/**
 * This header sends the user to the login/authenticate page over at spotify.com
 * There is one thing that went wrong the first 20 minutes I tried this out:
 * Spotify has no proper error handling if any parameter is duplicate in the url.
 * The green button won't do anything.
 * In my case, I had the response_type in the url twice.
 * &response_type=code was still in the url alongside &response_type=token
 */

header("Location: https://accounts.spotify.com/authorize?".
    "client_id=".CLIENT_ID.
    "&redirect_uri=".urlencode(REDIRECT_URI).
    "&response_type=token".
    "&scope=".urlencode(SCOPE));
