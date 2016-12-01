
// Important modules for switch statement
require('dotenv').config();
var axios = require('axios');
var Yelp = require('yelpv3');

// Facebook modules
var Botkit = require('botkit');

// Credentials Google
const GOOGLE_API = process.env.GOOGLE_API_KEY;

// Credentials for Yelp module
/*var yelp = new Yelp({
    app_id: process.env.YELP_APP_ID,
    app_secret: process.env.YELP_APP_SECRET
});*/

// Creating botkit controller for facebook messenger
var controller = Botkit.facebookbot({
    access_token: process.env.FACEBOOK_ACCESS_TOKEN,
    verify_token: process.env.FACEBOOK_VERIFY_TOKEN
});

var bot = controller.spawn();

controller.hears('(.*)', 'message_received', function(bot, message) {
    var watsonMessage = message.watsonData;
    var intent = watsonMessage.intents[0].intent;
    var context = watsonMessage.context;
    var input = watsonMessage.input;
    var output = watsonMessage.output;

    if (intent === 'book_ticket') {
        var set = context.set;
        switch (set) {
            case 'origin':
                context.origin_airport = input.text;
                context.destination_airport = null;
                break;
            case 'destination':
                context.destination_airport = input.text;
                break;
        }
    }

    switch (intent) {

        case 'get_weather':

            // Important context and variables
            var city = context.city;
            const GOOGLE_API = process.env.GOOGLE_API_KEY;
            var url_geolocation = `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${GOOGLE_API}`;

            // Calling geolocation API
            axios.get(url_geolocation).then(function(response){

                var location = {
                    lat: response.data.results[0].geometry.location.lat,
                    lng: response.data.results[0].geometry.location.lng
                };

                console.log('lat:', location.lat.toFixed(2));
                console.log('lng', location.lng.toFixed(2));

                // Dark sky API
                /*const DARK_SKY_API = process.env.DARKSKY_API_KEY;
                var url_weather = `https://api.darksky.net/forecast/${DARK_SKY_API}/${location.lat},${location.lng}`;*/

                // The weather company API
                // The Weather Company Credentials and URL
                const WEATHER_COMPANY_USER = process.env.WEATHER_COMPANY_USERNAME;
                const WEATHER_COMPANY_PASS = process.env.WEATHER_COMPANY_PASSWORD;
                const WEATHER_COMPANY_PORT = process.env.WEATHER_COMPANY_PORT;

                var url_weather_company = `https://${WEATHER_COMPANY_USER}:${WEATHER_COMPANY_PASS}@twcservice.eu-gb.mybluemix.net:${WEATHER_COMPANY_PORT}/api/weather` + `/v1/geocode/${location.lat}/${location.lng}/forecast/daily/3day.json`;


                return axios.get(url_weather_company);
            }).then(function(response){

                console.log(response.data.forecasts[0].day.temp);
                console.log(response.data.forecasts[0].day.shortcast);

                // Results from dark weather API
                /*var summary = response.data.currently.summary;
                var apparentTemperature = response.data.currently.apparentTemperature;*/

                var summary = response.data.forecasts[0].day.shortcast;
                var apparentTemperature = response.data.forecasts[0].day.temp;

                output.text = `${summary} in ${city} with temperature ${(apparentTemperature - 32).toFixed(0)} C.`;
            }).then(function(){
                console.log(output.text);
                return bot.reply(message, output.text);
            }).catch(function(error){
                console.log(error);
            });

            break;

        case 'get_landmarks':

            // Important context and variables
            var city = context.city;
            var landmarks = context.landmarks;
            console.log('city', city);

            // Credentials for Yelp module
            var yelp = new Yelp({
                app_id: process.env.YELP_APP_ID,
                app_secret: process.env.YELP_APP_SECRET
            });

            // Calling Yelp API
            yelp.search({
                term:'sightseeing',
                location:`${city}`,
                limit:5
            }).then(function(data){
                landmarks = [];
                var places = JSON.parse(data);

                for (var i = 0; i<places.businesses.length; i++) {
                    var businessName = places.businesses[i].name;
                    landmarks.push(businessName);
                }
                console.log('landmarks:',landmarks);
                output.text = `In ${city}, I would like to recommend you to go to ${landmarks}`;
                console.log(output.text);
            }).then(function(){
                return bot.reply(message, output.text);
            }).then(function(){
                delete landmarks;
            }).catch(function(err){
                console.log(err);
            });

            break;

        case 'book_ticket':


            console.log(watsonMessage);
            console.log(context.origin_airport);
            console.log(context.destination_airport);
            console.log(context.departure_date);
            console.log(context.origin_departing_time);
            console.log(context.return_date);
            console.log(context.returning_departing_time);


        default:
            output.text;
            // Check whether the output is array
            if (Array.isArray(output.text)) {
                return bot.reply(message, output.text.join('\n'));
            } else {
                return bot.reply(message, output.text);
            };
    }
 });

module.exports.controller = controller;
module.exports.bot = bot;




