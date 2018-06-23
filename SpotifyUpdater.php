<?php
/**
 * S P O T I F Y U P D A T E R
 * version 1.0
 * by Kurt Höblinger, BSc aka NitricWare
 */

class SpotifyUpdater {
    public $accessToken;                            // The access token for the Spotify API
    private $curlHeaders;                           // The basic cURL headers required by the Spotify API
    private $spotifyAPIbaseURI;                     // The base URI for the Spotify API

    public $userInfo;                               // Variable holding all the user information once getUserInfo was called
    public $playlist;                               // Holds the track of the currently loaded playlist
    public $playlists;                              // Contains all the playlists owned by the user.
    public $playlistInfo;                           // Information about the currently selected playlist, which can always only be one
    public $missingTracks;                          // Array containing the tracks not available on Spotify anymore but still on the playlist
    public $foundTracks;                            // Array containing the search results for each song that's "missing"
    public $combinedTracks = [];

    public $newPlaylist;

    public $addStack = [];
    public $deleteStack = [];

    public $trackCount;                             // Integer of all songs
    public $missingTrackCount;                      // Integer of missing songs
    public $foundTracksCount;                       // Integer of re-found songs (not search results)


    /**
     * SpotifyUpdater constructor.
     * Sets the initial variables.
     * Accepts an acces token.
     * Creates the cURL headers.
     *
     * @param String $accessToken
     */

    public function __construct(String $accessToken){
        $this->accessToken = $accessToken;
        $this->curlHeaders = [
            "Authorization: Bearer ".$accessToken,
            "Accept: application/json",
            "Content-Type: application/json"
        ];
        $this->spotifyAPIbaseURI = "https://api.spotify.com/v1/";
        $this->getUserInfo();
    }

    /**
     * A flexible cURL wrapper using the options of $options and returning a stdClass of the JSON given by Spotify API.
     * $options contains URL, headers, body and method of the request and must be assembled outside.
     *
     * @param array $options
     * @return stdClass
     */

    private function makecURLrequest(Array $options) : stdClass{
        $curl = curl_init();                            // Initate cURL session
        curl_setopt_array($curl, $options);             // Set all options (including URL, headers, body and method)
        $responsePlain = curl_exec($curl);              // Execute the cURL request and get a plain text response
        $response = json_decode($responsePlain);        // Spotify API returns JSON therefor, make the response a stdClass
        curl_close($curl);                              // Close cURL session
        return $response;
    }

    /**
     * Initates a cURL GET request.
     * This function only accepts $urlAddendum which points to the API endpoint.
     * It prepares the cURL options for a GET request.
     *
     * @param String $urlAddendum
     * @return stdClass
     */

    private function makecURLgetRequest(String $urlAddendum) : stdClass{
        $url = $this->spotifyAPIbaseURI.$urlAddendum;               // Add the String urlAddendum to the base URL

        $cURLoptions = [CURLOPT_RETURNTRANSFER => 1,                // Return the whole plain text answer
            CURLOPT_URL => $url,                                    // Request from this URL
            CURLOPT_SSL_VERIFYHOST => false,                        // SSL errors might crash the script (likely on localhost)
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => $this->curlHeaders];              // Add the headers to the options

        return $this->makecURLrequest($cURLoptions);                // return the response
    }

    /**
     * Initates a cURL POST request.
     * This function accepts $urlAddendum which points to the API endpoint and a body for the request.
     * It prepares the cURL options for a POST request.
     *
     * @param String $urlAddendum
     * @param String $body
     *
     * @return stdClass
     */

    private function makecURLpostRequest(String $urlAddendum, String $body) : stdClass{
        $url = $this->spotifyAPIbaseURI.$urlAddendum;               // Add the String urlAddendum to the base URL

        $cURLoptions = [CURLOPT_RETURNTRANSFER => 1,                // Return the whole plain text answer
            CURLOPT_URL => $url,                                    // Request from this URL
            CURLOPT_CUSTOMREQUEST => "POST",                        // Make POST request
            CURLOPT_POSTFIELDS => $body,                            // Send given body
            CURLOPT_SSL_VERIFYHOST => false,                        // SSL errors might crash the script (likely on localhost)
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => $this->curlHeaders];              // Add the headers to the options

        return $this->makecURLrequest($cURLoptions);                // return the response
    }

    /**
     * Initates a cURL DELETE request.
     * This function accepts $urlAddendum which points to the API endpoint and a body for the request.
     * It prepares the cURL options for a DELETE request.
     *
     * TODO: currently not in use. Issue 612 on github spotif-web-api
     *
     * @param String $urlAddendum
     * @param String $body
     *
     * @return String
     */

    private function makecURLdeleteRequest(String $urlAddendum, String $body) : String {
        $url = $this->spotifyAPIbaseURI.$urlAddendum;               // Add the String urlAddendum to the base URL

        $cURLoptions = [CURLOPT_RETURNTRANSFER => 1,                // Return the whole plain text answer
            CURLOPT_URL => $url,                                    // Request from this URL
            CURLOPT_CUSTOMREQUEST => "DELETE",                      // Make DELETE request
            CURLOPT_POSTFIELDS => $body,                            // Send given body
            CURLOPT_SSL_VERIFYHOST => false,                        // SSL errors might crash the script (likely on localhost)
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => $this->curlHeaders];              // Add the headers to the options

        return $this->makecURLrequest($cURLoptions);                // return the response
    }

    /**
     * getUserInfo fetches the info of the logged in user.
     * It is then stored in the class' userInfo variable.
     *
     * @return bool
     */

    public function getUserInfo() : Bool{
        $endpoint = "me";                                           // Endpoint is just "me", added to the baseurl by another function
        $response = $this->makecURLgetRequest($endpoint);           // Initate GET request
        // TODO: error handling
        $this->userInfo = $response;                                // Assigning the response to the userInfo variable
        return true;
    }

    /**
     * This function returns the playlists, owned by the user.
     * They are then stored in the class' playlists variable.
     *
     * @return mixed
     */

    public function getPlaylists() : Bool{
        $endpoint = "users/".$this->userInfo->id."/playlists";      // Endpoint contians the user-ID and is added to the baseurl by another function
        $response = $this->makecURLgetRequest($endpoint);           // Initiate GET request
        $items = [];                                                // Create empty array
        /*
        Iterate over the item array of the response object.
        If the owner ID of the playlist is the current user's ID,
        add the playlist information to the playlists array.
         */
        foreach ($response->items as $item){
            if ($item->owner->id == $this->userInfo->id){
                $items[] = $item;
            }
        }
        $this->playlists = $items;                                  // Assign class' playlists variable with the items
        return true;
    }

    /**
     * This function fetches the information about the currently selected playlist.
     * The information is then stored in the class' playlistInfo variable.
     * This also effectively sets the currently selected playlist.
     *
     * @param String $playlistID
     *
     * @return stdClass
     */
    public function getPlaylistInfo(String $playlistID) : Bool {
        $endpoint = "users/".$this->userInfo->id."/playlists/".$playlistID;
        $this->playlistInfo = $this->makecURLgetRequest($endpoint);
        return true;
    }

    /**
     * This function fetches the tracks of the currently selected playlist.
     * They are then stored in the class' playlist variable.
     *
     * The track count is stored in the class' trackCount variable. It represents all the songs in the playlist.
     *
     * @param String $playlistID
     *
     * @return bool
     */

    public function getPlaylistContents() : Bool {
        $endpoint = "users/".$this->userInfo->id."/playlists/".$this->playlistInfo->id."/tracks";
        $response = $this->makecURLgetRequest($endpoint);
        $this->playlist = $response->items;
        while ($response->next != null){
            $url = str_replace($this->spotifyAPIbaseURI,"",$response->next);
            $response = $this->makecURLgetRequest($url);
            $this->playlist = array_merge($this->playlist, $response->items);
        }
        $this->trackCount = count($this->playlist);
        return true;
    }

    /**
     * This function detects local (aka missing) tracks of the currently selected playlist.
     * Those tracks are then saved as a tidied-up array in the class' missungTracks varibale.
     *
     * The missing track count is stored in the class' missingTrackCount variable.
     *
     * @return bool
     */

    public function getMissingTracks() : Bool{
        for ($i = 0; $i < count($this->playlist); $i++){
            if ($this->playlist[$i]->is_local == true) {
                $trackInfo["song"] = $this->playlist[$i]->track->name;
                $trackInfo["artist"] = $this->playlist[$i]->track->artists[0]->name;
                $trackInfo["album"] = $this->playlist[$i]->track->album->name;
                $trackInfo["uri"] = $this->playlist[$i]->track->uri;
                $trackInfo["position"] = $i;

                $this->missingTracks[] = $trackInfo;
            }
        }

        $this->missingTrackCount = count($this->missingTracks);

        return true;
    }

    /**
     * This function searches for the missing tracks.
     * The results are then stored in the class' foundTracks variable.
     *
     * The found tracks count is stored in the class' foundTracksCount variable.
     *
     * @return bool
     */

    public function findTracksAgain() : Bool {
        $i = 0;
        foreach ($this->missingTracks as $track){
            $url = "search?q=".urlencode($track["song"]." ".$track["artist"])."&type=track";
            $response = $this->makecURLgetRequest($url);
            if ($response->tracks->total == 0){
                $this->foundTracks[] = false;
            } else {
                foreach($response->tracks->items as $newTrack){
                    $info = [
                        "song" => $newTrack->name,
                        "artist" => $newTrack->artists[0]->name,
                        "album" => $newTrack->album->name,
                        "uri" => $newTrack->uri,
                        "position" => $i
                    ];
                    $this->foundTracks[$i][] = $info;
                }
            }
            $i++;
        }
        $this->foundTracksCount = $i;
        return true;
    }

    /**
     * This function creates a unified array holding the original songs with their respective replacements.
     * This combined array is stored in the class' combinedTracks variable.
     *
     * @return Void
     */

    public function combineTrackLists() : Void {
        for ($i=0;$i<$this->missingTrackCount;$i++){
            $this->combinedTracks[$i]["original"] = $this->missingTracks[$i];
            $this->combinedTracks[$i]["replacements"] = $this->foundTracks[$i];
        }
    }

    /**
     * This class creates stacks of request bodies.
     * The stacks are then stored in the class' addStack and deleteStack variables respectively.
     *
     * @param String $snapshot
     * @param array  $tracklist
     *
     * @return bool
     */

    public function createRequestStacks(String $snapshot, array $tracklist) : Bool {
        /*
        A counter variable is needed instead of a for loop because it might become necessary
        to reset the counter variable within the foreach loop.

        Checking if the $i var of a forloop can be divided by 99, could also be a solution to the problem.

        The Spotify API only accepts 100 URIs per call.

        The $requestQueue will contain arrays with a maximum of 100 delete and add URIs
         */
        $i = 0;
        $requestQueue = new stdClass();
        $requestQueue->deleteStacks = [];
        $requestQueue->addStacks = [];

        $deleteQueue = new stdClass();
        $deleteQueue->tracks = [];
        $deleteQueue->snapshot_id = $snapshot;

        $addQueue = new stdClass();
        $addQueue->uris = [];

        foreach ($tracklist as $tracks) {
            $deleteItem = new stdClass();
            $deleteItem->uri = $tracks->original;
            $deleteItem->positions = [(int)$tracks->position];
            $deleteQueue->tracks[] = $deleteItem;
            $addQueue->uris[] = $tracks->replacement;

            /*
            If the counter has reached 99, it means that now 100 URIs are within $requestURIs.
            It's now necessary to add the object to the $requestQueue and start over with a new,
            blank object. Also, the counter will now be reset to zero.
             */

            if ($i == 99) {
                $requestQueue->deleteStacks[] = $deleteQueue;
                $requestQueue->addStacks[] = $addQueue;

                $deleteQueue->tracks = [];
                $addQueue->uris = [];

                $i = 0;
            } else {
                $i++;
            }
        }

        /*
        If there were less than 100 elements left over or if the request contains less then 100 elements in total,
        the elements will now be added to the $requestQueue.
         */

        $requestQueue->deleteStacks[] = $deleteQueue;
        $requestQueue->addStacks[] = $addQueue;

        $this->deleteStack = $requestQueue->deleteStacks;
        $this->addStack = $requestQueue->addStacks;

        return true;
    }

    /**
     * This function creates a new playlist with the same name as the currently selected one, but with "(Updated)" appended.
     * The ID of the new playlist is the stored in the class' newPlaylist variable.
     *
     * @return mixed
     */

    public function createNewPlaylist() : Bool {
        $body = new stdClass();
        $body->name = $this->playlistInfo->name . " (Updated)";
        $body->description = $this->playlistInfo->description;
        $body->public = false;
        $response = $this->makecURLpostRequest("users/".$this->userInfo->id."/playlists",json_encode($body));
        $this->newPlaylist = $response->id;
        return true;
    }

    /**
     * This function iterates over the addStack variable and performs a POST request with each of the bodies in the stack.
     *
     * @return bool
     */

    public function addSongs() : Bool {
        foreach ($this->addStack as $stack){
            $this->makecURLpostRequest("users/".$this->userInfo->id."/playlists/".$this->newPlaylist."/tracks", json_encode($stack));
        }
    }
}