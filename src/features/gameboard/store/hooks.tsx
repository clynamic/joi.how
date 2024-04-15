import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { IState } from '../../../store'
import { gameBoardSlice } from './reducer'

export const useGameLoop = (callback: () => void | Promise<void>, ms: (() => number) | number, pause?: (paused: boolean) => boolean) => {
  const dispatch = useDispatch()
  const state = useSelector<IState, IState>((state) => state)
  const gamePaused = useSelector<IState, IState['game']['gamePaused']>((state) => state.game.gamePaused)
  const isPaused = useMemo(() => pause?.(gamePaused) ?? gamePaused, [gamePaused, pause])

  const stateRef = useRef(state)
  const callbackRef = useRef(callback)
  const msRef = useRef(ms)
  const pauseRef = useRef(pause)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    callbackRef.current = callback
    msRef.current = ms
    pauseRef.current = pause
  }, [callback, ms, pause])

  const gameloop = useCallback(() => {
    const timer = setTimeout(
      async () => {
        const isPaused = pauseRef.current?.(stateRef.current.game.gamePaused) ?? stateRef.current.game.gamePaused
        if (!isPaused) {
          await callbackRef.current()
        }
        dispatch(gameBoardSlice.actions.RemoveTimer(timer))
        if (!isPaused) {
          gameloop()
        }
      },
      typeof msRef.current == 'function' ? msRef.current() : msRef.current,
    )
    dispatch(gameBoardSlice.actions.AddTimer(timer))
    return timer
  }, [dispatch])

  useEffect(() => {
    if (!isPaused) {
      const timer = gameloop()

      return () => {
        dispatch(gameBoardSlice.actions.RemoveTimer(timer))
      }
    }
  }, [dispatch, gameloop, isPaused])
}
