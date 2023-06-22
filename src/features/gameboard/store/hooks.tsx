import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { IState } from '../../../store'
import { gameBoardSlice } from './reducer'

export const useGameLoop = (callback: () => void | Promise<void>, ms: (() => number) | number) => {
  const dispatch = useDispatch()
  const state = useSelector<IState, IState>((state) => state)
  const gamePaused = useSelector<IState, IState['game']['gamePaused']>((state) => state.game.gamePaused)

  const stateRef = useRef(state)
  const callbackRef = useRef(callback)
  const msRef = useRef(ms)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    callbackRef.current = callback
    msRef.current = ms
  }, [callback, ms])

  const gameloop = useCallback(() => {
    const timer = setTimeout(
      async () => {
        if (!stateRef.current.game.gamePaused) {
          await callbackRef.current()
        }
        dispatch(gameBoardSlice.actions.RemoveTimer(timer))
        if (!stateRef.current.game.gamePaused) {
          gameloop()
        }
      },
      typeof msRef.current == 'function' ? msRef.current() : msRef.current,
    )
    dispatch(gameBoardSlice.actions.AddTimer(timer))
    return timer
  }, [dispatch])

  useEffect(() => {
    if (!gamePaused) {
      const timer = gameloop()

      return () => {
        dispatch(gameBoardSlice.actions.RemoveTimer(timer))
      }
    }
  }, [dispatch, gameloop, gamePaused])
}
