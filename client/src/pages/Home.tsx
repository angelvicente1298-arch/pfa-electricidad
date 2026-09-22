import React, { useState } from "react";
import {
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  Bot,
  FileCheck2,
  Clock3,
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
  ArrowUpRight,
  ArrowRight,
  Menu,
  Wrench,
  Layers,
  CircleCheck,
  BadgeCheck
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const WHATSAPP_NUMBER = "56961935547";
const DISPLAY_PHONE = "+56 9 6193 5547";

const comunas = [
  "Las Condes", "Vitacura", "Lo Barnechea", "Providencia", "Ñuñoa",
  "Santiago Centro", "La Reina", "Peñalolén", "Macul", "San Miguel",
  "Maipú", "La Florida", "Huechuraba", "Colina / Chicureo", "Lampa", "Otras Comunas RM"
];

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"servicio" | "visita">("servicio");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string }>>([
    { sender: "bot", text: "¡Hola! Soy el asistente de PFA Electricidad. ¿Qué necesitas resolver hoy?" }
  ]);
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
      toast.success("Solicitud registrada. Abriendo WhatsApp con el detalle completo.");
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank");
      setModalOpen(false);
      setFormData({ nombre: "", telefono: "", comuna: "Las Condes", servicio: "Reparación Urgente / Emergencia", tipoPropiedad: "Residencial", urgencia: "Inmediata (Hoy)", mensaje: "" });
    },
    onError: (error) => toast.error(`No se pudo registrar la solicitud: ${error.message}`)
  });

  const openServiceModal = (service?: string, type: "servicio" | "visita" = "servicio") => {
    if (service) setFormData((prev) => ({ ...prev, servicio: service }));
    setModalType(type);
    setModalOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      toast.error("Completa tu nombre y teléfono para continuar.");
      return;
    }
    createOrderMutation.mutate({ ...formData, nombre: formData.nombre.trim(), telefono: formData.telefono.trim(), mensaje: formData.mensaje.trim() });
  };

  const handleChatSend = (event: React.FormEvent) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    setChatMessages((prev) => [...prev, { sender: "user", text: message }]);
    setChatInput("");
    window.setTimeout(() => {
      const normalized = message.toLowerCase();
      let reply = `Podemos ayudarte en toda la Región Metropolitana. Si quieres una respuesta inmediata, llama al ${DISPLAY_PHONE}.`;
      if (normalized.includes("precio") || normalized.includes("costo") || normalized.includes("valor")) reply = "Entregamos presupuestos claros después de revisar el alcance. Puedes solicitar una visita técnica y te contactamos por WhatsApp.";
      if (normalized.includes("urgencia") || normalized.includes("corte") || normalized.includes("humo")) reply = `Si hay humo, chispas o riesgo, corta el automático general y llama de inmediato al ${DISPLAY_PHONE}.`;
      if (normalized.includes("sec") || normalized.includes("te1")) reply = "Gestionamos declaraciones TE1 y regularizaciones con instaladores certificados SEC. Completa el formulario y te contactamos.";
      setChatMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 450);
  };

  const services = [
    { icon: <Building2 />, title: "Instalaciones eléctricas", label: "Residencial y comercial", description: "Montajes, ampliaciones y circuitos completos con terminaciones limpias y seguras." },
    { icon: <FileCheck2 />, title: "Certificación SEC", label: "TE1 y regularizaciones", description: "Carpetas técnicas y declaraciones para empalmes, ventas, patentes y aumentos de potencia." },
    { icon: <Cpu />, title: "Tableros eléctricos", label: "Normalización y protección", description: "Renovación de protecciones, diferenciales y distribución para reducir riesgos y fallas." },
    { icon: <Car />, title: "Cargadores EV", label: "Electromovilidad", description: "Instalación de Wallbox para hogares, estacionamientos y flotas con circuito dedicado." },
    { icon: <Lightbulb />, title: "Iluminación LED", label: "Ahorro energético", description: "Proyectos de iluminación eficiente para hogares, oficinas, locales, bodegas y exteriores." },
    { icon: <AlertTriangle />, title: "Urgencias 24/7", label: "Respuesta prioritaria", description: "Cortocircuitos, cortes, recalentamientos y fallas eléctricas atendidas con rapidez." }
  ];

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950 pb-24 sm:pb-0">
      {/* Top utility strip */}
      <div className="relative z-50 border-b border-white/10 bg-[#090F20]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-2.5 text-center text-xs sm:flex-row sm:text-left">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">
              <Zap className="h-3 w-3 fill-current" /> Atención profesional
            </span>
            <span className="hidden sm:inline">Servicios eléctricos garantizados en Santiago de Chile</span>
          </div>
          <a href={`tel:+${WHATSAPP_NUMBER}`} className="inline-flex items-center gap-1.5 font-bold text-amber-300 transition hover:text-amber-200">
            <Phone className="h-3.5 w-3.5" /> {DISPLAY_PHONE}
          </a>
        </div>
      </div>

      {/* Main navigation */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050814]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="PFA Electricidad inicio">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,.2)]">
              <Zap className="h-6 w-6 fill-current" />
            </span>
            <span className="leading-none">
              <span className="heading-font block text-2xl font-bold tracking-tight text-white">PFA <em className="not-italic text-amber-400">Electricidad</em></span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Instalaciones • Obras • SEC</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegación principal">
            <a href="#servicios" className="text-sm font-semibold text-slate-300 transition hover:text-amber-300">Servicios</a>
            <a href="#confianza" className="text-sm font-semibold text-slate-300 transition hover:text-amber-300">Por qué PFA</a>
            <a href="#contacto" className="text-sm font-semibold text-slate-300 transition hover:text-amber-300">Contacto</a>
            <Link href="/admin/pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition hover:text-amber-300"><BarChart2 className="h-4 w-4 text-amber-400" /> Panel</Link>
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20PFA%20Electricidad,%20necesito%20ayuda`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/25"><MessageSquare className="h-4 w-4" /> WhatsApp</a>
            <button onClick={() => openServiceModal()} className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-slate-950 shadow-[0_8px_24px_rgba(245,158,11,.2)] transition hover:bg-amber-300 active:scale-[.98]"><ShieldCheck className="h-4 w-4" /> Solicitar servicio</button>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200 sm:hidden" aria-label="Abrir menú">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && <div className="border-t border-white/10 bg-[#080D1C] px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-3 text-sm font-semibold text-slate-300">
            <a href="#servicios" onClick={() => setMobileMenuOpen(false)}>Servicios</a>
            <a href="#confianza" onClick={() => setMobileMenuOpen(false)}>Por qué PFA</a>
            <Link href="/admin/pedidos">Panel de pedidos</Link>
            <button onClick={() => { setMobileMenuOpen(false); openServiceModal(); }} className="mt-2 rounded-xl bg-amber-400 px-4 py-3 text-left font-black text-slate-950">Solicitar servicio</button>
          </div>
        </div>}
      </header>

      {/* Hero */}
      <main>
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="noise-overlay absolute inset-0" />
          <div className="absolute -left-32 top-12 h-96 w-96 rounded-full bg-blue-600/15 blur-[120px]" />
          <div className="absolute -right-20 top-0 h-[34rem] w-[34rem] rounded-full bg-amber-500/10 blur-[130px]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-20 lg:pb-28 lg:pt-24">
            <div className="animate-float-in">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3.5 py-2 text-xs font-bold text-amber-200"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Electricistas certificados SEC · Respuesta 24/7</div>
              <h1 className="heading-font max-w-3xl text-5xl font-bold leading-[.98] tracking-[-.055em] text-white sm:text-6xl lg:text-[76px]">Electricidad bien hecha.<br /><span className="text-amber-400">Sin sorpresas.</span></h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Instalaciones, reparaciones y certificaciones para hogares, comercios e industrias en Santiago. Diagnóstico claro, trabajo seguro y respaldo profesional.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => openServiceModal()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-black text-slate-950 shadow-[0_15px_35px_rgba(245,158,11,.25)] transition hover:-translate-y-0.5 hover:bg-amber-300"><Wrench className="h-4 w-4" /> Solicitar visita técnica <ArrowRight className="h-4 w-4" /></button>
                <a href={`tel:+${WHATSAPP_NUMBER}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:border-amber-300/50 hover:bg-white/10"><Phone className="h-4 w-4 text-amber-300" /> Llamar ahora</a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-400">
                <span className="inline-flex items-center gap-2"><CircleCheck className="h-4 w-4 text-emerald-400" /> Presupuesto claro</span>
                <span className="inline-flex items-center gap-2"><CircleCheck className="h-4 w-4 text-emerald-400" /> Garantía post-servicio</span>
                <span className="inline-flex items-center gap-2"><CircleCheck className="h-4 w-4 text-emerald-400" /> Atención directa</span>
              </div>
            </div>

            <div className="relative animate-float-in lg:pt-4">
              <div className="absolute -inset-8 rounded-[2.5rem] bg-blue-500/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#0B1428]/90 p-5 shadow-[0_25px_100px_rgba(0,0,0,.4)] sm:p-7">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div><p className="text-xs font-black uppercase tracking-[.16em] text-amber-300">Atención inmediata</p><h2 className="heading-font mt-2 text-2xl font-bold text-white">Cuéntanos qué necesitas</h2><p className="mt-1 text-sm text-slate-400">Te contactamos por WhatsApp con la información completa.</p></div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-300"><Zap className="h-5 w-5 fill-current" /></div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre completo *" className="field" />
                    <input required type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="Teléfono / WhatsApp *" className="field" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={formData.comuna} onChange={(e) => setFormData({ ...formData, comuna: e.target.value })} className="field">{comunas.map((item) => <option key={item}>{item}</option>)}</select>
                    <select value={formData.servicio} onChange={(e) => setFormData({ ...formData, servicio: e.target.value })} className="field"><option>Reparación Urgente / Emergencia</option><option>Renovación de Tablero</option><option>Certificación SEC / TE1</option><option>Instalación Cargador EV</option><option>Instalación Eléctrica Completa</option><option>Iluminación LED</option></select>
                  </div>
                  <textarea rows={3} value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} placeholder="Describe brevemente el problema o proyecto" className="field resize-none" />
                  <button disabled={createOrderMutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-black text-white transition hover:bg-emerald-400 disabled:opacity-60">{createOrderMutation.isPending ? "Registrando solicitud..." : <>Enviar solicitud por WhatsApp <ArrowUpRight className="h-4 w-4" /></>}</button>
                  <p className="text-center text-[11px] text-slate-500">La solicitud queda registrada en el panel y se prepara para el número {DISPLAY_PHONE}.</p>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Trust rail */}
        <section className="border-b border-white/10 bg-[#071021]">
          <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:grid-cols-3 sm:px-6">
            {[
              [<BadgeCheck className="h-5 w-5" />, "Instaladores certificados", "Trabajo bajo normativa SEC"],
              [<Clock3 className="h-5 w-5" />, "Respuesta prioritaria", "Atención coordinada 24/7"],
              [<ShieldCheck className="h-5 w-5" />, "Garantía y respaldo", "Transparencia en cada paso"]
            ].map(([icon, title, description], index) => <div key={index} className="flex items-center gap-3 border-b border-white/10 py-5 sm:border-b-0 sm:border-r sm:px-8 sm:first:pl-0 sm:last:border-r-0"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300">{icon}</span><span><strong className="block text-sm text-white">{title}</strong><small className="mt-1 block text-xs text-slate-500">{description}</small></span></div>)}
          </div>
        </section>

        {/* Services */}
        <section id="servicios" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Lo que hacemos</p><h2 className="heading-font mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Un equipo para cada<br /><span className="text-slate-500">problema eléctrico.</span></h2></div><p className="max-w-sm text-sm leading-6 text-slate-400">Soluciones pensadas para que entiendas el trabajo, apruebes con confianza y recibas un resultado que dura.</p></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => <article key={service.title} className="group rounded-2xl border border-white/10 bg-white/[.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-amber-300/35 hover:bg-amber-300/[.045] hover:shadow-[0_18px_50px_rgba(0,0,0,.22)]"><div className="mb-8 flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/10 text-amber-300 [&>svg]:h-6 [&>svg]:w-6">{service.icon}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{service.label}</span></div><h3 className="heading-font text-xl font-bold text-white transition group-hover:text-amber-200">{service.title}</h3><p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-400">{service.description}</p><button onClick={() => openServiceModal(service.title)} className="mt-6 inline-flex items-center gap-1.5 text-xs font-black text-amber-300 transition hover:gap-2.5">Solicitar este servicio <ChevronRight className="h-3.5 w-3.5" /></button></article>)}
          </div>
        </section>

        {/* Why us */}
        <section id="confianza" className="border-y border-white/10 bg-[#071021]">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Por qué PFA</p><h2 className="heading-font mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Profesionalidad que se nota desde la primera visita.</h2><p className="mt-6 max-w-xl text-base leading-7 text-slate-400">No solo resolvemos la falla. Te explicamos qué ocurre, qué hay que hacer y cómo mantener tu instalación segura después del trabajo.</p><button onClick={() => openServiceModal(undefined, "visita")} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-200 transition hover:bg-amber-300/20">Agendar diagnóstico <ArrowRight className="h-4 w-4" /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ title: "Diagnóstico claro", body: "Te mostramos el origen del problema y las alternativas antes de comenzar.", icon: <Wrench /> }, { title: "Terminaciones limpias", body: "Orden, rotulación y materiales adecuados en cada intervención.", icon: <Layers /> }, { title: "Respaldo SEC", body: "Trabajos y declaraciones con profesionales autorizados.", icon: <BadgeCheck /> }, { title: "Seguimiento real", body: "Cada solicitud queda registrada para que no se pierda ningún detalle.", icon: <CheckCircle2 /> }].map((item) => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300 [&>svg]:h-5 [&>svg]:w-5">{item.icon}</span><h3 className="mt-5 text-base font-bold text-white">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p></div>)}
            </div>
          </div>
        </section>

        {/* Testimonial / CTA */}
        <section id="contacto" className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="grid overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-400/[.14] via-[#111C36] to-[#0B1328] lg:grid-cols-[1fr_.8fr]">
            <div className="p-8 sm:p-12"><div className="flex gap-1 text-amber-300">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div><blockquote className="heading-font mt-6 max-w-2xl text-3xl font-bold leading-tight text-white sm:text-4xl">“Trabajaron rápido, explicaron todo y dejaron el tablero impecable.”</blockquote><p className="mt-5 text-sm text-slate-400">Carolina Méndez · Las Condes</p></div>
            <div className="border-t border-white/10 bg-black/15 p-8 sm:p-12 lg:border-l lg:border-t-0"><p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">¿Tienes una falla?</p><h3 className="heading-font mt-3 text-2xl font-bold text-white">Hablemos hoy.</h3><p className="mt-3 text-sm leading-6 text-slate-400">Recibe atención directa en el número oficial de PFA Electricidad.</p><a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20PFA%20Electricidad,%20quiero%20solicitar%20un%20servicio`} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-400">Escribir por WhatsApp <ArrowUpRight className="h-4 w-4" /></a><p className="mt-4 text-xs text-slate-500">{DISPLAY_PHONE} · Santiago y Región Metropolitana</p></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#03050D]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-slate-950"><Zap className="h-5 w-5 fill-current" /></span><span><strong className="block text-sm text-white">PFA Electricidad SpA</strong><small className="text-xs text-slate-500">Instalaciones · Obras · Certificación SEC</small></span></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><a href={`tel:+${WHATSAPP_NUMBER}`} className="transition hover:text-amber-300">{DISPLAY_PHONE}</a><span>Santiago de Chile</span><Link href="/admin/pedidos" className="transition hover:text-amber-300">Panel de pedidos</Link></div><p className="text-xs text-slate-600">© {new Date().getFullYear()} PFA Electricidad SpA</p></div>
      </footer>

      {/* Floating contact actions */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        <button onClick={() => setChatOpen(!chatOpen)} className="group inline-flex items-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-400 px-3.5 py-2.5 text-slate-950 shadow-[0_12px_35px_rgba(245,158,11,.32)] transition hover:-translate-y-0.5 hover:bg-amber-300"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-950/10"><Bot className="h-4 w-4" /></span><span className="text-left"><small className="block text-[9px] font-black uppercase tracking-widest">Asistente IA · 24/7</small><strong className="block text-xs">Consultas y emergencias</strong></span><Sparkles className="h-4 w-4 fill-current" /></button>
        <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20PFA%20Electricidad,%20necesito%20asistencia`} target="_blank" rel="noreferrer" className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_12px_35px_rgba(16,185,129,.32)] transition hover:scale-105 hover:bg-emerald-400" aria-label="WhatsApp PFA Electricidad"><MessageSquare className="h-6 w-6 fill-current" /></a>
      </div>

      {/* Chat */}
      {chatOpen && <div className="fixed bottom-24 right-4 z-50 flex h-[460px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-amber-300/30 bg-[#080D1B] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 bg-[#101B34] p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-slate-950"><Bot className="h-5 w-5" /></span><span><strong className="block text-sm text-white">Asistente PFA</strong><small className="text-xs text-emerald-300">En línea · {DISPLAY_PHONE}</small></span></div><button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button></div><div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">{chatMessages.map((message, index) => <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}><span className={`max-w-[84%] rounded-2xl px-3 py-2.5 leading-5 ${message.sender === "user" ? "bg-amber-400 font-semibold text-slate-950" : "border border-white/10 bg-white/5 text-slate-200"}`}>{message.text}</span></div>)}</div><form onSubmit={handleChatSend} className="flex gap-2 border-t border-white/10 bg-[#0C1427] p-3"><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Escribe tu consulta..." className="field flex-1" /><button className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-slate-950"><Send className="h-4 w-4" /></button></form></div>}

      {/* Service modal */}
      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#0B1428] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">PFA Electricidad</p><h2 className="heading-font mt-2 text-2xl font-bold text-white">{modalType === "visita" ? "Agendar visita técnica" : "Solicitar servicio"}</h2><p className="mt-2 text-sm text-slate-400">Tu solicitud se registra y se envía preparada al número {DISPLAY_PHONE}.</p></div><button onClick={() => setModalOpen(false)} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:text-white"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="label">Nombre completo *<input required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="field mt-2" placeholder="Tu nombre" /></label><label className="label">Teléfono / WhatsApp *<input required type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="field mt-2" placeholder="+56 9..." /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="label">Comuna<select value={formData.comuna} onChange={(e) => setFormData({ ...formData, comuna: e.target.value })} className="field mt-2">{comunas.map((item) => <option key={item}>{item}</option>)}</select></label><label className="label">Tipo de propiedad<select value={formData.tipoPropiedad} onChange={(e) => setFormData({ ...formData, tipoPropiedad: e.target.value })} className="field mt-2"><option>Residencial</option><option>Departamento</option><option>Comercial</option><option>Industrial</option></select></label></div><label className="label">Servicio requerido<input value={formData.servicio} onChange={(e) => setFormData({ ...formData, servicio: e.target.value })} className="field mt-2" /></label><label className="label">Detalle del problema o proyecto<textarea rows={3} value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} className="field mt-2 resize-none" placeholder="Cuéntanos qué necesitas..." /></label><div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10">Cancelar</button><button disabled={createOrderMutation.isPending} className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-60">{createOrderMutation.isPending ? "Registrando..." : "Confirmar solicitud"}</button></div></form></div></div>}
    </div>
  );
}
