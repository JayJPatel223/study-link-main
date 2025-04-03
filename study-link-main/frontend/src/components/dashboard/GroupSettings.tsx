import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Switch } from "../ui/switch";
import { Loader2, Trash2, Save, Users, Lock } from "lucide-react";
import { updateGroup, deleteGroup, Group } from "../../lib/api/group";
import DeleteGroupModal from "./modals/DeleteGroupModal";

interface GroupSettingsProps {
  groupId: number;
  groupData: Group;
  isAdmin: boolean;
  onGroupUpdated: (data: Group) => void;
  setFetchTrigger: (trigger: number) => void;
}

const GroupSettings = ({
  groupId,
  groupData,
  onGroupUpdated,
  setFetchTrigger,
}: GroupSettingsProps) => {
  const [name, setName] = useState(groupData.name);
  const [description, setDescription] = useState(groupData.description || "");
  const [isPrivate, setIsPrivate] = useState(groupData.private);
  const [groupPassword, setGroupPassword] = useState(groupData.password || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if any form values have changed from their original values
  const hasChanges =
    name !== groupData.name ||
    description !== (groupData.description || "") ||
    isPrivate !== Boolean(groupData.private) ||
    (isPrivate && groupPassword !== (groupData.password || ""));

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage("Group name cannot be empty");
      return;
    }

    clearMessages();
    try {
      setIsSaving(true);
      const response = await updateGroup(groupId, {
        name,
        description,
        private: isPrivate,
        password: isPrivate && groupPassword ? groupPassword : undefined,
      });

      onGroupUpdated(response);
      setSuccessMessage("Group settings updated successfully");
      setFetchTrigger(1);
    } catch (error) {
      console.error("Error updating group:", error);
      setErrorMessage("Failed to update group settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    clearMessages();
    try {
      setIsDeleting(true);
      await deleteGroup(groupId);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error deleting group:", error);
      setErrorMessage("Failed to delete group");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {successMessage && (
        <div className="bg-green-500/20 text-green-700 p-3 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/20 text-red-700 p-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Information
          </CardTitle>
          <CardDescription>
            Update your group's basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Group Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              className="shadow-sm"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control who can join your group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-12">
            <div className="space-y-0.5">
              <label htmlFor="private-group" className="text-sm font-medium">
                Private Group
              </label>
              <p className="text-sm text-muted-foreground">
                Private groups require a password to join
              </p>
            </div>
            <Switch
              id="private-group"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          {isPrivate && (
            <div className="space-y-2">
              <label htmlFor="group-password" className="text-sm font-medium">
                Group Password
              </label>
              <Input
                id="group-password"
                type="password"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                placeholder="Enter password for the group"
              />
              <p className="text-xs text-muted-foreground">
                Members will need this password to join your group
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>

      <Card className="border-destructive shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Actions here cannot be undone</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteGroupModal onDelete={handleDelete} isDeleting={isDeleting} />
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupSettings;
