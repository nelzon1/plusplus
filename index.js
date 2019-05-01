//express API to listen, store scores and respond to messages
/*
Created by Jake Nelson
*/

var express = require("express");
var request = require("request");
var jsonfile = require("jsonfile");
var bodyParser = require("body-parser");
var fs = require("fs");

var app = express();
app.use(bodyParser());

app.post("/plusbot", function(req,res){
    res.sendStatus(200);
    let payload = req.body;
    //console.log(req);
    console.log(payload.event);
    if (payload.type==="url_verification")
    {
        let challenge = payload.challenge;
        console.log("Responding to challenge");
        console.log(payload);
        res.set("application/json").send({body: {"challenge": challenge} });
    }

    else if (payload.type==="event_callback"){

        if (payload.event.type === "message" && payload.event.subtype !== "bot_message")
        {
            //get user from message
            msgUser = payload.event.user;
            //get point user from message
            try {
                ptUser = pointUser.exec(payload.event.text)[0].slice(2,-1);
                console.log(ptUser);
            }
            catch(err){
                console.log("no user mention");
            }

             //leaderboard things
             if ( leaderboardthing.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("T"),"T");
                //sendMessage("leader",ptUser);
            }


            //leaderboard
            else if ( leaderboard.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard(),"U");
                //sendMessage("leader",ptUser);
            }

            //loserboard things
            else if ( loserboardthing.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("T","bad"),"T");
                //sendMessage("leader",ptUser);
            }

            //loserboard
            else if ( loserboard.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("U","bad"),"U");
                //sendMessage("leader",ptUser);
            }



            //user score
            else if ( userScore.test(payload.event.text) ){
                userTag.exec(payload.event.text);
                ptUser = userTag.exec(payload.event.text)[0].slice(2,-1);
                sendMessage("score",ptUser);
            }


            //user plus plus
            else if ( userPlusPlus.test(payload.event.text) ){
                if (ptUser === msgUser) {
                    sendReprimand(msgUser);
                }
                else {
                    addRecord(ptUser,"U");
                    addPoint(ptUser);
                    sendMessage("good",ptUser);
                }
            }


            //user minus minus
            else if (userMinusMinus.test(payload.event.text) ){
                if (ptUser === msgUser) {
                    sendReprimand(msgUser);
                }
                else {
                    addRecord(ptUser,"U");
                    removePoint(ptUser);
                    sendMessage("bad",ptUser);
                }
            }

            //thing plus plus
            else if (thingPlusPlus.test(payload.event.text) ){
                let thing = thingPlusPlus.exec(payload.event.text)[0].slice(1,-3);
                addRecord(thing,"T");
                addPoint(thing);
                console.log(thing);
                sendMessage("good",thing);
            }

            //thing minus minus
            else if (thingMinusMinus.test(payload.event.text) ){
                let thing = thingMinusMinus.exec(payload.event.text)[0].slice(1,-3);
                addRecord(thing,"T");
                removePoint(thing);
                sendMessage("bad",thing);
            }
        }
        
        
    }


});


var server = app.listen(10001, function () {

    var host = server.address().address
    var port = server.address().port
 
    console.log("Example app listening at http://%s:%s", host, port)
 })
