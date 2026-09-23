import React, { useEffect, useState } from "react";
import {
  Phone,
  MessageSquare,
  ShieldCheck,
  Zap,
  Bot,
  Clock3,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Sparkles,
  Star,
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
const PFA_LOGO_URL = "https://raw.githubusercontent.com/angelvicente1298-arch/pfa-electricidad/main/branding/pfa-electricidad-logo.webp";
const IS_STATIC_PAGES = import.meta.env.VITE_GITHUB_PAGES === "true" || (typeof window !== "undefined" && window.location.hostname.endsWith("github.io"));

function getStaticAssistantReply(message: string) {
  const normalized = message.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (/(humo|chispa|cortocircuito|olor a quemado|incendio|electrocut|urgencia|emergencia)/.test(normalized)) {
    return "Si hay humo, fuego, chispas o riesgo de descarga, aléjate y corta el interruptor general solo si puedes hacerlo sin exponerte. No manipules cables dañados. Para atención inmediata, llama al +56 9 6193 5547 o escribe por WhatsApp.";
  }
  if (/(whatsapp|contacto|numero|llamar|telefono)/.test(normalized)) {
    return "Puedes contactar a PFA Electricidad por WhatsApp o llamar directamente al +56 9 6193 5547. Cuéntanos qué ocurrió, tu comuna y si es una urgencia.";
  }
  if (/(precio|cotiza|cotizacion|presupuesto|valor|costo)/.test(normalized)) {
    return "Para preparar una cotización, envía por WhatsApp tu nombre, comuna, tipo de propiedad y una descripción de lo que necesitas. El equipo revisará los detalles y te responderá.";
  }
  if (/(servicio|instalacion|tablero|mantencion|certificacion|proyecto|industrial|domiciliaria)/.test(normalized)) {
    return "PFA Electricidad realiza instalaciones domiciliarias, montaje eléctrico industrial en baja tensión, integración de tableros, mantenciones, ejecución de proyectos y respaldo profesional en Chile.";
  }
  return "Puedo orientarte sobre una falla eléctrica, una instalación, una mantención o una cotización. Escribe qué ocurrió y tu comuna; si prefieres, usa los botones de WhatsApp o llamada directa.";
}

const comunas = [
  "Las Condes", "Vitacura", "Lo Barnechea", "Providencia", "Ñuñoa",
  "Santiago Centro", "La Reina", "Peñalolén", "Macul", "San Miguel",
  "Maipú", "La Florida", "Huechuraba", "Colina / Chicureo", "Lampa", "Otras Comunas RM"
];

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [orderConfirmationUrl, setOrderConfirmationUrl] = useState<string | null>(null);
  const [modalType, setModalType] = useState<"servicio" | "visita">("servicio");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    nombre: "",
    comuna: "Las Condes",
    servicio: "Reparación Urgente / Emergencia",
    calificacion: 5,
    comentario: "",
  });
  const { data: approvedReviews = [] } = trpc.reviews.listApproved.useQuery();
  const utils = trpc.useUtils();
  const submitReviewMutation = trpc.reviews.submit.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      setReviewModalOpen(false);
      setReviewForm({ nombre: "", comuna: "Las Condes", servicio: "Reparación Urgente / Emergencia", calificacion: 5, comentario: "" });
      utils.reviews.listApproved.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
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
    servicio: "Solicitud eléctrica",
    tipoPropiedad: "Residencial",
    urgencia: "Inmediata (Hoy)",
    mensaje: ""
  });

  const buildWhatsAppUrl = (data: typeof formData) => {
    const digits = data.telefono.replace(/\D/g, "");
    const phone = digits.startsWith("56") ? digits : digits.startsWith("0") ? `56${digits.slice(1)}` : `56${digits}`;
    const message = [
      "NUEVO PEDIDO DE SERVICIO",
      "PFA ELECTRICIDAD SPA",
      "------------------------------",
      `Cliente: ${data.nombre.trim()}`,
      `Telefono: +${phone}`,
      `Comuna: ${data.comuna}`,
      `Tipo de propiedad: ${data.tipoPropiedad || "Residencial"}`,
      `Urgencia: ${data.urgencia || "Normal"}`,
      `Detalle: ${data.mensaje.trim() || "Sin detalle adicional"}`,
    ].join("\n");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  useEffect(() => {
    const handleAdminShortcut = (event: KeyboardEvent) => {
      const modifierPressed = event.ctrlKey || event.metaKey;
      if (modifierPressed && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        window.location.assign("/admin/pedidos");
      }
    };

    window.addEventListener("keydown", handleAdminShortcut);
    return () => window.removeEventListener("keydown", handleAdminShortcut);
  }, []);

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success("Solicitud registrada correctamente.");
      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
        setOrderConfirmationUrl(data.whatsappUrl);
      }
      setModalOpen(false);
      setFormData({ nombre: "", telefono: "", comuna: "Las Condes", servicio: "Solicitud eléctrica", tipoPropiedad: "Residencial", urgencia: "Inmediata (Hoy)", mensaje: "" });
    },
    onError: (error) => {
      const whatsappUrl = buildWhatsAppUrl(formData);
      toast.error(`No se pudo guardar en el Panel Admin: ${error.message}. El pedido quedó preparado para WhatsApp.`);
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setOrderConfirmationUrl(whatsappUrl);
      setModalOpen(false);
    }
  });

  const assistantMutation = trpc.assistant.chat.useMutation({
    onSuccess: (data) => setChatMessages((prev) => [...prev, { sender: "bot", text: data.reply }]),
    onError: () => setChatMessages((prev) => [...prev, { sender: "bot", text: `Estoy disponible 24/7. Si necesitas atención inmediata, llama o escribe al ${DISPLAY_PHONE}.` }]),
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

  const sendAssistantMessage = (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || assistantMutation.isPending) return;
    const history = chatMessages.slice(-12);
    setChatMessages((prev) => [...prev, { sender: "user", text: message }]);
    setChatInput("");
    if (IS_STATIC_PAGES) {
      window.setTimeout(() => setChatMessages((prev) => [...prev, { sender: "bot", text: getStaticAssistantReply(message) }]), 350);
      return;
    }
    assistantMutation.mutate({ message, history });
  };

  const handleChatSend = (event: React.FormEvent) => {
    event.preventDefault();
    const message = chatInput.trim();
    sendAssistantMessage(message);
  };


  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950 pb-24 sm:pb-0">
      {/* Top utility strip */}
      <div className="relative z-50 border-b border-white/10 bg-[#090F20]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-2.5 text-center text-xs sm:flex-row sm:text-left">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">
              <Zap className="h-3 w-3 fill-current" /> Atención profesional
            </span>
            <span className="hidden sm:inline">Servicios eléctricos garantizados en Chile</span>
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
            <img src={PFA_LOGO_URL} alt="PFA Electricidad SpA" className="h-12 w-auto max-w-[220px] object-contain object-left" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegación principal">
            <a href="#confianza" className="text-sm font-semibold text-slate-300 transition hover:text-amber-300">Por qué PFA</a>
            <a href="#contacto" className="text-sm font-semibold text-slate-300 transition hover:text-amber-300">Contacto</a>
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
            <a href="#confianza" onClick={() => setMobileMenuOpen(false)}>Por qué PFA</a>
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
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Instalaciones domiciliarias y montaje eléctrico industrial en baja tensión, integración de tableros electricos, mantenciones, ejecución de proyectos y respaldo profesional.</p>
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
                    <input required type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="Pon tu número (9 1234 5678) *" className="field" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={formData.comuna} onChange={(e) => setFormData({ ...formData, comuna: e.target.value })} className="field">{comunas.map((item) => <option key={item}>{item}</option>)}</select>
                  </div>
                  <label className="label">¿Qué pasó? *<textarea required rows={3} value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} placeholder="Cuéntanos con tus palabras qué ocurrió. Ej.: se corta la luz al prender el horno..." className="field mt-2 resize-none" /></label>
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

        {/* Why us */}
        <section id="confianza" className="border-y border-white/10 bg-[#071021]">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Por qué PFA</p><h2 className="heading-font mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Profesionalidad que se nota desde la primera visita.</h2><p className="mt-6 max-w-xl text-base leading-7 text-slate-400">No solo resolvemos la falla. Te explicamos qué ocurre, qué hay que hacer y cómo mantener tu instalación segura después del trabajo.</p><button onClick={() => openServiceModal(undefined, "visita")} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-200 transition hover:bg-amber-300/20">Agendar diagnóstico <ArrowRight className="h-4 w-4" /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[{ title: "Diagnóstico claro", body: "Te mostramos el origen del problema y las alternativas antes de comenzar.", icon: <Wrench /> }, { title: "Terminaciones limpias", body: "Orden, rotulación y materiales adecuados en cada intervención.", icon: <Layers /> }, { title: "Respaldo SEC", body: "Trabajos y declaraciones con profesionales autorizados.", icon: <BadgeCheck /> }, { title: "Seguimiento real", body: "Cada solicitud queda registrada para que no se pierda ningún detalle.", icon: <CheckCircle2 /> }].map((item) => <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300 [&>svg]:h-5 [&>svg]:w-5">{item.icon}</span><h3 className="mt-5 text-base font-bold text-white">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p></div>)}
            </div>
          </div>
        </section>

        {/* Reseñas reales y contacto */}
        <section id="contacto" className="mx-auto max-w-7xl space-y-10 px-4 py-24 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Opiniones de clientes</p>
              <h2 className="heading-font mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Reseñas del servicio</h2>
              <p className="mt-2 text-sm text-slate-400">Las opiniones se reciben por este formulario y solo se muestran después de una revisión manual.</p>
            </div>
            <button onClick={() => setReviewModalOpen(true)} className="inline-flex w-fit items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs font-black text-amber-200 transition hover:bg-amber-300/20">
              <Star className="h-4 w-4 fill-current" /> Dejar mi reseña
            </button>
          </div>

          {approvedReviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-8 text-center">
              <p className="text-sm font-semibold text-slate-300">Aún no hay reseñas publicadas.</p>
              <p className="mt-1 text-xs text-slate-500">¿Recibiste un servicio de PFA Electricidad? Sé el primero en compartir tu experiencia.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedReviews.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-5 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1 text-amber-300">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`h-3.5 w-3.5 ${idx < item.calificacion ? "fill-current" : "text-slate-600"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString("es-CL")}</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">“{item.comentario}”</p>
                  <div className="mt-4 border-t border-white/10 pt-3 text-[11px]">
                    <strong className="block font-bold text-white">{item.nombre}</strong>
                    <span className="text-slate-500">{item.comuna || "Santiago"} · {item.servicio || "Servicio Eléctrico"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-400/[.14] via-[#111C36] to-[#0B1328] lg:grid-cols-[1fr_.8fr]">
            <div className="p-8 sm:p-12">
              <p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">Transparencia técnica</p>
              <h3 className="heading-font mt-3 text-2xl font-bold text-white sm:text-3xl">Todas las reseñas son revisadas antes de publicarse.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">Cada comentario queda pendiente hasta que el equipo lo revise y decida si corresponde publicarlo.</p>
            </div>
            <div className="border-t border-white/10 bg-black/15 p-8 sm:p-12 lg:border-l lg:border-t-0">
              <p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">¿Tienes una falla?</p>
              <h3 className="heading-font mt-2 text-2xl font-bold text-white">Hablemos hoy.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Atención directa en el número oficial de PFA Electricidad.</p>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20PFA%20Electricidad,%20quiero%20solicitar%20un%20servicio`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-400">
                Escribir por WhatsApp <ArrowUpRight className="h-4 w-4" />
              </a>
              <p className="mt-3 text-xs text-slate-500">{DISPLAY_PHONE} · Santiago y Región Metropolitana</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#03050D]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><img src={PFA_LOGO_URL} alt="PFA Electricidad SpA" className="h-9 w-auto max-w-[170px] object-contain object-left" /><span><strong className="block text-sm text-white">PFA Electricidad SpA</strong><small className="text-xs text-slate-500">Instalaciones · Obras · Certificación SEC</small></span></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><a href={`tel:+${WHATSAPP_NUMBER}`} className="transition hover:text-amber-300">{DISPLAY_PHONE}</a><span>Chile</span></div><p className="text-xs text-slate-600">© {new Date().getFullYear()} PFA Electricidad SpA</p></div>
      </footer>

      {/* Floating contact actions */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
        <button onClick={() => setChatOpen(!chatOpen)} className="group inline-flex items-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-400 px-3.5 py-2.5 text-slate-950 shadow-[0_12px_35px_rgba(245,158,11,.32)] transition hover:-translate-y-0.5 hover:bg-amber-300"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-950/10"><Bot className="h-4 w-4" /></span><span className="text-left"><small className="block text-[9px] font-black uppercase tracking-widest">Asistente IA · 24/7</small><strong className="block text-xs">Consultas y emergencias</strong></span><Sparkles className="h-4 w-4 fill-current" /></button>
        <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20PFA%20Electricidad,%20necesito%20asistencia`} target="_blank" rel="noreferrer" className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_12px_35px_rgba(16,185,129,.32)] transition hover:scale-105 hover:bg-emerald-400" aria-label="WhatsApp PFA Electricidad"><MessageSquare className="h-6 w-6 fill-current" /></a>
      </div>

      {/* Chat */}
      {chatOpen && <div className="fixed bottom-24 right-4 z-50 flex h-[460px] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-amber-300/30 bg-[#080D1B] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 bg-[#101B34] p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-slate-950"><Bot className="h-5 w-5" /></span><span><strong className="block text-sm text-white">Asistente PFA</strong><small className="text-xs text-emerald-300">Disponible 24/7 · {DISPLAY_PHONE}</small></span></div><button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button></div><div className="grid grid-cols-2 gap-2 border-b border-white/10 bg-[#0C1427] p-3"><a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20PFA%20Electricidad,%20necesito%20ayuda`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-2 py-2 text-[11px] font-black text-white transition hover:bg-emerald-400"><MessageSquare className="h-3.5 w-3.5" /> WhatsApp</a><a href="tel:+56961935547" aria-label="Llamar directamente al +56 9 6193 5547" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-2 py-2 text-[11px] font-black text-amber-200 transition hover:bg-amber-300/20"><Phone className="h-3.5 w-3.5" /> Llamar directo al +56 9 6193 5547</a></div><div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">{chatMessages.map((message, index) => <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}><span className={`max-w-[84%] rounded-2xl px-3 py-2.5 leading-5 ${message.sender === "user" ? "bg-amber-400 font-semibold text-slate-950" : "border border-white/10 bg-white/5 text-slate-200"}`}>{message.text}</span></div>)}{assistantMutation.isPending && <div className="flex justify-start"><span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-slate-400">El asistente está escribiendo...</span></div>}</div><form onSubmit={handleChatSend} className="flex gap-2 border-t border-white/10 bg-[#0C1427] p-3"><input disabled={assistantMutation.isPending} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Escribe tu consulta..." className="field flex-1" /><button disabled={assistantMutation.isPending} className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-slate-950 disabled:opacity-50"><Send className="h-4 w-4" /></button></form></div>}

      {/* Review modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#0B1428] p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">Tu opinión</p>
                <h2 className="heading-font mt-2 text-2xl font-bold text-white">Dejar una reseña</h2>
                <p className="mt-1 text-sm text-slate-400">Comparte cómo fue tu experiencia con PFA Electricidad.</p>
              </div>
              <button onClick={() => setReviewModalOpen(false)} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!reviewForm.nombre.trim() || !reviewForm.comentario.trim()) {
                toast.error("Completa tu nombre y comentario");
                return;
              }
              submitReviewMutation.mutate(reviewForm);
            }} className="mt-6 space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input required value={reviewForm.nombre} onChange={(e) => setReviewForm({ ...reviewForm, nombre: e.target.value })} className="field mt-2 w-full" placeholder="Tu nombre" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Comuna</label>
                  <select value={reviewForm.comuna} onChange={(e) => setReviewForm({ ...reviewForm, comuna: e.target.value })} className="field mt-2 w-full">
                    {comunas.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Calificación</label>
                  <select value={reviewForm.calificacion} onChange={(e) => setReviewForm({ ...reviewForm, calificacion: Number(e.target.value) })} className="field mt-2 w-full">
                    <option value={5}>5 estrellas - Excelente</option>
                    <option value={4}>4 estrellas - Muy bueno</option>
                    <option value={3}>3 estrellas - Bueno</option>
                    <option value={2}>2 estrellas - Regular</option>
                    <option value={1}>1 estrella - Malo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Servicio recibido</label>
                <input value={reviewForm.servicio} onChange={(e) => setReviewForm({ ...reviewForm, servicio: e.target.value })} className="field mt-2 w-full" placeholder="Ej.: Reparación de tablero" />
              </div>
              <div>
                <label className="label">Tu comentario *</label>
                <textarea required rows={3} value={reviewForm.comentario} onChange={(e) => setReviewForm({ ...reviewForm, comentario: e.target.value })} className="field mt-2 w-full resize-none" placeholder="Cuéntanos cómo fue el trabajo, puntualidad y resultado..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReviewModalOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10">Cancelar</button>
                <button disabled={submitReviewMutation.isPending} className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-60">
                  {submitReviewMutation.isPending ? "Enviando..." : "Enviar reseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {orderConfirmationUrl && <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl border border-emerald-300/20 bg-[#0B1428] p-7 text-center shadow-2xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="h-7 w-7" /></span><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-emerald-300">Solicitud registrada</p><h2 className="heading-font mt-2 text-2xl font-bold text-white">Tu pedido fue guardado correctamente</h2><p className="mt-3 text-sm leading-6 text-slate-400">WhatsApp debería haberse abierto en otra pestaña. Si no ocurrió, usa el botón para enviar el detalle al número oficial.</p><div className="mt-6 grid gap-3"><a href={orderConfirmationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-400"><MessageSquare className="h-4 w-4" /> Abrir WhatsApp</a><a href={`tel:+${WHATSAPP_NUMBER}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-200 transition hover:bg-amber-300/20"><Phone className="h-4 w-4" /> Llamar al {DISPLAY_PHONE}</a><button onClick={() => setOrderConfirmationUrl(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10">Cerrar</button></div></div></div>}

      {/* Service modal */}
      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#0B1428] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-amber-300">PFA Electricidad</p><h2 className="heading-font mt-2 text-2xl font-bold text-white">{modalType === "visita" ? "Agendar visita técnica" : "Solicitar servicio"}</h2><p className="mt-2 text-sm text-slate-400">Tu solicitud se registra y se envía preparada al número {DISPLAY_PHONE}.</p></div><button onClick={() => setModalOpen(false)} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:text-white"><X className="h-5 w-5" /></button></div><form onSubmit={handleSubmit} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="label">Nombre completo *<input required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="field mt-2" placeholder="Tu nombre" /></label><label className="label">Teléfono / WhatsApp *<input required type="tel" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="field mt-2" placeholder="9 1234 5678" /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="label">Comuna<select value={formData.comuna} onChange={(e) => setFormData({ ...formData, comuna: e.target.value })} className="field mt-2">{comunas.map((item) => <option key={item}>{item}</option>)}</select></label><label className="label">Tipo de propiedad<select value={formData.tipoPropiedad} onChange={(e) => setFormData({ ...formData, tipoPropiedad: e.target.value })} className="field mt-2"><option>Residencial</option><option>Departamento</option><option>Comercial</option><option>Industrial</option></select></label></div><label className="label">¿Qué pasó? *<textarea required rows={3} value={formData.mensaje} onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })} className="field mt-2 resize-none" placeholder="Cuéntanos con tus palabras qué ocurrió..." /></label><div className="flex gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10">Cancelar</button><button disabled={createOrderMutation.isPending} className="flex-1 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:opacity-60">{createOrderMutation.isPending ? "Registrando..." : "Confirmar solicitud"}</button></div></form></div></div>}
    </div>
  );
}
