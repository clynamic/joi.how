import { PropsWithChildren } from 'react';
import { AnimatePresence, motion, HTMLMotionProps } from 'framer-motion';
import styled from 'styled-components';
import { WaInput, WaButton, WaIcon } from '@awesome.me/webawesome/dist/react';
import {
  SettingsLabel,
  Space,
  SettingsGrid,
  SettingsRow,
} from '../../../common';
import { GameHypnoType } from '../../../types';
import { defaultTransition } from '../../../utils';
import { useSetting, subsetting, HypnoTextEntry } from '../../SettingsProvider';

// ---------------------
// Fields as motion
interface FieldsProps
  extends PropsWithChildren<Omit<HTMLMotionProps<'fieldset'>, 'ref'>> {
  label?: React.ReactNode;
}

const StyledFields = styled(motion.fieldset)`
  display: flex;
  flex-direction: column;

  background: var(--section-background);
  color: #b9bad6;

  border: unset;
  border-left: 2px solid var(--legend-background);
  border-radius: unset;

  margin: var(--wa-space-m);
  padding: var(--wa-space-s);

  position: relative;
`;

const StyledFieldsLegend = styled.legend`
  width: fit-content;
  padding: 4px 8px;
  background: var(--legend-background);
  color: var(--legend-color);
  line-height: 100%;
  font-size: 1rem;
`;

const MotionFields: React.FC<FieldsProps> = ({
  label: legend,
  children,
  ...props
}) => {
  return (
    <StyledFields {...props}>
      {legend && <StyledFieldsLegend>{legend}</StyledFieldsLegend>}
      <SettingsGrid>{children}</SettingsGrid>
    </StyledFields>
  );
};

// ---------------------

const StyledSettingsDescription = styled.p`
  line-height: 1.1;
  max-width: 100%;
  text-wrap: wrap;
  grid-column: 1 / -1;
  margin: 10px 0px;
`;

const HypnoRow = styled.div`
  display: grid;
  grid-template-columns: auto auto auto auto;
  gap: 8px;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  background: var(--card-background);
`;

const Unit = styled.div`
  position: relative;
  pointer-events: none;
  user-select-none:
  color: #666;
  right: 5px;
  text-align: right;
`;

const ScrollDiv = styled.div`
  width: 100%;
  max-height: 500px;
  overflow-y: scroll;
  scrollbar-width: thin !important;
  scrollbar-color: var(--background) var(--card-background) !important;
  &::-webkit-scrollbar {
    background: var(--card-background) !important;
    width: 12px !important;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 6px;
    background: var(--background) !important;
  }
  &::-webkit-scrollbar-thumb:hover {
    filter: brightness(1.2);
  }
`;

export const HypnoCustomTextSettings = () => {
  const h = useSetting('hypno');
  const [hypno] = h;
  const [customMaster, setCustomMaster] = subsetting(h, 'textCustomMaster');
  const [customHands, setCustomHands] = subsetting(h, 'textCustomHands');
  const [custom, setCustom] = subsetting(h, 'textCustom');

  const addRow = () =>
    setCustom((p: HypnoTextEntry[]) => {
      const rid = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      if (p.length == 0) return [{ id: rid, text: '', start: 0, duration: 1 }];
      return [
        ...p,
        {
          id: rid,
          text: '',
          start: p[p.length - 1]!.start + p[p.length - 1]!.duration,
          duration: 1,
        },
      ];
    });
  function updateRow<S extends keyof HypnoTextEntry>(
    ix: number,
    key: S,
    val: HypnoTextEntry[S]
  ) {
    setCustom((p: HypnoTextEntry[]) =>
      p.map((v, i) => (i === ix ? { ...p[ix]!, [key]: val } : v))
    );
  }
  const removeRow = (ix: number) =>
    setCustom((p: HypnoTextEntry[]) => [...p.slice(0, ix), ...p.slice(ix + 1)]);

  return (
    <AnimatePresence>
      {hypno.textType === GameHypnoType.custom && (
        <MotionFields
          label={'Hypno Custom Text'}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={defaultTransition}
        >
          <StyledSettingsDescription>
            Variables:
            <br />
            <b>$part</b> - selected genitalia, <b>$stroke</b> - genitalia touch
            word, <b>$player</b> - third pronoun, <b>$master</b>, <b>$hands</b>
            <br />
            Flavors:
            <br />
            <b>$part</b> - lowercase, <b>$Part</b> - capitalized, <b>$PART</b> -
            uppercase
          </StyledSettingsDescription>
          <SettingsRow>
            <SettingsLabel htmlFor='customMaster'>Custom Master</SettingsLabel>
            <WaInput
              id='customMaster'
              style={{ gridColumn: '2 / -1', width: '100%' }}
              value={customMaster}
              onChange={e => setCustomMaster(e.currentTarget.value ?? '')}
            />
          </SettingsRow>
          <Space size='medium' />
          <SettingsRow>
            <SettingsLabel htmlFor='customHands'>Custom Hands</SettingsLabel>
            <WaInput
              id='customHands'
              style={{ gridColumn: '2 / -1', width: '100%' }}
              value={customHands}
              onChange={e => setCustomHands(e.currentTarget.value ?? '')}
            />
          </SettingsRow>
          <Space size='medium' />
          <ScrollDiv>
            <AnimatePresence>
              {custom.map((el, ix) => {
                return (
                  <motion.div
                    key={el.id}
                    transition={defaultTransition}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    data-ix={ix}
                  >
                    <HypnoRow>
                      <WaButton
                        style={{ background: 'var(--wa-color-fill-loud)' }}
                        onClick={() => removeRow(ix)}
                      >
                        Delete
                        <WaIcon slot='end' name='minus' />
                      </WaButton>
                      <WaInput
                        style={{
                          gridColumn: '2 / -1',
                          width: '100%',
                          minWidth: 0,
                        }}
                        value={el.text}
                        placeholder='Hypno text...'
                        onInput={e =>
                          updateRow(ix, 'text', e.currentTarget.value ?? '')
                        }
                      />
                      <SettingsLabel htmlFor={`${ix}-start`}>
                        Start at
                      </SettingsLabel>
                      <WaInput
                        style={{
                          gridRow: '2',
                          gridColumn: '2',
                          width: '100%',
                          minWidth: 0,
                        }}
                        value={el.start.toString()}
                        onInput={e => {
                          if (!isNaN(parseFloat(e.currentTarget.value ?? '')))
                            updateRow(
                              ix,
                              'start',
                              parseFloat(e.currentTarget.value ?? '')
                            );
                        }}
                      />
                      <Unit style={{ gridRow: '2', gridColumn: '2' }}>s</Unit>
                      <SettingsLabel
                        style={{ gridColumn: '3' }}
                        htmlFor={`${ix}-duration`}
                      >
                        Duration
                      </SettingsLabel>
                      <WaInput
                        style={{
                          gridRow: '2',
                          gridColumn: '4',
                          width: '100%',
                          minWidth: 0,
                        }}
                        value={el.duration.toString()}
                        onInput={e => {
                          if (!isNaN(parseFloat(e.currentTarget.value ?? '')))
                            updateRow(
                              ix,
                              'duration',
                              parseFloat(e.currentTarget.value ?? '')
                            );
                        }}
                      />
                      <Unit style={{ gridRow: '2', gridColumn: '4' }}>s</Unit>
                    </HypnoRow>
                    <Space size='medium' />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ScrollDiv>
          <WaButton
            style={{
              gridColumn: '1 / -1',
              background: 'var(--wa-color-fill-loud)',
            }}
            onClick={addRow}
          >
            Add entry
            <WaIcon slot='end' name='plus' />
          </WaButton>
        </MotionFields>
      )}
    </AnimatePresence>
  );
};
