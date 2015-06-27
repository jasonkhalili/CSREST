require('dotenv').load(); //load environment variables from .env files


var express = require('express');
var router = express.Router();
var request = require('request');
var Steam = require('steam');
var SteamTradeOffers = require('steam-tradeoffers');

/// Steam bot account log on
var bot = new Steam.SteamClient();
var offers = new SteamTradeOffers();

var logOnOptions = {
  accountName: process.env.STEAM_USERNAME,
  password: process.env.STEAM_PASSWORD,
};

var authCode = '';

if (require('fs').existsSync('sentryfile')) {
  logOnOptions['shaSentryfile'] = require('fs').readFileSync('sentryfile');
} else if (authCode != '') {
  logOnOptions['authCode'] = authCode;
}

bot.logOn(logOnOptions);

bot.on('loggedOn', function() {
  console.log('logged in');
  bot.setPersonaState(Steam.EPersonaState.Online);
});

bot.on('sentry',function(sentryHash) {
  require('fs').writeFile('sentryfile',sentryHash,function(err) {
    if(err){
      console.log(err);
    }
    else {
      console.log('Saved sentry file hash as "sentryfile"');
    }
  });
});

bot.on('chatInvite', function(chatRoomID, chatRoomName, patronID) {
  console.log('Got an invite to ' + chatRoomName + ' from ' + bot.users[patronID].playerName);
  bot.joinChat(chatRoomID); // autojoin on invite
});

bot.on('message', function(source, message, type, chatter) {
  // respond to both chat room and private messages
  console.log('Received message: ' + message);
  bot.sendMessage(source, 'Autoresponse from Bot', Steam.EChatEntryType.ChatMsg); // ChatMsg by default
});

bot.on('webSessionID', function(sessionID) {
  bot.webLogOn(function(newCookie) {
    offers.setup( {
      sessionID: sessionID,
      webCookie: newCookie
    }, function(err) {
      if(err) {
        throw err;
      }
    });
  });
});

bot.on('tradeOffers', function(number) {
  if(number > 0) {
    offers.getOffers({
      get_received_offers: 1,
      active_only:1,
      time_historical_cutoff: Math.round(Date.now() / 1000)
    }, function(error, body) {
      if(body.response.trade_offers_received) {
        body.response.trade_offers_received.forEach(function(offer) {
          if(offer.trade_offer_state == 2) {
            console.log(offer);
            console.log('Received trade offer: ' + offer.tradeofferid);
            if(!offer.items_to_give) {
              offers.acceptOffer({tradeOfferId: offer.tradeofferid});
              console.log('Offer Accepted');
              bot.sendMessage(offer.steamid_other, 'Thanks for the deposit');
            }
            else {
              offers.declineOffer({tradeOfferId: offer.tradeofferid});
              console.log('Offer declined');
              bot.sendMessage(offer.steamid_other, 'Gifts only');
            }
          }
        });
      }
    });
  }
});

/* POST user deposits items */
router.post('/:steam_id', function(req, res) {

  var id = req.params.steam_id;
  var items = req.body.items;

  offers.makeOffer({
    partnerSteamId: id,
    itemsFromMe: items,
    itemsFromThem: [],
    message: 'test trade offer'
  }, function(err, response) {
    if(err) {
      throw err;
    }
    console.log(response);
    return res.json(response);
  });
});



module.exports = router;