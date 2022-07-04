# fb-live-stream-chatbot-module

> Library that contains an extensible implementation for facebook gaming chatbots as well as a module to mangage them across several videos and pages.

[![NPM](https://img.shields.io/npm/v/fb-live-stream-chatbot-module.svg)](https://www.npmjs.com/package/fb-live-stream-chatbot-module) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save fb-live-stream-chatbot-module
```
## Goal

The goal of this library is to provide a simple interface for building facebook gaming chatbots and a straightforward way to use them.

## Directions for creating and using chatbots

### Creating a bot

There are two ways to create a bot. 

1. Create a factory class that extends the `FacebookChatBotFactory` and a class that extends the `FaceBookChatBot` class. 

If you're extending the `FaceBookChatBot` then you may be required to set your `commandMap` manually if you require any internal scoping.

```typescript
export class BlackJackBotFactory extends FaceBookChatBotFactory {
    createBot(videoId: string, accessToken: string) {
      return new BlackJackBot(super.name, videoId, accessToken);
    }
  }

export class BlackJackBot extends FaceBookChatBot {
  bjGames = new Map();
  constructor(name: string, videoId: string, accessToken: string) {
    super(name, videoId, accessToken);
    this.commandMap.set('!blackjack', {
      chatBot: (event: MessageEvent) => this.startGameCommand(event),
    });
    this.commandMap.set('!stand', {
      chatBot: (event: MessageEvent) => this.standCommand(event),
    });
    this.commandMap.set('!hit', {
      chatBot: (event: MessageEvent) => this.hitCommand(event),
    });
  }
  //... Method implementations, etc

}
```

2. The second way to create a bot is to use the default `FaceBookChatBotFactory` and `FaceBookChatBot` implementations. While they don't allowing any internal scoping, you can pass in a `Map<string,ChatBotCommand>` that will act as the command handlers. 

```typescript
const commandMap = new Map<string, ChatBotCommand>();
commandMap.set('!testCommand1', {
    chatBot: (event: MessageEvent) => console.log("execute command1")
});
commandMap.set('!testCommand2', {
    chatBot: (event: MessageEvent) => console.log("execute command2")
});
const newFactory = new FaceBookChatFactory('testBot', commandMap);
```

### Using the chat bot module

The module currently supports multiple event sources so internally maps `EventSource` instances to chatbots.

```typescript
// initial the module, this module will handle all event sources, factories, and bots
const fbModule = new FaceBookChatBotModule();
// create the factory that we will register to the module
const chatBotFactory = new BlackJackBotFactory("blackJack");
// create and register the EvenSource for the video. A Page access token is required
// see here for details https://developers.facebook.com/docs/pages/access-tokens/
fbModule.registerEventSource(
    new EventSourceAdapter({videoId:"videoId", accessToken:"accessToken"}));
// Installs the BlackJackBotFactory we create earlier
fbModule.install(chatBotFactory);
// register the bot. Internally this calls the factory class to create the bot and link it with the event source
fbModule.registerBot("blackJack", "videoId", "accessToken");
```

Afer the setup the module will listen for events from the provided videoId and process commands from any messages it receives. When an `EventSource` is closed the module will clean up the `EventSource` and any chatbots current associated with it. 

In the future there will also be an implementation that allows the module to control the chat bots at a page level vs a video level. This will allow for long living bots, but the implementer will have to manage the videoIds themselves as new live streams are created. 

Also in the future, there will be the ability to have single instance chatbots accessible across multiple `EventSource` instances since not all chatbots will require a video/page level state.

## Supporting 3rd party Chat Bots

As the chat bots grow, this list aims to serve as a central place for reference. This will hopefully allow contributers to create their own chatbot implementations that other users of this library will be able to leverage. 

### Current chat bots
- `BlackJackChatBot`

MIT © [jeremyheaton](https://github.com/jeremyheaton)