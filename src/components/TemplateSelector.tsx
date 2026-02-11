/**
 * TemplateSelector - Browse and select care plan templates
 *
 * Displays templates grouped by category. Clicking a template shows a preview
 * of its missions and medications before confirming selection.
 *
 * Requirements: 5.1, 5.2, 5.5
 */

import { useState } from 'react';
import type { CarePlanTemplate } from '../types';
import { FileText, ChevronRight, Pill, Calendar, CheckCircle2, X, Clipboard } from 'lucide-react';

interface TemplateSelectorProps {
  templates: CarePlanTemplate[];
  onSelect: (templateId: string) => void;
  onCancel: () => void;
}

/**
 * Group an array of templates by their category field
 */
function groupByCategory(templates: CarePlanTemplate[]): Map<string, CarePlanTemplate[]> {
  const groups = new Map<string, CarePlanTemplate[]>();
  for (const template of templates) {
    const category = template.category || 'Uncategorized';
    const list = groups.get(category) ?? [];
    list.push(template);
    groups.set(category, list);
  }
  return groups;
}

export function TemplateSelector({ templates, onSelect, onCancel }: TemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const grouped = groupByCategory(templates);
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? null;

  /** Handle confirming the selected template */
  function handleApply() {
    if (selectedTemplateId) {
      onSelect(selectedTemplateId);
    }
  }

  // Empty state
  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
        <Clipboard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-medical-text mb-1">No Templates Available</h3>
        <p className="text-sm text-gray-600 mb-4">
          There are no care plan templates to choose from. You can create a plan from scratch instead.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-white text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-medical-primary" />
          <h3 className="text-base font-semibold text-medical-text">Select a Template</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close template selector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Template list (left panel) */}
        <div className="lg:w-1/2 lg:border-r border-gray-200 max-h-[28rem] overflow-y-auto">
          {Array.from(grouped.entries()).map(([category, categoryTemplates]) => (
            <div key={category}>
              {/* Category header */}
              <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {category}
                </span>
              </div>

              {/* Template items */}
              {categoryTemplates.map((template) => {
                const isActive = template.id === selectedTemplateId;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full text-left px-6 py-4 border-b border-gray-100 transition-colors flex items-center gap-3 ${
                      isActive
                        ? 'bg-blue-50 border-l-4 border-l-medical-primary'
                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium truncate ${isActive ? 'text-medical-primary' : 'text-medical-text'}`}>
                        {template.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {template.missions.length} mission{template.missions.length !== 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Pill className="w-3 h-3" />
                          {template.medications.length} medication{template.medications.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-medical-primary' : 'text-gray-300'}`} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Preview panel (right side) */}
        <div className="lg:w-1/2 max-h-[28rem] overflow-y-auto">
          {!selectedTemplate ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
              <FileText className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Select a template to preview its contents</p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Template header */}
              <div>
                <h4 className="text-base font-semibold text-medical-text">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>

              {/* Missions preview */}
              {selectedTemplate.missions.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Missions ({selectedTemplate.missions.length})
                  </h5>
                  <ul className="space-y-2">
                    {selectedTemplate.missions.map((mission, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <Calendar className="w-4 h-4 text-medical-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-medical-text truncate">
                            {mission.title}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5 capitalize">
                            {mission.type.replace('_', ' ')} &middot; Day {mission.schedule.startDayOffset}+ &middot;{' '}
                            {mission.schedule.recurrence.type}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medications preview */}
              {selectedTemplate.medications.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Medications ({selectedTemplate.medications.length})
                  </h5>
                  <ul className="space-y-2">
                    {selectedTemplate.medications.map((med, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <Pill className="w-4 h-4 text-medical-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-medical-text truncate">
                            {med.medicationName} &mdash; {med.dosage}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">
                            {med.frequency.timesPerDay}x daily
                            {med.durationDays ? ` for ${med.durationDays} days` : ' (ongoing)'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Apply button */}
              <button
                type="button"
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-medical-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply Template
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer with cancel */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-sm text-gray-600 font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
