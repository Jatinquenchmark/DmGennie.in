'use client'

import { motion } from 'framer-motion'

export function Testimonials() {
  const testimonials = [
    {
      name: 'Saswati',
      handle: '@fit.saswati',
      text: "I absolutely love DMGennie! As a creator, I have used a lot of automated DM services but none of them had a UI as user friendly as DMGennie. The amazing customer support is their USP — issues were quickly resolved. I'll happily pay the monthly subscription!",
    },
    {
      name: 'Manvi',
      handle: '@manvihiranwal',
      text: "This platform is genuinely one of the easiest and cleanest I've used. It's super beginner-friendly, smooth to navigate, and everything feels so direct and well-structured. I'd definitely recommend it to anyone looking for a hassle-free automation experience!",
    },
    {
      name: 'Kushank',
      handle: '@khushankmathurcuet',
      text: "Excellent technical support and smooth automation, far better than most other platforms. Using their tool, I gained 6000+ followers in just 20 days. Deliveries to viewers are always timely. 100% recommended!",
    },
    {
      name: 'Manoj',
      handle: '@missionudyog',
      text: "DMGennie is a must-have for creators and entrepreneurs. Seriously a game-changer!",
    },
    {
      name: 'Shruti',
      handle: '@desi.potatoo',
      text: "It's one of the best platforms for automating your replies. As a creator, I find the services very helpful because of their easy to use UI and multiple features. Would definitely recommend it to other creators and businesses.",
    },
    {
      name: 'Dream AI Lab',
      handle: '@Dreamailab01',
      text: "I've been using it for 1 month and it's been a game changer for my growth. The interface is simple and easy to setup. The price is also very affordable compared to others. I gained 10k+ followers in just 1 month using DMGennie!",
    },
  ]

  return (
    <section id="testimonials" className="relative py-16 sm:py-20 lg:py-24 bg-card/30">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-foreground">
            See What People Are Saying 👀
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.handle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background clean-border rounded-2xl p-6 subtle-shadow hover:elevated-shadow gentle-animation"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center text-white font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-foreground">{t.name}</div>
                  <div className="text-muted-foreground text-sm">{t.handle}</div>
                </div>
              </div>
              <div className="text-yellow-500 mb-3 text-sm">★★★★★</div>
              <p className="text-muted-foreground text-sm leading-relaxed">{t.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
