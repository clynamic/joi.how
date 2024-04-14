import { useMemo, useRef, useState, type FunctionComponent } from 'react'
import { formatMessage } from '../../../helpers/parseString'
import { useSelector } from 'react-redux'
import { styled } from 'styled-components'
import { HypnoMode } from '../types'

import { type IState } from '../../../store'
import { useGameLoop } from '../store/hooks'
import './Hypno.css'

interface IHypnoProps {
  mode: HypnoMode
}

const HypnoTextDiv = styled.div<{ delay: number }>`
  ${({ delay }) => `
    animation-duration: ${delay}ms !important;
  `}
`

const HYPNO_PHRASES = new Map<HypnoMode, string[]>()
HYPNO_PHRASES.set(HypnoMode.JOI, [
  '$part',
  'stroke',
  'precum',
  'horny',
  'need',
  'instinct',
  "can't stop",
  'ooze',
  'leak',
  '$stroke',
  'hard',
  '$stroke',
  'jack off',
  'give in',
  'obey',
  'pre',
  'must',
  'masturbate',
  'goon',
  '$part',
  'everyday',
])
HYPNO_PHRASES.set(HypnoMode.Breeding, [
  'breed',
  'seed',
  'deep',
  'must',
  'instinct',
  'breed',
  'instinct',
  'fuck',
  'shoot',
  'ooze',
  'moan',
  'give in',
  'fill',
  'sperm',
  'breed',
  'sperm',
  'give in',
])
HYPNO_PHRASES.set(HypnoMode.Pet, [
  'good $player',
  'hump',
  'listen',
  'stare',
  'obey',
  '$stroke for master',
  '$stroke for master',
  'obey',
  'master',
  'owner',
  'obey',
  'give in',
  'obey master',
  'good $player',
  'good $player',
  'good $player',
  'animal',
  'only',
  'master',
  'give master',
  'not your $part',
  'not your $part',
  'not your $part',
  'not your cum',
  "master's $part",
  "master's $part",
  "master's $part",
  "master's cum",
])
HYPNO_PHRASES.set(HypnoMode.FemDomPet, [
  'good $player',
  'hump',
  'obey',
  'listen',
  'stare',
  'obey',
  '$stroke for mistress',
  '$stroke for mistress',
  'mistress',
  'owner',
  'obey',
  'give in',
  'obey mistress',
  'good $player',
  'good $player',
  'good $player',
  'animal',
  'only',
  'mistress',
  'give mistress',
  'not your $part',
  'not your $part',
  'not your $part',
  'not your cum',
  "mistress' $part",
  "mistress' $part",
  "mistress' $part",
  "mistress' cum",
])

export const Hypno: FunctionComponent<IHypnoProps> = (props) => {
  const [phrase, setPhrase] = useState((HYPNO_PHRASES.get(props.mode) ?? [''])[0])
  const [animating, setAnimating] = useState(false)
  const intensity = useSelector<IState, IState['game']['intensity']>((state) => state.game.intensity)
  const settings = useSelector<IState, IState['settings']>((state) => state.settings)
  const cycling = useRef(false)

  const delay = useMemo(() => {
    // intensity ranges between 0 and 100, lowest delay time is thus 100ms
    return 3000 - intensity * 29
  }, [intensity])

  useGameLoop(() => {
    if (cycling.current) {
      const phrases = HYPNO_PHRASES.get(props.mode)
      if (phrases != null) {
        let newPhrase = phrase
        while (newPhrase === phrase) {
          newPhrase = phrases[Math.ceil(Math.random() * (phrases.length - 1))]
        }
        setPhrase(newPhrase)
      }
    }
    cycling.current = !cycling.current
    setAnimating(!animating)
  }, delay / 2)

  return (
    <HypnoTextDiv delay={delay} className={animating ? 'Hypno--changed' : 'Hypno'}>
      {props.mode !== HypnoMode.Off ? <div className="Hypno__phrase">{formatMessage(phrase, settings)}</div> : null}
    </HypnoTextDiv>
  )
}
