/**
 * S P O T I F Y U P D A T E R
 * by Kurt Höblinger, BSc aka Nitricware
 * https://www.nitricware.com
 *
 * This is the JavaScript bridge to the PHP backend of the SpotifyUpdater.
 * SpotifyUpdater is a program designed to detect "unavailable" songs in your
 * playlist and replace them with the exact same song, because they're actually
 * still available on Spotify.
 */

class SpotifyUpdater {

    constructor(token){
        this.baseURI = "backend.php";                                           // Backend file
        this.token = token;                                                     // The access token for the Spotify API

        this.userInfo = {};                                                     // Create empty object for user infos
        this.playlists = {};                                                    // Create empty object for the user's playlists

        this.getUserDetails();                                                  // Get all user infos
        this.getPlaylists();                                                    // Get all playlists of the user
    }

    /**
     * This is a wrapper for creating and dispatching an event.
     *
     * @param eventhandler  Name of the event to be dispatched
     * @param content       Content of the event to be dispatched
     * @param variablename  Variable of the class to be filled with the content
     *
     * @return void
     */

    releaseEvent(eventhandler,content,variablename) {
        // TODO: lookup structure of json response and why it is content.details
        this[variablename] = content.details;
        let detail = {
            'varname': variablename,
            'content': content.details
        };

        let event = new CustomEvent(eventhandler, { detail: detail });
        document.dispatchEvent(event);
    }

    /**
     * Makes a get request to the backend using JavaScript's fetch function.
     *
     * @param action        Requested action from the backend
     * @param eventhandler  Event name to be dispatched
     * @param variablename  Variable of the class to be filled in releaseEvent()
     * @param parameters    Parameters to be appended to the base URI
     *
     * @return void
     */

    makeGETRequest(action, eventhandler, variablename, parameters = {}){
        let parent = this;                                                      // Current this saved to a variable as it gets lost along the way
        let url = this.baseURI+"?action="+action+"&token="+this.token;          // Completion of URI

        /*
        If there are parameters handed over to the function, this loop
        will append them all as GET parameters.
         */

        if (Object.keys(parameters).length > 0){
            for (let property in parameters) {
                if (parameters.hasOwnProperty(property)) {
                    let value = parameters[property];
                    url += "&"+property+"="+value;
                }
            }
        }

        /*
        Fetching the given URI.
        Once that's completed, the response is made to a JSON object.
        If no JSON string is returned by the backend, it is caught and the error is logged to the console.
        However, if it does not fail, the releaseEvent() function will be called.

        The variable parent holds the this object of the makeGETRequest. That this object is aware of
        the SpotifyUpdater class. This within the generic callback function would not know about the class.
         */

        // TODO: remove console.log
        console.log(url)

        fetch(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(jsonResponse) {
                parent.releaseEvent(eventhandler,jsonResponse,variablename);
            })
            .catch(function(e) {
                console.log(e);
            });
    }



    makePOSTRequest(action,eventhandler,variablename,parameters = {},body={}){
        let parent = this;
        let url =  this.baseURI+"?action="+action+"&token="+this.token;

        let data = new FormData();
        data.append( "data", JSON.stringify( body ) );

        // TODO: remove console.log
        console.log(url)

        fetch(url,
              {
                  method: "POST",
                  body: data
              })
            .then(function(response) {
                return response.text();
            })
            .then(function(jsonResponse) {
                //parent.releaseEvent(eventhandler,jsonResponse,variablename);
                console.log(jsonResponse);
            })
            .catch(function(e) {
                console.log(e);
            });
    }

    /**
     * This function initiates the GET request, asking for the user information.
     * Because of the way the event ('userinfoloaded' in this case) is created and dispatched,
     * the variable 'userInfo' will be filled with the response of the request.
     *
     * @return void
     */

    getUserDetails() {
        this.makeGETRequest('getuserinfo','userinfoloaded','userInfo');
    }

    /**
     * This function initiates the GET request, asking for the user's playlists.
     * Because of the way the event ('playlistsloaded' in this case) is created and dispatched,
     * the variable 'userInfo' will be filled with the response of the request.
     *
     * @return void
     */

    getPlaylists() {
        this.makeGETRequest('getplaylists','playlistsloaded','playlists')
    }

    getMissingTracks(playlistID) {
        // TODO: check if playlist is already loaded
        let parameters = {
            'id': playlistID
        };
        this.makeGETRequest('getmissingtracks', 'tracksloaded', 'playlist_'+playlistID, parameters);
    }

    replaceSongs(body) {
        this.makePOSTRequest('replacetracks', 'tracksreplaced', false, false, body)
    }
}