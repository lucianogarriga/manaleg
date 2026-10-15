import type { PresenceUser } from "@/services/presence/canalesCausa";

// Iniciales de quienes tienen la causa abierta en este momento
export default function AvataresEnLinea({ users }: { users: PresenceUser[] }) {
  if (users.length === 0) return null;
  return (
    <span className="flex shrink-0 items-center gap-[3px]" title={`En línea: ${users.map((u) => u.nombre).join(", ")}`}>
      {users.slice(0, 4).map((u) => (
        <span
          key={u.user_id}
          className="relative flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ background: "var(--color-grn)", boxShadow: "0 0 0 2px var(--color-card)" }}
          title={u.nombre}
        >
          {u.initials}
          <span
            className="absolute -right-[1px] -bottom-[1px] h-[7px] w-[7px] rounded-full border-[1.5px]"
            style={{ background: "var(--color-grn)", borderColor: "var(--color-card)" }}
          />
        </span>
      ))}
      {users.length > 4 && <span className="text-[11px] font-medium text-muted">+{users.length - 4}</span>}
    </span>
  );
}
