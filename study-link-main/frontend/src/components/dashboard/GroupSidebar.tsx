import { useState } from "react";
import CreateGroupModal from "./modals/CreateGroupModal";
import JoinGroupModal from "./modals/JoinGroupModal";
import { Button } from "@components/ui/button";
import { ScrollArea } from "@components/ui/scroll-area";
import { cn } from "@lib/utils";
import { createGroup, joinGroup, Group } from "@lib/api/group";
import { useToast } from "@components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface GroupSidebarProps {
  onSelectGroup: (groupId: number | null) => void;
  selectedGroupId: number | null;
  groups: Group[];
  loading: boolean;
  refreshGroups: (groupId?: number) => Promise<void>;
}

const GroupSidebar = ({
  onSelectGroup,
  selectedGroupId,
  groups,
  loading,
  refreshGroups,
}: GroupSidebarProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const { toast } = useToast();

  const handleGroupClick = (groupId: number) => {
    onSelectGroup(groupId);
  };

  const handleCreateGroup = async (name: string, description: string) => {
    try {
      const newGroup = await createGroup({ name, description });
      await refreshGroups(newGroup.id);
      toast({
        title: "Success",
        description: "Group created successfully",
      });
    } catch (error) {
      console.error("Failed to create group:", error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleJoinGroup = async (groupId: string, password?: string) => {
    try {
      await joinGroup(Number(groupId), password);
      await refreshGroups(Number(groupId));
      toast({
        title: "Success",
        description: "Successfully joined the group",
      });
    } catch (error) {
      console.error("Failed to join group:", error);
      toast({
        title: "Error",
        description:
          "Failed to join group. Please check the group ID and password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-w-64 w-64 border-r h-auto flex flex-col">
      <div className="p-4 border-b flex items-center justify-center">
        <a
          href="/dashboard"
          className="text-lg font-semibold hover:text-muted-foreground transition-colors cursor-pointer"
        >
          My Dashboard
        </a>
      </div>

      {/* Create/Join Group buttons */}
      <div className="p-4 space-y-2">
        <Button className="w-full" onClick={() => setIsCreateModalOpen(true)}>
          Create Group
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsJoinModalOpen(true)}
        >
          Join Group
        </Button>
      </div>

      {/* Groups heading */}
      <div className="px-4 py-4 text-base font-extrabold text-muted-foreground">
        Groups
      </div>

      {/* Groups list */}
      <ScrollArea className="flex-1">
        <div className="px-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <button
                key={group.id}
                className={cn(
                  "w-full px-2 my-1 py-2 text-left rounded-md transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  selectedGroupId === group.id &&
                    "bg-accent text-accent-foreground border-1 border-primary"
                )}
                onClick={() => handleGroupClick(group.id)}
              >
                {group.name}
              </button>
            ))
          ) : (
            <div className="text-center p-4 text-muted-foreground">
              No groups yet. Create or join a group to get started.
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
      <JoinGroupModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoinGroup={handleJoinGroup}
      />
    </div>
  );
};

export default GroupSidebar;
