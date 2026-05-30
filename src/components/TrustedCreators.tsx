'use client'

export function TrustedCreators() {
  const creators = [
    { name: '@ghar_sansar', followers: '156K+', category: 'Local Business' },
    { name: '@jr.hardikpandyaa93', followers: '728K+', category: 'Actor' },
    { name: '@ezsnippet', followers: '3.3M+', category: 'Tech' },
    { name: '@fit.saswati', followers: '35K+', category: 'Fitness' },
    { name: '@elementec', followers: '1.2M+', category: 'Travel' },
    { name: '@englishwitharthibaskar', followers: '1M', category: 'Education' },
    { name: '@riyabangia_', followers: '839K+', category: 'Travel' },
    { name: '@prriya.khandelwal', followers: '772K+', category: 'Yoga' },
    { name: '@fatimazaidii._', followers: '84.9K+', category: 'Beauty' },
    { name: '@masaischool', followers: '98.3K+', category: 'Startup' },
  ]

  return (
    <section className="relative py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <h2 className="text-4xl sm:text-5xl font-black text-center mb-12 text-foreground">
          <span className="text-accent-blue">10k+</span> Creators Trust DMGennie 🚀
        </h2>

        {/* Scrolling creator cards */}
        <div className="relative overflow-hidden">
          <div className="flex gap-6 animate-scroll">
            {[...creators, ...creators].map((creator, index) => (
              <div key={index} className="flex-shrink-0 bg-card clean-border rounded-2xl p-5 w-56 subtle-shadow hover:elevated-shadow gentle-animation">
                <div className="w-14 h-14 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full mb-3 flex items-center justify-center text-white font-bold text-lg">
                  {creator.name.charAt(1).toUpperCase()}
                </div>
                <div className="font-bold text-foreground text-sm truncate">{creator.name}</div>
                <div className="text-accent-blue font-semibold text-sm">{creator.followers} Followers</div>
                <div className="text-muted-foreground text-xs mt-1 bg-accent/50 rounded-full px-3 py-1 inline-block">{creator.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
