import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Heart } from 'lucide-react';
import { Button, extractErrorMessage, notify } from '@maill/shared';
import {
  useGetArtistQuery,
  useCheckFollowQuery,
  useFollowArtistMutation,
  useUnfollowArtistMutation,
} from './artistsApi';
import { useListByArtistQuery } from '@/features/articles/articlesApi';

export default function ArtistDetailPage() {
  const { t } = useTranslation(['artist', 'common']);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const artistId = Number(id);
  const { data: artist, isLoading } = useGetArtistQuery(artistId, { skip: !artistId });
  const { data: articles = [] } = useListByArtistQuery(artistId, { skip: !artistId });
  const { data: following = false } = useCheckFollowQuery(artistId, { skip: !artistId });
  const [followArtist, { isLoading: following1 }] = useFollowArtistMutation();
  const [unfollowArtist, { isLoading: unfollowing }] = useUnfollowArtistMutation();
  const busy = following1 || unfollowing;

  const onToggleFollow = async () => {
    try {
      if (following) {
        await unfollowArtist(artistId).unwrap();
      } else {
        await followArtist(artistId).unwrap();
      }
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  return (
    <div>
      <div className="relative h-44 bg-gradient-brand-soft">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common:actions.back')}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 -mt-12 relative">
        {artist?.avatarUrl ? (
          <img
            src={artist.avatarUrl}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-4 border-background"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted border-4 border-background flex items-center justify-center">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {isLoading || !artist ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {artist.stageName || artist.name}
                </h1>
                {artist.stageName && artist.name !== artist.stageName && (
                  <p className="text-sm text-muted-foreground">{artist.name}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {(artist.followCount ?? 0)} · {(artist.showCount ?? 0)} · {artist.nationality || '-'}
                </p>
              </div>
              <Button
                variant={following ? 'outline' : 'default'}
                size="sm"
                onClick={onToggleFollow}
                disabled={busy}
              >
                <Heart className={'h-4 w-4 mr-1.5 ' + (following ? 'fill-current' : '')} />
                {following ? t('artist:user.following') : t('artist:user.follow')}
              </Button>
            </div>

            {artist.tags && (
              <div className="flex flex-wrap gap-2">
                {artist.tags.split(',').map((tag, i) => (
                  <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {artist.bio && (
              <section>
                <h3 className="text-sm font-medium mb-1">{t('artist:user.bio')}</h3>
                <p className="text-sm text-foreground/80">{artist.bio}</p>
              </section>
            )}

            {artist.description && (
              <section>
                <h3 className="text-sm font-medium mb-1">{t('artist:user.description')}</h3>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{artist.description}</p>
              </section>
            )}

            <section>
              <h3 className="text-sm font-medium mb-2">{t('artist:user.tabShows')}</h3>
              <p className="text-sm text-muted-foreground">{t('artist:user.noShows')}</p>
            </section>

            <section>
              <h3 className="text-sm font-medium mb-2">{t('artist:user.tabArticles')}</h3>
              {articles.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('artist:user.noArticles')}</p>
              ) : (
                <div className="space-y-2">
                  {articles.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigate(`/article/${a.id}`)}
                      className="w-full text-left rounded-xl border bg-card p-3 hover:shadow-md transition-shadow flex gap-3"
                    >
                      {a.coverUrl && (
                        <img
                          src={a.coverUrl}
                          alt=""
                          className="w-16 h-16 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{a.title}</div>
                        {a.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {a.summary}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
