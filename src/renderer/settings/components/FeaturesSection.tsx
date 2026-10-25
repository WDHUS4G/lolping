import {
  Chat24Regular, CheckboxChecked24Regular, Emoji24Regular, PeopleCommunity24Regular, People24Regular,
} from '@fluentui/react-icons';
import type { ReactNode } from 'react';
import { FEATURES, type FeatureId } from '../../../shared/features';
import type { Settings } from '../../../shared/settings';
import { useText } from '../text';
import type { Update } from '../useAppState';
import { SwitchRow } from './rows';

const ICONS: Record<FeatureId, ReactNode> = {
  emotes: <Emoji24Regular />,
  rooms: <PeopleCommunity24Regular />,
  roomText: <Chat24Regular />,
  roomVotes: <CheckboxChecked24Regular />,
  roomPanel: <People24Regular />,
};

/** One switch per optional feature. The room ones grey out while Rooms is off. */
export function FeaturesSection({ settings: s, update }: { settings: Settings; update: Update }) {
  const t = useText();
  return (
    <>
      {FEATURES.map(({ id, requires }) => {
        const blocked = requires !== undefined && !s.features[requires];
        return (
          <SwitchRow key={id} icon={ICONS[id]} title={t.featureTitle[id]} dim={blocked} disabled={blocked}
            description={blocked ? `${t.featureDesc[id]} ${t.featureNeedsRooms}` : t.featureDesc[id]}
            checked={s.features[id]} onChange={(v) => void update({ features: { ...s.features, [id]: v } })} />
        );
      })}
    </>
  );
}
