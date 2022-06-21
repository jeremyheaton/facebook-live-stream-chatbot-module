import EventSource from 'eventsource';

const defaultFields: string = 'from,message,attachment,message_tags,created_time';
const defaultRate: string = 'ten_per_second';

export interface EventSourceFactoryParams {
  videoId: string;
  accessToken: string;
  fields: string;
  rate: string;
}

export class EventSourceAdapter {
  eventSource: EventSource;
  videoId: string;
  constructor({ videoId, accessToken, fields = defaultFields, rate = defaultRate }: EventSourceFactoryParams) {
    this.videoId = videoId;
    this.eventSource = new EventSource(
      'https://streaming-graph.facebook.com/' +
        videoId +
        '/live_comments?access_token=' +
        accessToken +
        '&comment_rate=' +
        rate +
        '&fields=' +
        fields,
    );
  }

  getEventSource(): EventSource {
    return this.eventSource;
  }

  getVideoId(): string {
    return this.videoId;
  }
}
