import React from 'react';
import { AlertTriangle, Lightbulb, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpContentProps, HelpContentItem } from '../types/help';
import { getHelpSection } from '../data/helpContent';

const HelpContent: React.FC<HelpContentProps> = ({ section, theme }) => {
  const sectionData = getHelpSection(section);

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
          1: 'text-2xl font-bold mb-4 text-foreground',
          2: 'text-xl font-semibold mb-3 mt-6 text-foreground',
          3: 'text-lg font-medium mb-2 mt-4 text-foreground',
          4: 'text-base font-medium mb-2 mt-3 text-foreground',
          5: 'text-sm font-medium mb-1 mt-2 text-foreground',
          6: 'text-sm font-medium mb-1 mt-2 text-foreground'
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
          <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
            {item.content as string}
          </p>
        );

      case 'list':
        const listItems = Array.isArray(item.content) ? item.content : [item.content];
        return (
          <ul key={index} className="mb-4 space-y-2">
            {listItems.map((listItem, listIndex) => (
              <li key={listIndex} className="flex items-start gap-2 text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="leading-relaxed">{listItem}</span>
              </li>
            ))}
          </ul>
        );

      case 'code':
        return (
          <div key={index} className="mb-4">
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Code</span>
              </div>
              <pre className="text-sm font-mono text-foreground whitespace-pre-wrap overflow-x-auto">
                {item.content as string}
              </pre>
            </div>
          </div>
        );

      case 'warning':
        return (
          <div key={index} className="mb-4">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-700 dark:text-orange-300 leading-relaxed">
                    {item.content as string}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tip':
        return (
          <div key={index} className="mb-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
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
      <div className="p-6 sm:p-6 p-4">
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <sectionData.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{sectionData.title}</h1>
              <p className="text-sm text-muted-foreground">{sectionData.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-0">
          {sectionData.content.map((item, index) => renderContentItem(item, index))}
        </div>
      </div>
    </div>
  );
};

export default HelpContent;