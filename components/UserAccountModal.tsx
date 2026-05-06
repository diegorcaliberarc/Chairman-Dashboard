import { X } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserAccountModalProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  onClose: () => void;
}

export function UserAccountModal({ user, onClose }: UserAccountModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md p-6 rounded-2xl bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-zinc-200/50 dark:border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white" style={{ fontFamily: "Georgia, serif" }}>My Account</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-200/50 dark:hover:bg-white/10 text-zinc-900 dark:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10">
          {user.image ? (
            <img src={user.image} alt="User" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-2xl font-bold">
              {(user.name ?? "C")[0].toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-white">{user.name ?? "Chairman"}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{user.email ?? "chairman@pristinedesigns.com"}</div>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => signOut({ callbackUrl: "/api/auth/signin" })}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-center text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
