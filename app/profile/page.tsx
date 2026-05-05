import PageHeader from "@/components/ui/PageHeader";
import ProfileForm from "@/components/features/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title="Profile 🌺" subtitle="Your festival identity" />
      <ProfileForm />
    </div>
  );
}
