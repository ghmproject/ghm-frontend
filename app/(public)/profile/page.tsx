import { RequireAuth } from "@/components/auth/RequireAuth";
import { routes } from "@/config/routes";
import { ProfileScreen } from "@/features/profile/components/ProfileScreen";

export const metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <RequireAuth returnTo={routes.profile}>
      <ProfileScreen />
    </RequireAuth>
  );
}
