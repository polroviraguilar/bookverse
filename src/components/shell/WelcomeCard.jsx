import { BookOpen, Globe2, Layers3, Sparkles } from "lucide-react";
import Button from "../ui/Button.jsx";

export default function WelcomeCard({ stats, onCreate, onImport }) {
  return (
    <section className="bv-welcome-card">
      <div className="bv-welcome-card__glow" />
      <div className="bv-eyebrow"><Sparkles size={13} /> El teu univers literari</div>
      <h1>Construeix una biblioteca que es pugui explorar.</h1>
      <p>Connecta universos, sagues i lectures en un mapa viu. Bookverse guarda la teva col·lecció al navegador i la converteix en una experiència visual.</p>
      <div className="bv-welcome-stats">
        <span><Globe2 size={15} /><strong>{stats.universes}</strong> universos</span>
        <span><Layers3 size={15} /><strong>{stats.sagas}</strong> sagues</span>
        <span><BookOpen size={15} /><strong>{stats.books}</strong> llibres</span>
      </div>
      <div className="bv-welcome-actions">
        <Button variant="primary" icon={Globe2} onClick={() => onCreate("universe")}>Crear un univers</Button>
        <Button icon={BookOpen} onClick={onImport}>Importar Goodreads</Button>
      </div>
    </section>
  );
}
