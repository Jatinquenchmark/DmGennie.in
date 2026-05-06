'use client'

export function Stats() {
  const stats = [
    { value: '30M+', label: 'DMs Sent' },
    { value: '5M+', label: 'Followers Gained' },
    { value: '10M+', label: 'Comments Sent' },
    { value: '12+', label: 'Countries' },
  ]

  return (
    <section className="relative py-20 bg-card/30">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-accent-blue mb-2">{stat.value}</div>
              <div className="text-lg text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
