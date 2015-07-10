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

// localAccountInfo = require('./rbr-app.json') || {};

var accountInfo = {
  client_email: process.env.SHEETEMAIL,
  private_key: process.env.SHEETKEY
}

var rbrSheet = new spreadsheet('1J7AdFGG_vk36mQu3UbeAYzH_uoN-GAON5Rw1o0x2Qws');

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
    if (err) {
      res.status(500).json({
        message: "There was an error",
        error: err
      })
    } else {
      rbrSheet.getInfo(function(err, sheet_info) {

        rbrSheet.addRow(1, row, function(err, newRow) {
          if (err) {
            res.status(500).json({
              message: "There was an error",
              error: err
            })
          } else {
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
