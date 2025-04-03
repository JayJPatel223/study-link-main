import GroupDetails from "../components/dashboard/GroupDetails";
import GroupSidebar from "../components/dashboard/GroupSidebar";
import { useState, useEffect } from "react";
import { fetchUserGroups, Group } from "@lib/api/group";
import { useToast } from "@components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const userGroups = await fetchUserGroups();
        setGroups(userGroups);
        setSelectedGroup(userGroups[0]?.id || null);
      } catch (error) {
        console.error("Failed to load groups:", error);
        toast({
          title: "Error",
          description: "Failed to load your groups. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [toast]);

  const refreshGroups = async (groupId?: number) => {
    try {
      setLoading(true);
      const userGroups = await fetchUserGroups();
      setGroups(userGroups);
      if (groupId) {
        setSelectedGroup(groupId);
      }
    } catch (error) {
      console.error("Failed to refresh groups:", error);
      toast({
        title: "Error",
        description: "Failed to refresh your groups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-122px)] dashboard">
      <GroupSidebar
        selectedGroupId={selectedGroup}
        onSelectGroup={setSelectedGroup}
        groups={groups}
        loading={loading}
        refreshGroups={refreshGroups}
      />

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : selectedGroup ? (
          <GroupDetails groupId={selectedGroup} />
        ) : (
          <div className="flex items-center justify-center h-full border border-gray-800 rounded-lg dashboard-card">
            <p className="text-lg text-gray-400">
              Select a group or create a new one to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
