import { useRef, useEffect } from 'react'
import { debounce } from 'lodash'
import reactGA from '../../../analytics'

export function useGA<P>(category: string, props: P, record: (keyof P)[]) {
  const eventRefs = useRef(
    record.reduce(
      (acc, key) => ({
        ...acc,
        [key]: debounce((prop: P[keyof P]) => {
          if (localStorage.getItem('allowCookies') !== 'true' || localStorage.getItem('allowCookies') !== null) return
          if (typeof prop === 'number') {
            reactGA.event({
              category,
              action: `Changed ${String(key)}`,
              value: prop,
            })
          } else if (typeof prop === 'object') {
            reactGA.event({
              category,
              action: `Changed ${String(key)} to ${prop}`,
              label: JSON.stringify(prop),
            })
          } else {
            reactGA.event({
              category,
              action: `Changed ${String(key)} to ${prop}`,
            })
          }
        }, 2000),
      }),
      {} as any,
    ),
  )

  useEffect(
    () => {
      record.forEach((key) => {
        eventRefs.current[key](props[key])
      })
    },
    // eslint-disable-next-line
    record.map((key) => props[key]),
  )
}
