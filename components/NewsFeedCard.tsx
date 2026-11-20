import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { NewsItem } from '../types';
import { useI18n } from '../utils/i18n';

interface NewsFeedCardProps {
  newsFeed: NewsItem[];
  newsRef: React.RefObject<HTMLDivElement | null>;
  showNewsMobile: boolean;
  onToggleMobile: () => void;
}

export const NewsFeedCard: React.FC<NewsFeedCardProps> = ({
  newsFeed,
  newsRef,
  showNewsMobile,
  onToggleMobile,
}) => {
  const { t } = useI18n();

  return (
    <div
      className={`paper-card w-full md:w-80 flex flex-col overflow-hidden transition-all ${
        !showNewsMobile ? 'h-auto md:h-36' : 'h-36 md:h-36'
      }`}
    >
      <div
        className="bg-sunk px-3.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-ink-3 border-b border-line flex justify-between items-center cursor-pointer md:cursor-default"
        onClick={onToggleMobile}
      >
        <span>{t('cityFeed')}</span>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-clay" />
          <div className="md:hidden text-ink-2">
            {showNewsMobile ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </div>
      </div>

      <div
        ref={newsRef}
        className={`flex-1 overflow-y-auto p-3 space-y-2 text-[11px] scroll-smooth ${
          !showNewsMobile ? 'hidden md:block' : 'block'
        }`}
      >
        {newsFeed.length === 0 && (
          <div className="text-ink-3 italic font-serif text-center mt-5">
            {t('noNews')}
          </div>
        )}
        {newsFeed.map((news) => {
          const borderClass =
            news.type === 'positive'
              ? 'border-sage'
              : news.type === 'negative'
                ? 'border-danger'
                : 'border-clay';
          const ts = parseInt(news.id, 10);
          const timeStr = Number.isFinite(ts)
            ? new Date(ts).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';
          return (
            <div
              key={news.id}
              className={`border-l-2 ${borderClass} pl-2.5 py-0.5 animate-fade-in leading-snug relative text-ink`}
            >
              {timeStr && (
                <span className="text-ink-3 font-mono text-[9px] absolute top-0.5 right-0 tabular-nums">
                  {timeStr}
                </span>
              )}
              <span className="pr-10 block">{news.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
