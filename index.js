var express = require('express');
var bodyParser = require('body-parser');
var spreadsheet = require('google-spreadsheet');
var cors = require('cors');
var _ = require('lodash');
var app = express();


app.use(bodyParser.urlencoded({ extended: true }));


app.use(bodyParser.json());

var whitelist = ['http://localhost:4000', 'https://rbr-cleveland.github.io'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  }
};

app.use(cors(corsOptions));

var port = process.env.PORT || 8081;

console.log(process.env.SHEETEMAIL);

var accountInfo = {
  "client_email": process.env.SHEETEMAIL,
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCxS4JJ5I9f7XEh\nW6oN6MMep3onvo4TVoOMi/KdzTarP5PhUrwwmbgdy3QZSG6ITyUN1MxfJgrTO8Zz\niBlTOAJAfd07gYpg670VfpXYBjr2vSeRaQPx/2GaadfgfstKP/o2om6GWTNoqEia\n17Wec0BvZJRhGGfZTLIpzUams3z1gD0OdsH0IW9Jj1Exqb05w28vKjm//n3EhZXE\nQRKwH+qeHotdfW7npDl+KnQzPRfutu823UlVkY1+r8Tcq3r1tK3NdKeF9DpwlD9E\nYxzK4uYOW1xYLvtBVNJ+Pir2OcdoP8qViafkkbu2tcJ1fe2jPEMImsxAGuuESSAu\nKvgJVlhzAgMBAAECggEAGU4XuIhA1oZDYWl96iJQxy1MSCPwj14HxKWs6U0DAoo+\nhyiR57XpC4egeINYE2iId2LqEKKTZPbhKlhAlRonaCEO1JF2uMKs6EZ7CKxK+jCh\nVyXQBFhZC/sTbt1qEpzzD507fT16EvQB+OfU6lq01bFbZEhheihyPXkpHl379eYs\nwW/ZXr93DK/jc9+vg/iaxxMtqI9hMTLFE5cGbJp6uh3teMA4uEQR2vdeZEK2iP2w\nx+1L0XYqbWtopog0uEZWKxvdTsQYxntAg/7K0d2m4HmkMxDQJ+I0NIvV09SKCgsF\nPTIJcdekMA5AFLvlv5YdX+ieS5Ug0ifqBGSaTgmjoQKBgQDpAr9hRUViXfqLiobE\nRY17bZ4BYtUK7k9tMo0Ez4BLP+BZUwZBbXVdFJGAGF9MQWXpf1o0In4mlZ8NrXzB\nwGR2gQoLVKkkX4ZNDUcJlbojmrT4Bgr47BnnTLvINW2NV9lB2qGnqXmbBIUlkj3T\nZDfZXo198jlZAwcd/mzKKD+XaQKBgQDCyYYl4VulPwcclH7IB4d8/OH4qI9Do3jt\nxd0pF2O0etoYPd74stAqG/LK9CNJ2fmPf2fUzy7h6dYJZjky0YA1EcsZIzAPJ3DT\no3N3TTrpXZPDYLo50OxsyZ6QhYI6Nlu3TfJiGh0NmfwQBnI6OeA0u+Vl1c5nVn0s\nYScIwDGxewKBgAVgMtojpv4l/OnLQGC22hTG6qZNiWy/IsX6LJa30tXpm1t0Nui7\nhcGn/9NcvJYdzCQe9A3P3ek1+n1uSzqNHcQ+JeUtBtn3+jk83S6zbZ/0qcgvG4Gy\nsMZNVue/k892/2Qtjx03I78X05qSTSrbXQ5+x/Tn6brL/xYKEKh5VT5BAoGAdLMI\nC+nYXkhEmnrc+jqIkflv6OoT6xIlgU7qEZRRx+9SevOWgqmezZuw+qcJ/VT6j15l\ndrop/G98LGVyH2Akz6a5Z3YNdQbMMf/bTb6XbPkDbiqlZ74j54lj1nImc3nduRSa\nAuxiO6PlwDQce4XxLabk6P4PixnmJJCQMk3zd8ECgYAbrr5CBxUlDfMQrIkiABcO\nXnRmbYmuA5Hi4xuMK04VJSF0gIL3CBBl7CEWMJi+VOgcKZTEEit5Kg5h6FYlXdZo\nKA9vTHS53JKdpXvf0vLk09hrt60dFMNHFdo404KL5WKZucWE2z8VM95oSSDCfX2R\nawkr80AMztVYTerECURiXA\u003d\u003d\n-----END PRIVATE KEY-----\n",
}

var rbrSheet = new spreadsheet(process.env.SHEETID);

var router = express.Router();

app.get('/', function(request, response) {
  response.json({
    message: 'hooray! welcome to our api!'
  });
})

router.route('/awake').get(function(req, res) {
  res.json({
    message: 'heroku dyno is awake now',
    isAwake: true
  })
})

router.route('/new-account').post(function(req, res) {

  var data = req.body;

  var row = {};
  if (_.has(data, 'address')) {
    row = _.assign(data.address, row);
    delete data.address;
  }
  row = _.assign(data, row);

  // console.log(req, row);

  rbrSheet.useServiceAccountAuth(accountInfo, function(err) {
    console.log('oh hey!')
    if (err) {
      res.status(500).json({
        message: "There was an authentication error",
        error: err
      })
    } else {

      rbrSheet.getInfo(function(err, sheet_info) {
        console.log('hey!')
        rbrSheet.addRow(1, row, function(err, newRow) {
          if (err) {
            res.status(500).json({
              message: "There was an error",
              error: err
            })
          } else {
            console.log('and now for this!')
            res.status(200).json({
              message: "Hooray we might have added a row!",
              data: row,
              success: true,
              timestamp: newRow.updated
            });
          }
        });
      });
    }
  });
});

app.use('/api', router);
app.listen(port);

console.log('Magic happens on port ' + port);
