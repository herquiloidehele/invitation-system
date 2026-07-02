"use client";

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MediaUpload from "@/components/admin/MediaUpload";
import VideoSequenceCover from "@/components/shared/VideoSequenceCover";
import { isValidCoverVideoItem } from "@/lib/cover-videos";
import type { CoverVideoItem, CoverVideos } from "@/lib/types";

const MAX_CLIPS = 4;
/** Per-clip size cap. Kept small on purpose — these load on the guest's phone
 *  the moment they tap, so a heavy sequence spikes data + memory on low-end
 *  in-app WebViews. */
const MAX_CLIP_MB = 25;
/** Soft guidance thresholds for the editor warnings. */
const LONG_CLIP_SEC = 15;
const LONG_SEQUENCE_SEC = 40;
const EMPTY: CoverVideos = { enabled: false, items: [] };

interface ClipMeta {
  duration: number;
  w: number;
  h: number;
}

interface CoverVideosEditorProps {
  value: CoverVideos | undefined;
  onChange: (next: CoverVideos) => void;
}

export default function CoverVideosEditor({
  value,
  onChange,
}: CoverVideosEditorProps) {
  const config = value ?? EMPTY;
  const items = config.items ?? [];
  const validItems = items.filter(isValidCoverVideoItem);

  // Client-read metadata (duration + dimensions) keyed by URL, so we can show
  // per-clip length/orientation feedback and a total runtime.
  const [meta, setMeta] = useState<Record<string, ClipMeta>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const recordMeta = (url: string, el: HTMLVideoElement) => {
    if (!Number.isFinite(el.duration)) return;
    setMeta((m) =>
      m[url]
        ? m
        : {
            ...m,
            [url]: {
              duration: el.duration,
              w: el.videoWidth,
              h: el.videoHeight,
            },
          },
    );
  };

  const setItems = (nextItems: CoverVideoItem[]) =>
    onChange({ ...config, items: nextItems });

  const addItem = (item: CoverVideoItem) => {
    if (items.length >= MAX_CLIPS) return;
    setItems([...items, item]);
  };

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const totalDuration = items.reduce(
    (sum, it) => sum + (meta[it.url]?.duration ?? 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Cover-type toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label>Capa em vídeo</Label>
          <p className="text-xs text-muted-foreground">
            Substitui o envelope por uma sequência de vídeos reproduzida antes
            do convite. Precisa de pelo menos um vídeo.
          </p>
        </div>
        <Switch
          checked={config.enabled}
          onCheckedChange={(v) => onChange({ ...config, enabled: v })}
        />
      </div>

      {config.enabled && (
        <>
          {/* Enabled-but-empty warning (falls back to the envelope). */}
          {validItems.length === 0 && (
            <p className="text-xs text-amber-600">
              Ativo, mas sem vídeos — o convite mostrará o envelope. Adicione
              pelo menos um vídeo.
            </p>
          )}

          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, index) => {
                const m = meta[item.url];
                const isLandscape = m ? m.w > m.h : false;
                const isLong = m ? m.duration > LONG_CLIP_SEC : false;
                return (
                  <div
                    key={`${item.url}-${index}`}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2"
                  >
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-black">
                      <video
                        src={item.url}
                        poster={item.poster}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                        onLoadedMetadata={(e) =>
                          recordMeta(item.url, e.currentTarget)
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-medium">Vídeo {index + 1}</p>
                      <p className="text-xs text-muted-foreground">
                        {m
                          ? `${m.duration.toFixed(1)}s · ${m.w}×${m.h}`
                          : "A ler informação…"}
                      </p>
                      {isLandscape && (
                        <p className="text-xs text-amber-600">
                          Horizontal — será cortado nas laterais no telemóvel.
                        </p>
                      )}
                      {isLong && (
                        <p className="text-xs text-amber-600">
                          Vídeo longo — considere encurtar.
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={index === items.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total runtime + preview */}
          {validItems.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {totalDuration > 0
                  ? `Sequência: ~${Math.round(totalDuration)}s`
                  : "Sequência"}
                {totalDuration > LONG_SEQUENCE_SEC && (
                  <span className="text-amber-600">
                    {" "}
                    — longa, considere encurtar.
                  </span>
                )}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewKey((k) => k + 1);
                  setPreviewOpen(true);
                }}
              >
                <PlayIcon className="mr-1.5 h-4 w-4" />
                Pré-visualizar
              </Button>
            </div>
          )}

          {items.length < MAX_CLIPS ? (
            <div className="space-y-1.5">
              <Label>
                Adicionar vídeo ({items.length}/{MAX_CLIPS})
              </Label>
              <MediaUpload
                kind="video"
                maxSizeMB={MAX_CLIP_MB}
                onUpload={(url, meta2) =>
                  addItem({ url, poster: meta2?.posterUrl })
                }
                onClear={() => {}}
                label="Arraste um vídeo para a capa"
              />
              <p className="text-xs text-muted-foreground">
                Até {MAX_CLIPS} vídeos verticais e curtos (idealmente ≤{" "}
                {LONG_CLIP_SEC}s cada) — são carregados no telemóvel do
                convidado assim que ele toca.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Máximo de {MAX_CLIPS} vídeos atingido.
            </p>
          )}

          {/* Preview modal — renders the real guest cover in a phone frame. */}
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Pré-visualização da capa</DialogTitle>
              </DialogHeader>
              <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-2xl bg-black">
                {previewOpen && (
                  <VideoSequenceCover
                    key={previewKey}
                    items={validItems}
                    onOpen={() => {}}
                    onAnimationComplete={() => {}}
                    onUnavailable={() => {}}
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Toque no vídeo para reproduzir.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewKey((k) => k + 1)}
                >
                  Repetir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
