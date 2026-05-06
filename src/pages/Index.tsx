import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AnimationShowcase from "@/components/AnimationShowcase";
import GlassCard from "@/components/GlassCard";
import TextType from "@/components/ui/TextType";
import Particles from "@/components/ui/Particles";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={['#2563eb', '#059669', '#7c3aed', '#ffffff']}
            particleCount={300}
            particleSpread={12}
            speed={0.15}
            particleBaseSize={120}
            moveParticlesOnHover={true}
            alphaParticles={true}
            disableRotation={false}
          />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-5xl mx-auto px-4 pointer-events-none">
          <h1 className="font-bagel text-5xl md:text-7xl lg:text-8xl text-shadow-strong text-white leading-tight">
            <TextType
              text="Go Viral on IG with DM automation"
              typingSpeed={50}
              deletingSpeed={30}
              pauseDuration={3000}
              showCursor={true}
              cursorCharacter="|"
              cursorClassName="text-accent-blue"
              loop={false}
            />
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-medium pointer-events-auto">
            Turn your comments into warm leads instantly. Auto-DM your followers and scale your Instagram growth on autopilot.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pointer-events-auto pt-6">
            <Button
              className="px-8 py-6 text-lg font-bold bg-accent-blue hover:bg-blue-600 text-white rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105"
            >
              Start Automating Free
            </Button>
            <Button
              variant="outline"
              className="px-8 py-6 text-lg font-bold border-white/20 hover:bg-white/10 text-white rounded-xl backdrop-blur-md transition-all"
            >
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Animation Showcase */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 font-bagel">
            Анимации и Эффекты
          </h2>
          <AnimationShowcase />
        </div>
      </section>

      {/* Glass Effects Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-accent-blue/5 via-accent-purple/5 to-accent-emerald/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 font-bagel">
            Стеклянные Эффекты
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard
              title="Стекло"
              description="Основной стеклянный эффект с размытием и прозрачностью"
              className="glass-effect"
            />
            <GlassCard
              title="Навигация"
              description="Усиленный эффект для навигационных элементов"
              className="glass-navbar"
            />
            <GlassCard
              title="Свечение"
              description="Эффект с пульсирующим свечением"
              className="glass-effect pulse-glow"
            />
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold font-bagel">Типографика</h2>

          <div className="space-y-6">
            <h1 className="font-bagel text-shadow-medium">Заголовок H1 с Bagel Fat</h1>
            <h2>Заголовок H2 с системным шрифтом</h2>
            <h3>Заголовок H3 с улучшенной типографикой</h3>
            <p>
              Обычный текст с оптимизированными интервалами и читаемостью.
              Система поддерживает адаптивные размеры и правильные пропорции.
            </p>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 font-bagel">
            Цветовая Палитра
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 text-center subtle-shadow gentle-animation hover:elevated-shadow">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4"
                style={{ backgroundColor: 'var(--accent-blue)' }}
              ></div>
              <h3 className="text-xl font-semibold mb-2">Accent Blue</h3>
              <p className="text-muted-foreground">#2563eb</p>
            </Card>

            <Card className="p-8 text-center subtle-shadow gentle-animation hover:elevated-shadow">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4"
                style={{ backgroundColor: 'var(--accent-emerald)' }}
              ></div>
              <h3 className="text-xl font-semibold mb-2">Accent Emerald</h3>
              <p className="text-muted-foreground">#059669</p>
            </Card>

            <Card className="p-8 text-center subtle-shadow gentle-animation hover:elevated-shadow">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4"
                style={{ backgroundColor: 'var(--accent-purple)' }}
              ></div>
              <h3 className="text-xl font-semibold mb-2">Accent Purple</h3>
              <p className="text-muted-foreground">#7c3aed</p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;