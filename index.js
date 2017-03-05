'use strict';
var request = require("request");

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'SSML',
            ssml: output,
        },
        card: {
            type: 'Simple',
            title: 'SessionSpeechlet - ${title}',
            content: 'SessionSpeechlet - ${output}',
        },
        reprompt: {
            outputSpeech: {
                type: 'SSML',
                ssml: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}

function getWelcomeResponse(callback) {
    var cardTitle = 'Party Started';
    var speechOutput = '<speak>Welcome to DJ Collab.</speak>';
    var repromptText = '<speak>You can add a song to a party by saying a song title and the party name.</speak>';
    var shouldEndSession = false;
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    var cardTitle = 'Party Ended';
    var speechOutput = '<speak>Thank you for using DJ Collab!</speak>';
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, true));
}

function inSession(intent, session, callback) {
    var cardTitle = 'Party Raging';
    var host = "http://djcollab.com/";
    switch (intent.name) {
      case "CreateParty":
          var route = "api/party";
          var partyName = intent.slots.PartyName.value;
          var url = {
              url: host + route,
              method: 'PUT',
              json: {
                'user-id': 1,
                'name': partyName,
                'threshold': 5
              }
          };

          request(url, function(error, response, body) {
              if (error !== null) {
                  console.error("ERROR: " + error);
              }
              console.log(body);
              var data = body;
              var confirmedParty = data['name'];
              var speechOutput = "<speak><p>" + confirmedParty + "was successfully created.</p></speak>";
              var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
              callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
            });
          break;


        case "AddSong":
              var route = "api/party";
              var songName = intent.slots.SongName.value;
              var partyName = intent.slots.PartyName.value;
              //Getting Party-ID from server

              var url = {
                  url: host + route + '/?name=' + partyName,
              };

              request.get(url, function(error, response, body) {
                  if (error !== null) {
                      console.error("ERROR: " + error);
                  }
                  var data = JSON.parse(body);
                  console.log(data);
                  var partyID = data.id;
                  console.log(data.id);
                  if(response.statusCode !== 200){
                    var speechOutput = "<speak><p>Can't find party</p></speak>";
                    var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                    callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                    return;
                  }
                  console.log("FIRST REQUEST PASSED");
                  var spotifyHost = "https://api.spotify.com/";
                  var spotifyRoute = "v1/search";
                  var url = {
                      url: spotifyHost + spotifyRoute + "/?q=" + songName + "&type=track"

                  };
                  request.get(url, function(error, response, body) {
                      if (error !== null) {
                          console.error("ERROR: " + error);
                      }
                      var data = JSON.parse(body);
                      var songID = data.tracks.items[0].uri;
                      console.log(data.tracks.items[0].uri);
                      if(response.statusCode !== 200){
                        var speechOutput = "<speak><p>Can't find songID</p></speak>";
                        var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                        callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                        return;
                      }
                      console.log("SECOND REQUEST PASSED");
                      console.log(songID);
                      console.log(partyID);
                      console.log("************************LOOOOOOOOOOOK HERE*****************")
                      var url = {
                          url: host + route + "/song",
                          method: 'PUT',
                          json: {
                            'party-id': partyID,
                            'song-id': songID
                          }
                      };

                      request(url, function(error, response, body) {
                          if (error !== null) {
                              console.error("ERROR: " + error);
                          }
                          console.log(body);
                          console.log(response.statusCode);
                          if(response.statusCode != 200){
                            var speechOutput = "<speak><p>Can't add song to playlist</p></speak>";
                            var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                            return;
                          }

                          var speechOutput = "<speak><p> Song was successfully added.</p></speak>";
                          var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                          callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                        });
                    });
                });//RETURNS PARTY ID
              break;
    }
}


function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);
    getWelcomeResponse(callback);
}

function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    if (intentName !== null) {
        inSession(intent, session, callback);
    } else {
        callback({}, buildSpeechletResponse("DJ Collab", "Invalid command, " + intentName, true));
        throw new Error('Invalid intent');
    }
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log('onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}');
}

exports.handler = (event, context, callback) => {
    try {
      /*
        console.log('event.session.application.applicationId=${event.session.application.applicationId}');
        if (event.session.application.applicationId !== 'amzn1.ask.skill.25e6ef34-e26b-466b-85d3-7760e5dcdb97') {
            callback('Invalid Application ID');
        }*/
        if (event.session.new) {
            onSessionStarted({
                requestId: event.request.requestId
            }, event.session);
        }
        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
