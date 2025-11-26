import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Torna alla Home
            </Button>
          </Link>
        </div>

        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <p className="text-muted-foreground mb-6">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduzione</h2>
            <p className="text-muted-foreground">
              UNVRS LABS ("noi", "nostro" o "ci") gestisce la piattaforma UNVRS Magic AI. 
              Questa Privacy Policy descrive come raccogliamo, utilizziamo e proteggiamo le tue informazioni 
              personali quando utilizzi i nostri servizi.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Informazioni che Raccogliamo</h2>
            <p className="text-muted-foreground mb-4">Raccogliamo le seguenti categorie di informazioni:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Informazioni dell'account:</strong> Nome, email, numero di telefono quando crei un account.</li>
              <li><strong>Dati di utilizzo:</strong> Informazioni su come utilizzi i nostri servizi.</li>
              <li><strong>Connessioni social media:</strong> Quando connetti account social (Instagram, YouTube, TikTok), 
                  riceviamo token di accesso per pubblicare contenuti per tuo conto.</li>
              <li><strong>Contenuti generati:</strong> Immagini e video che crei utilizzando i nostri strumenti AI.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Utilizzo delle Informazioni</h2>
            <p className="text-muted-foreground mb-4">Utilizziamo le tue informazioni per:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Fornire e migliorare i nostri servizi</li>
              <li>Generare contenuti AI secondo le tue richieste</li>
              <li>Pubblicare contenuti sui tuoi account social connessi</li>
              <li>Gestire il tuo account e le transazioni</li>
              <li>Comunicare aggiornamenti e informazioni sui servizi</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Accesso ai Dati YouTube</h2>
            <p className="text-muted-foreground mb-4">
              Quando connetti il tuo account YouTube, richiediamo accesso per:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Visualizzare le informazioni del tuo canale YouTube</li>
              <li>Gestire i tuoi video e live streaming</li>
              <li>Pubblicare contenuti per tuo conto</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Puoi revocare l'accesso in qualsiasi momento dalle impostazioni del tuo account Google: {" "}
              <a 
                href="https://myaccount.google.com/permissions" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://myaccount.google.com/permissions
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Condivisione delle Informazioni</h2>
            <p className="text-muted-foreground">
              Non vendiamo le tue informazioni personali. Possiamo condividere le tue informazioni solo con:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Fornitori di servizi che ci aiutano a gestire la piattaforma (es. hosting, generazione AI)</li>
              <li>Piattaforme social media quando pubblichi contenuti tramite il nostro servizio</li>
              <li>Autorità legali quando richiesto dalla legge</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Sicurezza dei Dati</h2>
            <p className="text-muted-foreground">
              Implementiamo misure di sicurezza tecniche e organizzative per proteggere le tue informazioni, 
              inclusa la crittografia dei dati sensibili e l'accesso limitato ai dati personali.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. I Tuoi Diritti</h2>
            <p className="text-muted-foreground mb-4">Hai il diritto di:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Accedere ai tuoi dati personali</li>
              <li>Correggere dati inesatti</li>
              <li>Richiedere la cancellazione dei tuoi dati</li>
              <li>Revocare il consenso al trattamento</li>
              <li>Esportare i tuoi dati</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Conservazione dei Dati</h2>
            <p className="text-muted-foreground">
              Conserviamo i tuoi dati per il tempo necessario a fornire i nostri servizi o come richiesto dalla legge. 
              Puoi richiedere la cancellazione del tuo account in qualsiasi momento.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Modifiche alla Privacy Policy</h2>
            <p className="text-muted-foreground">
              Possiamo aggiornare questa Privacy Policy periodicamente. Ti notificheremo di modifiche significative 
              tramite email o avviso sulla piattaforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Contatti</h2>
            <p className="text-muted-foreground">
              Per domande sulla nostra Privacy Policy o sul trattamento dei tuoi dati, contattaci a:{" "}
              <a href="mailto:privacy@unvrslabs.com" className="text-primary hover:underline">
                privacy@unvrslabs.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
