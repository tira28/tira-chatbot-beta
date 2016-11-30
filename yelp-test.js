// Testing Yelp API
require( 'dotenv' ).config( {silent: true} );
var Yelp = require('yelpv3');

var yelp = new Yelp({
    app_id: process.env.YELP_APP_ID,
    app_secret: process.env.YELP_APP_SECRET
});

yelp.search({term: 'sightseeing', location: 'Paris', limit: 5})
    .then(function (data) {
        var landmarks = [];
        var places = JSON.parse(data);

        for (var i = 0; i<places.businesses.length; i++) {
            var businessName = places.businesses[i].name;
            landmarks.push(businessName);
        }
        console.log(landmarks);
        return landmarks;
    })
    .catch(function (err) {
        console.error(err);
    });




