import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, X, Trash2 } from 'lucide-react';
import { Input } from '@maill/shared';
import {
  useSearchAllQuery,
  useSearchHistoryQuery,
  useClearHistoryMutation,
} from './searchApi';

type Tab = 'all' | 'show' | 'artist' | 'article';

interface HitItem {
  id?: number | string;
  name?: string;
  stage_name?: string;
  title?: string;
  venue?: string;
  bio?: string;
  summary?: string;
  poster_url?: string;
  avatar_url?: string;
  cover_url?: string;
  _highlight?: Record<string, string>;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [kw, setKw] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  const { data: history = [], refetch: refetchHistory } = useSearchHistoryQuery();
  const [clearHistory] = useClearHistoryMutation();
  const { data: results, isFetching } = useSearchAllQuery({ kw }, { skip: !kw });

  // 输入防抖 300ms
  useEffect(() => {
    const t = setTimeout(() => setKw(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  // 搜索后刷新历史
  useEffect(() => {
    if (kw) refetchHistory();
  }, [kw, refetchHistory]);

  const Hl = ({ text, html }: { text?: string; html?: string }) => {
    if (html) return <span dangerouslySetInnerHTML={{ __html: html }} />;
    return <span>{text ?? ''}</span>;
  };

  const showList = (results?.show?.list ?? []) as HitItem[];
  const artistList = (results?.artist?.list ?? []) as HitItem[];
  const articleList = (results?.article?.list ?? []) as HitItem[];

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="搜索演出 / 艺人 / 资讯"
            className="pl-9 h-10 rounded-xl"
          />
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput('');
                setKw('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center"
              aria-label="clear"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {!kw && history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">最近搜索</h3>
            <button
              type="button"
              onClick={() => clearHistory()}
              className="text-xs text-muted-foreground inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> 清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(h)}
                className="rounded-full bg-muted px-3 py-1 text-xs"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {kw && (
        <>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
            {(['all', 'show', 'artist', 'article'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  'shrink-0 rounded-full px-3 py-1 text-xs transition-colors ' +
                  (tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted')
                }
              >
                {t === 'all' ? '全部' : t === 'show' ? '演出' : t === 'artist' ? '艺人' : '资讯'}
              </button>
            ))}
          </div>

          {isFetching && <p className="text-sm text-muted-foreground">Searching...</p>}

          {(tab === 'all' || tab === 'show') && showList.length > 0 && (
            <Section title="演出">
              {showList.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(`/show/${s.id}`)}
                  className="w-full text-left rounded-xl border bg-card p-3 flex gap-3 hover:shadow-md"
                >
                  {s.poster_url ? (
                    <img src={s.poster_url} alt="" className="w-16 h-20 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-20 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      <Hl text={s.name} html={s._highlight?.name} />
                    </div>
                    {s.venue && <p className="text-xs text-muted-foreground truncate">{s.venue}</p>}
                  </div>
                </button>
              ))}
            </Section>
          )}

          {(tab === 'all' || tab === 'artist') && artistList.length > 0 && (
            <Section title="艺人">
              {artistList.map((a, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(`/artist/${a.id}`)}
                  className="w-full text-left rounded-xl border bg-card p-3 flex gap-3 hover:shadow-md"
                >
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      <Hl
                        text={a.stage_name || a.name}
                        html={a._highlight?.stage_name || a._highlight?.name}
                      />
                    </div>
                    {a.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        <Hl text={a.bio} html={a._highlight?.bio} />
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </Section>
          )}

          {(tab === 'all' || tab === 'article') && articleList.length > 0 && (
            <Section title="资讯">
              {articleList.map((art, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => navigate(`/article/${art.id}`)}
                  className="w-full text-left rounded-xl border bg-card p-3 flex gap-3 hover:shadow-md"
                >
                  {art.cover_url ? (
                    <img src={art.cover_url} alt="" className="w-16 h-16 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      <Hl text={art.title} html={art._highlight?.title} />
                    </div>
                    {art.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <Hl text={art.summary} html={art._highlight?.summary} />
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </Section>
          )}

          {!isFetching &&
            showList.length === 0 &&
            artistList.length === 0 &&
            articleList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-8">没有找到相关结果</p>
            )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
