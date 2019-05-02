//express API to listen, store scores and respond to messages
/*
Created by Jake Nelson
*/
// dependencies
const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const request = require("request");
const jsonfile = require("jsonfile");
const bodyParser = require("body-parser");
const fs = require("fs");

//initialize express and add middleware for body-parser
var app = express();
app.use(bodyParser());

// initialize global variables
var points = {};
var good;
var bad;
const credentials = jsonfile.readFileSync('ini.json');
const INITIALIZATION_TIMEOUT = 5000; //ms

// regex used to parse the slack messages
const pointUser = /(<@)\S+(>)/;
const userPlusPlus =  /(<@)\S+(>)\s(\+\+)/;
const userMinusMinus = /(<@)\S+(>)\s(\-\-)/;
const thingPlusPlus =  /(@)\S+\s(\+\+)/;
const thingMinusMinus = /(@)\S+\s(\-\-)/;
const plusbot = credentials.botuser;
const leaderboard = /<@UC2CYDAE8>\sleaderboard/;
const leaderboardthing = /<@UC2CYDAE8>\sleaderboard\sthings/;
const loserboard = /<@UC2CYDAE8>\sloserboard/;
const loserboardthing = /<@UC2CYDAE8>\sloserboard\sthings/;
const reset = /(<@UC2CYDAE8>)\s(reset leaderboard)/;
const userScore = /(<@UC2CYDAE8>)\s(<)\S+(>)/;
const userTag = /<@\S+>/g;



function initialize(callback){
    let db = new sqlite3.Database('./database/' + credentials.dbfile);
 
    // get good quotes from database
    let sql = 'SELECT quote, author FROM goodquotes';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }

        good = rows;

        // get bad quotes from database
        sql = 'SELECT quote FROM badquotes';

        db.all(sql, [], (err, rows2) => {
            if (err) {
                throw err;
            }
            bad = rows2;          

            // get points from database and store in memory
            sql = 'SELECT user, score, type FROM scores';
            db.all(sql, [], (err, rows3) => {
                if (err) {
                    throw err;
                }
                scores = {};
                rows3.forEach(function(row){
                    points[row.user] = {"score":row.score, "type":row.type};
                });
                callback(err);
            });
        });
    
    });
    db.close();
}

initialize(function(err){
    if (err) {
        throw err;
    }
});


/*
function getPoints(){


    points = jsonfile.readFileSync(filename);
}
*/


function savePoints(){
    let db = new sqlite3.Database('./database/' + credentials.dbfile);

    let sql = 'update scores set score = ? where user = ?;';

    Object.keys(points).forEach(function(key,index){

        db.run(sql, [points[key].score, key], function(err){
            if (err){
                throw err;
            }
            else if (this.changes === 0) {
                //user doesnt exist, add it
                sql_insert = 'insert into scores values (?,?,?,?);'
                db.run(sql_insert,[key,points[key].type, points[key].score, ''],function(err){
                    if (err){
                        throw err;
                    }
                    console.log('inserted new user/thing: ' + key);
                })
            }
        })
    });
    console.log('database saved successfully');
    db.close();

}


function checkPoints(user){
    if (points.hasOwnProperty(user)){
        return points[user].score;
    }
    else {
        //points[user] = {"score":0,"type":"U"};
        return 0;
    }
}

function addRecord(user,type="U"){
    if (points.hasOwnProperty(user)){
        return false;
    }
    else {
        points[user] = {"score": 0, "type": type};
        return true;
    }
}

function addPoint(user){
    points[user].score = checkPoints(user) + 1;
}

function removePoint(user){
    points[user].score = checkPoints(user) - 1;
}

function sendMessage( karma , user, channel, token=credentials.token, thread=null ){
    if (karma === "good") {
        let index = Math.floor(Math.random()*good.length);
        var msg = good[index].quote + " - " + good[index].author;
        colour = "#62cc1c";
    }
    else if (karma === "bad") {
        var msg = bad[Math.floor(Math.random()*bad.length)].quote;
        colour = "#ff2300";
    }
    else if (karma === "score") {
        var msg = "User score:";
        colour = "#f59800";
    }
    else if (karma === "leader") {
        var msg = getLeaderboard().toString();
        colour = "#0183f7";
    }

    var options = {
        url: 'https://slack.com/api/chat.postMessage',
        method: "POST",
        json: true,
        headers: {'Authorization': "Bearer " + token,
            'Content-Type': 'application/json'},
        body: {
            text: msg,
            link_names: 0,
            channel: channel,
            attachments: [{
                text: "<@" + user + "> now at " + checkPoints(user) + " points.",
                color: colour
            }]
        }
    };
    request(options,function(error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(" - Sent notification to Slack: " + message);
        }
        else console.log(" - Error communicating with Slack API");
    });
}

function sendLeaderboard( list, type="U", channel, token=credentials.token, thread=null ){
    let msg = "";
    if (type === "U") {
        msg += "Current leaderboard:\n ";
        let index = 0;
        list.forEach(function(user){
            index ++;
            msg += index + ". <@" + user[0] + "> at " + checkPoints(user[0]) + " points.\n"
        })
    }
    else if (type ==="T"){
        msg += "Current leaderboard:\n ";
        let index = 0;
        list.forEach(function(user){
            index ++;
            msg += index + ". @" + user[0] + " at " + checkPoints(user[0]) + " points.\n"
        })
    }

    var options = {
        url: 'https://slack.com/api/chat.postMessage',
        method: "POST",
        json: true,
        headers: {'Authorization': "Bearer " + token,
            'Content-Type': 'application/json'},
        body: {
            text: msg,
            channel: channel,
            link_names: 0
        }
    };
    request(options,function(error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(" - Sent notification to Slack: " + message);
        }
        else console.log(" - Error communicating with Slack API");
    });
}

function sendReprimand(user, channel, token=credentials.token, thread=null){

    var msg = "Really, <@" + user + ">?";
    colour = "#ff2300";

    var options = {
        url: 'https://slack.com/api/chat.postMessage',
        method: "POST",
        json: true,
        headers: {'Authorization': "Bearer " + token,
            'Content-Type': 'application/json'},
        body: {
            text: msg,
            channel: channel,
            link_names: 0
        }
    };
    request(options,function(error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(" - Sent notification to Slack: " + message);
        }
        else console.log(" - Error communicating with Slack API");
    });
}

function getLeaderboard(type="U", karma="good"){
    var userlist = [];
    var thinglist = [];
    Object.keys(points).forEach(function(element,key){
        if (points[element].type === "U"){
            userlist.push([element,points[element].score]);
        }
        else if (points[element].type === "T"){
            thinglist.push([element,points[element].score]);
        }
    })


    userlist.sort(sortLeaders);
    thinglist.sort(sortLeaders);

    if (karma === "bad"){
        userlist.reverse();
        thinglist.reverse();
    }

    if (type === "U")   return userlist.slice(0,10);
    else if (type === "T")  return thinglist.slice(0,10);
    
}

function sortLeaders(a,b){
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] > b[1]) ? -1: 1;
    }
}


function test(){

    console.log(good[Math.floor(Math.random()*good.length)]);
}

setTimeout(function(){
    setInterval(savePoints,30000);
},INITIALIZATION_TIMEOUT);


app.post("/plusbot", function(req,res){ 
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
        res.sendStatus(200);
        if (payload.event.type === "message" && payload.event.subtype !== "bot_message")
        {
            //get user from message
            msgUser = payload.event.user;
            //get channel
            msgChannel = payload.event.channel;
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
                sendLeaderboard(getLeaderboard("T"),"T",msgChannel);
                //sendMessage("leader",ptUser);
            }


            //leaderboard
            else if ( leaderboard.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard(),"U",msgChannel);
                //sendMessage("leader",ptUser);
            }

            //loserboard things
            else if ( loserboardthing.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("T","bad"),"T",msgChannel);
                //sendMessage("leader",ptUser);
            }

            //loserboard
            else if ( loserboard.test(payload.event.text) ){
                //console.log(payload.event.text);
                sendLeaderboard(getLeaderboard("U","bad"),"U",msgChannel);
                //sendMessage("leader",ptUser);
            }



            //user score
            else if ( userScore.test(payload.event.text) ){
                userTag.exec(payload.event.text);
                ptUser = userTag.exec(payload.event.text)[0].slice(2,-1);
                sendMessage("score",ptUser,msgChannel);
            }


            //user plus plus
            else if ( userPlusPlus.test(payload.event.text) ){
                if (ptUser === msgUser) {
                    sendReprimand(msgUser,msgChannel);
                }
                else {
                    addRecord(ptUser,"U");
                    addPoint(ptUser);
                    sendMessage("good",ptUser,msgChannel);
                }
            }


            //user minus minus
            else if (userMinusMinus.test(payload.event.text) ){
                if (ptUser === msgUser) {
                    sendReprimand(msgUser,msgChannel);
                }
                else {
                    addRecord(ptUser,"U");
                    removePoint(ptUser);
                    sendMessage("bad",ptUser,msgChannel);
                }
            }

            //thing plus plus
            else if (thingPlusPlus.test(payload.event.text) ){
                let thing = thingPlusPlus.exec(payload.event.text)[0].slice(1,-3);
                addRecord(thing,"T");
                addPoint(thing);
                console.log(thing);
                sendMessage("good",thing,msgChannel);
            }

            //thing minus minus
            else if (thingMinusMinus.test(payload.event.text) ){
                let thing = thingMinusMinus.exec(payload.event.text)[0].slice(1,-3);
                addRecord(thing,"T");
                removePoint(thing);
                sendMessage("bad",thing,msgChannel);
            }
        }
        
        
    }

});


var server = app.listen(10001, function () {

    var host = server.address().address
    var port = server.address().port
 
    console.log("Example app listening at http://%s:%s", host, port)
 })
