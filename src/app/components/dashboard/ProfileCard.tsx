import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface Profile {
  fullName: string;
  email: string;
  profilePicture: string;
}

const ProfileCard = ({ profile }: { profile: Profile }) => (
  <Card className="bg-gray-900 border-gray-800">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Profile</CardTitle>
      <User className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent className="flex items-center gap-4">
      <Avatar>
        <AvatarImage src={profile.profilePicture} alt={profile.fullName} />
        <AvatarFallback>{profile.fullName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">{profile.fullName}</p>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>
    </CardContent>
  </Card>
);

export default ProfileCard;
