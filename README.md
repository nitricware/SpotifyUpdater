# SpotifyUpdater

SpotifyUpdater is a program designed to detect "unavailable" songs in your playlist and replace them with the exact same song, because they're actually still available on Spotify.

*Current build only supports creating a new playlist and adding the songs to that playlist, since deleting local tracks is allowed by the Spotify API but somewhat complicated. Awaiting response to issue 612...*

## Developer
Kurt Höblinger, BSc aka NitricWare

## Comment-Style

```php
/**
 * This comment style is meant for commenting definitions
 */

/*
This comment style is meant for commenting multiple lines or blocks of code.
 */

// This comment style is meant for single lines and is placed next to the lines
```

## Running the Application
There are several steps to accomplish before, the script can run.
1. The user must create a Spotify Application in the Developer [Dashboard].
2. The user must find and copy the ``Client ID`` in the Dashboard
3. While the user is there, they should define the ``redirct URI`` for the application
4. The user must then head to ``index.php`` and paste the ``Client ID`` and the ``redirect URI`` into the the ``const``-definitions

## History
10.5.2018 - Development started

## Changelog
1.0 initial release

[Dashboard]: https://beta.developer.spotify.com/dashboard/applications