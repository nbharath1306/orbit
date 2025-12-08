import UserLayoutContent from '@/components/user/layout/UserLayoutContent';
import { DashboardPageLoading } from '@/components/user/LoadingSkeleton';

export default function Loading() {
  return (
    <UserLayoutContent title="Dashboard">
      <DashboardPageLoading />
    </UserLayoutContent>
  );
}
