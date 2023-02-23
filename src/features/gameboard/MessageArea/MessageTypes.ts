export enum MessageType {
  NewEvent,
  EventDescription,
  Prompt,
}

interface NewEventMessage {
  type: MessageType.NewEvent
  text: string
}

interface EventDescriptionMessage {
  type: MessageType.EventDescription
  text: string
}

interface PromptMessage {
  type: MessageType.Prompt
  text: string
  buttons: Button[]
}

export interface Button {
  display: string
  method: () => void | Promise<void>
}

export type Message = NewEventMessage | EventDescriptionMessage | PromptMessage

export function isPrompt(message: Message): message is PromptMessage {
  return message.type === MessageType.Prompt
}

export function applyMessage(log: Message[], message: Message): Message[] {
  switch (message.type) {
    case MessageType.NewEvent:
    case MessageType.Prompt:
      return [message]
    case MessageType.EventDescription:
      return [...log.filter((loggedMessage) => loggedMessage.type !== MessageType.EventDescription), message]
  }
}
