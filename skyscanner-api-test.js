/**
 * Created by yudistira on 12/12/16.
 */

'use strict';
require('dotenv').config({silent: true});
var axios = require('axios');
var qs = require('querystringify');
const skyscannerApiKey = process.env.SKYSCANNER_API;

// Creating API Key query
var apiQuery = qs.stringify({apiKey:skyscannerApiKey},true);

// Url for skyscanner track
var skyscannerUrl = `http://partners.api.skyscanner.net/apiservices/referral/v1.0/GB/EUR/en-GB/AMS/CDG/2016-12-12/2016-12-20/` + apiQuery;
console.log(skyscannerUrl);

// Calling SkyScanner URL
axios.get(skyscannerUrl).then(function(response){
    console.log(response.data);
}).catch(function(error){
    console.log(error);
});








