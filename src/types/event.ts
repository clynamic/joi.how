import { PlayerBody } from './body';

export enum GameEvent {
  randomPace = 'randomPace',
  halfPace = 'halfPace',
  doublePace = 'doublePace',
  risingPace = 'risingPace',
  pause = 'pause',
  edge = 'edge',
  climax = 'climax',
  randomGrip = 'randomGrip',
  cleanUp = 'cleanUp',
}

export const GameEventLabels: Record<GameEvent, string> = {
  randomPace: 'Random Pace',
  halfPace: 'Half Pace',
  doublePace: 'Double Pace',
  risingPace: 'Rising Pace',
  pause: 'Pause',
  edge: 'Edge Safety Net',
  climax: 'Climax',
  randomGrip: 'Random Grip',
  cleanUp: 'Clean Up Mess',
};

export const GameEventDescriptions: Record<GameEvent, string> = {
  randomPace: 'Randomly select a new pace',
  halfPace: 'Paw at half the current pace for a few seconds',
  doublePace: 'Paw at twice the current pace for a few seconds',
  risingPace: 'Start from your lowest and slowly pick up speed',
  pause: 'Stop stroking for a little bit',
  edge: "Slows down when intensity is almost at it's highest",
  climax: 'Creates an end point to the game',
  randomGrip: 'Randomly select new hands to play with',
  cleanUp: "Clean up any mess you've made along the way",
};

export const CleanUpDescriptions: Record<PlayerBody, string> = {
  penis: "pre you've leaked",
  vagina: "juices you've made",
  neuter: "mess you've made",
};
