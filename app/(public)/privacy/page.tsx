import { PublicListPageShell } from "@/components/layout/PublicListPageShell";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Privacy policy",
};

export default function PrivacyPolicyPage() {
  return (
    <PublicListPageShell
      title="Privacy policy"
      subtitle="How we handle your data"
      showEditButton={false}
    >
      <article className="max-w-none space-y-4 text-sm leading-relaxed text-neutral-700">
        <p>
          {siteConfig.name} helps you discover community-ranked cheap eats. This policy explains what
          information we collect and how we use it.
        </p>
        <h2 className="mt-6 text-base font-bold text-neutral-900">Information we collect</h2>
        <p>
          When you sign in, we store your email address and nickname to personalise your experience,
          including saved places, feed posts, and comments.
        </p>
        <h2 className="mt-6 text-base font-bold text-neutral-900">How we use it</h2>
        <p>
          We use your account details to operate the app, show your activity, and keep the community
          safe. We do not sell your personal information to third parties.
        </p>
        <h2 className="mt-6 text-base font-bold text-neutral-900">Contact</h2>
        <p>
          Questions about this policy? Reach out through the app or your usual support channel for{" "}
          {siteConfig.name}.
        </p>
      </article>
    </PublicListPageShell>
  );
}
