//Dependencies
const axios = require('axios');
const cheerio = require('cheerio');
const restify = require('restify');
const builder = require('botbuilder');
const fs = require('fs')

//Web Scraping
let promises = [];

for (let page = 1; page <= 1; page++) {
  const urlTemplate= `https://www.govtrack.us/congress/bills/browse?sort=-proscore&congress=115&page=${page}&faceting=false&allow_redirect=false&do_search=1`;
  promises.push(axios.get(urlTemplate));
}

let dataset = [];
let dataSetMap = {};

Promise.all(promises).then(resolvedPromises => {
  for (let resolvedPromise of resolvedPromises) {
    dataset = [...dataset, ...resolvedPromise.data.results.map(s =>
      s.replace(/[\n]/g, "").replace(/[\t]/g, "").trim()
    )];
  }
    
  for (let item of dataset) {
    fs.appendFile('log.txt', `${item}\n`, err => console.log(err));
  }
});

var billObjects = [];
    
fs.readFile('log.txt', 'utf8', function (err,data) {
    if (err) {return console.log(err);}
    
    const bills = fs.readFileSync("log.txt").toString().split('\n');
        
    for(bill in bills){
        
        const $ = cheerio.load(bills[bill]);
        const info = $('table').text().toString().split('</td>');

        const billObject = {
            
            name: $('a').text(),
            dateIntroduced: info[0],
            dateReported: info[1],
            prognosis: info[2],
            link: 'https://www.govtrack.us/'+$('a').attr('href')
            
            
        }
                
        billObjects[bill] = billObject;        
        
    }
    
    
});

var rng1 = Math.floor(Math.random() * billObjects.length);
var rng2 = Math.floor(Math.random() * billObjects.length);
var rng3 = Math.floor(Math.random() * billObjects.length);



var LUIS_MODEL_URL = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/ac331e24-9065-4a75-83ea-757e133e0d1e?subscription-key=2de61e8069d141dfb21bead8f2d26dbe&timezoneOffset=0";

// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});


// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: "52e1dff2-51a8-4a34-a3d4-ecb6d3678228",
    appPassword: "7Whs23TDoxmgs3A4AVPQ6k5"
});

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

//Recognizer

var recognizer = new builder.LuisRecognizer(LUIS_MODEL_URL);
bot.recognizer(recognizer);
bot.dialog('Greetings', function (session) {
    session.endDialog('Nice to meet you! Would you like to learn about some bills?');
}).triggerAction({
    matches: 'Greetings'
});

bot.dialog('getOverview', function (session) {
    session.endDialog('Sure! here\'s a bill you might be interested in:'            
        + '\n name: ' + billObjects[rng1].name
        + '\n Date Introduced: ' + billObjects[rng1].dateIntroduced 
        + '\n Date Reported: ' + billObjects[rng1].dateReported 
        + '\n If you want to read more, visit ' + billObjects[rng1].link
    );
    
}).triggerAction({
    matches: 'getOverview'
});
    