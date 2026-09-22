import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Zap,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  ListOrdered,
  ArrowLeft,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminOrders() {
  const [filterComuna, setFilterComuna] = useState<string>("todas");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const utils = trpc.useUtils();
  const { data: orders = [], isLoading: loadingOrders } = trpc.orders.list.useQuery();
  const { data: stats, isLoading: loadingStats } = trpc.orders.stats.useQuery();

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado del pedido actualizado correctamente");
      utils.orders.list.invalidate();
      utils.orders.stats.invalidate();
    },
    onError: (err) => {
      toast.error(`Error al actualizar estado: ${err.message}`);
    }
  });

  const handleStatusChange = (id: number, newStatus: any) => {
    updateStatusMutation.mutate({ id, estado: newStatus });
  };

  const filteredOrders = orders.filter((o) => {
    const matchesComuna = filterComuna === "todas" || o.comuna === filterComuna;
    const matchesEstado = filterEstado === "todos" || o.estado === filterEstado;
    const matchesSearch =
      o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.telefono.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.mensaje && o.mensaje.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesComuna && matchesEstado && matchesSearch;
  });

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "en_camino":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "contactado":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      case "completado":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "cancelado":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-[#050B17] text-slate-100 font-sans pb-16 selection:bg-amber-400 selection:text-slate-900">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#060D1E]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 transition bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a la Web
            </Link>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white heading-font">
                  Panel de Pedidos & Estadísticas
                </h1>
                <p className="text-[11px] text-slate-400">
                  PFA Electricidad SpA • Destino WhatsApp: +56 9 6193 5547
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                utils.orders.list.invalidate();
                utils.orders.stats.invalidate();
                toast.info("Actualizando datos...");
              }}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Refrescar
            </button>
            <a
              href="https://wa.me/56961935547"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#00a884] hover:bg-[#009273] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Phone className="w-3.5 h-3.5" />
              Abrir WhatsApp (+56 9 6193 5547)
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        
        {/* STATS SECTION */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">
              Métricas Clave de Solicitudes
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0B152B] border border-blue-500/20 p-5 rounded-2xl shadow">
              <span className="text-xs text-slate-400 font-medium">Total de Pedidos</span>
              <div className="text-3xl font-black text-white mt-1 heading-font">
                {stats?.total ?? 0}
              </div>
              <span className="text-[11px] text-slate-500">Registrados en la plataforma</span>
            </div>

            <div className="bg-[#0B152B] border border-amber-500/30 p-5 rounded-2xl shadow">
              <span className="text-xs text-amber-300 font-medium">Pendientes de Contacto</span>
              <div className="text-3xl font-black text-amber-400 mt-1 heading-font">
                {stats?.pendientes ?? 0}
              </div>
              <span className="text-[11px] text-amber-500/80">Requieren respuesta</span>
            </div>

            <div className="bg-[#0B152B] border border-purple-500/30 p-5 rounded-2xl shadow">
              <span className="text-xs text-purple-300 font-medium">En Gestión / Camino</span>
              <div className="text-3xl font-black text-purple-400 mt-1 heading-font">
                {stats?.contactados ?? 0}
              </div>
              <span className="text-[11px] text-purple-400/80">Coordinados con cliente</span>
            </div>

            <div className="bg-[#0B152B] border border-emerald-500/30 p-5 rounded-2xl shadow">
              <span className="text-xs text-emerald-300 font-medium">Servicios Completados</span>
              <div className="text-3xl font-black text-emerald-400 mt-1 heading-font">
                {stats?.completados ?? 0}
              </div>
              <span className="text-[11px] text-emerald-400/80">Trabajos finalizados</span>
            </div>
          </div>
        </section>

        {/* BREAKDOWN PILLS: Servicios y Comunas */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Demanda por Tipo de Servicio
            </h3>
            {stats?.porServicio && stats.porServicio.length > 0 ? (
              <div className="space-y-2">
                {stats.porServicio.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-300">{item.servicio}</span>
                    <span className="bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Sin datos de servicios aún.</p>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              Cobertura por Comuna
            </h3>
            {stats?.porComuna && stats.porComuna.length > 0 ? (
              <div className="space-y-2">
                {stats.porComuna.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-300">{item.comuna}</span>
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Sin datos de comunas aún.</p>
            )}
          </div>
        </section>

        {/* ORDERS TABLE SECTION */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider text-xs">
                Listado Detallado de Solicitudes ({filteredOrders.length})
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, teléfono o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-52 sm:w-64"
                />
              </div>

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="todos">Todos los Estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_camino">En Camino</option>
                <option value="contactado">Contactado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Orders Container */}
          <div className="bg-[#070D1D] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loadingOrders ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Cargando pedidos...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No se encontraron solicitudes registradas con los filtros actuales.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B152B] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">ID / Fecha</th>
                      <th className="py-3.5 px-4 font-semibold">Cliente & Contacto</th>
                      <th className="py-3.5 px-4 font-semibold">Comuna</th>
                      <th className="py-3.5 px-4 font-semibold">Servicio Solicitado</th>
                      <th className="py-3.5 px-4 font-semibold">Detalle del Requerimiento</th>
                      <th className="py-3.5 px-4 font-semibold">Estado</th>
                      <th className="py-3.5 px-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredOrders.map((order) => {
                      const cleanPhone = order.telefono.replace(/[^0-9]/g, "");
                      const clientWaUrl = `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(order.nombre)},%20te%20escribimos%20de%20PFA%20Electricidad%20SpA%20respecto%20a%20tu%20solicitud%20de%20${encodeURIComponent(order.servicio)}`;

                      return (
                        <tr key={order.id} className="hover:bg-slate-900/50 transition">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-amber-400 font-bold">#{order.id}</span>
                            <div className="text-[10px] text-slate-500">
                              {new Date(order.createdAt).toLocaleString("es-CL", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{order.nombre}</div>
                            <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                              <Phone className="w-3 h-3 text-amber-400" />
                              <span>{order.telefono}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                              {order.comuna}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-amber-300">{order.servicio}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>{order.tipoPropiedad}</span> • <span>Urgencia: {order.urgencia}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-slate-300 line-clamp-2">
                              {order.mensaje || <span className="text-slate-500 italic">Sin detalle extra</span>}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={order.estado}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`border text-[11px] font-bold rounded-lg px-2.5 py-1 focus:outline-none transition cursor-pointer ${getBadgeColor(order.estado)}`}
                            >
                              <option value="pendiente" className="bg-slate-950 text-amber-400">Pendiente</option>
                              <option value="en_camino" className="bg-slate-950 text-blue-400">En Camino</option>
                              <option value="contactado" className="bg-slate-950 text-purple-400">Contactado</option>
                              <option value="completado" className="bg-slate-950 text-emerald-400">Completado</option>
                              <option value="cancelado" className="bg-slate-950 text-red-400">Cancelado</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <a
                                href={clientWaUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 bg-[#00a884] hover:bg-[#009273] text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition shadow"
                              >
                                <Phone className="w-3 h-3" />
                                Contactar
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
