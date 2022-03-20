import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { HypnoMode } from '../types'
import { formatMessage } from '../../../helpers/parseString'
import styled from 'styled-components'

import './Hypno.css'
import { IState } from '../../../store'

interface IHypnoProps {
  mode: HypnoMode
}

const HypnoTextDiv = styled.div`
  ${(props: { delay: number }) => `
    animation-duration: ${props.delay}ms !important;
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

export function Hypno(props: IHypnoProps) {
  const [phrase, setPhrase] = useState((HYPNO_PHRASES.get(props.mode) || [''])[0])
  const [animating, setAnimating] = useState(false)
  const intensity = useSelector<IState, IState['game']['intensity']>(state => state.game.intensity)
  const settings = useSelector<IState, IState['settings']>(state => state.settings)

  const delay = useMemo(() => {
    // intensity ranges between 0 and 100, lowest delay time is thus 10ms
    return 3000 - intensity * 29
  }, [intensity])

  useEffect(() => {
    const phraseTimer = setTimeout(() => {
      const phrases = HYPNO_PHRASES.get(props.mode)
      if (phrases) {
        let newPhrase = phrase
        while (newPhrase === phrase) {
          newPhrase = phrases[Math.ceil(Math.random() * (phrases.length - 1))]
        }
        setPhrase(newPhrase)
        setAnimating(true)
      }
    }, delay)

    const animationTimer = setTimeout(() => {
      setAnimating(false)
    }, delay / 2)

    return () => {
      clearTimeout(phraseTimer)
      clearTimeout(animationTimer)
    }
  }, [phrase, props.mode, delay])

  return (
    <HypnoTextDiv delay={delay} className={animating ? 'Hypno--changed' : 'Hypno'}>
      {props.mode !== HypnoMode.Off ? <div className="Hypno__phrase">{formatMessage(phrase, settings)}</div> : null}
    </HypnoTextDiv>
  )
}
