var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

server.get('/api/test', (req, res, next) => {
  console.log("We are ok!"); 
  res.send('We are ok!');
  next();
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL);
// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector);

const dialog = new builder.IntentDialog({ 
    recognizers: [recognizer],
    recognizeOrder: builder.RecognizeOrder.parallel
});

bot.dialog('/', dialog);

dialog.matches("saludo", (session) => {
    session.sendTyping();
    session.send("😃 Hola %s!", session.message.user.name);
});

dialog.matches("None", (session) => {
    session.sendTyping();
    session.send("🤔 Creo que no entendí lo que me quieres decir...", session.message.user.name);
});



dialog.matches("mostrar-obras", (session) => {
    session.sendTyping();

    let cards = [];

    let warholUrl = "http://curame-bot.azurewebsites.net/events/centro-cultural-la-moneda-andy-warhol/main.png";

    let card = new builder.ThumbnailCard(session)
                    .title("Andy Warhol")
                    .subtitle("Litografía #1")
                    .text("Lorem ipsum bla blabla")
                    .images([
                        builder.CardImage.create(session, warholUrl)
                    ])
                    .tap(builder.CardAction.openUrl(session, "http://www.ccplm.cl/sitio/andy-warhol"));
    cards.push(card);

    let yokoUrl = "http://curame-bot.azurewebsites.net/events/corpartes-yoko-ono-dream/main.png";
    let card2 = new builder.ThumbnailCard(session)
                    .title("Yoko Ono")
                    .subtitle("Dream come true")
                    .images([
                        builder.CardImage.create(session, yokoUrl)
                    ])
                    .tap(builder.CardAction.openUrl(session, "http://www.corpartes.cl/evento/yoko-ono-dream-come-true/"));
    cards.push(card2);

    let message = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
    session.send(message);

});


