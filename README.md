# plusplus
Slack Bot to keep track of scores. Inspired by an app on Slack app directory
#### Requirements:
* Node.js
* npm (Node Package Manager)
* Slack API Access:
  * OAuth & Permissions > Scopes:
    * channels:history
    * chat:write:bot
    * channels:read
  * Event Subscriptions:
    * Enter your IP/Domain with ":10001/plusplus" on the end. E.g. http://example.com:10001/plusplus. Make sure to open this port on your firewall and forward it to your server via the router.
    * Workspace Events > message.channels
    * Bot Events > message.channels
  * Bot Users:
    * Create a bot user

#### Set-up:
1. git clone https://github.com/nelzon1/plusplus.git plusplus
2. cd plusplus
3. npm install
4. copy ini_sample.json ini.json
5. copy database/scores_template.db database/scores.db
6. get bot user id:
  1. run server with **node index.js**
  2. in your slack channel, type "@plusplus ++" (or whatver your called the bot user)
  3. watch the command window where the server is running. You should see a message come in like the following:
  ```
  Example app listening at http://:::10001
{ client_msg_id: '31504842-c064-47ca-b5be-cf734c803abf',
  type: 'message',
  text: '<@UJ3KGKG4R> ++',
  user: 'UHY7CL691',
  ts: '1556775961.008600',
  channel: 'CJBPZDXV5',
  event_ts: '1556775961.008600',
  channel_type: 'channel' }
  ```
  4. take the user code from the text field, **UJ3KGKG4R** in this case. **NOT THE USER FIELD**
7. enter this into the _botuser_ field in the file **ini.json** and save
8. open index.js and edit the regex entries for the leaderboards to use the correct user for the bot or the leaderboard commands will not work



