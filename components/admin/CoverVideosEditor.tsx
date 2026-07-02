"use client";

import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MediaUpload from "@/components/admin/MediaUpload";
import type { CoverVideoItem, CoverVideos } from "@/lib/types";

const MAX_CLIPS = 4;
const EMPTY: CoverVideos = { enabled: false, items: [] };

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
          {items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2"
                >
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-black">
                    {item.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.poster}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="flex-1 text-xs text-muted-foreground">
                    Vídeo {index + 1}
                  </span>
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
              ))}
            </div>
          )}

          {items.length < MAX_CLIPS ? (
            <div className="space-y-1.5">
              <Label>
                Adicionar vídeo ({items.length}/{MAX_CLIPS})
              </Label>
              <MediaUpload
                kind="video"
                maxSizeMB={100}
                onUpload={(url, meta) =>
                  addItem({ url, poster: meta?.posterUrl })
                }
                onClear={() => {}}
                label="Arraste um vídeo para a capa"
              />
              <p className="text-xs text-muted-foreground">
                Até {MAX_CLIPS} vídeos, reproduzidos em sequência. Mantenha-os
                curtos e leves — são carregados no telemóvel do convidado.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Máximo de {MAX_CLIPS} vídeos atingido.
            </p>
          )}
        </>
      )}
    </div>
  );
}
