import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileSettingsProps = {
  name: string;
  email: string;
};

export function ProfileSettings({ name, email }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }

    setMessage("Profile updates are prepared. Password changes will be enabled in a later API update.");
  }

  return (
    <form className="grid gap-4 max-w-md" onSubmit={onSave}>
      <h2 className="font-semibold text-lg">Profile</h2>

      <div className="grid gap-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" type="email" value={email} disabled />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-current-pw">Current password</Label>
        <Input
          id="profile-current-pw"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-new-pw">New password</Label>
        <Input
          id="profile-new-pw"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-confirm-pw">Confirm new password</Label>
        <Input
          id="profile-confirm-pw"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Button type="submit">Save profile</Button>
    </form>
  );
}
