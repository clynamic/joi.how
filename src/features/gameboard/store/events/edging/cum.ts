import { createAsyncThunk } from '@reduxjs/toolkit'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { playTone } from '../../../sound'

import { wait } from '../../../../../helpers/helpers'
import { EGrip, PlayerParts } from '../../../types'
import { gameBoardSlice } from '../../reducer'

export const Cum = createAsyncThunk('gameBoard/event-cum', async (_, { getState, dispatch }) => {
  const state = getState() as IState
  const hasCock = state.settings.player.parts === PlayerParts.Cock
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.Prompt,
      text: 'Are you edging?',
      buttons: [
        {
          display: "I'm edging $master",
          method: async () => {
            dispatch(
              gameBoardSlice.actions.ShowMessage({
                type: MessageType.NewEvent,
                text: `Stay on the edge, $player.`,
              }),
            )
            dispatch(gameBoardSlice.actions.SetPace(state.settings.pace.min))
            await wait(3000)
            dispatch(
              gameBoardSlice.actions.ShowMessage({
                type: MessageType.EventDescription,
                text: `3...`,
              }),
            )
            await wait(5000)
            dispatch(
              gameBoardSlice.actions.ShowMessage({
                type: MessageType.EventDescription,
                text: `2...`,
              }),
            )
            await wait(5000)
            dispatch(
              gameBoardSlice.actions.ShowMessage({
                type: MessageType.EventDescription,
                text: `1...`,
              }),
            )
            await wait(5000)

            /** Ejaculating */
            if (Math.random() * 100 < state.settings.cum.ejaculateLikelihood) {
              if (Math.random() * 100 < state.settings.cum.ruinLikelihood) {
                /** Ruining */
                dispatch(gameBoardSlice.actions.SetGrip(EGrip.none))
                dispatch(gameBoardSlice.actions.PauseGame())
                dispatch(
                  gameBoardSlice.actions.ShowMessage({
                    type: MessageType.NewEvent,
                    text: `$HANDS OFF! Ruin your orgasm.`,
                  }),
                )
                await wait(3000)
                dispatch(
                  gameBoardSlice.actions.ShowMessage({
                    type: MessageType.EventDescription,
                    text: `Clench ${hasCock ? 'and dripple out your load ' : ''}in desperation.`,
                  }),
                )
              } else {
                /** Orgasming */
                dispatch(gameBoardSlice.actions.PauseGame())
                dispatch(
                  gameBoardSlice.actions.ShowMessage({
                    type: MessageType.NewEvent,
                    text: `Cum!`,
                  }),
                )
              }
              dispatch(gameBoardSlice.actions.Cum())
              let cumSounds = 0
              const clearCumSound = setInterval(() => {
                playTone(225 - cumSounds * 6)
                if (cumSounds > 15) clearInterval(clearCumSound)
                else cumSounds++
              }, 400)
            } else {
              /** No Ejaculation */
              dispatch(gameBoardSlice.actions.SetGrip(EGrip.none))
              dispatch(gameBoardSlice.actions.PauseGame())
              dispatch(gameBoardSlice.actions.PauseEvents())
              dispatch(
                gameBoardSlice.actions.ShowMessage({
                  type: MessageType.NewEvent,
                  text: `$HANDS OFF! Do not cum.`,
                }),
              )
              await wait(5000)
              dispatch(
                gameBoardSlice.actions.ShowMessage({
                  type: MessageType.EventDescription,
                  text: `Good $player. Let yourself ${hasCock ? 'go soft.' : 'cool off.'}`,
                }),
              )
              await wait(5000)
              dispatch(
                gameBoardSlice.actions.ShowMessage({
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
              gameBoardSlice.actions.ShowMessage({
                type: MessageType.NewEvent,
                text: `You're pathetic. Stop for a moment.`,
              }),
            )
            dispatch(gameBoardSlice.actions.PauseGame())
            dispatch(gameBoardSlice.actions.DecIntensity(100))
            await wait(20000)
            dispatch(
              gameBoardSlice.actions.ShowMessage({
                type: MessageType.NewEvent,
                text: `Start ${hasCock ? 'stroking again.' : 'pawing again.'}`,
              }),
            )
            dispatch(gameBoardSlice.actions.SetPace(state.settings.pace.min))
            dispatch(gameBoardSlice.actions.ResumeGame())
            await wait(15000)
          },
        },
      ],
    }),
  )
})
