import React, { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Filter,
  ListFilter,
  LockKeyhole,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  Wrench,
  XCircle,
  Zap,
  Star
} from "lucide-react";

type OrderStatus = "pendiente" | "en_camino" | "contactado" | "completado" | "cancelado";

const statusLabels: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  en_camino: "En camino",
  contactado: "Contactado",
  completado: "Completado",
  cancelado: "Cancelado"
};

const statusStyles: Record<OrderStatus, string> = {
  pendiente: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  en_camino: "border-blue-300/30 bg-blue-400/10 text-blue-200",
  contactado: "border-violet-300/30 bg-violet-400/10 text-violet-200",
  completado: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  cancelado: "border-rose-300/30 bg-rose-400/10 text-rose-200"
};

const formatDate = (value: string | Date) => new Date(value).toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AdminOrders() {
  const { user, loading: authLoading, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | OrderStatus>("todos");
  const [communeFilter, setCommuneFilter] = useState("todas");
  const [activeTab, setActiveTab] = useState<"pedidos" | "resenas">("pedidos");
  const [panelPassword, setPanelPassword] = useState("");
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);

  const utils = trpc.useUtils();
  const verifyPassword = trpc.orders.verifyPassword.useMutation({
    onSuccess: () => {
      setPasswordUnlocked(true);
      toast.success("Panel desbloqueado");
    },
    onError: (error) => toast.error(error.message),
  });
  const { data: orders = [], isLoading: loadingOrders } = trpc.orders.list.useQuery({ password: panelPassword }, { enabled: isAdmin && passwordUnlocked });
  const { data: stats } = trpc.orders.stats.useQuery({ password: panelPassword }, { enabled: isAdmin && passwordUnlocked });
  const { data: allReviews = [], isLoading: loadingReviews } = trpc.reviews.listAll.useQuery({ password: panelPassword }, { enabled: isAdmin && passwordUnlocked });
  const updateReviewStatusMutation = trpc.reviews.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado de reseña actualizado");
      utils.reviews.listAll.invalidate({ password: panelPassword });
      utils.reviews.listApproved.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      utils.orders.list.invalidate({ password: panelPassword });
      utils.orders.stats.invalidate({ password: panelPassword });
    },
    onError: (error) => toast.error(error.message)
  });

  const communes = useMemo(() => Array.from(new Set(orders.map((order) => order.comuna))).sort(), [orders]);
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const term = search.toLowerCase();
    const matchesTerm = !term || [order.nombre, order.telefono, order.comuna, order.servicio, order.mensaje || ""].join(" ").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "todos" || order.estado === statusFilter;
    const matchesCommune = communeFilter === "todas" || order.comuna === communeFilter;
    return matchesTerm && matchesStatus && matchesCommune;
  }), [orders, search, statusFilter, communeFilter]);

  const maxServiceCount = Math.max(...(stats?.porServicio?.map((item) => item.count) || [1]));
  const maxCommuneCount = Math.max(...(stats?.porComuna?.map((item) => item.count) || [1]));

  if (authLoading || !isAuthenticated) {
    return <AdminAccessState title="Verificando acceso" description="Estamos validando tu sesión de administrador." loading />;
  }

  if (!isAdmin) {
    return <AdminAccessState title="Acceso restringido" description="Esta sección es privada y solo está disponible para el administrador de PFA Electricidad." />;
  }

  if (!passwordUnlocked) {
    return <AdminPasswordGate password={panelPassword} setPassword={setPanelPassword} onSubmit={() => verifyPassword.mutate({ password: panelPassword })} loading={verifyPassword.isPending} error={verifyPassword.error?.message} />;
  }

  const changeStatus = (id: number, estado: OrderStatus) => updateStatus.mutate({ id, estado, password: panelPassword });
  const whatsappForClient = (phone: string, name: string, service: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${name}, te contactamos de PFA Electricidad SpA por tu solicitud de ${service}.`)}`;

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Operations header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060B18]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1500px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-amber-300/40 hover:text-white sm:inline-flex"><ArrowLeft className="h-3.5 w-3.5" /> Volver a la web</Link>
            <div className="hidden h-7 w-px bg-white/10 sm:block" />
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-slate-950 shadow-[0_10px_25px_rgba(245,158,11,.22)]"><Zap className="h-5 w-5 fill-current" /></span>
            <div className="min-w-0"><h1 className="heading-font truncate text-lg font-bold tracking-tight text-white">Centro de operaciones</h1><p className="truncate text-xs text-slate-500">PFA Electricidad <span className="hidden sm:inline">· Solicitudes, seguimiento y desempeño</span></p></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-300 md:flex"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Sistema en línea</div>
            <a href="https://wa.me/56961935547" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-400 sm:px-4"><MessageSquare className="h-3.5 w-3.5" /><span className="hidden sm:inline">Abrir WhatsApp</span><span className="sm:hidden">WhatsApp</span></a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-8 px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Vista general</p>
            <h2 className="heading-font mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {activeTab === "pedidos" ? "Pedidos y estadísticas" : "Moderación de reseñas"}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {activeTab === "pedidos"
                ? "Todas las solicitudes quedan registradas y se preparan para el WhatsApp oficial +56 9 6193 5547."
                : "Revisa opiniones reales enviadas por clientes y decide cuáles publicar en el sitio web."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
              <button onClick={() => setActiveTab("pedidos")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${activeTab === "pedidos" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"}`}>Pedidos ({orders.length})</button>
              <button onClick={() => setActiveTab("resenas")} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${activeTab === "resenas" ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-white"}`}>Reseñas ({allReviews.length})</button>
            </div>
            <button onClick={() => {
              if (activeTab === "pedidos") {
                utils.orders.list.invalidate({ password: panelPassword });
                utils.orders.stats.invalidate({ password: panelPassword });
              } else {
                utils.reviews.listAll.invalidate({ password: panelPassword });
                utils.reviews.listApproved.invalidate();
              }
              toast.info("Datos actualizados");
            }} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:border-amber-300/40 hover:text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Actualizar datos
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={<ListFilter />} label="Solicitudes totales" value={stats?.total ?? 0} hint="Desde el inicio" tone="blue" />
          <KpiCard icon={<Bell />} label="Pendientes de contacto" value={stats?.pendientes ?? 0} hint="Requieren respuesta" tone="amber" />
          <KpiCard icon={<TrendingUp />} label="En gestión" value={stats?.contactados ?? 0} hint="Contactados o en camino" tone="violet" />
          <KpiCard icon={<CheckCircle2 />} label="Completados" value={stats?.completados ?? 0} hint="Servicios finalizados" tone="emerald" />
        </section>

        {/* Insight panels */}
        <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6"><div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">Demanda</p><h3 className="heading-font mt-1 text-xl font-bold text-white">Servicios más solicitados</h3></div><span className="rounded-lg bg-amber-400/10 p-2 text-amber-300"><BarChart3 className="h-4 w-4" /></span></div><div className="space-y-4">{stats?.porServicio?.length ? stats.porServicio.slice(0, 5).map((item) => <div key={item.servicio}><div className="mb-1.5 flex justify-between gap-4 text-xs"><span className="truncate font-semibold text-slate-300">{item.servicio}</span><span className="font-black text-amber-300">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all" style={{ width: `${Math.max(8, (item.count / maxServiceCount) * 100)}%` }} /></div></div>) : <EmptyState text="Todavía no hay solicitudes de servicio." />}</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:p-6"><div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-300">Cobertura</p><h3 className="heading-font mt-1 text-xl font-bold text-white">Comunas con más demanda</h3></div><span className="rounded-lg bg-blue-400/10 p-2 text-blue-300"><MapPin className="h-4 w-4" /></span></div><div className="space-y-4">{stats?.porComuna?.length ? stats.porComuna.slice(0, 5).map((item) => <div key={item.comuna}><div className="mb-1.5 flex justify-between gap-4 text-xs"><span className="truncate font-semibold text-slate-300">{item.comuna}</span><span className="font-black text-blue-300">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-300 transition-all" style={{ width: `${Math.max(8, (item.count / maxCommuneCount) * 100)}%` }} /></div></div>) : <EmptyState text="Todavía no hay comunas registradas." />}</div></div>
        </section>

        {activeTab === "pedidos" ? (
          <>
            {/* Orders */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#080E1D] shadow-[0_25px_80px_rgba(0,0,0,.2)]"><div className="border-b border-white/10 p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/10 text-amber-300"><Wrench className="h-4 w-4" /></span><h3 className="heading-font text-xl font-bold text-white">Solicitudes recibidas</h3></div><p className="mt-2 text-sm text-slate-500">Gestiona el estado, revisa el requerimiento y contacta al cliente desde un solo lugar.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente o servicio" className="field w-full pl-9 sm:w-64" /></label><FilterSelect value={statusFilter} onChange={(value) => setStatusFilter(value as "todos" | OrderStatus)} options={["todos", ...Object.keys(statusLabels) as OrderStatus[]]} labels={{ todos: "Todos los estados", ...statusLabels }} /><FilterSelect value={communeFilter} onChange={setCommuneFilter} options={["todas", ...communes]} labels={{ todas: "Todas las comunas" }} /></div></div></div><div className="overflow-x-auto">{loadingOrders ? <div className="p-16 text-center text-sm text-slate-500">Cargando solicitudes...</div> : filteredOrders.length === 0 ? <div className="p-16 text-center"><Search className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No hay solicitudes que coincidan con los filtros.</p></div> : <table className="w-full min-w-[1060px] text-left text-xs"><thead className="border-b border-white/10 bg-white/[.025] text-[10px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-4 font-bold">Solicitud</th><th className="px-5 py-4 font-bold">Cliente</th><th className="px-5 py-4 font-bold">Servicio</th><th className="px-5 py-4 font-bold">Ubicación</th><th className="px-5 py-4 font-bold">Estado</th><th className="px-5 py-4 text-right font-bold">Acción</th></tr></thead><tbody className="divide-y divide-white/[.07]">{filteredOrders.map((order) => <tr key={order.id} className="transition hover:bg-white/[.025]"><td className="px-5 py-5 align-top"><span className="font-mono font-bold text-amber-300">#{String(order.id).padStart(4, "0")}</span><span className="mt-1 block text-[11px] text-slate-500">{formatDate(order.createdAt)}</span></td><td className="px-5 py-5 align-top"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-400/10 text-blue-300"><UserRound className="h-4 w-4" /></span><span><strong className="block text-sm font-bold text-white">{order.nombre}</strong><a href={`tel:${order.telefono}`} className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400 transition hover:text-amber-300"><Phone className="h-3 w-3" />{order.telefono}</a></span></div></td><td className="max-w-[240px] px-5 py-5 align-top"><strong className="block font-bold text-amber-200">{order.servicio}</strong><span className="mt-1 block text-[11px] text-slate-500">{order.tipoPropiedad || "Residencial"} · {order.urgencia || "Normal"}</span>{order.mensaje && <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400">{order.mensaje}</p>}</td><td className="px-5 py-5 align-top"><span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-semibold text-slate-300"><MapPin className="h-3 w-3 text-blue-300" />{order.comuna}</span></td><td className="px-5 py-5 align-top"><div className="relative inline-flex"><select value={order.estado as OrderStatus} onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)} className={`appearance-none rounded-full border py-1.5 pl-3 pr-8 text-[11px] font-bold outline-none ${statusStyles[order.estado as OrderStatus]}`}><option value="pendiente">Pendiente</option><option value="en_camino">En camino</option><option value="contactado">Contactado</option><option value="completado">Completado</option><option value="cancelado">Cancelado</option></select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-current" /></div></td><td className="px-5 py-5 text-right align-top"><a href={whatsappForClient(order.telefono, order.nombre, order.servicio)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-[11px] font-black text-white transition hover:bg-emerald-400"><MessageSquare className="h-3.5 w-3.5" /> Contactar</a></td></tr>)}</tbody></table>}</div><div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-xs text-slate-500"><span>Mostrando {filteredOrders.length} de {orders.length} solicitudes</span><span className="hidden items-center gap-1.5 sm:flex"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Datos protegidos en la plataforma</span></div></section>
          </>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#080E1D] shadow-[0_25px_80px_rgba(0,0,0,.2)]">
            <div className="border-b border-white/10 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="heading-font text-xl font-bold text-white">Reseñas de clientes</h3>
                  <p className="mt-1 text-sm text-slate-500">Aprueba comentarios reales para publicarlos en el sitio.</p>
                </div>
                <span className="rounded-lg border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300">{allReviews.filter((review) => review.estado === "pendiente").length} pendientes</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              {loadingReviews ? <div className="p-16 text-center text-sm text-slate-500">Cargando reseñas...</div> : allReviews.length === 0 ? <div className="p-16 text-center text-sm text-slate-400">Aún no se han enviado reseñas desde la web.</div> : (
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead className="border-b border-white/10 bg-white/[.025] text-[10px] uppercase tracking-[.12em] text-slate-500"><tr><th className="px-5 py-4 font-bold">Cliente</th><th className="px-5 py-4 font-bold">Calificación</th><th className="px-5 py-4 font-bold">Comentario</th><th className="px-5 py-4 font-bold">Estado</th><th className="px-5 py-4 text-right font-bold">Acciones</th></tr></thead>
                  <tbody className="divide-y divide-white/[.07]">
                    {allReviews.map((review) => <tr key={review.id} className="transition hover:bg-white/[.025]">
                      <td className="px-5 py-5 align-top"><strong className="block text-sm font-bold text-white">{review.nombre}</strong><span className="mt-1 block text-[11px] text-slate-500">{review.comuna || "Santiago"} · {review.servicio || "Servicio"}</span><span className="mt-1 block text-[10px] text-slate-600">{formatDate(review.createdAt)}</span></td>
                      <td className="px-5 py-5 align-top"><div className="flex gap-1 text-amber-300">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.calificacion ? "fill-current" : "text-slate-600"}`} />)}</div></td>
                      <td className="max-w-[360px] px-5 py-5 align-top leading-5 text-slate-300">“{review.comentario}”</td>
                      <td className="px-5 py-5 align-top"><span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${review.estado === "aprobada" ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : review.estado === "rechazada" ? "border-rose-300/30 bg-rose-400/10 text-rose-200" : "border-amber-300/30 bg-amber-400/10 text-amber-200"}`}>{review.estado === "aprobada" ? "Publicada" : review.estado === "rechazada" ? "Rechazada" : "Pendiente"}</span></td>
                      <td className="space-x-2 px-5 py-5 text-right align-top">{review.estado !== "aprobada" && <button onClick={() => updateReviewStatusMutation.mutate({ id: review.id, estado: "aprobada", password: panelPassword })} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-emerald-400">Aprobar</button>}{review.estado !== "rechazada" && <button onClick={() => updateReviewStatusMutation.mutate({ id: review.id, estado: "rechazada", password: panelPassword })} className="rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-[11px] font-bold text-rose-200 transition hover:bg-rose-400/20">Rechazar</button>}</td>
                    </tr>)}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function AdminPasswordGate({ password, setPassword, onSubmit, loading, error }: { password: string; setPassword: (value: string) => void; onSubmit: () => void; loading: boolean; error?: string }) {
  return <div className="grid min-h-screen place-items-center bg-[#050814] px-6 text-slate-100"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-8 shadow-2xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300"><LockKeyhole className="h-6 w-6" /></span><div className="mt-5 text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">PFA Electricidad</p><h1 className="heading-font mt-2 text-2xl font-bold text-white">Panel Admin privado</h1><p className="mt-3 text-sm leading-6 text-slate-400">Ingresa la contraseña para ver pedidos, clientes y estadísticas.</p></div><form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="mt-6 space-y-3"><label className="label">Contraseña del panel<input autoFocus required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" className="field mt-2 w-full" /></label>{error && <p className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200">{error}</p>}<button disabled={loading || !password} className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Verificando..." : "Entrar al Panel Admin"}</button></form><Link href="/" className="mt-5 block text-center text-xs font-semibold text-slate-500 transition hover:text-amber-300">Volver al sitio público</Link></div></div>;
}

function AdminAccessState({ title, description, loading = false }: { title: string; description: string; loading?: boolean }) {
  return <div className="grid min-h-screen place-items-center bg-[#050814] px-6 text-center text-slate-100"><div className="max-w-md rounded-3xl border border-white/10 bg-white/[.04] p-8 shadow-2xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">{loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <LockKeyhole className="h-6 w-6" />}</span><h1 className="heading-font mt-5 text-2xl font-bold text-white">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>{!loading && <Link href="/" className="mt-6 inline-flex rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300">Volver al sitio</Link>}</div></div>;
}

function KpiCard({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: number; hint: string; tone: "blue" | "amber" | "violet" | "emerald" }) {
  const tones = { blue: "border-blue-300/20 bg-blue-400/[.06] text-blue-300", amber: "border-amber-300/20 bg-amber-400/[.06] text-amber-300", violet: "border-violet-300/20 bg-violet-400/[.06] text-violet-300", emerald: "border-emerald-300/20 bg-emerald-400/[.06] text-emerald-300" };
  return <div className={`rounded-2xl border p-5 ${tones[tone]}`}><div className="flex items-start justify-between gap-3"><span className="text-xs font-semibold text-slate-400">{label}</span><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 [&>svg]:h-4 [&>svg]:w-4">{icon}</span></div><p className="heading-font mt-5 text-4xl font-bold text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{hint}</p></div>;
}

function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-slate-500">{text}</div>; }

function FilterSelect({ value, onChange, options, labels = {} }: { value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) { return <div className="relative"><select value={value} onChange={(e) => onChange(e.target.value)} className="field min-w-[150px] appearance-none pr-8">{options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /></div>; }
