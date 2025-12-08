import React from 'react';
import { AlertTriangle, Lightbulb, Code } from 'lucide-react';
import { HelpContentProps, HelpContentItem, HelpQuickAction } from '../types/help';
import { getHelpSection } from '../data/helpContent';

const HelpContent: React.FC<HelpContentProps> = ({ section, theme, mode }) => {
  const currentMode = mode ?? 'documentation';
  const sectionData = getHelpSection(section, currentMode);

  if (!sectionData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Contenu non disponible</p>
        </div>
      </div>
    );
  }

  const renderContentItem = (item: HelpContentItem, index: number) => {
    switch (item.type) {
      case 'heading':
        const HeadingTag = `h${Math.min(item.level || 1, 6)}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: 'text-xl font-semibold mb-3 text-foreground',
          2: 'text-lg font-semibold mb-2 mt-5 text-foreground',
          3: 'text-base font-medium mb-1.5 mt-3 text-foreground',
          4: 'text-sm font-medium mb-1 mt-3 text-foreground',
          5: 'text-xs font-semibold mb-1 mt-2 text-foreground tracking-tight',
          6: 'text-xs font-semibold mb-1 mt-2 text-foreground tracking-tight'
        };
        
        return (
          <HeadingTag 
            key={index} 
            className={headingClasses[item.level as keyof typeof headingClasses] || headingClasses[1]}
          >
            {item.content as string}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p key={index} className="mb-3 text-sm text-muted-foreground leading-relaxed">
            {item.content as string}
          </p>
        );

      case 'list':
        const listItems = Array.isArray(item.content) ? item.content : [item.content];
        return (
          <ul key={index} className="mb-3 space-y-1.5">
            {listItems.map((listItem, listIndex) => (
              <li key={listIndex} className="flex items-start gap-2 text-muted-foreground text-sm leading-relaxed">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{listItem}</span>
              </li>
            ))}
          </ul>
        );

      case 'quickstart':
        const quickActions = Array.isArray(item.content) ? item.content as HelpQuickAction[] : [];
        return (
          <div key={index} className="mb-4">
            <div className="grid gap-2.5 grid-cols-1">
              {quickActions.map((action, actionIndex) => (
                <div
                  key={actionIndex}
                  className="rounded-lg border border-border/50 bg-muted/30 px-3 py-3 flex items-start gap-3 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs">
                    {action.icon || '•'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground leading-tight">{action.title}</p>
                      {action.shortcut && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-background border text-muted-foreground">
                          {action.shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'code':
        return (
          <div key={index} className="mb-3">
            <div className="bg-muted/50 rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Code className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Code</span>
              </div>
              <pre className="text-xs md:text-sm font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
                {item.content as string}
              </pre>
            </div>
          </div>
        );

      case 'warning':
        return (
          <div key={index} className="mb-3">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-700 dark:text-orange-300 leading-relaxed text-sm">
                    {item.content as string}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tip':
        return (
          <div key={index} className="mb-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-700 dark:text-blue-300 leading-relaxed text-sm">
                    {item.content as string}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        {/* Section Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <sectionData.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{sectionData.title}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{sectionData.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {sectionData.content.map((item, index) => renderContentItem(item, index))}
        </div>
      </div>
    </div>
  );
};

export default HelpContent;