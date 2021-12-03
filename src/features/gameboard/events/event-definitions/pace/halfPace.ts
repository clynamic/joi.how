import { GameEvent } from '../../../types'
import { GameBoardActions } from '../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { randomPace } from './randomPace'
import { wait } from '../../helpers'

export const halfPace: GameEvent = () => {
  return async (state, dispatch) => {
    const newPace = Math.max(state.game.pace / 2, state.settings.pace.min)
    const duration = Math.ceil(Math.random() * 20000) + 12000
    const durationPortion = duration / 3
    dispatch(GameBoardActions.SetVibration(newPace / state.settings.pace.max))
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Half pace!`,
      }),
    )
    dispatch(GameBoardActions.SetPace(newPace))
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.EventDescription,
        text: `3...`,
      }),
    )

    await wait(durationPortion)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.EventDescription,
        text: `2...`,
      }),
    )

    await wait(durationPortion)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.EventDescription,
        text: `1...`,
      }),
    )

    await wait(durationPortion)
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Done! Back to normal pace`,
      }),
    )
    randomPace(MessageType.EventDescription)(state, dispatch)
  }
}
