import React from 'react'
import { PornList, ArrayElement } from '../types'

import { IState } from '../../../store'

import './Porn.css'
import { PornControls } from './PornControls/PornControls'
import styled from 'styled-components'
import { Walltaker } from './Walltaker'
import { connect } from 'react-redux'
import { SettingsActions } from '../../settings/store'
import { PropsForConnectedComponent } from '../../../store.types'

interface IPornProps extends PropsForConnectedComponent {
  pornList: PornList
  walltakerLink: IState['settings']['walltakerLink']
  intensity: IState['game']['intensity']
}

interface IPornState {
  currentPornKey: number
  playing: number | null
}

const PornBackgroundDiv = styled.div`
  ${(props: { duration: number }) => `
    animation-duration: ${props.duration}ms !important;
  `}
`

export const Porn = connect(
  (state: IState) =>
    ({
      pornList: state.settings.pornList,
      walltakerLink: state.settings.walltakerLink,
      intensity: state.game.intensity,
    } as IPornProps),
)(
  class extends React.Component<IPornProps, IPornState> {
    constructor(props: IPornProps) {
      super(props)

      this.state = {
        currentPornKey: 0,
        playing: null,
      }
    }

    componentDidMount() {
      this.nextPorn()
    }

    render() {
      let duration
      if (this.state.playing === null) {
        duration = Math.max((100 - this.props.intensity) * 80, 800)
        this.setState({
          playing: duration,
        })
      } else {
        duration = this.state.playing
      }
      return (
        <div className="Porn__container">
          <Walltaker walltakerLink={this.props.walltakerLink} pornList={this.props.pornList} dispatch={this.props.dispatch} />
          {this.props.pornList.length > 0 ? (
            <>
              <div className="Porn">
                <div className="Porn__foreground" style={this.makePornStyle(this.props.pornList[this.state.currentPornKey])} />
                <PornBackgroundDiv
                  duration={duration}
                  className="Porn__background"
                  style={this.makePornStyle(this.props.pornList[this.state.currentPornKey])}
                ></PornBackgroundDiv>
              </div>
              <PornControls
                onSkip={() => this.skipPorn(this.state.currentPornKey)}
                onOpen={() => this.openSource(this.props.pornList[this.state.currentPornKey])}
              />
            </>
          ) : null}
        </div>
      )
    }

    openSource(porn: ArrayElement<PornList>) {
      const md5Match = /\w*(?=\.(jpg|gif|webm|png|swf|bmp))/.exec(porn)
      if (md5Match && md5Match[0]) {
        window.open(`https://e621.net/post/index/1/md5:${md5Match[0]}`)
      }
    }

    makePornStyle(porn: PornList[keyof PornList]) {
      return {
        backgroundImage: `url(${porn})`,
      }
    }

    skipPorn(pornToSkip: number) {
      this.props.dispatch(SettingsActions.SetPornList(this.props.pornList.filter((porn) => porn !== this.props.pornList[pornToSkip])))
      this.setState({
        currentPornKey: Math.floor(this.props.pornList.length * Math.random()),
      })
    }

    nextPorn() {
      setTimeout(() => {
        this.setState({
          playing: null,
        })
        this.setState({
          currentPornKey: Math.floor(this.props.pornList.length * Math.random()),
        })
        this.nextPorn()
      }, Math.max((100 - this.props.intensity) * 80, 400))
    }
  },
)
