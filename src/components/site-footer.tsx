const footerLinks = ["隐私与安全", "用户内容规范", "开发团队联系"]

function GithubLogo() {
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.74 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.38-5.25 5.67.41.36.78 1.07.78 2.15v3.18c0 .31.21.67.79.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

function MiitLogo() {
  return (
    <span className="grid size-4 shrink-0 place-items-center" aria-hidden="true">
      <img className="size-full object-contain" src="/ghs.png" alt="" />
    </span>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-[#171717] font-mono text-sm text-white dark:bg-[#1f1f1f]">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-white/70">
          {footerLinks.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <p>© 2026 北航敏捷开发软件工程</p>
        <p>
          <a
            className="inline-flex items-center gap-1.5 underline"
            href="https://github.com/BUAA2026SE-404NotFound"
            target="_blank"
            rel="noreferrer"
          >
            <GithubLogo />
            BUAA2026SE-404NotFound
          </a>
        </p>
        <p>
          <a
            className="inline-flex items-center gap-1.5 underline"
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noreferrer"
          >
            <MiitLogo />
            京ICP备2026018715号-2
          </a>
        </p>
      </div>
    </footer>
  )
}
