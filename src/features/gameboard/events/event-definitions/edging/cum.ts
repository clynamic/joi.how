import { MessageType } from '../../../MessageArea/MessageTypes'
import { playTone } from '../../../sound'
import { GameBoardActions } from '../../../store/reducer'

import { EGrip, PlayerParts, type GameEvent } from '../../../types'
import { wait } from '../../helpers'

export const cum: GameEvent = () => {
  return (state, dispatch) => {
    const hasCock = state.settings.player.parts === PlayerParts.Cock
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.Prompt,
        text: 'Are you edging?',
        buttons: [
          {
            display: "I'm edging $master",
            method: async () => {
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.NewEvent,
                  text: `Stay on the edge, $player.`,
                }),
              )
              dispatch(GameBoardActions.SetPace(state.settings.pace.min))
              await wait(3000)
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.EventDescription,
                  text: `3...`,
                }),
              )
              await wait(5000)
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.EventDescription,
                  text: `2...`,
                }),
              )
              await wait(5000)
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.EventDescription,
                  text: `1...`,
                }),
              )
              await wait(5000)

              /** Ejaculating */
              if (Math.random() * 100 < state.settings.cum.ejaculateLikelihood) {
                if (Math.random() * 100 < state.settings.cum.ruinLikelihood) {
                  /** Ruining */
                  dispatch(GameBoardActions.SetGrip(EGrip.none))
                  dispatch(GameBoardActions.PauseGame())
                  dispatch(
                    GameBoardActions.ShowMessage({
                      type: MessageType.NewEvent,
                      text: `$HANDS OFF! Ruin your orgasm.`,
                    }),
                  )
                  await wait(3000)
                  dispatch(
                    GameBoardActions.ShowMessage({
                      type: MessageType.EventDescription,
                      text: `Clench ${hasCock ? 'and dripple out your load ' : ''}in desperation.`,
                    }),
                  )
                } else {
                  /** Orgasming */
                  dispatch(GameBoardActions.PauseGame())
                  dispatch(
                    GameBoardActions.ShowMessage({
                      type: MessageType.NewEvent,
                      text: `Cum!`,
                    }),
                  )
                }
                dispatch(GameBoardActions.Cum())
                let cumSounds = 0
                const clearCumSound = setInterval(() => {
                  playTone(225 - cumSounds * 6)
                  if (cumSounds > 15) clearInterval(clearCumSound)
                  else cumSounds++
                }, 400)
              } else {
                /** No Ejaculation */
                dispatch(GameBoardActions.SetGrip(EGrip.none))
                dispatch(GameBoardActions.PauseGame())
                dispatch(GameBoardActions.PauseEvents())
                dispatch(
                  GameBoardActions.ShowMessage({
                    type: MessageType.NewEvent,
                    text: `$HANDS OFF! Do not cum.`,
                  }),
                )
                await wait(5000)
                dispatch(
                  GameBoardActions.ShowMessage({
                    type: MessageType.EventDescription,
                    text: `Good $player. Let yourself ${hasCock ? 'go soft.' : 'cool off.'}`,
                  }),
                )
                await wait(5000)
                dispatch(
                  GameBoardActions.ShowMessage({
                    type: MessageType.EventDescription,
                    text: `Leave now.`,
                  }),
                )
              }
            },
          },
          {
            display: "I can't",
            method: async () => {
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.NewEvent,
                  text: `You're pathetic. Stop for a moment.`,
                }),
              )
              dispatch(GameBoardActions.PauseGame())
              dispatch(GameBoardActions.DecIntensity(100))
              await wait(20000)
              dispatch(
                GameBoardActions.ShowMessage({
                  type: MessageType.NewEvent,
                  text: `Start ${hasCock ? 'stroking again.' : 'pawing again.'}`,
                }),
              )
              dispatch(GameBoardActions.SetPace(state.settings.pace.min))
              dispatch(GameBoardActions.ResumeGame())
              await wait(15000)
            },
          },
        ],
      }),
    )
  }
}
