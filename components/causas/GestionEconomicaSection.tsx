"use client";

import { useState } from "react";
import CardSection from "@/components/ui/CardSection";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import HonorariosCard from "@/components/honorarios/HonorariosCard";
import GastosCard from "@/components/gastos/GastosCard";

type Tab = "honorarios" | "gastos";

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const btn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      onClick={() => setTab(t)}
      className="cursor-pointer rounded-[5px] px-[10px] py-[3px] text-[12px] font-semibold transition-colors"
      style={{
        background: tab === t ? "var(--color-blue)" : "transparent",
        color: tab === t ? "white" : "var(--color-muted)",
      }}
    >
      {label}
    </button>
  );
  return (
    <div
      className="flex items-center gap-[2px] rounded-[7px] p-[2px]"
      style={{ background: "var(--color-border)" }}
    >
      {btn("honorarios", "Honorarios")}
      {btn("gastos", "Gastos")}
    </div>
  );
}

function Content({ causaId, tab }: { causaId: string; tab: Tab }) {
  return (
    <div className="min-h-[40px]">
      {tab === "honorarios" && <HonorariosCard causaId={causaId} naked />}
      {tab === "gastos" && <GastosCard causaId={causaId} naked />}
    </div>
  );
}

interface Props {
  causaId: string;
  /** Usar dentro de CausaModal (CollapsibleSection). Por defecto usa CardSection. */
  collapsible?: boolean;
}

export default function GestionEconomicaSection({ causaId, collapsible = false }: Props) {
  const [tab, setTab] = useState<Tab>("honorarios");

  if (collapsible) {
    return (
      <CollapsibleSection title="Gastos y honorarios" headerAction={<TabBar tab={tab} setTab={setTab} />}>
        <Content causaId={causaId} tab={tab} />
      </CollapsibleSection>
    );
  }

  return (
    <CardSection title="Gastos y honorarios" action={<TabBar tab={tab} setTab={setTab} />}>
      <Content causaId={causaId} tab={tab} />
    </CardSection>
  );
}
