import { useState, useEffect } from "react";
import { useToast } from "@components/ui/use-toast";
import {
  fetchGroupDiscussions,
  createDiscussion,
  getDiscussion,
  Discussion,
} from "@lib/api/discussion";
import DiscussionsSidebar from "./DiscussionsSidebar";
import ChatDiscussionView from "./ChatDiscussionView";
import DiscussionInfoPanel from "./DiscussionInfoPanel";
import CreateDiscussionModal from "./modals/CreateDiscussionModal";

interface DiscussionsLayoutProps {
  groupId: number;
  isAdmin: boolean;
}

const DiscussionsLayout = ({ groupId, isAdmin }: DiscussionsLayoutProps) => {
  const { toast } = useToast();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<
    number | null
  >(null);
  const [selectedDiscussion, setSelectedDiscussion] =
    useState<Discussion | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch discussions for the current group
  useEffect(() => {
    async function fetchDiscussions() {
      if (!groupId) return;

      try {
        setLoading(true);
        setSelectedDiscussionId(null);
        setSelectedDiscussion(null);
        const data = await fetchGroupDiscussions(groupId);
        setDiscussions(data);

        if (data.length > 0) {
          setSelectedDiscussionId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to load discussions:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load discussions. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDiscussions();
  }, [groupId, toast]);

  // Fetch selected discussion details
  useEffect(() => {
    async function fetchDiscussionDetails() {
      if (!groupId || !selectedDiscussionId) {
        setSelectedDiscussion(null);
        return;
      }

      try {
        setLoading(true);
        const data = await getDiscussion(groupId, selectedDiscussionId);
        setSelectedDiscussion(data);
      } catch (error) {
        console.error("Failed to load discussion:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load discussion details. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDiscussionDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiscussionId, toast]);

  const handleSelectDiscussion = (discussionId: number) => {
    setSelectedDiscussionId(discussionId);
  };

  const handleCreateDiscussion = async (title: string, content: string) => {
    try {
      await createDiscussion(groupId, {
        title,
        content: content || undefined,
      });

      // Refresh discussions list
      const data = await fetchGroupDiscussions(groupId);
      setDiscussions(data);

      // Auto-select the newly created discussion (should be first in list)
      if (data.length > 0) {
        setSelectedDiscussionId(data[0].id);
      }

      toast({
        title: "Success",
        description: "Discussion created successfully",
      });
    } catch (error) {
      console.error("Failed to create discussion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create discussion. Please try again.",
      });
    }
  };

  const refreshDiscussions = async () => {
    try {
      // Refresh selected discussion if it exists
      if (selectedDiscussionId) {
        const updatedDiscussion = await getDiscussion(
          groupId,
          selectedDiscussionId
        );
        setSelectedDiscussion(updatedDiscussion);
      }
    } catch (error) {
      console.error("Failed to refresh discussions:", error);
    }
  };

  const handleCommentDeleted = () => {
    refreshDiscussions();
  };

  const handleUpdateDiscussion = (updatedDiscussion: Discussion) => {
    // Update in the discussions list
    setDiscussions((prevDiscussions) =>
      prevDiscussions.map((disc) =>
        disc.id === updatedDiscussion.id
          ? { ...disc, _count: updatedDiscussion._count }
          : disc
      )
    );

    // Update selected discussion if it's the one that changed
    if (selectedDiscussion && selectedDiscussion.id === updatedDiscussion.id) {
      setSelectedDiscussion({
        ...selectedDiscussion,
        ...updatedDiscussion,
      });
    }
  };

  return (
    <div className="flex h-full w-full">
      <DiscussionsSidebar
        discussions={discussions}
        selectedDiscussionId={selectedDiscussionId}
        onSelectDiscussion={handleSelectDiscussion}
        onNewDiscussion={() => setCreateDialogOpen(true)}
      />

      <div className="flex w-full">
        {selectedDiscussionId && (
          <>
            <div className="flex-1">
              <ChatDiscussionView
                groupId={groupId}
                discussionId={selectedDiscussionId}
                isAdmin={isAdmin}
                onCommentDeleted={handleCommentDeleted}
                onUpdateDiscussion={handleUpdateDiscussion}
                discussion={selectedDiscussion}
                discussionLoading={loading}
              />
            </div>
            <div className="min-w-80 max-w-80 shrink-0 border-l">
              <DiscussionInfoPanel
                discussionId={selectedDiscussionId}
                groupId={groupId}
                isAdmin={isAdmin}
                discussion={selectedDiscussion}
                discussionLoading={loading}
                onUpdateDiscussion={handleUpdateDiscussion}
              />
            </div>
          </>
        )}
      </div>

      <CreateDiscussionModal
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateDiscussion={handleCreateDiscussion}
      />
    </div>
  );
};

export default DiscussionsLayout;
