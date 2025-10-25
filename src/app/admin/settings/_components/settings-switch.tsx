'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type SettingsSwitchProps = {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
};

export function SettingsSwitch({ id, label, description, defaultChecked }: SettingsSwitchProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-base">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} />
    </div>
  );
}
