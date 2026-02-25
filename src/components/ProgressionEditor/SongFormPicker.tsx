import { useState } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import {
  getSongFormTemplates,
  createArrangementFromTemplate,
} from "@services/progression/ProgressionManager";
import type { SongFormTemplate } from "@/types/progression";

interface SongFormPickerProps {
  /** Called when a template is selected */
  onTemplateSelected?: (templateId: string) => void;
}

export default function SongFormPicker({
  onTemplateSelected,
}: SongFormPickerProps) {
  const templates = getSongFormTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { setSections, setArrangementBlocks, sections } = useProgressionStore();

  const handleApplyTemplate = (template: SongFormTemplate) => {
    // Get the current key root from store or default to C (60)
    const currentSections = useProgressionStore.getState().sections;
    const keyRoot = currentSections[0]?.progression[0]?.notes?.[0] ?? 60;

    // Create arrangement from template
    const { sections: newSections, blocks: newBlocks } =
      createArrangementFromTemplate(template.id, {
        key: keyRoot,
        startBeat: 0,
      });

    // Replace all sections and blocks in the store
    setSections(newSections);
    setArrangementBlocks(newBlocks);

    setSelectedTemplate(template.id);
    onTemplateSelected?.(template.id);

    // Collapse the picker after selection
    setIsExpanded(false);
  };

  return (
    <div className="border rounded-md p-2 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium">Song Form</div>
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Current form display */}
      <div className="mb-2">
        {sections.length > 0 ? (
          <div className="text-sm">
            <span className="muted-text">Current: </span>
            <span className="font-medium">
              {sections.length} section{sections.length !== 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <div className="text-sm muted-text">No sections yet</div>
        )}
      </div>

      {/* Template picker */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          <div className="text-[10px] muted-text mb-1">
            Select a form template:
          </div>
          {templates.map((template) => (
            <button
              key={template.id}
              className={`w-full text-left p-2 rounded border transition-colors ${
                selectedTemplate === template.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 hover:bg-muted"
              }`}
              onClick={() => handleApplyTemplate(template)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{template.name}</span>
                <span className="text-xs muted-text">
                  {template.structure.join("-")}
                </span>
              </div>
              <div className="text-xs muted-text mt-1">
                {template.description}
              </div>
              <div className="text-[10px] muted-text mt-1">
                {template.structure.length} sections •{" "}
                {template.defaultBeatsPerBar ?? 4}/4
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
