/*Testing QPI Express App*/

// var API = require('qpx-express');
require('dotenv').config({silent: true});
var axios = require('axios');

var apiKey = process.env.GOOGLE_API_KEY;
// var qpx = new API(apiKey);

var body;
body = {
    "request": {
        "passengers": {"adultCount": 1},
        "slice": [
            {
                "origin": 'AMS',
                "destination": 'CDG',
                "date": '2016-12-20',
                "permittedCarrier": ['KL'],
                "maxStops": 0,
                "permittedDepartureTime" : {
                    "kind": "qpxexpress#timeOfDayRange",
                    "earliestTime":'15:30:00',
                    "latestTime": '23:59:00'
                },
                "solutions": 1
            },
            {
                "origin": 'CDG',
                "destination": 'AMS',
                "date": '2016-12-20',
                "permittedCarrier": ['KL'],
                "maxStops": 0,
                "permittedDepartureTime" : {
                    "kind": "qpxexpress#timeOfDayRange",
                    "earliestTime":'15:30:00',
                    "latestTime": '23:59:00'
                },
                "solutions": 1
            },
        ]
    }
};

/*qpx.getInfo(body, function (error, data) {

    if (error) {
        console.log(error);
    }

    var trips = data.trips;
    var tripOption = data.trips.tripOption[0];
    var summary = {
        departure_date: body.request.slice[0].date,
        return_date: body.request.slice[1].date,
        origin_airport_code: trips.data.airport[0].code,
        origin_airport_name: trips.data.airport[0].name,
        origin_city_name: trips.data.city[0].name,
        destination_airport_code: trips.data.airport[1].code,
        destination_airport_name: trips.data.airport[1].name,
        destination_city_name:trips.data.city[1].name,
        carrier: trips.data.carrier[0].name,
        travel_fare: tripOption.saleTotal
    };
    console.log(`Origin City: ${summary.origin_city_name}`);
    console.log(`Origin Airport: ${summary.origin_airport_name}`);
    console.log(`Destination City: ${summary.destination_city_name}`);
    console.log(`Destination Airport: ${summary.destination_airport_name}`);
    console.log(`Flight with: ${summary.carrier}`);
    console.log(`Total Cost: ${summary.travel_fare}`);
});*/

var url_qpx = `https://www.googleapis.com/qpxExpress/v1/trips/search?key=${apiKey}`;

axios.post(url_qpx,body).then(function(data){
    var trips = data.data.trips;
    var tripOption = trips.tripOption[0];
    var originDepartureTime = tripOption.slice[0];
    var summary = {
        departure_date: body.request.slice[0].date,
        return_date: body.request.slice[1].date,
        origin_airport_code: trips.data.airport[0].code,
        origin_airport_name: trips.data.airport[0].name,
        origin_city_name: trips.data.city[0].name,
        destination_airport_code: trips.data.airport[1].code,
        destination_airport_name: trips.data.airport[1].name,
        destination_city_name:trips.data.city[1].name,
        carrier: trips.data.carrier[0].name,
        flight_code: tripOption.slice[0].segment[0].flight.carrier,
        flight_number: tripOption.slice[0].segment[0].flight.number,
        travel_fare: tripOption.saleTotal
    };

    var flyingTime = {
        departing_flight_departure_time: tripOption.slice[0].segment[0].leg[0].departureTime,
        departing_flight_arrival_time: tripOption.slice[0].segment[0].leg[0].arrivalTime,
        returning_flight_departure_time: tripOption.slice[1].segment[0].leg[0].departureTime,
        returning_flight_arrival_time: tripOption.slice[1].segment[0].leg[0].arrivalTime
    };

    var departingDepartureTimeHour =  new Date(flyingTime.departing_flight_departure_time).getHours();
    var departingDepartureTimeMinutes =  new Date(flyingTime.departing_flight_departure_time).getMinutes();
    var departingDepartureTime = `${departingDepartureTimeHour}:${departingDepartureTimeMinutes}`;

    var departingArrivalTimeHour = new Date(flyingTime.departing_flight_arrival_time).getHours();
    var departingArrivalTimeMinutes = new Date(flyingTime.departing_flight_arrival_time).getMinutes();
    var departingArrivalTime = `${departingArrivalTimeHour}:${departingArrivalTimeMinutes}`;

    var returningDepartureTimeHour = new Date(flyingTime.returning_flight_departure_time).getHours();
    var returningDepartureTimeMinutes = new Date(flyingTime.returning_flight_departure_time).getMinutes();
    var returningDepartureTime = `${returningDepartureTimeHour}:${returningDepartureTimeMinutes}`;

    var returningArrivalTimeHour = new Date(flyingTime.returning_flight_arrival_time).getHours();
    var returningArrivalTimeMinutes = new Date(flyingTime.returning_flight_arrival_time).getHours();
    var returningArrivalTime = `${returningArrivalTimeHour}:${returningArrivalTimeMinutes}`;

    console.log('departingDepartureTime:',departingDepartureTime);
    console.log('departingArrivalTime:',departingArrivalTime);
    console.log('returningDepartureTime:',returningDepartureTime);
    console.log('returningArrivalTime:',returningArrivalTime);
    console.log(`Origin City: ${summary.origin_city_name}`);
    console.log(`Origin Airport: ${summary.origin_airport_name}`);
    console.log(`Origin City Departing Time: ${flyingTime.departing_flight_departure_time}`);
    console.log(`Destination City: ${summary.destination_city_name}`);
    console.log(`Destination Airport: ${summary.destination_airport_name}`);
    console.log(`Flight with: ${summary.carrier}`);
    console.log(`Total Cost: ${summary.travel_fare}`);
}).then(function(){
    summary.departing_flight_departure_time = tripOption.slice[0].segment[0].leg[0].departureTime;
}).catch(function(error){
    console.log(error);
});

