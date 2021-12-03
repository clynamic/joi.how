import React from 'react'
import { connect } from 'react-redux'
import StrokeMeter from './StrokeMeter/StrokeMeter'
import { EStroke, PropsForConnectedComponent } from './types'
import { IState } from '../../store'
import { GameBoardActions } from './store'
import { MessageArea } from './MessageArea/MessageArea'
import { EmergencyStop } from './EmergencyStop/EmergencyStop'
import { Stats } from './Stats/Stats'
import { getNextEvent } from './events'
import { Porn } from './Porn/Porn'
import { playTone } from './sound'

import './GameBoard.css'
import { Hypno } from './Hypno/Hypno'
import { randomPace } from './events/event-definitions/pace/randomPace'
import { VibrationStyleMode } from '../settings/store'

interface IGameBoardProps extends PropsForConnectedComponent {
  state: IState
}

interface IGameBoardState {
  timers: number[]
}

export const GameBoard = connect(
  (state: IState) =>
    ({
      state: state,
    } as IGameBoardProps),
)(
  class extends React.Component<IGameBoardProps, IGameBoardState> {
    constructor(props: IGameBoardProps) {
      super(props)
      this.state = { timers: [] }
    }

    render() {
      return (
        <div className="GameBoard">
          <Stats />
          <StrokeMeter stroke={this.props.state.game.stroke} pace={this.props.state.game.pace} cumming={this.props.state.game.cumming} />
          <Hypno mode={this.props.state.settings.hypnoMode} />
          <MessageArea />
          <EmergencyStop />
          <Porn />
        </div>
      )
    }

    componentDidMount() {
      this.start()
      randomPace(undefined)(this.props.state, this.props.dispatch)
    }

    setNextStroke() {
      if (window.location.pathname !== '/play') return
      const strokeTimer = setTimeout(() => {
        this.props.dispatch(GameBoardActions.Pulse())
        if (this.props.state.game.stroke === EStroke.down) playTone(425)
        if (this.props.state.game.stroke === EStroke.up) {
          playTone(625)
          if (this.props.state.vibrator.vibrator && this.props.state.vibrator.mode === VibrationStyleMode.THUMP) {
            if (this.props.state.game.pace > 3.25) this.props.state.vibrator.vibrator.setVibration(this.props.state.game.intensity / 100)
            else
              this.props.state.vibrator.vibrator.thump(
                ((1 / this.props.state.game.pace) * 1000) / 2,
                Math.max(0.25, this.props.state.game.intensity / 100),
              )
          }
        }
        if (!this.props.state.game.gamePaused) this.setNextStroke()
        else this.setUnpauseTimer()
        this.setState({ timers: this.state.timers.filter(timer => timer !== strokeTimer) })
      }, (1 / this.props.state.game.pace) * 1000)

      this.setState({ timers: this.state.timers.concat([strokeTimer]) })
    }

    setNextEvent() {
      if (window.location.pathname !== '/play') return
      const eventTimer = setTimeout(() => {
        const next = getNextEvent(this.props.state)
        let nextReturn
        if (next) {
          nextReturn = next(this.props.state, this.props.dispatch)
        }
        if (nextReturn) {
          nextReturn.then(() => {
            if (!this.props.state.game.gamePaused) this.setNextEvent()
          })
        } else {
          if (!this.props.state.game.gamePaused) this.setNextEvent()
        }
        this.setState({ timers: this.state.timers.filter(timer => timer !== eventTimer) })
      }, 1000)

      this.setState({ timers: this.state.timers.concat([eventTimer]) })
    }

    setIntensityTick() {
      if (window.location.pathname !== '/play') return
      const intensityTimer = setTimeout(() => {
        this.props.dispatch(GameBoardActions.IncIntensity(1))
        if (!this.props.state.game.gamePaused) this.setIntensityTick()
        this.setState({ timers: this.state.timers.filter(timer => timer !== intensityTimer) })
      }, this.props.state.settings.duration)

      this.setState({ timers: this.state.timers.concat([intensityTimer]) })
    }

    start() {
      this.setNextStroke()
      this.setNextEvent()
      this.setIntensityTick()
    }

    setUnpauseTimer() {
      this.state.timers.forEach(timer => clearTimeout(timer))
      this.setState({
        timers: [
          setTimeout(() => {
            if (!this.props.state.game.gamePaused) this.start()
            else this.setUnpauseTimer()
          }, 1000),
        ],
      })
    }
  },
)
