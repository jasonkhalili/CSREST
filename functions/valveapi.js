require('dotenv').load();

var request = require('request');
var async = require('async');


exports.GetSteamUserInfo = function GetSteamUserInfo(steamid, callback) {
  var connectionString = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + process.env.STEAM_API_KEY + '&steamids=' + steamid;

  request({
    uri: connectionString
  }, function(error, response, body) {
    if(!error && response.statusCode == 200) {
      var playerJson = JSON.parse(body);
      var player = playerJson.response.players[0];
      callback(null, player);
    }
    else if(error) {
      callback(error);
    }
    else {
      callback(response.statusCode);
    }
  });
}

function GetItemPrice(item, callback) {
  var hashName = item["market_hash_name"];
  var connectionString = 'https://steamcommunity.com/market/priceoverview/?currency=1&appid=730&market_hash_name=' + hashName;

  request({
    uri: connectionString
  }, function(error, response, body) {
    if(!error && response.statusCode == 200) {
      callback(null, body);
    }
    else if(error) {
      callback(error);
    }
    else {
      callback(response.statusCode);
    }
  });
}

exports.GetItemsPrice = function GetItemsPrice(items, callback) {
  async.map(items,
    GetItemPrice,
    function(err, results){
      // All tasks are done now
      callback(results);
    }
  );
}

// Example async parallel call
// items = ['P90 | Ash Wood (Field-Tested)', 'P90 | Ash Wood (Field-Tested)'];
// async.parallel([
//   function(callback) {
//     GetItemsPrice(items, function(itemsData) {
//       callback(null, itemsData);
//     });
//   },
//   function(callback) {
//     GetSteamUserInfo('76561198077592773', function(error, userData) {
//       callback(null, userData);
//     });
//   }
// ],
// function(error, results) {
//   console.log(results);
// });