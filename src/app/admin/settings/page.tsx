import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SettingsSwitch } from './_components/settings-switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold font-headline mb-6">Settings</h1>
      <div className="grid gap-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage general application settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" defaultValue="CodeDuel Pro" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" defaultValue="support@codeduel.pro" />
             </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>AI Proctoring</CardTitle>
            <CardDescription>Configure the AI-powered proctoring features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsSwitch
              id="ai-proctoring"
              label="Enable AI Proctoring"
              description="Analyze user behavior during contests for suspicious activity."
              defaultChecked={true}
            />
            <SettingsSwitch
              id="tab-switch-detection"
              label="Tab Switch Detection"
              description="Issue a warning when a user switches to another browser tab."
              defaultChecked={true}
            />
             <SettingsSwitch
              id="devtools-blocking"
              label="Developer Tools Blocking"
              description="Prevent users from opening browser developer tools during a contest."
              defaultChecked={true}
            />
            <div className="space-y-2 pt-2">
                <Label htmlFor="max-warnings">Maximum Warnings</Label>
                <Input id="max-warnings" type="number" defaultValue={3} className="max-w-xs" />
                <p className="text-sm text-muted-foreground">
                    Number of warnings before a user's contest is automatically locked.
                </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button size="lg">Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
