/**
 * V2 Projects Dashboard — project list view shown when user clicks "Back" from editor.
 *
 * Features:
 * - List all saved V2 projects (newest first)
 * - Edit / Duplicate / Delete actions per project
 * - Delete confirmation modal
 * - Empty state with "New Project" prompt
 */

import {useState} from 'react';
import type {SavedV2Project} from '../stores/projectStore';
import {useV2ProjectStore} from '../stores/projectStore';

interface V2ProjectsDashboardProps {
  onNewProject: () => void;
  onEditProject: (projectId: string) => void;
}

export default function V2ProjectsDashboard({onNewProject, onEditProject}: V2ProjectsDashboardProps) {
  const projects = useV2ProjectStore((s) => s.projects);
  const duplicateProject = useV2ProjectStore((s) => s.duplicateProject);
  const deleteProject = useV2ProjectStore((s) => s.deleteProject);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDuplicate = (id: string) => {
    const newId = duplicateProject(id);
    if (newId) onEditProject(newId);
  };

  const handleDeleteConfirmed = () => {
    if (confirmDeleteId) {
      deleteProject(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const projectToDelete = confirmDeleteId
    ? projects.find((p) => p.id === confirmDeleteId)
    : null;

  return (
    <div style={{
      height: '100%', background: '#0F172A',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #1E293B',
        background: '#0F172A',
      }}>
        <div>
          <h1 style={{color: '#F1F5F9', fontSize: 20, fontWeight: 700, margin: 0}}>
            My Projects
          </h1>
          <p style={{color: '#64748B', fontSize: 12, margin: '4px 0 0 0'}}>
            Vary.video V2 Editor
          </p>
        </div>
        <NewProjectButton onClick={onNewProject} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '16px 20px',
        maxWidth: 800, width: '100%', margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {projects.length === 0 ? (
          <EmptyState onCreateNew={onNewProject} />
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => onEditProject(project.id)}
                onDuplicate={() => handleDuplicate(project.id)}
                onDelete={() => setConfirmDeleteId(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && projectToDelete && (
        <DeleteModal
          projectName={projectToDelete.name}
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────

function NewProjectButton({onClick}: {onClick: () => void}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 8, border: 'none',
      cursor: 'pointer', fontSize: 13, fontWeight: 600,
      background: '#3B82F6', color: '#fff',
      boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
    }}>
      <span style={{fontSize: 16, lineHeight: 1}}>+</span>
      New Project
    </button>
  );
}

function EmptyState({onCreateNew}: {onCreateNew: () => void}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
    }}>
      <div style={{fontSize: 48, marginBottom: 16}}>🎬</div>
      <h2 style={{color: '#E2E8F0', fontSize: 18, fontWeight: 600, margin: '0 0 8px 0'}}>
        No projects yet
      </h2>
      <p style={{color: '#64748B', fontSize: 13, margin: '0 0 20px 0', maxWidth: 360, lineHeight: 1.5}}>
        Create your first V2 project to get started. Projects are saved automatically in your browser.
      </p>
      <NewProjectButton onClick={onCreateNew} />
    </div>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  project: SavedV2Project;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const timeAgo = formatTimeAgo(project.lastModified);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 10,
      background: '#1A202C', border: '1px solid #2D3748',
      transition: 'border-color 0.15s',
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: '#2D3748', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        📄
      </div>

      {/* Info */}
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{color: '#E2E8F0', fontSize: 14, fontWeight: 600, marginBottom: 2}}>
          {project.name}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
          <span style={{color: '#64748B', fontSize: 11}}>{timeAgo}</span>
          <Badge>{project.aspectRatio}</Badge>
          <Badge>{project.sceneCount} scene{project.sceneCount !== 1 ? 's' : ''}</Badge>
          <Badge>{project.elementCount} element{project.elementCount !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Actions */}
      <div style={{display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0}}>
        <ActionButton label="Edit" onClick={onEdit} primary />
        <ActionButton label="Dup" onClick={onDuplicate} />
        <ActionButton label="Del" onClick={onDelete} danger />
      </div>
    </div>
  );
}

function Badge({children}: {children: React.ReactNode}) {
  return (
    <span style={{
      fontSize: 10, color: '#94A3B8', background: '#2D3748',
      padding: '2px 6px', borderRadius: 4, fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

function ActionButton({
  label, onClick, primary, danger,
}: {
  label: string; onClick: () => void; primary?: boolean; danger?: boolean;
}) {
  return (
    <button onClick={(e) => {e.stopPropagation(); onClick();}} style={{
      padding: '4px 10px', borderRadius: 5, border: 'none',
      cursor: 'pointer', fontSize: 11, fontWeight: 600,
      background: primary ? '#3B82F6' : danger ? 'transparent' : '#2D3748',
      color: primary ? '#fff' : danger ? '#F87171' : '#94A3B8',
      border: danger ? '1px solid #3B1E1E' : 'none',
    }}>
      {label}
    </button>
  );
}

function DeleteModal({
  projectName,
  onCancel,
  onConfirm,
}: {
  projectName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 12000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      padding: 20,
    }}>
      <div style={{
        background: '#1A202C', borderRadius: 12, border: '1px solid #2D3748',
        padding: '24px 20px', maxWidth: 360, width: '100%',
      }}>
        <div style={{fontSize: 18, marginBottom: 8}}>🗑</div>
        <h3 style={{color: '#F1F5F9', fontSize: 16, fontWeight: 600, margin: '0 0 8px 0'}}>
          Delete Project?
        </h3>
        <p style={{color: '#94A3B8', fontSize: 13, margin: '0 0 20px 0', lineHeight: 1.5}}>
          Are you sure you want to delete <strong style={{color: '#F1F5F9'}}>"{projectName}"</strong>?
          This action cannot be undone.
        </p>
        <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
          <button onClick={onCancel} style={{
            padding: '8px 18px', borderRadius: 6, border: '1px solid #374151',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'transparent', color: '#94A3B8',
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            padding: '8px 18px', borderRadius: 6, border: 'none',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: '#DC2626', color: '#fff',
          }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Formatting ────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}
