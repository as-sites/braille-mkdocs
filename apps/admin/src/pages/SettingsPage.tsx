import { useAuth } from "../hooks/useAuth";
import { ApiKeyManager } from "../components/settings/ApiKeyManager";
import { ProfileSettings } from "../components/settings/ProfileSettings";
import { UserManager } from "../components/settings/UserManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="keys">API keys</TabsTrigger>
              {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <ProfileSettings name={user?.name ?? ""} email={user?.email ?? ""} />
            </TabsContent>

            <TabsContent value="keys" className="mt-4">
              <ApiKeyManager />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users" className="mt-4">
                {user && <UserManager currentUserId={user.id} />}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
