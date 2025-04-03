import { useState } from "react";
import { useAuth } from "../../hooks/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Loader2, UserX, ShieldAlert } from "lucide-react";
import {
  changeUserRole,
  removeMember,
  leaveGroup,
  GroupMember,
} from "../../lib/api/group";

interface GroupMembersProps {
  groupId: number;
  isAdmin: boolean;
  members: GroupMember[];
  setFetchTrigger: (trigger: number) => void;
}

const GroupMembers = ({
  groupId,
  isAdmin,
  members,
  setFetchTrigger,
}: GroupMembersProps) => {
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const { user } = useAuth();

  const handleRemoveMember = async (userId: string) => {
    try {
      setRemovingUser(userId);
      await removeMember(groupId, userId);
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setRemovingUser(null);
      setFetchTrigger(1);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user) return;
    try {
      setRemovingUser(user.id);
      await leaveGroup(groupId);
      window.location.reload();
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      setRemovingUser(null);
    }
  };

  const handleChangeRole = async (
    userId: string,
    newRole: "ADMIN" | "MEMBER"
  ) => {
    try {
      setChangingRole(userId);
      await changeUserRole(groupId, userId, newRole);
    } catch (error) {
      console.error("Error changing role:", error);
    } finally {
      setChangingRole(null);
      setFetchTrigger(1);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl font-semibold">
        Group Members ({members.length})
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {members.map((member) => (
          <Card key={member.id} className="overflow-hidden shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage
                      className="object-cover"
                      src={member.user.image || ""}
                    />
                    <AvatarFallback>
                      {member.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{member.user.name}</p>
                      <Badge
                        variant={
                          member.role === "ADMIN" ? "destructive" : "outline"
                        }
                      >
                        {member.role}
                      </Badge>
                      {user && member.id === Number(user.id) && (
                        <Badge variant="secondary">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                {isAdmin &&
                  user &&
                  member.id !== Number(user.id) &&
                  member.role === "MEMBER" && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleChangeRole(
                            member.userId,
                            member.role === "ADMIN" ? "MEMBER" : "ADMIN"
                          )
                        }
                        disabled={!!changingRole}
                      >
                        {changingRole === member.userId ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 mr-2" />
                        )}
                        {"Make Admin"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={!!removingUser}
                      >
                        {removingUser === member.userId ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4 mr-2" />
                        )}
                        Remove
                      </Button>
                    </div>
                  )}
                {user &&
                  member.userId === user.id &&
                  member.role === "MEMBER" && (
                    <div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLeaveGroup}
                        disabled={!!removingUser}
                      >
                        {removingUser === user.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4 mr-2" />
                        )}
                        Leave Group
                      </Button>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GroupMembers;
