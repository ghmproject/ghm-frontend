import { RequireAuth } from "@/components/auth/RequireAuth";
import { routes } from "@/config/routes";
import { SubmissionsQueueScreen } from "@/features/submissions/components/SubmissionsQueueScreen";

export const metadata = {
  title: "Submissions queue",
};

export default function SubmissionsPage() {
  return (
    <RequireAuth adminOnly returnTo={routes.submissions}>
      <SubmissionsQueueScreen />
    </RequireAuth>
  );
}
