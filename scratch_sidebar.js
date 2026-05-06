const fs = require('fs');
const file = 'app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Root flex
content = content.replace(/className="min-h-screen text-zinc-900 dark:text-white"/, 'className="flex h-screen overflow-hidden text-zinc-900 dark:text-white"');

// 2. Add Account Open State & Import
if (!content.includes('accountOpen')) {
  content = content.replace(/const \[appearanceOpen, setAppearanceOpen\] = useState\(false\);/, 'const [appearanceOpen, setAppearanceOpen] = useState(false);\n  const [accountOpen, setAccountOpen] = useState(false);');
}
if (!content.includes('UserAccountModal')) {
  content = content.replace(/import \{ AppearanceSettings \} from "@\/components\/AppearanceSettings";/, 'import { AppearanceSettings } from "@/components/AppearanceSettings";\nimport { UserAccountModal } from "@/components/UserAccountModal";');
}

// 3. Extract parts from header
// Delete Executive Command subtext
content = content.replace(/<div className="text-\[9px\] tracking-widest uppercase" className="text-zinc-900 dark:text-white">\s*Executive Command · Claude Agent Stack · V6 · Supabase\s*<\/div>/, '');

// Delete EA Buffer Active entirely
content = content.replace(/<div className="header-divider-ea"[\s\S]*?<span className="text-\[9px\] tracking-widest uppercase text-zinc-500 dark:text-zinc-400">EA Buffer Active<\/span>\s*<\/div>\s*<\/div>/, '</div>'); // Close the brand flex items

// Make header sleek
content = content.replace(/<div className="flex flex-wrap items-center justify-between gap-y-3 py-4">/, '<div className="flex flex-wrap items-center justify-between gap-y-3 py-2">');

// Extract Cal Connect, Nova, Appearance, User Avatar from right cluster
// We'll replace the entire Right cluster in the header with just the Nova logic core or nothing if we want it fully clean.
// The user said: "Move the 'Cal Live' button, the 'Appearance' settings trigger button, and the User Profile icon/button into this bottom section"
// The header had Nova too, the user didn't mention Nova. I'll leave Nova in the header.

// I'll manually construct the sidebar and inject it just before <header> or <main>. Wait, since main content needs header + main, I'll wrap header + main in a <div className="flex-1 flex flex-col overflow-hidden">
// Let's replace the <header> tag to wrap it.
content = content.replace(/<header className="sticky top-0 z-40 bg-white\/80 dark:bg-black\/60 backdrop-blur-xl border border-zinc-200\/50 dark:border-white\/10 border-b border-zinc-200 dark:border-\[\#1E1F24\]">/, 
`
      {accountOpen && <UserAccountModal user={user} onClose={() => setAccountOpen(false)} />}
      
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
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {user?.image ? (
                <img src={user.image} alt="User" width={28} height={28} className="rounded-full" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-themeAccent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-themeAccent">{(user?.name ?? "C")[0].toUpperCase()}</span>
                </div>
              )}
              <div className="flex flex-col text-left">
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

// 4. Remove extracted buttons from the Right cluster in Header
// We must find the block and remove it. The right cluster has Cal Connect, dividers, Nova, Appearance, User Avatar.
// It's a bit hairy to replace with string regex, but we can replace everything between "Right cluster" and "</header>"
// Wait, the header ends with </header>.
content = content.replace(/\{\/\* Right cluster \*\/\}\s*<div className="flex items-center gap-6">[\s\S]*?<\/header>/, 
`{/* Right cluster */}
            <div className="flex items-center gap-6">
              {/* Nova Logic Core toggle */}
              <button
                onClick={() => setNovaOpen((p) => !p)}
                title="Nova Logic Core — AI Agent Array"
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  gap:             6,
                  padding:         "7px 12px",
                  borderRadius:    6,
                  backgroundColor: novaOpen ? "rgba(var(--theme-grad-start), 0.12)" : "transparent",
                  border:          \`1px solid \${novaOpen ? "var(--theme-grad-start)" : "#1E1F24"}\`,
                  color: novaOpen ? "var(--theme-grad-start)" : "#3B4558",
                  fontSize:        9,
                  fontWeight:      700,
                  letterSpacing:   "0.18em",
                  cursor:          "pointer",
                  transition:      "all 0.2s ease",
                  textTransform:   "uppercase",
                  flexShrink:      0,
                }}
              >
                <Bot size={11} />
                Nova
              </button>
            </div>
          </div>
        </div>
      </header>`);

// 5. Remove horizontal TABS rendering from <main>
// The horizontal tabs were: `<div className="flex items-end gap-1 mt-6"> ... TABS.map ... </div>`
content = content.replace(/<div className="flex items-end gap-1 mt-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\{appearanceOpen && <AppearanceSettings onClose=\{() => setAppearanceOpen\(false\)\} \/>\}/, 
`</div>
        </div>`);
// Let's be more robust about removing the old horizontal tabs:
content = content.replace(/<div className="flex items-end gap-1 mt-6 border-b border-zinc-200\/50 dark:border-white\/10">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '</div></div>');

// 6. Fix main layout so it scrolls
content = content.replace(/<main className="flex-1 w-full flex flex-col relative z-10 min-h-\[calc\(100vh-60px\)\]">/, '<main className="flex-1 w-full flex flex-col relative z-10 overflow-y-auto">');

// 7. Add closing div for the new wrapper
content = content.replace(/<\/main>\s*<\/div>\s*\)\;/g, '</main>\n      </div>\n    </div>\n  );');

fs.writeFileSync(file, content);
console.log('Processed sidebar refactor.');
