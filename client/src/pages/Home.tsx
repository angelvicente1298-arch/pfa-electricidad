import React, { useState } from "react";
import {
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  Bot,
  FileCheck2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Sparkles,
  ChevronRight,
  Building2,
  Car,
  Lightbulb,
  Cpu,
  Star,
  BarChart2,
  Check,
  Layers,
  Wrench,
  Flame,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Home() {
  // Modal / drawer state for "Solicitar Servicio" and "Visita Técnica"
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"servicio" | "visita">("servicio");

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    {
      sender: "bot",
      text: "¡Hola! Soy el Asistente IA 24/7 de PFA Electricidad SpA. ¿En qué comuna de Santiago necesitas atención o qué problema eléctrico tienes?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Lead Form state
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    comuna: "Las Condes",
    servicio: "Reparación Urgente / Emergencia",
    tipoPropiedad: "Residencial",
    urgencia: "Inmediata (Hoy)",
    mensaje: ""
  });

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success("¡Solicitud registrada en el panel con éxito!");
      // Open WhatsApp to +56 9 6193 5547 with full details
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
      setModalOpen(false);
      setFormData({
        nombre: "",
        telefono: "",
        comuna: "Las Condes",
        servicio: "Reparación Urgente / Emergencia",
        tipoPropiedad: "Residencial",
        urgencia: "Inmediata (Hoy)",
        mensaje: ""
      });
    },
    onError: (err) => {
      toast.error(`Error al registrar solicitud: ${err.message}`);
    }
  });

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      toast.error("Por favor completa tu nombre y teléfono.");
      return;
    }

    createOrderMutation.mutate({
      nombre: formData.nombre.trim(),
      telefono: formData.telefono.trim(),
      comuna: formData.comuna,
      servicio: formData.servicio,
      tipoPropiedad: formData.tipoPropiedad,
      urgencia: formData.urgencia,
      mensaje: formData.mensaje.trim()
    });
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");

    setTimeout(() => {
      let botReply =
        "Contamos con electricistas certificados SEC para toda la Región Metropolitana. ¿Deseas agendar visita técnica o necesitas contacto directo al +56 9 6193 5547?";
      const lower = userText.toLowerCase();
      if (lower.includes("precio") || lower.includes("cuanto") || lower.includes("costo") || lower.includes("tarifa")) {
        botReply =
          "Nuestros presupuestos son claros y detallados. Las revisiones de urgencia o inspecciones parten desde una tarifa base deducible de la reparación final. ¿Para qué comuna sería?";
      } else if (lower.includes("urgencia") || lower.includes("emergencia") || lower.includes("corte") || lower.includes("fuego") || lower.includes("humo")) {
        botReply =
          "🚨 ¡Emergencia detectada! Te recomendamos cortar el automático general y comunicarte directamente al teléfono +56 9 6193 5547 para despachar al móvil de turno.";
      } else if (lower.includes("sec") || lower.includes("te1") || lower.includes("certificacion") || lower.includes("enel")) {
        botReply =
          "Gestionamos declaraciones TE1 oficiales ante la SEC para viviendas, edificios comerciales e industrias. Todos nuestros técnicos cuentan con credencial SEC vigente.";
      }

      setChatMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    }, 600);
  };

  const services = [
    {
      icon: <Building2 className="w-7 h-7 text-amber-400" />,
      title: "Instalaciones Residenciales y Comerciales",
      badge: "Norma RIC 2026",
      desc: "Diseño y montaje completo desde la acometida hasta circuitos de fuerza, iluminación y enchufes para locales y viviendas."
    },
    {
      icon: <FileCheck2 className="w-7 h-7 text-amber-400" />,
      title: "Certificación y Declaración SEC (TE1)",
      badge: "Oficial SEC",
      desc: "Trámite de planos y carpetas técnicas garantizadas ante la SEC para empalmes definitivos, aumentos de potencia y patentes."
    },
    {
      icon: <Cpu className="w-7 h-7 text-amber-400" />,
      title: "Renovación y Normalización de Tableros",
      badge: "Seguridad Total",
      desc: "Reemplazo de protecciones obsoletas, montaje de interruptores termomagnéticos y diferenciales tipo A para prevenir incendios."
    },
    {
      icon: <Car className="w-7 h-7 text-amber-400" />,
      title: "Cargadores para Vehículos Eléctricos (EV)",
      badge: "Electromovilidad",
      desc: "Instalación certificada de cargadores tipo Wallbox residenciales y flotas corporativas con tablero y protecciones dedicadas."
    },
    {
      icon: <Lightbulb className="w-7 h-7 text-amber-400" />,
      title: "Iluminación LED y Ahorro Energético",
      badge: "Alta Eficiencia",
      desc: "Proyectos de reconversión lumínica para galpones, estacionamientos y oficinas con hasta 65% de ahorro en consumo eléctrico."
    },
    {
      icon: <AlertTriangle className="w-7 h-7 text-amber-400" />,
      title: "Servicio de Urgencias Eléctricas 24/7",
      badge: "Respuesta Rápida",
      desc: "Atención prioritaria de cortocircuitos, caídas de fase, automáticos trabados y reposición segura de energía en Santiago."
    }
  ];

  const comunas = [
    "Las Condes", "Vitacura", "Lo Barnechea", "Providencia", "Ñuñoa", 
    "Santiago Centro", "La Reina", "Peñalolén", "Macul", "San Miguel", 
    "Maipú", "La Florida", "Huechuraba", "Colina / Chicureo", "Lampa", "Otras Comunas RM"
  ];

  return (
    <div className="min-h-screen bg-[#040814] text-slate-100 flex flex-col font-sans relative selection:bg-amber-400 selection:text-slate-900 pb-24 sm:pb-0">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-[#091226] border-b border-amber-500/25 text-xs sm:text-sm py-2 px-4 relative z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider inline-flex items-center gap-1 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-current" /> ATENCIÓN PROFESIONAL
            </span>
            <span className="text-amber-100/90 font-medium">
              Instalaciones y Servicios Garantizados SEC Santiago de Chile
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/pedidos"
              className="text-slate-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1 bg-slate-900/80 px-2.5 py-0.5 rounded border border-slate-700 hover:border-amber-500/40 transition"
            >
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              Panel de Pedidos & Estadísticas
            </Link>

            <a
              href="tel:+56961935547"
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 text-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              +56 9 6193 5547
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER */}
      <header className="sticky top-0 z-40 bg-[#050C1F]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo Brand matching exact reference */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 border border-blue-400/40 p-1 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.35)]">
                <div className="w-full h-full rounded-lg border border-amber-400/50 flex items-center justify-center bg-black/40 relative">
                  <Zap className="w-6 h-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-white heading-font">
                    PFA
                  </span>
                  <span className="text-[11px] uppercase font-extrabold tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded">
                    ELECTRICIDAD SPA
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium tracking-tight">
                  Instalaciones • Obras • Certificación SEC Santiago de Chile
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/pedidos"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700 hover:border-amber-400/50 px-3 py-2 rounded-xl transition shadow"
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Ver Pedidos
            </Link>

            <a
              href="https://wa.me/56961935547?text=Hola%20PFA%20Electricidad%20SpA,%20necesito%20asistencia%20el%C3%A9ctrica%20en%20Santiago"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 bg-[#00a884] hover:bg-[#009273] text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-[#00a884]/20 hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              WhatsApp
            </a>

            <button
              onClick={() => {
                setModalType("servicio");
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold px-3.5 sm:px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] text-xs sm:text-sm tracking-wide uppercase border border-amber-300/40"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline">SOLICITAR SERVICIO</span>
              <span className="sm:hidden">SOLICITAR</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden border-b border-slate-800/60">
        
        {/* Glow ambient background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Top Pill / Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Electricistas Matriculados SEC • Chatbot & Asistencia IA 24/7</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight heading-font leading-[1.1] mb-6 drop-shadow-md">
              Soluciones Eléctricas Rápidas, Seguras y Garantizadas
            </h1>

            <p className="text-slate-300 text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-3xl mx-auto mb-8">
              Atención residencial, comercial e industrial por <strong className="text-white font-semibold">PFA Electricidad SpA</strong>. Realizamos renovaciones de tableros, instalaciones eléctricas, cargadores EV, iluminación LED y emitimos informes garantizados SEC en Santiago de Chile.
            </p>

            {/* Checkpoints row */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-10 text-xs sm:text-sm text-slate-200 font-medium">
              <div className="flex items-center gap-2 bg-slate-900/70 px-3.5 py-1.5 rounded-full border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Matriculados Oficiales</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/70 px-3.5 py-1.5 rounded-full border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Bot IA 24/7 Activo</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/70 px-3.5 py-1.5 rounded-full border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Presupuesto Claro</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/70 px-3.5 py-1.5 rounded-full border border-slate-800 text-amber-300">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>WhatsApp: +56 9 6193 5547</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md sm:max-w-none mx-auto mb-14">
              <a
                href="tel:+56961935547"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black px-7 py-4 rounded-xl text-base shadow-[0_10px_25px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-300/60"
              >
                <Phone className="w-5 h-5 fill-slate-950" />
                LLAMAR AHORA (+56 9 6193 5547)
              </a>

              <button
                onClick={() => {
                  setModalType("visita");
                  setModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-slate-900/90 hover:bg-slate-800/90 text-white font-bold px-7 py-4 rounded-xl text-base border border-slate-700/80 shadow-md transition-all hover:border-amber-400/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Solicitar Visita Técnica
              </button>
            </div>
          </div>

          {/* HERO BOTTOM FORM CARD: "Para Hacer Tu Proyecto" */}
          <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#0B152B] to-[#070D1D] rounded-2xl border border-blue-500/25 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white heading-font">
                    Para Hacer Tu Proyecto
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Completa tus datos: se guarda en el panel administrativo y te redirige a WhatsApp al +56 9 6193 5547
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Registro Inmediato
              </div>
            </div>

            <form onSubmit={handleHeroSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Rodrigo Morales"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+56 9 1234 5678"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Comuna de Santiago
                  </label>
                  <select
                    value={formData.comuna}
                    onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  >
                    {comunas.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Servicio Requerido
                  </label>
                  <select
                    value={formData.servicio}
                    onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  >
                    <option value="Reparación Urgente / Emergencia">Reparación Urgente 24/7</option>
                    <option value="Renovación de Tablero">Renovación de Tablero Eléctrico</option>
                    <option value="Certificación SEC / TE1">Certificación SEC (TE1)</option>
                    <option value="Instalación Cargador EV">Instalación Cargador Vehículo Eléctrico</option>
                    <option value="Instalación Eléctrica Completa">Instalación Eléctrica Completa</option>
                    <option value="Iluminación LED">Iluminación LED Comercial/Hogar</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Detalle del Requerimiento / Problema Eléctrico
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Salta el automático general / Necesito regularizar para venta"
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Presupuestos transparentes sin compromiso de compra
                </span>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00a884] hover:bg-[#009273] disabled:opacity-50 text-white font-extrabold px-6 py-3 rounded-xl transition shadow-lg hover:shadow-[#00a884]/20 hover:scale-[1.01] active:scale-[0.99] text-sm"
                >
                  <Send className="w-4 h-4" />
                  {createOrderMutation.isPending ? "Guardando..." : "Enviar a WhatsApp Directo (+56 9 6193 5547)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 4. SERVICES SECTION */}
      <section className="py-20 bg-[#060D21] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-extrabold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3">
              Servicios Especializados
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white heading-font">
              Soluciones Eléctricas Integrales en Santiago
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Cumplimos estrictamente los pliegos técnicos RIC de la SEC para garantizar la seguridad de tu familia, colaboradores y patrimonio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/70 hover:bg-slate-850/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-900/40 to-slate-900 border border-slate-700 group-hover:border-amber-400/50 flex items-center justify-center transition-colors">
                      {item.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors heading-font">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFormData({ ...formData, servicio: item.title });
                    setModalType("servicio");
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors pt-2 border-t border-slate-800/80"
                >
                  Pedir presupuesto para este servicio <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE PFA ELECTRICIDAD SPA */}
      <section className="py-20 bg-[#040814] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Advantages */}
            <div>
              <span className="text-amber-400 text-xs font-extrabold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Garantía y Tranquilidad
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-6 heading-font leading-tight">
                ¿Por qué confiar en PFA Electricidad SpA?
              </h2>
              <p className="text-slate-300 text-base leading-relaxed mb-8">
                Una mala conexión eléctrica puede provocar accidentes graves, multas y pérdida de equipos valiosos. Trabajamos con estándares industriales aplicados al ámbito residencial y comercial en todo Santiago.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Instaladores Matriculados SEC Clase A y B</h4>
                    <p className="text-xs sm:text-sm text-slate-400">Firmas oficiales válidas para compañías eléctricas como Enel y CGE.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Puntualidad y Respuesta Veloz</h4>
                    <p className="text-xs sm:text-sm text-slate-400">Móviles equipados con instrumentación de diagnóstico rápido.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Facturación y Garantía Post-Servicio</h4>
                    <p className="text-xs sm:text-sm text-slate-400">Garantía por escrito sobre todas nuestras obras e instalaciones realizadas.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Highlight Card with Stats & Certifications */}
            <div className="bg-gradient-to-br from-[#0c1836] to-[#080F21] p-8 rounded-3xl border border-blue-500/20 shadow-2xl relative">
              <div className="grid grid-cols-2 gap-6 text-center mb-8">
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 heading-font mb-1">
                    100%
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Norma SEC Aprobada</div>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="text-3xl sm:text-4xl font-extrabold text-white heading-font mb-1">
                    +1.200
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Proyectos Ejecutados</div>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 heading-font mb-1">
                    24/7
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Asistencia Emergencias</div>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
                  <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 heading-font mb-1">
                    5.0 ★
                  </div>
                  <div className="text-xs text-slate-400 font-medium">Calificación Clientes</div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-200 font-medium mb-3">
                  ¿Necesitas verificar el estado de tu instalación o tablero antes de que falle?
                </p>
                <button
                  onClick={() => {
                    setModalType("visita");
                    setModalOpen(true);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wide transition shadow"
                >
                  Agendar Diagnóstico Técnico
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-20 bg-[#060D21] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-amber-400 text-xs font-extrabold uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Opiniones Reales
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-3 heading-font">
              Lo que dicen nuestros clientes en Santiago
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                "Nos quedamos sin luz un domingo en la noche por un recalentamiento en el tablero general. Llegaron rápido a Las Condes, aislaron la falla y dejaron todo seguro. Totalmente recomendados."
              </p>
              <div className="text-xs font-semibold text-white">Carolina Méndez</div>
              <div className="text-[11px] text-slate-400">Residencial, Las Condes</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                "Excelente gestión para la tramitación del TE1 de nuestro local gastronómico en Providencia. Todo dentro del plazo comprometido y con la carpeta técnica impecable."
              </p>
              <div className="text-xs font-semibold text-white">Matías Valenzuela</div>
              <div className="text-[11px] text-slate-400">Comercial, Providencia</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                "Instalaron el cargador de mi auto eléctrico en Chicureo. Muy prolijos con las canalizaciones y protecciones. Se nota el profesionalismo y conocimiento técnico."
              </p>
              <div className="text-xs font-semibold text-white">Felipe Echeverría</div>
              <div className="text-[11px] text-slate-400">Cargador EV, Colina</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-[#02050E] py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-white font-black text-xl heading-font">
                PFA ELECTRICIDAD SPA
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Santiago de Chile (Cobertura RM)
              </span>
              <a href="tel:+56961935547" className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> +56 9 6193 5547
              </a>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Certificados SEC
              </span>
              <Link href="/admin/pedidos" className="flex items-center gap-1 text-slate-400 hover:text-amber-400 underline">
                Panel de Administración
              </Link>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} PFA Electricidad SpA. Todos los derechos reservados. Servicios eléctricos garantizados bajo normativa SEC Santiago de Chile.
          </div>
        </div>
      </footer>

      {/* 8. FLOATING BUTTONS (WhatsApp & Asistente IA) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        {/* ASISTENTE IA 24/7 FLOATING BADGE */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-2xl shadow-[0_8px_25px_rgba(245,158,11,0.4)] flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95 border border-amber-300 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-950/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
              ASISTENTE IA <span className="bg-slate-950 text-amber-400 px-1 py-0.2 rounded text-[8px]">24/7</span>
            </div>
            <div className="text-[11px] font-black">Consultas & Emergencias</div>
          </div>
          <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
        </button>

        {/* WhatsApp Quick Button directed to +56 9 6193 5547 */}
        <a
          href="https://wa.me/56961935547?text=Hola%20PFA%20Electricidad%20SpA,%20necesito%20asistencia%20inmediata"
          target="_blank"
          rel="noreferrer"
          aria-label="Contactar por WhatsApp"
          className="w-13 h-13 rounded-full bg-[#00a884] hover:bg-[#009273] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(0,168,132,0.4)] transition-transform hover:scale-110 active:scale-95"
        >
          <Phone className="w-6 h-6 fill-white" />
        </a>
      </div>

      {/* 9. CHATBOT POPUP MODAL */}
      {chatOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[380px] bg-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[460px] animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-950 to-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  Asistente IA PFA
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    En línea
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">Atención técnica 24/7 (+56 9 6193 5547)</div>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#050B17]/90 text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] rounded-xl px-3 py-2 leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-amber-500 text-slate-950 font-medium"
                      : "bg-slate-850 text-slate-200 border border-slate-700/80"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Input */}
          <form onSubmit={handleChatSend} className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Escribe tu consulta o comuna..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 p-2 rounded-xl"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* 10. MODAL: SOLICITAR SERVICIO / VISITA TÉCNICA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B152B] border border-blue-500/30 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white heading-font">
                  {modalType === "servicio" ? "Solicitar Servicio Eléctrico" : "Agendar Visita Técnica SEC"}
                </h3>
                <p className="text-xs text-slate-400">
                  Llega directo al WhatsApp +56 9 6193 5547 y se registra en tu panel
                </p>
              </div>
            </div>

            <form onSubmit={handleHeroSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Teléfono o WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="+56 9 1234 5678"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Comuna en Santiago</label>
                  <select
                    value={formData.comuna}
                    onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    {comunas.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipo de Propiedad</label>
                  <select
                    value={formData.tipoPropiedad}
                    onChange={(e) => setFormData({ ...formData, tipoPropiedad: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Residencial">Residencial / Casa</option>
                    <option value="Departamento">Departamento</option>
                    <option value="Comercial">Local / Comercial</option>
                    <option value="Industrial">Industrial / Bodega</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Servicio Solicitado</label>
                <input
                  type="text"
                  value={formData.servicio}
                  onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Motivo o Descripción Breve</label>
                <textarea
                  rows={2}
                  placeholder="Detalla lo que necesitas resolver..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {createOrderMutation.isPending ? "Registrando..." : "Confirmar y Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
