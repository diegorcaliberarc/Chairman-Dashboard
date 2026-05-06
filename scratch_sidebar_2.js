const fs = require('fs');
const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Root Flex layout
content = content.replace(/className="min-h-screen text-zinc-900 dark:text-white"/, 'className="flex h-screen overflow-hidden text-zinc-900 dark:text-white"');

// 2. Add UserAccountModal import & state
if (!content.includes('UserAccountModal')) {
  content = content.replace(/import \{ AppearanceSettings \} from "@\/components\/AppearanceSettings";/, 'import { AppearanceSettings } from "@/components/AppearanceSettings";\nimport { UserAccountModal } from "@/components/UserAccountModal";');
}
if (!content.includes('accountOpen')) {
  content = content.replace(/const \[appearanceOpen, setAppearanceOpen\] = useState\(false\);/, 'const [appearanceOpen, setAppearanceOpen] = useState(false);\n  const [accountOpen, setAccountOpen] = useState(false);');
}

// 3. Header deletions
content = content.replace(/<div className="text-\[9px\] tracking-widest uppercase" className="text-zinc-900 dark:text-white">\s*Executive Command · Claude Agent Stack · V6 · Supabase\s*<\/div>/, '');
content = content.replace(/<div className="header-divider-ea"[\s\S]*?<span className="text-\[9px\] tracking-widest uppercase text-zinc-500 dark:text-zinc-400">EA Buffer Active<\/span>\s*<\/div>\s*<\/div>/, '</div>');
content = content.replace(/<div className="flex flex-wrap items-center justify-between gap-y-3 py-4">/, '<div className="flex flex-wrap items-center justify-between gap-y-3 py-2">');

// 4. Wrap main content area & insert sidebar
content = content.replace(/<header className="sticky top-0 z-40 bg-white\/80 dark:bg-black\/60 backdrop-blur-xl border-b border-zinc-200\/50 dark:border-white\/10">/,
`{accountOpen && <UserAccountModal user={user} onClose={() => setAccountOpen(false)} />}
      
      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside className="w-64 flex flex-col bg-white/80 dark:bg-black/60 backdrop-blur-xl border-r border-zinc-200/50 dark:border-white/10 z-50 shrink-0">
        <div className="p-6">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6" style={{ color: "var(--theme-grad-start)" }}>Navigation</h2>
          <div className="flex flex-col gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={\`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all \${isActive ? "bg-themeAccent/10 text-zinc-900 dark:text-white border-l-2 border-themeAccent" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5 border-l-2 border-transparent"}\`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="mt-auto p-4 border-t border-zinc-200/50 dark:border-white/10 flex flex-col gap-3">
          {/* Cal Connect */}
          <button
            onClick={() => calConnected ? signOut({ redirect: false }) : signIn("google")}
            className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className={calConnected ? "text-themeAccent" : "text-zinc-500"} />
              <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">{calConnected ? "Cal · Live" : "Connect Cal"}</span>
            </div>
            <div className={\`w-2 h-2 rounded-full \${calConnected ? "bg-themeAccent" : "bg-zinc-300 dark:bg-zinc-700"}\`} />
          </button>
          
          <div className="h-px w-full bg-zinc-200/50 dark:bg-white/10" />
          
          <div className="flex items-center justify-between">
            {/* User Profile */}
            <button
              onClick={() => setAccountOpen(true)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
            >
              {user?.image ? (
                <img src={user.image} alt="User" width={28} height={28} className="rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-themeAccent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-themeAccent">{(user?.name ?? "C")[0].toUpperCase()}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">{user?.name?.split(" ")[0] ?? "Chairman"}</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Omega Level</span>
              </div>
            </button>
            
            {/* Appearance */}
            <button
              onClick={() => setAppearanceOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-200/50 dark:hover:bg-white/10 text-zinc-500 transition-colors"
              title="Appearance Settings"
            >
              <Palette size={14} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/60 backdrop-blur-xl border-b border-zinc-200/50 dark:border-white/10">`);

// 5. Remove Cal Connect, Appearance, User Avatar from Header, keeping Nova, Deep Work, Progress, Clock
content = content.replace(/\{\/\* Google Calendar connect\/disconnect \*\/\}[\s\S]*?\{\/\* Nova Logic Core toggle \*\/\}/, '{/* Nova Logic Core toggle */}');
content = content.replace(/\{\/\* Theme toggle \*\/\}[\s\S]*?\{\/\* Deep Work toggle \*\/\}/, '{/* Deep Work toggle */}');
content = content.replace(/\{\/\* User avatar \/ sign-in \*\/\}[\s\S]*?\{\/\* Deep Work toggle \*\/\}/, '{/* Deep Work toggle */}'); // fallback if previous regex didn't catch

// 6. Remove old horizontal TABS from <main>
content = content.replace(/\{\/\* Tab nav \*\/\}[\s\S]*?<\/header>/, '</header>');

// 7. Make <main> scrollable inside the flex-1 wrapper
content = content.replace(/<main className="flex-1 w-full flex flex-col relative z-10 min-h-\[calc\(100vh-60px\)\]">/, '<main className="flex-1 w-full flex flex-col relative z-10 overflow-y-auto">');

// 8. Close the wrapper div at the end
content = content.replace(/<\/main>\s*<\/div>\s*\)\;/, '</main>\n      </div>\n    </div>\n  );');

fs.writeFileSync(file, content);
console.log('Sidebar injected correctly');
