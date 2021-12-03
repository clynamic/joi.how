import { GameEvent } from '../../../types'
import { GameBoardActions } from '../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { randomPace } from './randomPace'
import { wait } from '../../helpers'

export const doublePace: GameEvent = () => {
  return async (state, dispatch) => {
    const newPace = Math.min(state.game.pace * 2, state.settings.pace.max)
    dispatch(GameBoardActions.SetVibration(newPace / state.settings.pace.max))
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Double pace!`,
      }),
    )
    dispatch(GameBoardActions.SetPace(newPace))

    await wait(3000)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.EventDescription,
        text: `3...`,
      }),
    )

    await wait(3000)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.EventDescription,
        text: `2...`,
      }),
    )

    await wait(3000)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.EventDescription,
        text: `1...`,
      }),
    )

    await wait(3000)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Done! Back to normal pace`,
      }),
    )
    randomPace(MessageType.EventDescription)(state, dispatch) // This event resumes afterwards
  }
}
