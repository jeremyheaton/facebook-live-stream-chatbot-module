import {debug} from 'console';
import EventSource from 'eventsource';
import {EventSourceAdapter, EventSourceFactoryParams} from './EventSourceAdapter';
import {FaceBookChatBot} from './FaceBookChatBot';
import {FaceBookChatBotFactory} from './FaceBookChatBotFactory';

class FaceBookChatBotModule {

    commands : Map<string, FaceBookChatBot> = new Map<string, FaceBookChatBot>();
    eventSources : Map<string, EventSource> = new Map<string, EventSource>();
    chatBotFactoryMap : Map<string, FaceBookChatBotFactory> =
        new Map<string, FaceBookChatBotFactory>();
    eventSourceBotMap : Map<string, FaceBookChatBot[]> = new Map<string, FaceBookChatBot[]>();

    install(botFactory : FaceBookChatBotFactory) {
        this.chatBotFactoryMap.set(botFactory.name, botFactory);
    }

    registerBot(name: string, videoId: string, accessToken: string) {
        if (!this.eventSources.get(videoId)) {
            throw new Error("video not registered");
        }
        let bot = this.chatBotFactoryMap.get(name)?.createBot(videoId, accessToken);
        if (bot) {
            this.eventSourceBotMap.get(videoId)?.push(bot);
        }
        return this;
    }

    registerAllBots(videoId: string, accessToken: string) {
        this.chatBotFactoryMap.forEach(chatBotFactoryMap => 
            this.registerBot(chatBotFactoryMap.name, videoId, accessToken))
    }

    registerEventSource(eventSourceAdapter : EventSourceAdapter) {
        const eventSource: EventSource = eventSourceAdapter.getEventSource();
        const videoId: string = eventSourceAdapter.getVideoId();
        this.eventSources.set(videoId, eventSource);
        this.eventSourceBotMap.set(videoId, []);
        eventSource.onmessage = (event) => {
            debug(event);
            this.eventSourceBotMap.get(videoId)?.forEach(bot => {
                bot.processCommand(event.data.message.exec("^(![^\s]+)"), event);
            })
        };

        eventSource.onerror = (event : Event) => {
            debug(event);
            eventSource.close();
            this.eventSources.delete(videoId);
            this.eventSourceBotMap.delete(videoId);
        };
    }
}

export {
    FaceBookChatBot,
    FaceBookChatBotModule,
    EventSourceAdapter,
    EventSourceFactoryParams
};
