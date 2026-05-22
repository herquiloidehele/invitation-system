"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  GalleryHorizontalEnd,
  ImageIcon,
  LayoutTemplate,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type PickableKind = "invitation" | "save_the_date";

type Pickable = {
  kind: PickableKind;
  id: string;
  slug: string;
  title: string;
  eventType: string | null;
  landingImageUrl: string | null;
  priceLabel: string | null;
};

type FeatureRow = {
  id: string;
  section: "hero" | "gallery" | "live_demo";
  galleryCategory: string | null;
  position: number;
  enabled: boolean;
  invitationId: string | null;
  saveTheDateId: string | null;
  invitation?: {
    slug: string;
    couple: unknown;
    landingImageUrl: string | null;
    heroImage: string | null;
    eventType: string | null;
  } | null;
  saveTheDate?: {
    slug: string;
    couple: unknown;
    landingImageUrl: string | null;
  } | null;
};

type GalleryCategoryKey =
  | "wedding"
  | "save_the_date"
  | "baptism"
  | "anniversary"
  | "engagement";

const CATEGORIES: Array<{ value: GalleryCategoryKey; label: string }> = [
  { value: "wedding", label: "Casamento" },
  { value: "save_the_date", label: "Save the Date" },
  { value: "baptism", label: "Baptizado" },
  { value: "anniversary", label: "Aniversário" },
  { value: "engagement", label: "Noivado" },
];

const LIVE_DEMO_TARGET = 2;

function readTitle(row: FeatureRow): string {
  const source = row.invitation ?? row.saveTheDate;
  if (!source) return "(sem ligação)";
  const couple = source.couple as
    | { bride?: string; groom?: string }
    | undefined;
  return (
    [couple?.bride, couple?.groom].filter(Boolean).join(" & ") || "(sem nome)"
  );
}

function readSlug(row: FeatureRow): string {
  return row.invitation?.slug ?? row.saveTheDate?.slug ?? "";
}

function readHref(row: FeatureRow): string {
  if (row.invitation) return `/admin/invitations/${row.invitationId}/edit`;
  if (row.saveTheDate) return `/admin/save-the-dates/${row.saveTheDateId}/edit`;
  return "#";
}

function readKindLabel(row: FeatureRow): string {
  return row.invitation ? "Convite" : "Save the Date";
}

function readImage(row: FeatureRow): string | null {
  if (row.invitation) {
    return row.invitation.landingImageUrl ?? row.invitation.heroImage ?? null;
  }
  if (row.saveTheDate) {
    return row.saveTheDate.landingImageUrl ?? null;
  }
  return null;
}

export function LandingPageClient() {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [pickables, setPickables] = useState<Pickable[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [featuresRes, pickRes] = await Promise.all([
      fetch("/api/admin/landing-features").then((r) => r.json()),
      fetch("/api/admin/landing-pickable").then((r) => r.json()),
    ]);
    setFeatures(featuresRes);
    setPickables(pickRes);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function addFeature(input: {
    section: FeatureRow["section"];
    galleryCategory?: GalleryCategoryKey;
    pickableId: string;
  }) {
    setBusy(true);
    try {
      const pickable = pickables.find((item) => item.id === input.pickableId);
      if (!pickable) return;
      const res = await fetch("/api/admin/landing-features", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section: input.section,
          galleryCategory: input.galleryCategory ?? null,
          invitationId: pickable.kind === "invitation" ? pickable.id : null,
          saveTheDateId: pickable.kind === "save_the_date" ? pickable.id : null,
          position: features.filter((f) => f.section === input.section).length,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Erro ao adicionar");
      }
      await refresh();
      toast.success("Destaque adicionado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao adicionar");
    } finally {
      setBusy(false);
    }
  }

  async function deleteFeature(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/landing-features/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover");
      await refresh();
      toast.success("Destaque removido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover");
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, delta: number) {
    const row = features.find((f) => f.id === id);
    if (!row) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/landing-features/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ position: row.position + delta }),
      });
      if (!res.ok) throw new Error("Erro a reordenar");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro a reordenar");
    } finally {
      setBusy(false);
    }
  }

  const heroFeature = features.find((row) => row.section === "hero");
  const liveDemo = useMemo(
    () =>
      features
        .filter((row) => row.section === "live_demo")
        .sort((a, b) => a.position - b.position),
    [features],
  );
  const gallery = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        rows: features
          .filter(
            (row) =>
              row.section === "gallery" &&
              row.galleryCategory === category.value,
          )
          .sort((a, b) => a.position - b.position),
      })),
    [features],
  );

  const stats = useMemo(
    () => ({
      hero: heroFeature ? 1 : 0,
      gallery: features.filter((row) => row.section === "gallery").length,
      liveDemo: liveDemo.length,
    }),
    [heroFeature, features, liveDemo],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Landing Page</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha os convites em destaque para cada secção pública.
          </p>
        </div>
        <Button
          render={<a href="/" target="_blank" rel="noreferrer" />}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <ExternalLink className="size-4" />
          Ver landing
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Sparkles}
          label="Hero"
          value={stats.hero}
          hint="Convite em destaque no topo"
        />
        <StatCard
          icon={GalleryHorizontalEnd}
          label="Galeria"
          value={stats.gallery}
          hint={`${CATEGORIES.length} categorias disponíveis`}
        />
        <StatCard
          icon={LayoutTemplate}
          label="Live demo"
          value={stats.liveDemo}
          hint={`${LIVE_DEMO_TARGET} recomendados`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            Destaque do hero
          </CardTitle>
          <CardDescription>
            Aparece no topo da landing page como pré-visualização do convite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {heroFeature ? (
            <FeatureItem
              row={heroFeature}
              busy={busy}
              onRemove={() => deleteFeature(heroFeature.id)}
            />
          ) : (
            <EmptyState text="Sem destaque seleccionado." />
          )}

          <PickableSelect
            label={heroFeature ? "Substituir destaque" : "Selecionar destaque"}
            disabled={busy}
            options={pickables}
            onPick={(pickableId) => addFeature({ section: "hero", pickableId })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutTemplate className="size-4" />
            Live demo
          </CardTitle>
          <CardDescription>
            Dois convites são exibidos lado a lado na secção “Demo ao vivo”.
            {liveDemo.length !== LIVE_DEMO_TARGET ? (
              <span className="ml-1 text-amber-600">
                Recomendamos {LIVE_DEMO_TARGET} — actualmente: {liveDemo.length}
                .
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {liveDemo.length === 0 ? (
            <EmptyState text="Sem demos seleccionadas." />
          ) : (
            liveDemo.map((row, index) => (
              <FeatureItem
                key={row.id}
                row={row}
                busy={busy}
                canMoveUp={index > 0}
                canMoveDown={index < liveDemo.length - 1}
                onMoveUp={() => move(row.id, -1)}
                onMoveDown={() => move(row.id, 1)}
                onRemove={() => deleteFeature(row.id)}
              />
            ))
          )}

          <PickableSelect
            label="Adicionar live demo"
            disabled={busy}
            options={pickables}
            onPick={(pickableId) =>
              addFeature({ section: "live_demo", pickableId })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GalleryHorizontalEnd className="size-4" />
            Galeria
          </CardTitle>
          <CardDescription>
            Cada categoria aparece como um separador na galeria pública.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {gallery.map((category, categoryIndex) => (
            <div key={category.value} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{category.label}</h3>
                <Badge variant="secondary" className="font-normal">
                  {category.rows.length} item
                  {category.rows.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-2">
                {category.rows.length === 0 ? (
                  <EmptyState
                    text={`Sem convites em ${category.label}.`}
                    compact
                  />
                ) : (
                  category.rows.map((row, index) => (
                    <FeatureItem
                      key={row.id}
                      row={row}
                      busy={busy}
                      canMoveUp={index > 0}
                      canMoveDown={index < category.rows.length - 1}
                      onMoveUp={() => move(row.id, -1)}
                      onMoveDown={() => move(row.id, 1)}
                      onRemove={() => deleteFeature(row.id)}
                    />
                  ))
                )}

                <PickableSelect
                  label={`Adicionar a ${category.label}`}
                  disabled={busy}
                  options={pickables}
                  onPick={(pickableId) =>
                    addFeature({
                      section: "gallery",
                      galleryCategory: category.value,
                      pickableId,
                    })
                  }
                />
              </div>

              {categoryIndex < gallery.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureItem({
  row,
  busy,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  row: FeatureRow;
  busy: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
}) {
  const image = readImage(row);
  const slug = readSlug(row);

  return (
    <div className="flex items-center gap-4 rounded-md border bg-card p-3">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={readTitle(row)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-5" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{readTitle(row)}</span>
          <Badge variant="secondary" className="font-normal">
            {readKindLabel(row)}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">/{slug}</p>
      </div>

      <div className="flex items-center gap-1">
        {onMoveUp ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy || !canMoveUp}
            onClick={onMoveUp}
            aria-label="Mover para cima"
          >
            <ArrowUp className="size-4" />
          </Button>
        ) : null}
        {onMoveDown ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={busy || !canMoveDown}
            onClick={onMoveDown}
            aria-label="Mover para baixo"
          >
            <ArrowDown className="size-4" />
          </Button>
        ) : null}
        <Button
          render={<a href={readHref(row)} target="_blank" rel="noreferrer" />}
          variant="ghost"
          size="icon"
          aria-label="Abrir convite"
        >
          <ExternalLink className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
          aria-label="Remover"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 text-sm text-muted-foreground ${
        compact ? "py-3" : "py-6"
      }`}
    >
      <X className="size-4" />
      {text}
    </div>
  );
}

function PickableSelect({
  label,
  options,
  onPick,
  disabled,
}: {
  label: string;
  options: Pickable[];
  onPick: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-sm font-medium text-muted-foreground sm:w-56">
        {label}
      </span>
      <Select
        disabled={disabled}
        value=""
        onValueChange={(value) => {
          if (!value) return;
          onPick(value);
        }}
      >
        <SelectTrigger className="sm:max-w-md">
          <SelectValue placeholder="Escolher convite ou save the date…" />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Sem itens disponíveis.
            </div>
          ) : (
            options.map((option) => (
              <SelectItem key={`${option.kind}-${option.id}`} value={option.id}>
                <span className="font-medium">
                  {option.title || option.slug}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {option.kind === "invitation" ? "Convite" : "Save the Date"}
                </span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
