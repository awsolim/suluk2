import Shell from "@/components/Shell";
import ProfileClient from "./profileClient";

export default function ProfilePage() {
  return (
    <Shell title="Edit Profile" backLabel="Back to dashboard" backHref="/dashboard">
      <ProfileClient />
    </Shell>
  );
}
