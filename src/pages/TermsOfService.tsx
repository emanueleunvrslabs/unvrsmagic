import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold text-foreground mb-8">Termini di Servizio</h1>
          
          <p className="text-muted-foreground mb-6">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Accettazione dei Termini</h2>
            <p className="text-muted-foreground">
              Utilizzando UNVRS Magic AI ("Servizio"), accetti di essere vincolato da questi Termini di Servizio. 
              Se non accetti questi termini, non utilizzare il Servizio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Descrizione del Servizio</h2>
            <p className="text-muted-foreground">
              UNVRS Magic AI è una piattaforma che offre strumenti di generazione contenuti basati su intelligenza artificiale, 
              inclusa la creazione di immagini, video e la gestione automatizzata dei social media.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Utente</h2>
            <p className="text-muted-foreground mb-4">Per utilizzare il Servizio devi:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Avere almeno 18 anni di età</li>
              <li>Fornire informazioni accurate e complete durante la registrazione</li>
              <li>Mantenere la sicurezza delle tue credenziali di accesso</li>
              <li>Notificarci immediatamente in caso di accesso non autorizzato</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Utilizzo Accettabile</h2>
            <p className="text-muted-foreground mb-4">Accetti di non utilizzare il Servizio per:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Generare contenuti illegali, diffamatori o offensivi</li>
              <li>Violare diritti di proprietà intellettuale di terzi</li>
              <li>Creare deepfake o contenuti ingannevoli</li>
              <li>Spam o attività di marketing non autorizzate</li>
              <li>Qualsiasi attività che violi leggi applicabili</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Crediti e Pagamenti</h2>
            <p className="text-muted-foreground">
              Il Servizio utilizza un sistema di crediti per la generazione di contenuti. 
              I crediti acquistati non sono rimborsabili salvo quanto previsto dalla legge applicabile. 
              I prezzi possono essere modificati con preavviso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Proprietà dei Contenuti</h2>
            <p className="text-muted-foreground">
              I contenuti che generi utilizzando il Servizio sono di tua proprietà, soggetti ai termini 
              delle piattaforme AI sottostanti. Ci concedi una licenza limitata per memorizzare e 
              processare i tuoi contenuti al fine di fornire il Servizio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Connessione Social Media</h2>
            <p className="text-muted-foreground">
              Quando connetti account social media (Instagram, YouTube, TikTok), ci autorizzi a pubblicare 
              contenuti per tuo conto secondo le tue istruzioni. Sei responsabile di assicurarti che i 
              contenuti pubblicati rispettino i termini di servizio delle rispettive piattaforme.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Limitazione di Responsabilità</h2>
            <p className="text-muted-foreground">
              Il Servizio è fornito "così com'è" senza garanzie di alcun tipo. Non siamo responsabili per 
              danni indiretti, incidentali o consequenziali derivanti dall'uso del Servizio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Modifiche ai Termini</h2>
            <p className="text-muted-foreground">
              Possiamo modificare questi Termini in qualsiasi momento. Le modifiche saranno efficaci 
              dalla pubblicazione sul sito. L'uso continuato del Servizio costituisce accettazione 
              dei termini modificati.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Risoluzione</h2>
            <p className="text-muted-foreground">
              Possiamo sospendere o terminare il tuo accesso al Servizio in qualsiasi momento per 
              violazione di questi Termini o per qualsiasi altro motivo a nostra discrezione.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Legge Applicabile</h2>
            <p className="text-muted-foreground">
              Questi Termini sono regolati dalle leggi italiane. Qualsiasi controversia sarà sottoposta 
              alla giurisdizione esclusiva dei tribunali italiani.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Contatti</h2>
            <p className="text-muted-foreground">
              Per domande su questi Termini di Servizio, contattaci a:{" "}
              <a href="mailto:legal@unvrslabs.com" className="text-primary hover:underline">
                legal@unvrslabs.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
