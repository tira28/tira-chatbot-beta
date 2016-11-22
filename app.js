/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require( 'dotenv' ).config( {silent: true} );

var express = require( 'express' );  // app server
var bodyParser = require( 'body-parser' );  // parser for post requests
var watson = require( 'watson-developer-cloud' );  // watson sdk
var http = require('http');
var https = require('https');
var request = require('request');
var axios = require('axios');
// var unirest = require('unirest');


// The following requires are needed for logging purposes
var uuid = require( 'uuid' );
var vcapServices = require( 'vcap_services' );
var basicAuth = require( 'basic-auth-connect' );


// The app owner may optionally configure a cloudand db to track user input.
// This cloudand db is not required, the app will operate without it.
// If logging is enabled the app must also enable basic auth to secure logging
// endpoints
var cloudantCredentials = vcapServices.getCredentials( 'cloudantNoSQLDB' );
var cloudantUrl = null;
if ( cloudantCredentials ) {
  cloudantUrl = cloudantCredentials.url;
}
cloudantUrl = cloudantUrl || process.env.CLOUDANT_URL; // || '<cloudant_url>';


var logs = null;
var app = express();

// Bootstrap application settings
app.use( express.static( './public' ) ); // load UI from public folder
app.use( bodyParser.json() );

// Create the service wrapper
var conversation = watson.conversation( {
  url: 'https://gateway.watsonplatform.net/conversation/api',
  username: process.env.CONVERSATION_USERNAME || '<username>',
  password: process.env.CONVERSATION_PASSWORD || '<password>',
  version_date: '2016-07-11',
  version: 'v1'
} );

// Create service wrapper for AlchemyAPI
var alchemy_language = watson.alchemy_language({
  api_key: process.env.ALCHEMY_API_KEY || 'YOUR_API_KEY'
});

// Endpoint to be call from the client side
app.post( '/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if ( !workspace || workspace === '<workspace-id>' ) {
    return res.json( {
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
        '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' +
        'Once a workspace has been defined the intents may be imported from ' +
        '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    } );
  }

  var payload = {
    workspace_id: workspace,
    context: {},
    input: {}
  };

  var params = null;
  if ( req.body ) {
    if ( req.body.input ) {
      payload.input = req.body.input;
      params = {text: req.body.input.text};
    }
    if ( req.body.context ) {
      // The client must maintain context/state
      payload.context = req.body.context;
    }
  }

  if(params == null) {
   params = {text: "Some sample input"}
  }

  // searching for entities from alchemy language API

  alchemy_language.entities(params, function(error, response) {
        if (error) {
          return res.status(error.code || 500).json(error);
        }
        if(response != null) {
          var entities = response.entities;
          var cityList = entities.map(function(entry) {
                if(entry.type == "City") {
                 return(entry.text);
                }
          });
	  cityList = cityList.filter(function(entry) {
		if(entry != null) {
		 return(entry);
		}
	  });

    console.log('cityList: ', cityList);

	  if(cityList.length > 0) {
	   payload.context.appCity = cityList[0];
	  } else {
	   delete payload.context.appCity;
	  }
          var stateList = entities.map(function(entry) {
                if(entry.type == "StateOrCounty") {  //StateOrCounty
                 return(entry.text);
                }
          });

	  stateList = stateList.filter(function(entry) {
		if(entry != null) {
		 return(entry);
		}
	  });

    console.log('stateList: ', stateList);

	  if (stateList.length > 0) {
	   payload.context.appST = stateList[0];
	  } else {
	   delete payload.context.appST;
	  }
  } /* The following code for null response*/ else {
	 if(payload.context.appCity) {
	  delete payload.context.appCity;
	 }
	 if(payload.context.appST) {
	  delete payload.context.appST;
	 }
	 console.log('response from Alchemy Language entity extraction is null');
        }
  // Send the input to the conversation service
  console.log('params:', params);
  console.log('payload: ', payload);
        payload.context.entities = entities;

        conversation.message(payload, function(err, data) {
                if (err) {
                  return res.status(err.code || 500).json(err);
                }

                // updating response
                updateResponse(res, data);

         });

  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */


function updateResponse(res, data) {
  if (data.intents.length > 0 && data.intents[0].intent === 'get_weather') {
      const GOOGLE_API = process.env.GOOGLE_API_KEY;
      var cityQuery = data.context.appCity;
      var url_geolocation = `https://maps.googleapis.com/maps/api/geocode/json?address=${cityQuery}&key=${GOOGLE_API}`;
      axios.get(url_geolocation).then(function(response){
          console.log(response.data.results[0].geometry.location);
          var location = {
              lat: response.data.results[0].geometry.location.lat,
              lng: response.data.results[0].geometry.location.lng
          };
          const DARK_SKY_API = process.env.DARKSKY_API_KEY;
          var url_weather = `https://api.darksky.net/forecast/${DARK_SKY_API}/${location.lat},${location.lng}`;
          //console.log(data.output.text);
          return axios.get(url_weather);
      }).then(function(response){
          var summary = response.data.currently.summary;
          var apparentTemperature = response.data.currently.apparentTemperature;
          var city = data.context.appCity;
          data.output.text = `${summary} in ${city} with temperature ${(apparentTemperature - 32).toFixed(2)} C.`;
          return res.json(data);
      }).catch(function(error){
          console.log(error);
      });
  } else {
      return res.json(data);
  }

};



// create getWeatherApi function
  function getWeatherApi(){
    const DARK_SKY_API = process.env.DARKSKY_API_KEY;
    var url_weather = `https://api.darksky.net/forecast/${DARK_SKY_API}/42.3601,71.0589`;
    axios.get(url_weather)
     .then(function(response){
        console.log('response-data: ', response.data);
      }).catch(function(error){
        console.log(error);
    });
  };

function checkWeather(data) {
  //return (data.context != null) && (data.context.appCity != null) && (data.context.appST != null);
  return data.intents && data.intents.length > 0 && data.intents[0].intent === 'get_weather'
     && (data.context != null) && (data.context.appCity != null);
}



if ( cloudantUrl ) {
  // If logging has been enabled (as signalled by the presence of the cloudantUrl) then the
  // app developer must also specify a LOG_USER and LOG_PASS env vars.
  if ( !process.env.LOG_USER || !process.env.LOG_PASS ) {
    throw new Error( 'LOG_USER OR LOG_PASS not defined, both required to enable logging!' );
  }
  // add basic auth to the endpoints to retrieve the logs!
  var auth = basicAuth( process.env.LOG_USER, process.env.LOG_PASS );
  // If the cloudantUrl has been configured then we will want to set up a nano client
  var nano = require( 'nano' )( cloudantUrl );
  // add a new API which allows us to retrieve the logs (note this is not secure)
  nano.db.get( 'car_logs', function(err) {
    if ( err ) {
      console.error(err);
      nano.db.create( 'car_logs', function(errCreate) {
        console.error(errCreate);
        logs = nano.db.use( 'car_logs' );
      } );
    } else {
      logs = nano.db.use( 'car_logs' );
    }
  } );

  // Endpoint which allows deletion of db
  app.post( '/clearDb', auth, function(req, res) {
    nano.db.destroy( 'car_logs', function() {
      nano.db.create( 'car_logs', function() {
        logs = nano.db.use( 'car_logs' );
      } );
    } );
    return res.json( {'message': 'Clearing db'} );
  } );

  // Endpoint which allows conversation logs to be fetched
  app.get( '/chats', auth, function(req, res) {
    logs.list( {include_docs: true, 'descending': true}, function(err, body) {
      console.error(err);
      // download as CSV
      var csv = [];
      csv.push( ['Question', 'Intent', 'Confidence', 'Entity', 'Output', 'Time'] );
      body.rows.sort( function(a, b) {
        if ( a && b && a.doc && b.doc ) {
          var date1 = new Date( a.doc.time );
          var date2 = new Date( b.doc.time );
          var t1 = date1.getTime();
          var t2 = date2.getTime();
          var aGreaterThanB = t1 > t2;
          var equal = t1 === t2;
          if (aGreaterThanB) {
            return 1;
          }
          return  equal ? 0 : -1;
        }
      } );
      body.rows.forEach( function(row) {
        var question = '';
        var intent = '';
        var confidence = 0;
        var time = '';
        var entity = '';
        var outputText = '';
        if ( row.doc ) {
          var doc = row.doc;
          if ( doc.request && doc.request.input ) {
            question = doc.request.input.text;
          }
          if ( doc.response ) {
            intent = '<no intent>';
            if ( doc.response.intents && doc.response.intents.length > 0 ) {
              intent = doc.response.intents[0].intent;
              confidence = doc.response.intents[0].confidence;
            }
            entity = '<no entity>';
            if ( doc.response.entities && doc.response.entities.length > 0 ) {
              entity = doc.response.entities[0].entity + ' : ' + doc.response.entities[0].value;
            }
            outputText = '<no dialog>';
            if ( doc.response.output && doc.response.output.text ) {
              outputText = doc.response.output.text.join( ' ' );
            }
          }
          time = new Date( doc.time ).toLocaleString();
        }
        csv.push( [question, intent, confidence, entity, outputText, time] );
      } );
      res.csv( csv );
    } );
  } );
}

module.exports = app;
