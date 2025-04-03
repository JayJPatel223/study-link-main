import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/auth";
import { Button } from "@components/ui/button";
import { PlusIcon, Loader2, MessageCircle, Trash2, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { ScrollArea } from "@components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@components/ui/use-toast";
import {
  fetchGroupDiscussions,
  createDiscussion,
  deleteDiscussion,
  updateDiscussion,
  Discussion,
} from "@lib/api/discussion";
import CreateDiscussionModal from "./modals/CreateDiscussionModal";
import ViewDiscussionModal from "./modals/ViewDiscussionModal";
import EditDiscussionModal from "./modals/EditDiscussionModal";
import DeleteDiscussionModal from "./modals/DeleteDiscussionModal";

interface GroupDiscussionsProps {
  groupId: number;
  isAdmin: boolean;
  onSelectDiscussion?: (discussionId: number) => void;
  refreshTrigger?: number;
}

const GroupDiscussions = ({
  groupId,
  isAdmin,
  onSelectDiscussion,
  refreshTrigger = 0,
}: GroupDiscussionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] =
    useState<Discussion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [discussionToEdit, setDiscussionToEdit] = useState<Discussion | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discussionToDelete, setDiscussionToDelete] = useState<number | null>(
    null
  );

  const loadDiscussions = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      const data = await fetchGroupDiscussions(groupId);
      setDiscussions(data);
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
  }, [groupId, toast]);

  // Load discussions when component mounts, groupId changes, or refreshTrigger changes
  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions, refreshTrigger]);

  const handleCreateDiscussion = async (title: string, content: string) => {
    try {
      await createDiscussion(groupId, {
        title,
        content: content || undefined,
      });
      await loadDiscussions();
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

  const openDeleteDialog = (discussionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDiscussionToDelete(discussionId);
    setDeleteDialogOpen(true);
  };

  const handleEditDiscussion = (discussion: Discussion) => {
    setDiscussionToEdit(discussion);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Discussions</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </div>

      <Separator />

      {discussions.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-lg font-medium">No discussions yet</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to start a discussion in this group.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-4 pr-4">
            {discussions.map((discussion) => (
              <Card
                key={discussion.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">
                      <Button
                        variant="link"
                        className="p-0 h-auto font-bold text-left"
                        onClick={() => {
                          if (onSelectDiscussion) {
                            onSelectDiscussion(discussion.id);
                          } else {
                            setSelectedDiscussion(discussion);
                          }
                        }}
                      >
                        {discussion.title}
                      </Button>
                    </CardTitle>
                    <div className="flex gap-1">
                      {(isAdmin || discussion.authorId === user?.id) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDiscussion(discussion);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => openDeleteDialog(discussion.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Posted by <span>{discussion.author.name}</span> ·{" "}
                    {formatDistanceToNow(new Date(discussion.createdAt), {
                      addSuffix: true,
                    })}
                    {discussion.updatedAt !== discussion.createdAt && (
                      <span> · Edited</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="line-clamp-2 text-sm">
                    {discussion.content || "No content provided."}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      if (onSelectDiscussion) {
                        onSelectDiscussion(discussion.id);
                      } else {
                        setSelectedDiscussion(discussion);
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>
                      {discussion._count?.comments || 0}{" "}
                      {discussion._count?.comments === 1
                        ? "comment"
                        : "comments"}
                    </span>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Modals */}
      <CreateDiscussionModal
        isOpen={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateDiscussion={handleCreateDiscussion}
        trigger={null}
      />

      <ViewDiscussionModal
        discussion={selectedDiscussion}
        isOpen={!!selectedDiscussion && !onSelectDiscussion}
        onOpenChange={(open) => !open && setSelectedDiscussion(null)}
        groupId={groupId}
        onViewFullDiscussion={() => {
          if (selectedDiscussion && onSelectDiscussion) {
            onSelectDiscussion(selectedDiscussion.id);
          }
        }}
      />

      <EditDiscussionModal
        discussion={discussionToEdit}
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onUpdateDiscussion={async (id, title, content) => {
          try {
            await updateDiscussion(groupId, id, {
              title,
              content: content || undefined,
            });
            await loadDiscussions();
            toast({
              title: "Success",
              description: "Discussion updated successfully",
            });
          } catch (error) {
            console.error("Failed to update discussion:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to update discussion. Please try again.",
            });
          }
        }}
      />

      <DeleteDiscussionModal
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirmDelete={async () => {
          if (!discussionToDelete) return;

          try {
            await deleteDiscussion(groupId, discussionToDelete);
            await loadDiscussions();
            setDeleteDialogOpen(false);
            toast({
              title: "Success",
              description: "Discussion deleted successfully",
            });
          } catch (error) {
            console.error("Failed to delete discussion:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to delete discussion. Please try again.",
            });
          }
        }}
      />
    </div>
  );
};

export default GroupDiscussions;
