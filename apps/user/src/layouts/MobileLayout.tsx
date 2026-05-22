import { Outlet } from 'react-router-dom';

export default function MobileLayout() {
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md bg-background text-foreground">
      <Outlet />
    </div>
  );
}
