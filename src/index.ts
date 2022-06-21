import EventSource from "eventsource";

const defaultFields: string = "from,message,attachment,message_tags,created_time"
const defaultRate: string = "ten_per_second"

export class FaceBookChatBotModule {
    chatBot:FaceBookChatBot[] = [];
    commands:Map<string, FaceBookChatBot> = new Map<string, FaceBookChatBot>();
    eventSources:Map<string, EventSource> = new Map<string, EventSource>();

    install(bot: FaceBookChatBot) {
      if (this.commands.has(bot.command)) {
          throw "command has already be installed";
      }
      this.chatBot.push(bot);
      this.commands.set(bot.command, bot);
    }

    private register(eventSourceAdapter: EventSourceAdapter, commandList: string[]) {
        let eventSource: EventSource = eventSourceAdapter.getEventSource();
        let videoId: string = eventSourceAdapter.getVideoId();
        let filteredCommands = commandList.filter(command => this.commands.has(command));
        this.eventSources.set(videoId, eventSource)
        
        eventSource.onmessage = (event) => {
            filteredCommands.some(command => this.commands.get(command)?.chatBot(event))
        };

        eventSource.onerror = (event: Event) => {
            console.log(event);
            eventSource.close();
            this.eventSources.delete(videoId);
        }
    }
    
    private registerAll(eventSourceAdapter: EventSourceAdapter) {
        this.register(eventSourceAdapter, Array.from(this.commands.keys()));
    }
}

export class FaceBookChatBot {
    command: string;
    chatBot:  (event: MessageEvent) => void;
    constructor(command: string, chatBot: (a: MessageEvent) => boolean) {
        this.command = command;
        this.chatBot = chatBot;
    }
}

export interface eventSourceFactoryParams {
    videoId: string,
    accessToken: string,
    fields: string,
    rate: string, 
}

export class EventSourceAdapter {

    eventSource:EventSource;
    videoId:string;
    constructor({
        videoId,
        accessToken,
        fields = defaultFields,
        rate = defaultRate, 
    }: eventSourceFactoryParams) {
        this.videoId = videoId;
        this.eventSource = new EventSource("https://streaming-graph.facebook.com/"+ videoId +"/live_comments?access_token="+ accessToken +"&comment_rate="+ rate+"&fields=" + fields);
    }

    getEventSource() : EventSource {
        return this.eventSource;
    }

    getVideoId() : string {
        return this.videoId;
    }
}
