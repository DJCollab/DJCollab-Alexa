var https = require('https')

exports.handler = (event, context) => {

  try {

    if (event.session.new) {
      // New Session
      console.log("NEW SESSION")
    }

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`)
        context.succeed(
          generateResponse(
            buildSpeechletResponse("Welcome to DJ Collab", true),
            {}
          )
        )
        break;

      case "IntentRequest":
        // Intent Request
        console.log(`INTENT REQUEST`)

        switch(event.request.intent.name) {
          
          case "AddSong":
            console.log(event.request.intent.slots.SongName.value)
            var songName = intent.slots.SongName.value;

            var url = {
              url:
              headers: {
                //HEADER STUFF FOR API CALL
              }
            };

            apiRequest(url, function(error, response, body) {
                if (error !== null) {
                    console.error("ERROR: " + error);
                }
                console.info("RESPONSE: " + response);
                console.info("BODY: " + body);
                var data = JSON.parse(body);
                var user_response = data['user-response'];
                var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                });


            https.get(endpoint, (response) => {
              response.on('data', (chunk) => { body += chunk })
              response.on('end', () => {
                var data = JSON.parse(body)
                var viewCount = data.items[0].statistics.viewCount
                context.succeed(
                  generateResponse(
                    buildSpeechletResponse(`Current view count is ${viewCount}`, true),
                    {}
                  )
                )
              })
            })
          break;

          default:
            throw "Invalid intent"
        }

        break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log(`SESSION ENDED REQUEST`)
        break;

      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`)

    }

  } catch(error) { context.fail(`Exception: ${error}`) }

}

// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {

  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  }

}

generateResponse = (speechletResponse, sessionAttributes) => {

  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }

}

function apiRequest(url, callback) {
    console.log("Starting request to " + url.url);
    request.post(url, function(error, response, body) {
        callback(error, response, body);
    });
}
