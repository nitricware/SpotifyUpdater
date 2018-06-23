<?php
/**
 * This is the backend state machine.
 * The frontend will send requests to this page.
 */

// TODO: Security check - is the request from the frontend?

ini_set('max_execution_time', 0);

include "SpotifyUpdater.php";

$spotify = new SpotifyUpdater($_GET["token"]);
$spotify->getUserInfo();

/**
 * The state machine
 * Depending on the state of $_GET["action"], a case is triggered, corresponding to the requested action.
 *
 * The output of the whole thing is a JSON string which has
 *  - a status (indicating an error or success)
 *  - an error message
 *  - the result of the requested action
 */

/**
 * If set as the shutdown function, a json string is printed instead of the fatal error.
 * This does not need to be set if the max_execution_time is set to 0.
 * @return Void
 */
function timedOut() : Void {
    $e = error_get_last();
    $r = new stdClass();
    $r->status = 400;
    $r->error = "Timed out.";
    if($e != null) {
        print_r(json_encode($r));
    }
}

register_shutdown_function('timedOut');

switch ($_GET["action"]){
    case "getuserinfo":
        // TODO: implement error handling
        $response = new stdClass();
        $response->status = 200;
        $response->details = $spotify->userInfo;
        print_r(json_encode($response));
    break;
    case "getplaylists":
        $spotify->getPlaylists();

        $response = new stdClass();
        $response->status = 200;
        $response->details = $spotify->playlists;
        print_r(json_encode($response));
    break;
    case "getmissingtracks":
        $spotify->getPlaylistInfo($_GET["id"]);
        $spotify->getPlaylistContents();
        $spotify->getMissingTracks();
        $spotify->findTracksAgain();
        $spotify->combineTrackLists();

        $response = new stdClass();
        $response->status = 200;
        $response->details["tracklist"] = $spotify->combinedTracks;
        $response->details["playlistInfo"] = $spotify->playlistInfo;
        print_r(json_encode($response));
    break;
    case "replacetracks":
        $body = json_decode($_POST["data"]);
        $spotify->getPlaylistInfo($body->playlist);
        $spotify->createRequestStacks($body->snapshot, $body->tracklist);
        $spotify->createNewPlaylist();
        $spotify->addSongs();
        $response = new stdClass();
        $response->status = 200;
        $response->details = "Playlist created and songs added.";
    break;
    default:
        /**
         * No valid action was supplied.
         * A new stdClass (a generic class in PHP) is instantiated and filled with a status code.
         */
        $response = new stdClass();
        $response->status = 400;
        print_r(json_encode($response));
}