import { GameEvent } from '../../../types'
import { GameBoardActions } from '../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { round } from '../../../../../helpers/round'
import { intensityToPaceBounds } from '../../../../../helpers/intensity'
import { wait } from '../../helpers'

export const randomPace: GameEvent<[MessageType.EventDescription | MessageType.NewEvent | undefined]> = (
  messageType?: MessageType.EventDescription | MessageType.NewEvent,
) => {
  return async (state, dispatch) => {
    const bounds = intensityToPaceBounds(state.game.intensity, state.settings.steepness, state.settings.pace)
    const newPace = round(Math.random() * (bounds.max - bounds.min) + bounds.min)
    dispatch(
      (() => {
        if (messageType) {
          return GameBoardActions.ShowMessage({
            type: messageType,
            text: `Pace changed to ${newPace}!`,
          })
        } else {
          return GameBoardActions.ShowMessage({
            type: MessageType.NewEvent,
            text: `Pace changed to ${newPace}!`,
          })
        }
      })(),
    )
    dispatch(GameBoardActions.SetPace(newPace))
    dispatch(GameBoardActions.SetVibration(newPace / state.settings.pace.max))

    await wait(9000)
  }
}
