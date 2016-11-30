/**
 * Created by yudistira on 11/27/16.
 */
/*case 'book_ticket':
 var originAirport = context.origin_airport;
 var destinationAirport = "CDG";
 var departureDate = context.departure_date;
 var returnDate = "2016-12-30";

 // Define flight query
 var flightQuery;
 flightQuery = {
 "request": {
 "passengers": {"adultCount": 1},
 "slice": [
 {
 "origin": `${originAirport}`,
 "destination": `${destinationAirport}`,
 "date": `${departureDate}`,
 "permittedCarrier": ['KL'],
 "maxStops": 0,
 "solutions": 1
 },
 {
 "origin": `${destinationAirport}`,
 "destination": `${originAirport}`,
 "date": `${returnDate}`,
 "permittedCarrier": ['KL'],
 "maxStops": 0,
 "solutions": 1
 },
 ]
 }
 };

 console.log(flightQuery);

 // URL QPX
 var url_qpx = `https://www.googleapis.com/qpxExpress/v1/trips/search?key=${GOOGLE_API}`;

 // Calling Google QPX API
 axios.post(url_qpx,flightQuery).then(function(response){
 var trips = response.data.trips;
 var tripOption = trips.tripOption[0];
 var summary = {
 departure_date: flightQuery.request.slice[0].date,
 return_date: flightQuery.request.slice[1].date,
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
 data.output.text=`Thank you for flying with KLM Royal Dutch Airlines. Your flight code is: ${summary.flight_code} ${summary.flight_number}. Fare: ${summary.travel_fare}`;
 return bot.reply(message, output.text);
 }).catch(function(error){
 console.log(error);
 });*/