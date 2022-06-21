import { debug } from 'console';
import EventSource from 'eventsource';
import { EventSourceAdapter } from './EventSourceAdapter';
import { FaceBookChatBot } from './FaceBookChatBot';

export class FaceBookChatBotModule {
  chatBot: FaceBookChatBot[] = [];
  commands: Map<string, FaceBookChatBot> = new Map<string, FaceBookChatBot>();
  eventSources: Map<string, EventSource> = new Map<string, EventSource>();

  install(bot: FaceBookChatBot) {
    if (this.commands.has(bot.command)) {
      throw Error('command has already be installed');
    }
    this.chatBot.push(bot);
    this.commands.set(bot.command, bot);
  }

  register(eventSourceAdapter: EventSourceAdapter, commandList: string[]) {
    const eventSource: EventSource = eventSourceAdapter.getEventSource();
    const videoId: string = eventSourceAdapter.getVideoId();
    const filteredCommands = commandList.filter((command) => this.commands.has(command));
    this.eventSources.set(videoId, eventSource);

    eventSource.onmessage = (event) => {
      filteredCommands.some((command) => this.commands.get(command)?.chatBot(event));
    };

    eventSource.onerror = (event: Event) => {
      debug(event);
      eventSource.close();
      this.eventSources.delete(videoId);
    };
  }

  registerAll(eventSourceAdapter: EventSourceAdapter) {
    this.register(eventSourceAdapter, Array.from(this.commands.keys()));
  }
}
