//helper methods for the API

var pointUser = /(<@)\S+(>)/;
var userPlusPlus =  /(<@)\S+(>)\s(\+\+)/;
var userMinusMinus = /(<@)\S+(>)\s(\-\-)/;
var thingPlusPlus =  /(@)\S+\s(\+\+)/;
var thingMinusMinus = /(@)\S+\s(\-\-)/;
var plusbot = "UJ3KGKG4R";
var leaderboard = /<@UJ3KGKG4R>\sleaderboard/;
var leaderboardthing = /<@UJ3KGKG4R>\sleaderboard\sthings/;
var loserboard = /<@UJ3KGKG4R>\sloserboard/;
var loserboardthing = /<@UJ3KGKG4R>\sloserboard\sthings/;
var reset = /(<@UJ3KGKG4R>)\s(reset leaderboard)/;
var userScore = /(<@UJ3KGKG4R>)\s(<)\S+(>)/;
var userTag = /<@\S+>/g;


function getMessages(){

    fs.readFile("good.csv","utf8",function(err,data){
        if (err) throw err;
        good = parse(data);
        //console.log(good[0]);

    })

    fs.readFile("bad.csv","utf8",function(err,data){
        if (err) throw err;
        bad = parse(data);
        //console.log(bad[0]);

    })
}

function getPoints(){
    points = jsonfile.readFileSync(filename);
}

function savePoints(){
    jsonfile.writeFileSync(filename,points);
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

function sendMessage( karma , user ){
    if (karma === "good") {
        var msg = good[Math.floor(Math.random()*good.length)][0];
        colour = "#62cc1c";
    }
    else if (karma === "bad") {
        var msg = bad[Math.floor(Math.random()*bad.length)][0];
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
        url: webhook,
        method: "POST",
        json: true,
        body: {
            text: msg,
            link_names: 0,
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

function sendLeaderboard( list, type="U" ){
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
        url: webhook,
        method: "POST",
        json: true,
        body: {
            text: msg,
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

function sendReprimand(user){

    var msg = "Really, <@" + user + ">?";
    colour = "#ff2300";

    var options = {
        url: webhook,
        method: "POST",
        json: true,
        body: {
            text: msg,
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
