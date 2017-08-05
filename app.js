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



dialog.matches("mostrar-obras", (session, args) => {
    session.sendTyping();

    let cards = [];

    cards.push(buildCard(session,
                            "http://curame-bot.azurewebsites.net/events/centro-cultural-la-moneda-andy-warhol/main.png",
                            "http://www.ccplm.cl/sitio/andy-warhol",
                            "Andy Warhol",
                            "Litografía #1",
                            "Lorem ipsum bla bla bla"
                        ));

    cards.push(buildCard(session,
                            "http://curame-bot.azurewebsites.net/events/corpartes-yoko-ono-dream/main.png",
                            "http://www.corpartes.cl/evento/yoko-ono-dream-come-true/",
                            "Yoko Ono",
                            "Dream come true",
                            "Lorem ipsum bla bla bla"
                        ));


    let artistEntity = builder.EntityRecognizer.findEntity(args.entities, 'Artist');

    let message = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)

    if (artistEntity) {
        switch(artistEntity.entity.trim().toLowerCase()) {
            case "andy warhol": {
                message.addAttachment(cards[0]);
                session.send(message);
                break;
            }
            case "yoko ono": {
                message.addAttachment(cards[1]);
                session.send(message);
                break;
            }
            default: {
                session.send("No tengo información acerca de " + artistEntity.entity);
                break;
            }
        };
    }
    else {
        message.attachments(cards);
        session.send(message);
    } 

});

let buildCard = (session, imageUrl, pageUrl, title, subtitle, text) => {
    return new builder.ThumbnailCard(session)
                    .title(title)
                    .subtitle(subtitle)
                    .text(text)
                    .images([
                        builder.CardImage.create(session, imageUrl)
                    ])
                    .tap(builder.CardAction.openUrl(session, pageUrl));
};
