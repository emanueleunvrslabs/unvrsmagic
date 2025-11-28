export function LandingAbout() {
  return (
    <section id="about" className="py-24">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Chi Siamo
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              UNVRS LABS è un laboratorio di innovazione digitale specializzato nello sviluppo di soluzioni basate sull'intelligenza artificiale.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              Il nostro team di esperti combina creatività e tecnologia per creare esperienze digitali che trasformano il modo in cui le aziende operano e crescono.
            </p>
            <p className="text-lg text-muted-foreground">
              Crediamo nel potere dell'AI per democratizzare l'innovazione e rendere accessibili tecnologie avanzate a business di ogni dimensione.
            </p>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-border/40 backdrop-blur-xl">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-4">AI</div>
                  <div className="text-2xl text-muted-foreground">Powered Innovation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
