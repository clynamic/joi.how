import type { EventToken } from './types'

export const events = [
  { id: 'cum', name: 'Cum', description: 'Creates an end point to the game. Enable this to adjust ruin/cum/denial options.' },
  { id: 'edge', name: 'Edge Safety Net', description: "Slows down when intensity is almost at it's highest." },
  { id: 'doublePace', name: 'Double Pace', description: 'Paw at twice the current pace for a few seconds.' },
  { id: 'halfPace', name: 'Half Pace', description: 'Paw at half the current pace for a few seconds.' },
  { id: 'pause', name: 'Pause', description: 'Stop stroking for a little bit.' },
  { id: 'risingPace', name: 'Rising Pace', description: 'Start from your lowest and slowly pick up speed.' },
  { id: 'randomPace', name: 'Random Pace', description: 'Randomly select a new pace to jack off at.' },
  { id: 'randomGrip', name: 'Random Grip', description: 'Randomly select a new way for you to grip your cock.' },
  { id: 'cleanMess', name: 'Clean Up Mess', description: "Clean up any mess you've made along the way." },
] as EventToken[]
