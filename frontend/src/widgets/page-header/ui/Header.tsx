import { UserMenu } from './UserMenu';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-lg font-bold text-neutral-900">
          Clarity
        </div>
        <div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};