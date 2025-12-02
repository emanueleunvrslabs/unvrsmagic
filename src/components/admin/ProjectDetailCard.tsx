import "../labs/SocialMediaCard.css";
import { GitBranch, Receipt, FileText, CheckSquare, Kanban, X } from "lucide-react";
import { useState } from "react";

interface ProjectDetailCardProps {
  project: {
    id: string;
    project_name: string;
    description?: string;
  };
  onClose: () => void;
}

export function ProjectDetailCard({ project, onClose }: ProjectDetailCardProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const togglePanel = (panel: string) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  return (
    <div className="client-card-wrapper">
      <div 
        className={`social-media-card ${activePanel ? 'expanded-lateral' : ''} group`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-all"
          aria-label="Close project"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
        
        <div className="card-main-content">
          <img
            src="https://uiverse.io/astronaut.png"
            alt="Project"
            className="astronaut-image"
          />
          <div className="card-heading">
            {project.project_name}
          </div>
          
          <div className="social-icons">
            <button 
              className="instagram-link" 
              onClick={(e) => {
                e.stopPropagation();
                togglePanel('workflow');
              }}
              title="Workflow"
            >
              <GitBranch className="icon" strokeWidth={2} />
            </button>
            <button 
              className="x-link" 
              onClick={(e) => {
                e.stopPropagation();
                togglePanel('invoice');
              }}
              title="Invoice"
            >
              <Receipt className="icon" strokeWidth={2} />
            </button>
            <button 
              className="discord-link" 
              onClick={(e) => {
                e.stopPropagation();
                togglePanel('documents');
              }}
              title="Documents"
            >
              <FileText className="icon" strokeWidth={2} />
            </button>
            <button 
              className="instagram-link" 
              onClick={(e) => {
                e.stopPropagation();
                togglePanel('todo');
              }}
              title="Todo"
            >
              <CheckSquare className="icon" strokeWidth={2} />
            </button>
            <button 
              className="x-link" 
              onClick={(e) => {
                e.stopPropagation();
                togglePanel('kanban');
              }}
              title="Kanban"
            >
              <Kanban className="icon" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Lateral Panel */}
        <div className={`contacts-section-lateral ${activePanel ? 'open' : ''}`}>
        {activePanel === 'workflow' && (
            <div className="flex flex-col gap-4 w-full min-w-[15em]">
              <h3 className="text-base font-semibold text-white/90 border-b border-white/10 pb-2">Workflow</h3>
              <div className="flex flex-col gap-3">
                <p className="text-xs text-white/60">Manage project workflows and automation.</p>
                <div className="flex flex-col gap-2">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-white/70">No workflows configured yet</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activePanel === 'invoice' && (
            <div className="flex flex-col gap-3 w-full">
              <h3 className="text-sm font-semibold text-white/90">Invoice</h3>
              <p className="text-xs text-white/60">View and manage project invoices.</p>
            </div>
          )}
          
          {activePanel === 'documents' && (
            <div className="flex flex-col gap-3 w-full">
              <h3 className="text-sm font-semibold text-white/90">Documents</h3>
              <p className="text-xs text-white/60">Project documentation and files.</p>
            </div>
          )}
          
          {activePanel === 'todo' && (
            <div className="flex flex-col gap-3 w-full">
              <h3 className="text-sm font-semibold text-white/90">Todo</h3>
              <p className="text-xs text-white/60">Track project tasks and to-dos.</p>
            </div>
          )}
          
          {activePanel === 'kanban' && (
            <div className="flex flex-col gap-3 w-full">
              <h3 className="text-sm font-semibold text-white/90">Kanban</h3>
              <p className="text-xs text-white/60">Visual project board management.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
