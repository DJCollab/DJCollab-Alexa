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

          case "UpdateParty":
              var route = "api/party";
              var partyName = intent.slots.PartyName.value;
              var url = {
                  url: host + route,
                  method: 'GET',
                  json:{
                    'name': partyName
                  }
              };

              request(url, function(error, response, body) {
                  if (error !== null) {
                      console.error("ERROR: " + error);
                  }
                  console.log(body);
                  var data = body;
                  var partyToUpdate = data['name'];
                  var partyID = data['id'];
                  var speechOutput = "<speak><p>" + partyToUpdate + " will be updated.</p></speak>";
                });//RETURNS PARTY ID


              var url = {
                url: host + route,
                method: 'POST',
                json: {
                  'name': partyName,
                  'party-id': partyID,
                  'threshold': 5,
                  'user-id': 1
                }
              };

              request(url, function(error, response, body) {
                  if (error !== null) {
                      console.error("ERROR: " + error);
                  }
                  console.info("RESPONSE: " + response);
                  console.info("BODY: " + body);
                  var data = JSON.parse(body);
                  var user_response = data['user-response'];
                  var speechOutput = "<speak><p>" + partyName + " was successfully updated.</p></speak>";
                  var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                  callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                });
              break;


        case "AddSong":
              var route = "api/party";
              var songName = intent.slots.SongName.value;
              var partyName = intent.slots.PartyName.value;
              console.log(partyName);
              //Getting Party-ID from server
              /*
              var url = {
                  url: host + route
              };
              console.log(url);

              request.get(url, function(error, response, body) {
                  if (error !== null) {
                      console.error("ERROR: " + error);
                  }
                  var d = JSON.parse(body);
                  console.log(d);
                  console.log(body);
                  var data = body;
                  var partyID = data['id'];
                  var speechOutput = "<speak><p>" + partyID + " is the party I D.</p></speak>";
                  var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                  callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                });//RETURNS PARTY ID

*/
              //Getting Song-ID from spotify
              var url = {
                  url: "https://api.spotify.com/v1/search",
                  json: {
                    'q': songName,
                    'type': "track"
                  }
              };
              request.get(url, function(error, response, body) {
                  if (error !== null) {
                      console.error("ERROR: " + error);
                  }
                  console.log(body);
                  console.log(response);
                  var data = body;
                  console.log("just before songID");
                  var songID = data['uri'];
                  console.log("after songID");
                  var speechOutput = "<speak><p></p></speak>";
                  var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                  callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                });//RETURNS SONG ID

              route = "party/song";
              var url = {
                  url: host + route,
                  method: 'PUT',
                  json: {
                    'song-id' : songID,
                    'party-id': partyID
                  }
              };

              request(url, function(error, response, body) {
                  if (error !== null) {
                      console.error("ERROR: " + error);
                  }
                  var data = body
                  var songName = data[''];
                  var speechOutput = "<speak><p>" + songName + "was successfully added to party " + partyName + "</p></speak>";
                  var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                  callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                });
              break;

            case "DeleteSong":
                  var route = "party";
                  var songName = intent.slots.SongName.value;
                  var partyName = intent.slots.PartyName.value;
                  //Getting Party-ID from server
                  var url = {
                      url: host + route,
                      method: 'GET',
                      json: {
                        'name': partyName
                      }
                  };
                  request(url, function(error, response, body) {
                      if (error !== null) {
                          console.error("ERROR: " + error);
                      }
                      console.info("RESPONSE: " + response);
                      console.info("BODY: " + body);
                      var data = JSON.parse(body);
                      var user_response = data['user-response'];
                      var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                      var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                      callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                    });//GETTING PARTY ID


                  //Getting Song-ID from spotify
                  var url = {
                      url: "https://api.spotify.com/v1/search",
                      method: 'GET',
                      json: {
                        'q': songName,
                        'type': "track"
                      }
                  };
                  request(url, function(error, response, body) {
                      if (error !== null) {
                          console.error("ERROR: " + error);
                      }
                      console.info("RESPONSE: " + response);
                      console.info("BODY: " + body);
                      var data = JSON.parse(body);
                      var user_response = data['user-response'];
                      var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                      var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                      callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                    });//RETURNS SONG ID

                  route = "party/song";
                  var url = {
                      url: host + route,
                      method: 'DELETE',
                      json: {
                        'song-id' : songID,
                        'party-id': partyID
                      }
                  };

                  request(url, function(error, response, body) {
                      if (error !== null) {
                          console.error("ERROR: " + error);
                      }
                      console.info("RESPONSE: " + response);
                      console.info("BODY: " + body);
                      var data = JSON.parse(body);
                      var user_response = data['user-response'];
                      var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                      var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                      callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                    });
                  break;

                case "UpvoteSong":
                      var route = "party/up";
                      var songName = intent.slots.SongName.value;
                      var partyName = intent.slots.PartyName.value;
                      //Getting Party-ID from server
                      var url = {
                          url: host + route,
                          method: 'GET',
                          json: {
                            'name': partyName
                          }
                      };
                      request(url, function(error, response, body) {
                          if (error !== null) {
                              console.error("ERROR: " + error);
                          }
                          console.info("RESPONSE: " + response);
                          console.info("BODY: " + body);
                          var data = JSON.parse(body);
                          var user_response = data['user-response'];
                          var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                          var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                          callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                        });//RETURNS PARTY ID


                      //Getting Song-ID from spotify
                      var url = {
                          url: "https://api.spotify.com/v1/search",
                          method: 'GET',
                          json: {
                            'q': songName,
                            'type': "track"
                          }
                      };
                      request(url, function(error, response, body) {
                          if (error !== null) {
                              console.error("ERROR: " + error);
                          }
                          console.info("RESPONSE: " + response);
                          console.info("BODY: " + body);
                          var data = JSON.parse(body);
                          var user_response = data['user-response'];
                          var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                          var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                          callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                        });//RETURNS SONG ID


                      var url = {
                          url: host + route,
                          method: 'POST',
                          json: {
                            'party-id': partyID,
                            'song-id': songID
                          }
                      };

                      request(url, function(error, response, body) {
                          if (error !== null) {
                              console.error("ERROR: " + error);
                          }
                          console.info("RESPONSE: " + response);
                          console.info("BODY: " + body);
                          var data = JSON.parse(body);
                          var user_response = data['user-response'];
                          var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                          var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                          callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                        });
                      break;


                    case "DownvoteSong":
                        var route = "party/down";
                        var songName = intent.slots.SongName.value;
                        var partyName = intent.slots.PartyName.value;
                        //Getting Party-ID from server
                        var url = {
                            url: host + route,
                            method: 'GET',
                            json: {
                              'name': partyName
                            }
                        };
                        request(url, function(error, response, body) {
                            if (error !== null) {
                                console.error("ERROR: " + error);
                            }
                            console.info("RESPONSE: " + response);
                            console.info("BODY: " + body);
                            var data = JSON.parse(body);
                            var user_response = data['user-response'];
                            var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                            var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                          });//RETURNS PARTYID


                        //Getting Song-ID from spotify
                        var url = {
                            url: "https://api.spotify.com/v1/search",
                            method: 'GET',
                            json: {
                              'q': songName,
                              'type': "track"
                            }
                        };

                        request(url, function(error, response, body) {
                            if (error !== null) {
                                console.error("ERROR: " + error);
                            }
                            console.info("RESPONSE: " + response);
                            console.info("BODY: " + body);
                            var data = JSON.parse(body);
                            var user_response = data['user-response'];
                            var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                            var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, false));
                          });///RETURNS SONG ID

                        var url = {
                            url: host + route,
                            method: 'POST',
                            json: {
                              'song-id': songID,
                              'party-id': partyID
                            }
                        };

                        request(url, function(error, response, body) {
                            if (error !== null) {
                                console.error("ERROR: " + error);
                            }
                            console.info("RESPONSE: " + response);
                            console.info("BODY: " + body);
                            var data = JSON.parse(body);
                            var user_response = data['user-response'];
                            var speechOutput = "<speak><p>" + user_response + "</p></speak>";
                            var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                            callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                          });
                        break;



                    case "DeleteParty":
                          var route = "api/party";
                          var partyName = intent.slots.PartyName.value;
                          var url = {
                              url: host + route,
                              method: 'DELETE',
                              json: {
                                'user-id': 1,
                                'name': partyName,
                                'threshold': 5
                              }
                          };
                          console.log(partyName);

                          request(url, function(error, response, body) {
                              if (error !== null) {
                                  console.error("ERROR: " + error);
                              }
                              console.log(body);
                              var data = body;
                              var partyName = data['name'];
                              console.log(partyName);
                              if(partyName !== null){
                                var speechOutput = "<speak><p>" + partyName + " was successfully removed. </p></speak>";
                                var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                                callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                              }
                              else{
                                var speechOutput = "<speak><p>Unable to find party.</p></speak>";
                                var repromptText = "<speak>You can hear available commands by saying, help.</speak>";
                                callback({}, buildSpeechletResponse(cardTitle, speechOutput, repromptText, true));
                              }
                            });
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
