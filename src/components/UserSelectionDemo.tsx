import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUsers } from '@/data/mockUsers';
import { ProfileCard } from './ProfileCard';
import { User, UserRole } from '@/types/user';
import { Users } from 'lucide-react';

export const UserSelectionDemo = () => {
  const [selectedUser, setSelectedUser] = useState<User>(mockUsers[0]);

  const handleUserChange = (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  const roleGroups = mockUsers.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<UserRole, User[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Sélectionner un profil utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select value={selectedUser.id} onValueChange={handleUserChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleGroups).map(([role, users]) => (
                  <div key={role}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/30">
                      {role === 'initiator' && 'Initiateurs'}
                      {role === 'approver_level_1' && 'Approbateurs Niveau 1'}
                      {role === 'approver_level_2' && 'Approbateurs Niveau 2'}
                      {role === 'director' && 'Directeur'}
                    </div>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <span>{user.firstName} {user.lastName}</span>
                          <span className="text-muted-foreground">- {user.department}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockUsers.map((user) => (
                <Button
                  key={user.id}
                  variant={selectedUser.id === user.id ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-start space-y-1"
                  onClick={() => setSelectedUser(user)}
                >
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                  <span className="text-xs opacity-75">{user.role === 'initiator' ? 'Initiateur' : 
                    user.role === 'approver_level_1' ? 'Approbateur Nv1' :
                    user.role === 'approver_level_2' ? 'Approbateur Nv2' : 'Directeur'}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileCard user={selectedUser} />
    </div>
  );
};