import { UploadButton } from "@lib/uploadthing-client";
import { useAuth } from "../hooks/auth";
import { Mail, Calendar, User } from "lucide-react";

const Profile = () => {
  const { user, sessionToken } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-md w-full space-y-8 p-6 bg-card rounded-xl shadow-sm">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {user?.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <User className="h-12 w-12 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
          <p className="text-muted-foreground flex items-center justify-center mt-1">
            <Mail className="h-4 w-4 mr-2" />
            {user?.email}
          </p>
          <p className="text-muted-foreground flex items-center justify-center mt-1">
            <Calendar className="h-4 w-4 mr-2" />
            {user?.createdAt &&
              `Member since ${new Date(user.createdAt).toLocaleDateString()}`}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Profile Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Name</span>
              <span>{user?.name || "Not set"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Account Type</span>
              <span>Student</span>
            </div>
          </div>
        </div>
        {user?.id && sessionToken && (
          <UploadButton
            endpoint="profilePicture"
            appearance={{
              button: { width: "100%", backgroundColor: "maroon" },
            }}
            input={{
              userId: user.id,
              token: sessionToken,
            }}
            onClientUploadComplete={() => {
              window.location.reload();
            }}
            onUploadError={(error: Error) => {
              console.error(error, error.cause);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
