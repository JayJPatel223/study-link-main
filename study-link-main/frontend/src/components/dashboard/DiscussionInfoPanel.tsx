import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";
import { Input } from "@components/ui/input";
import { Loader2, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@components/ui/use-toast";
import {
  Discussion,
  updateDiscussion,
  deleteDiscussion,
} from "@lib/api/discussion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@components/ui/alert-dialog";
import { UploadDropzone } from "@lib/uploadthing-client";

interface DiscussionInfoPanelProps {
  discussionId: number;
  groupId: number;
  isAdmin: boolean;
  discussion?: Discussion | null;
  discussionLoading?: boolean;
  onUpdateDiscussion?: (discussion: Discussion) => void;
}

const DiscussionInfoPanel = ({
  discussionId,
  groupId,
  isAdmin,
  discussion,
  discussionLoading = false,
  onUpdateDiscussion,
}: DiscussionInfoPanelProps) => {
  const { user, sessionToken } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editingInfo, setEditingInfo] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    title: "",
    content: "",
  });
  // Set the edited info when the discussion changes
  useEffect(() => {
    if (discussion) {
      setEditedInfo({
        title: discussion.title,
        content: discussion.content || "",
      });
      setLoading(false);
    } else {
      setLoading(discussionLoading);
    }
  }, [discussion, discussionLoading]);

  const handleUpdateInfo = async () => {
    if (!editedInfo.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Discussion title is required.",
      });
      return;
    }

    try {
      setActionLoading(true);
      const updated = await updateDiscussion(groupId, discussionId, {
        title: editedInfo.title,
        content: editedInfo.content || undefined,
      });

      // Update via parent component
      if (onUpdateDiscussion) {
        onUpdateDiscussion(updated);
      }

      setEditingInfo(false);
      toast({
        title: "Success",
        description: "Discussion information updated successfully",
      });
    } catch (error) {
      console.error("Failed to update discussion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update discussion. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDiscussion = async () => {
    try {
      setActionLoading(true);
      await deleteDiscussion(groupId, discussionId);

      toast({
        title: "Success",
        description: "Discussion deleted successfully",
      });

      // Redirect to group discussions page or handle as needed
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete discussion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete discussion. Please try again.",
      });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!discussion) {
    return null;
  }

  const canEditDiscussion = isAdmin || discussion.authorId === user?.id;

  return (
    <div className="h-full min-w-full p-4">
      <h2 className="text-2xl font-semibold mb-4">Discussion Info</h2>

      <Card className="shadow-none border-none">
        <CardHeader className="pb-2 space-y-4 relative">
          {canEditDiscussion && !editingInfo && (
            <div className="absolute top-4 right-4 flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingInfo(true)}
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            {editingInfo ? (
              <Input
                value={editedInfo.title}
                onChange={(e) =>
                  setEditedInfo({
                    ...editedInfo,
                    title: e.target.value,
                  })
                }
                className="font-semibold text-xl"
                placeholder="Discussion title"
              />
            ) : (
              <CardTitle className="text-2xl leading-tight break-words pr-16">
                {discussion.title}
              </CardTitle>
            )}

            <div className="flex items-center space-x-3 border-l-4 pl-3 border-primary/30 py-1">
              <Avatar className="h-12 w-12 border-2 border-background">
                <AvatarImage
                  src={discussion.author.image || ""}
                  alt={discussion.author.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(discussion.author.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-base">
                  {discussion.author.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(discussion.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {editingInfo ? (
            <Textarea
              value={editedInfo.content}
              onChange={(e) =>
                setEditedInfo({
                  ...editedInfo,
                  content: e.target.value,
                })
              }
              placeholder="Add a description for your discussion..."
              rows={5}
              className="resize-none"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              {discussion.content ? (
                <p className="leading-relaxed text-sm">{discussion.content}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No description provided
                </p>
              )}
            </div>
          )}
        </CardContent>

        {editingInfo && (
          <div className="flex justify-end pb-4 pr-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingInfo(false)}
              disabled={actionLoading}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleUpdateInfo}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}

        <div className="px-4 pb-4 mt-2 border-t pt-4">
          <p className="text-sm font-medium mb-2">Attachments</p>
          <UploadDropzone
            input={{
              discussionId: discussionId.toString(),
              token: sessionToken!,
              groupId: groupId.toString(),
            }}
            endpoint="discussionFiles"
            onClientUploadComplete={(res) => {
              console.log(res);
              toast({
                title: "Files uploaded",
                description: "Your files have been uploaded successfully",
              });
            }}
            className="border-dashed border-2 ut-label:text-sm ut-allowed-content:text-xs"
          />
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the discussion "{discussion.title}"
              and all associated comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDiscussion}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiscussionInfoPanel;
