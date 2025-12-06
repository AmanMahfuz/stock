import React from 'react'

export default function MobileHeader({ onMenuClick, title }) {
    return (
        <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#191714] border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1 className="font-bold text-zinc-900 dark:text-white text-lg truncate">
                    {title || "Smart Floor"}
                </h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                SF
            </div>
        </div>
    )
}
