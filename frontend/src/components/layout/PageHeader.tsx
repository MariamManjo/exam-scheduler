interface PageHeaderProps {
  eyebrow?: string
  title: string
  description: string
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 text-center sm:mb-10">
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-base text-subtle sm:text-lg">
        {description}
      </p>
    </header>
  )
}
