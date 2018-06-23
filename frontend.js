/**
 * SpotifyUpdater F R O N T E N D
 *
 * This file
 *  - calls initial functions
 *  - knows the url string and the access token
 *  - listens to events dispatched by the SpotifUpdater-Bridge-Class
 *
 * Written by Kurt Höblinger, BSc aka NitricWare
 */

let url_string = window.location.href;              // Get the URL
let url = new URL(url_string);                      // Convert URL String to URL Object
let token = url.searchParams.get("access_token");   // Get value of parameter access_token

let spotupdtr;                                      // Instantiate spotupdtr variable for later user

/**
 * Once the DOM is done loading, initial requests will be performed.
 */

window.onload = function(){
    spotupdtr = new SpotifyUpdater(token);          // Instantiate new SpotifyUpdater Object (Backend-Bridge)
};

/**
 * loadPlaylist()
 *
 * This function loads the playlist.
 * It is assigned to the 'div' containing the playlist name.
 * This 'div' also has a data-id attribute which is used in this function.
 *
 * @return void
 */

function loadPlaylist(){
    let playlistID = this.dataset.id;               // this.dataset is an object containing all attributes with "data-" before
    spotupdtr.getMissingTracks(playlistID);         // Fetching the missing tracks of the playlist
}

/**
 * updatePlaylist()
 *
 * This function collects all the checked items of the track collection and the corresponding replacement tracks.
 * Then it calls the SpotifyUpdater-function which actually replaces the songs.
 */

function updatePlaylist(){
    /*
    Get all checked checkboxes.
    This can be done in this case, because the only checkboxes in the UI are tracks, the user wants to replace.
    It would be better to search by a better selector.

    TODO: Use a better selector - Getting all inputs could break the whole thing at one point. Using a class would be better

    Also, an empty body array will be created.
    This body will be the body of the POST request to the backend by the SpotifyUpdater bridge class.

    Then the script will iterate over the checked tracks

    The Spotify API needs a snapshot ID of a playlist to be able to delete local tracks.
    This ID is stored as a data attribute with the original track and added to the body of the request.
     */


    let originalTracks = document.querySelectorAll("input[type='checkbox']:checked")

    let body = {
        "snapshot": originalTracks[0].dataset.snapshot,
        "playlist": originalTracks[0].dataset.playlist,
        "tracklist": []
    };

    originalTracks.forEach(function(originalTrack){
        /*
        A data-something-something attribute is accessible via JavaScript as dataset.somethingSomething.
        The line below extracts the original URI from the checkbox attribute.
         */

        let track = originalTrack.dataset.originalUri;
        let position = originalTrack.dataset.position;

        /*
        The following lines select all the checked radio boxes which have the original URI as their name,
        and extract the replacement URIs
        Since this can only be one, we can safely just take element 0 of the resulting array.
         */

        let replacement = document.querySelectorAll("input[type='radio'][name='"+track+"']:checked");
        let replacementUri = replacement[0].dataset.replacementUri;

        /*
        Now the original URI and the replacement URI are added to the result object.
        This result object will then be pushed (appended) to the body array.
        The backend will later be able to send the result to the API
         */

        let result = {
            position: position,
            original: track,
            replacement: replacementUri
        };
        body.tracklist.push(result);
    });

    spotupdtr.replaceSongs(body);
}

/**
 *
 * E V E N T   L I S T E N E R S
 *
 * SpotifyUpdater() - the bridge between the backend and the front end - dispatches events.
 * The following section listens to them.
 * Each event listener does something useful when necessary.
 * The events come with details attached. However, the details are also stored in fields of SpotifyUpdater()
 *
 */

/**
 * userinfoloaded
 * --------------
 * Once the event 'userinfoloaded' is dispatched, this function fills the gaps with user data like the name.
 */

document.addEventListener('userinfoloaded', function () {
    document.getElementById("display_name").innerText = spotupdtr.userInfo.display_name;        // Display the user's name
}, false);

/**
 * playlistsloaded
 * ---------------
 * Once the event 'playlistsloaded' is dispatched, this function creates list elements for each playlist.
 */

document.addEventListener('playlistsloaded', function () {
    /*
    The field 'playlists' contains all the playlists owned by the user.
    This loop iterates over all of the playlists in the field.
    It creates divs with information of the playlists.
     */
    spotupdtr.playlists.forEach(function(element){
        let container = document.getElementById("playlists");                   // Get the container-div 'playlists'
        let newItem = document.createElement("div");                            // Create a new div
        let newItemText = document.createTextNode(element.name);                // Create text to be written into the div

        let newAttributeClass = document.createAttribute("class");              // Create a class attribute for the div
        let newAttributeID = document.createAttribute("data-id");               // Create a data-id attribute for the div
        let newAttributeName = document.createAttribute("data-name");           // Create a data-name attribute for the div

        newAttributeClass.value = "playlistItem";                               // Give the class attribute a value
        newAttributeID.value = element.id;                                 // Give the data-id attribute a value
        newAttributeName.value = element.name;                             // Give the data-name attribute a value

        newItem.setAttributeNode(newAttributeClass);                            // Attach the class attribute to the div
        newItem.setAttributeNode(newAttributeID);                               // Attach the data-id attribute to the div
        newItem.setAttributeNode(newAttributeName);                             // Attach the data-name attribute to the div

        newItem.onclick = loadPlaylist;                                         // Set the function to be called once div is clicked
                                                                                // Omit (), because that would call the function right away

        newItem.appendChild(newItemText);                                       // Write the text into the div

        container.appendChild(newItem);                                         // Append the div to the container
    })
}, false);

/**
 * tracksloaded
 * ------------
 * Once the event 'tracksloaded' is dispatched, this function creates an interface for selecting songs.
 */

document.addEventListener("tracksloaded", function (e) {
    let resultsContainer = document.getElementById("tracks");       // Get the container for all tracks

    let updateButton = document.createElement("input");             // Create the "Update Playlist" button
    let buttonType = document.createAttribute("type");              // Create an attribute "type" for the button
    let buttonText = document.createAttribute("value");             // Create an attribute "value" for the button

    buttonType.value = "button";                                    // Assign "button" to the type attribute
    buttonText.value = "Update Playlist";                           // Assign "Update Playlist" to the value attribute

    updateButton.setAttributeNode(buttonType);                      // Add the type to the button
    updateButton.setAttributeNode(buttonText);                      // Add the value (the caption) to the button

    updateButton.onclick = updatePlaylist;                          // Assing an onclick function

    resultsContainer.appendChild(updateButton);                     // Append the button to the container

    /*
    Since multiple playlists can be loaded at once due to the asynchronous nature of JS,
    the event comes with a body (e), containing the detail variable, which holds
    the variable name filled with the result of the API request.

    This variable name is stored in resultvarname.

    Fields and properties of classes can be addressed like so:
     - class.field
     - class['field']

    The later one comes in handy here and is used.
     */

    let resultvarname = e.detail.varname;

    /*
    Iterate over all the tracks in the variable.
    This loop will create a div containing the original track and all the replacement tracks.
    Also, this script will add radio buttons to all replacement tracks so the user can
    choose which one to keep.
    In addition to that the loop will add a checkbox to the original tracks, allowing the user
    to decide whether they want to replace the track at all or not.

    The playlist variable holds a bunch of arrays, each holding an object.
    The object is accessible as the variable results in the array.
     */

    spotupdtr[resultvarname].tracklist.forEach(function(results) {

        /*
        In the following three divs are created.
        The trackContainer will hold both the originalContainer and the replacementContainer
         */
        console.log(spotupdtr[resultvarname])
        let trackContainer = document.createElement("div");
        let originalContainer = document.createElement("div");
        let replacementsContainer = document.createElement("div");

        let input = document.createElement("input");                    // Create a new input (it'll become a checkbox)
        let inputLabel = document.createElement("label");               // Create a label for the input

        /*
        Now the text of the label will be created.
        It consists of the song title, the artist and the album
        It'll look like this:
        I Want a New Drug - Huey Lewis & The News (Sports)
        The text will the be packed into a text node.
         */

        let trackTitle = results.original.song + " - "
            + results.original.artist +
            " (" + results.original.album + ")";
        let labelText = document.createTextNode(trackTitle);

        /*
        Most of the elements have attributes.
        Those are created, filled and assigned in the next lines.

        First, the classes of the divs are created and attached.
         */
        let originalContainerClass = document.createAttribute("class");             // Create class attribute for div
        originalContainerClass.value = "originalTrack";                             // Give the class attribute a value
        originalContainer.setAttributeNode(originalContainerClass);                 // Attach the class attribute to the div

        let replacementsContainerClass = document.createAttribute("class");         // Create a class attribute for the div
        replacementsContainerClass.value = "replacementTracks";                     // Give the class attribute a value
        replacementsContainer.setAttributeNode(replacementsContainerClass);         // Attach the class attribute to the div

        /*
        The 'for' attribute holds the original uri, because
        the input's id also is the original uri. A label's 'for'
        must always be the input's 'id'.
         */
        let labelAttributeFor = document.createAttribute("for");                    // 'for' attribute for the label
        labelAttributeFor.value = results.original.uri;

        let inputType = document.createAttribute("type");                           // Create type attribute for input
        inputType.value = "checkbox";                                               // Make the input a checkbox
        input.setAttributeNode(inputType);                                          // Attach the type attribute to the input element

        let inputId = document.createAttribute("id");                               // Create id attribute for input
        inputId.value = results.original.uri;                                       // Assign the original uri to the id attribute
        input.setAttributeNode(inputId);                                            // Attach the id attribute to the input element

        let inputDataOriginalUri = document.createAttribute("data-original-uri");   // Create a data-id attribute for the input element
        inputDataOriginalUri.value = results.original.uri;                          // Give the data-id attribute a value
        input.setAttributeNode(inputDataOriginalUri);                               // Attach the original uri attribute to the input element

        let inputDataPlaylist = document.createAttribute("data-playlist");          // Create a data-id attribute for the input element
        inputDataPlaylist.value = resultvarname.substr(9);                          // Give the data-id attribute a value
        input.setAttributeNode(inputDataPlaylist);                                  // Attach the original uri attribute to the input element

        /*
        In order to be able to delete local tracks, the Spotify API needs their position in the
        playlist at a given time. The time is referenced by the snapshot.

        So, data-snapshot stores the snapshot, telling the Spotify API in which version
        of the playlist, the song was and data-position tells the Spotify API api at which
        position the song was in this version of the playlist.
         */

        let inputTrackPosition = document.createAttribute("data-position");         // Create a data-position attribute for the input element
        inputTrackPosition.value = results.original.position;                       // Give the data-position attribute a value
        input.setAttributeNode(inputTrackPosition);                                 // Attach the position attribute to the input element

        let inputSnapshot = document.createAttribute("data-snapshot");              // Create a data-snapshot attribute for the input element
        inputSnapshot.value = spotupdtr[resultvarname].playlistInfo.snapshot_id;    // Give the data-snapshot attribute a value
        input.setAttributeNode(inputSnapshot);                                      // Attach the snapshot attribute to the input element

        /*
        Now that all the attributes of the input and the label are created, filled and attached,
        it is time to append the text to the label, and to append the input and its label to the
        container holding the checkbox and the text.

        The original container will be appended to the container holding the tracks (original and
        replacements) later. This is solely for readability. It could also be done here.
         */

        inputLabel.appendChild(labelText);                                          // Write the text into the label element
        originalContainer.appendChild(input);                                       // First append the checkbox to the div
        originalContainer.appendChild(inputLabel);                                  // Then append the label to the div

        /*
        If the backend has found replacement songs, not only will the checkbox be checked,
        but there will also be a list of the possible replacement tracks.

        Those will be created in the following block.
         */

        if (results.replacements !== false){

            /*
            If the backend found replacement tracks for this item, the
            checkbox (this input) shall be checked, if not, it shall be
            unchecked.

            results.replacements will be false if there are no replacement tracks.

            Once a checkbox has a checked attribute, it will be checked.
            The value of the checked attribute is irrelevant.
             */

            let inputChecked = document.createAttribute("checked");                             // Create the checked attribute
            inputChecked.value = "checked";                                                     // Assign the value to the attribute
            input.setAttributeNode(inputChecked);                                               // Attach the attribute node to the input element

            /*
            In the following for loop, the script will iterate over all the replacement tracks.
            For each replacement track, a radio box and a label will be created.

            A for loop was chosen over a forEach() loop because it needs to be checked if this is
            the first iteration and thus 'activating' the radio control or leaving it untouched because
            it's not the first round of the loop.
             */

            for (let i=0; i<results.replacements.length;i++) {
                let replacementContainer = document.createElement("div");                       // Create a div for the radio box and the input

                let input = document.createElement("input");                                    // Create the input

                let inputLabel = document.createElement("label");                               // Create the label

                let trackTitle = results.replacements[i].song + " - "
                    + results.replacements[i].artist +
                    " (" + results.replacements[i].album + ")";                                 // Create the label's text
                let labelText = document.createTextNode(trackTitle);                            // Create a text node holding the label's text

                let containerClass = document.createAttribute("class");                         // Create a class attribute for the div
                containerClass.value = "trackItem replacementTrack";                            // Give the class attribute a value
                replacementContainer.setAttributeNode(containerClass);                          // Attach the class to the div

                let inputType = document.createAttribute("type");                               // Create a type attribute
                inputType.value = "radio";                                                      // Make the input a radio box
                input.setAttributeNode(inputType);                                              // Attach the attribute to the input

                /*
                If this is the first iteration of the for loop (i is 0 then),
                the radio box shall be check. This block is skipped after the
                first iteration of the loop.
                 */

                if (i === 0) {
                    let inputChecked = document.createAttribute("checked");                     // Create checked attribute for input
                    inputChecked.value = "checked";                                             // Assign a value to the attribute
                    input.setAttributeNode(inputChecked);                                       // Attach the attribute to the radio box
                }

                /*
                The radio box also needs a name attribute. In order to find it later on,
                when the "updatePlaylist()" function is called, the name will be the same
                as the name of the checkbox next to the original name.
                 */

                let inputName = document.createAttribute("name");                               // Create a name attribute
                inputName.value = results.original.uri;                                         // Assign the original uri to the attribute
                input.setAttributeNode(inputName);                                              // Attach the attribute to the radio box

                let inputDataReplacementUri = document.createAttribute("data-replacement-uri"); // Create a data-id attribute for the input
                inputDataReplacementUri.value = results.replacements[i].uri;                    // Set the data-id to the replacement uri
                input.setAttributeNode(inputDataReplacementUri);                                // Attach the attribute to the radio box

                inputLabel.appendChild(labelText);                                              // Write the text into the div

                replacementContainer.appendChild(input);                                        // Append the radio box to the container
                replacementContainer.appendChild(inputLabel);                                   // Append the label to the container

                replacementsContainer.appendChild(replacementContainer);                        // Append the container to the parent container
            }
        }

        /*
        Now five containers are known to the script.
        There's the results container (1), holding the track containers (2).
        The track container (2) holds
         - the original container (3) (checkbox and original song text)
         - the replacements container (4) containing
           - the replacement containers (5) (radio boxes and replcement song texts)

        ----------------------------------------------------
        | Results Container                                |
        | ------------------------------------------------ |
        | | Track Container                              | |
        | | -------------------------------------------- | |
        | | | Original Container                       | | |
        | | | ---------------------------------------- | | |
        | | | | Replacements Container               | | | |
        | | | | ------------------------------------ | | | |
        | | | | | Replacement Container #1         | | | | |
        | | | | ------------------------------------ | | | |
        | | | | ------------------------------------ | | | |
        | | | | | Replacement Container #2         | | | | |
        | | | | ------------------------------------ | | | |
        | | | ---------------------------------------- | | |
        | | -------------------------------------------- | |
        | ------------------------------------------------ |
        | ------------------------------------------------ |
        | | Track Container                              | |
        | | -------------------------------------------- | |
        | | | Original Container                       | | |
        | | | ---------------------------------------- | | |
        | | | | Replacements Container               | | | |
        | | | | ------------------------------------ | | | |
        | | | | | Replacement Container #1         | | | | |
        | | | | ------------------------------------ | | | |
        | | | | ------------------------------------ | | | |
        | | | | | Replacement Container #2         | | | | |
        | | | | ------------------------------------ | | | |
        | | | ---------------------------------------- | | |
        | | -------------------------------------------- | |
        | ------------------------------------------------ |
        ----------------------------------------------------

         */
        trackContainer.appendChild(originalContainer);          // Append the original container to the track container
        trackContainer.appendChild(replacementsContainer);      // Append the replacements container to the track container
        resultsContainer.appendChild(trackContainer);           // Append the track container to the results container
    });
});