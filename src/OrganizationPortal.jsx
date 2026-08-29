import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Archive,
  BarChart3,
  Award,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Columns3,
  Clipboard,
  Download,
  FileText,
  Filter,
  Heart,
  HelpCircle,
  Home,
  Layers,
  MessageCircle,
  MoreHorizontal,
  MapPin,
  Search,
  Upload,
  Plus,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import "./organization.css";
import "./interview-prep.css";

const routes = {
  organizationBootstrap: "bootstrap",
  organizationDashboard: "dashboard",
  organizationListParticipants: "participants",
  organizationResumeCount: "resume-count",
  organizationCreateInvite: "invite/create",
  organizationRedeemInvite: "invite/redeem",
  organizationParticipantMe: "participant/me",
  organizationParticipantDocuments: "participant/documents",
  organizationUploadDocument: "participant/documents/upload",
  organizationIssueExtensionLink: "extension/issue",
  organizationDevelopmentSeed: "dev/seed",
  organizationCreateLocation: "location/create",
  organizationListLocations: "locations",
  organizationAddStaffForSession: "staff/add",
  organizationCreateStaffInvite: "staff/invite/create",
  organizationRedeemStaffInvite: "staff/invite/redeem",
  organizationStaffAccount: "staff/account",
  organizationLogin: "login",
  organizationParticipantLogin: "participant/login",
  organizationParticipantInterviewPrep: "participant/interview-prep",
  organizationParticipantInterviewPrepSave: "participant/interview-prep/save",
  organizationParticipantJobs: "participant/jobs",
  organizationParticipantJobsUpdate: "participant/jobs/update",
  "employment-support/save": "workforce/records",
  "employment-consent/revoke": "workforce/consent/revoke",
  "employment-report": "workforce/report",
};
const apiOrigin =
  import.meta.env.DEV &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    ? "http://127.0.0.1:8787"
    : "";
const railsApiOrigin =
  import.meta.env.DEV &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    ? "http://127.0.0.1:3000"
    : "";
const railsRoutes = new Set(["organizationParticipantInterviewPrep", "organizationParticipantInterviewPrepSave", "organizationParticipantJobs", "organizationParticipantJobsUpdate", "organizationParticipantDocuments", "organizationUploadDocument", "interview-prep/metrics", "employment-support/save", "employment-consent/revoke", "employment-report"]);
const request = async (name, payload) => {
  if (window.desktopShell?.[name])
    return window.desktopShell[name](
      ...(Array.isArray(payload) ? payload : [payload]),
    );
  const body = Array.isArray(payload)
    ? { sessionToken: payload[0], ...(name === "employment-support/save" ? { recordType: payload[1]?.kind, participantId: payload[1]?.participantId, input: payload[1] } : name === "employment-consent/revoke" ? { participantId: payload[1]?.participantId } : { input: payload[1] }) }
    : (payload ?? {});
  const backendOrigin = railsRoutes.has(name) ? railsApiOrigin : apiOrigin;
  const response = await fetch(
    `${backendOrigin}/api/organization/${routes[name] || name}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const raw = await response.text();
  let result = {};
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `Organization API returned an unreadable response (${response.status}). Start the Next Step API server and try again.`,
    );
  }
  if (!response.ok)
    throw new Error(
      result.error || `Organization request failed (${response.status}).`,
    );
  return result;
};

const readParticipantUiState = (session, key, fallback) => {
  if (!session) return fallback;
  try {
    const value = JSON.parse(localStorage.getItem(`lighthouse-participant-ui:${session}`) || "{}")[key];
    return value || fallback;
  } catch {
    return fallback;
  }
};

function Brand({ partner = false }) {
  return (
    <div className="lighthouse-brand">
      <div className="lighthouse-mark" aria-hidden="true">
        ✦
      </div>
      <div>
        <b>Next Step</b>
        <span>{partner ? "Partner workspace" : "Participant workspace"}</span>
      </div>
    </div>
  );
}
function PrivacyNote() {
  return (
    <aside className="privacy-note">
      <ShieldCheck size={20} />
      <div>
        <b>Privacy is built in</b>
        <p>
          We collect only what is needed to provide access. Participant career
          records stay private.
        </p>
      </div>
    </aside>
  );
}

const trackerSeed = [
  { id: 1, title: "Senior Software Engineer across...", company: "Infinity Software Development, Inc", location: "Remote", status: "Saved", color: "blue", icon: BriefcaseBusiness },
  { id: 2, title: "Founding AI Forward Deployed ...", company: "RingCentral", location: "Remote in USA", status: "Saved", color: "white", icon: BarChart3 },
  { id: 3, title: "Product Engineer", company: "Pharos", location: "San Francisco, CA, USA", status: "Saved", color: "mint", icon: Columns3 },
  { id: 4, title: "Not a Real Job Application", company: "Simplify", location: "", status: "Saved", color: "cyan", icon: SlidersHorizontal },
  { id: 5, title: "Senior Forward Deployed Engin...", company: "Databricks", location: "Dallas, TX, USA", status: "Applied", color: "red", icon: Layers },
  { id: 6, title: "Forward Deployed Engineer", company: "Zendesk", location: "California, USA + 3 more", status: "Applied", color: "teal", icon: Layers },
  { id: 7, title: "Full Stack Engineer", company: "Ciridae", location: "San Francisco, CA, USA +1 more", status: "Applied", color: "black", icon: BarChart3 },
];

function JobTrackerView({ session }) {
  const [jobs, setJobs] = useState(trackerSeed);
  const [syncState, setSyncState] = useState("Loading private opportunities…");
  const [tab, setTab] = useState("Active");
  const [query, setQuery] = useState("");
  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visible, setVisible] = useState({ Saved: true, Applied: true, Screen: false, Interviewing: true, Offer: true, Withdrawn: false, Ghosted: false, Rejected: true, Accepted: false, Archived: false });
  const columns = ["Saved", "Applied", "Interviewing", "Offer", "Rejected"];
  const filtered = jobs.filter((job) => visible[job.status] && `${job.title} ${job.company}`.toLowerCase().includes(query.toLowerCase()));
  const counts = Object.fromEntries(columns.map((column) => [column, jobs.filter((job) => job.status === column).length]));
  const archiveAll = () => setJobs((current) => current.map((job) => ({ ...job, status: "Archived" })));
  const addApplication = () => setJobs((current) => [...current, { id: Date.now(), title: "New application", company: "Add company details", location: "", status: "Saved", color: "cyan", icon: BriefcaseBusiness }]);
  const toggleColumn = (column) => setVisible((current) => ({ ...current, [column]: !current[column] }));
  useEffect(() => {
    if (!session) return;
    request("organizationParticipantJobs", [session, {}]).then((result) => {
      const remote = (result.jobs || []).map((job, index) => ({ ...job, color: ["blue", "mint", "cyan", "teal"][index % 4], icon: BriefcaseBusiness, status: job.status === "interviewing" ? "Interviewing" : job.status.charAt(0).toUpperCase() + job.status.slice(1) }));
      setJobs(remote.length ? remote : trackerSeed);
      setSyncState(remote.length ? "Synced to your private workspace" : "No saved opportunities yet · showing demo examples");
    }).catch(() => setSyncState("Offline demo mode · changes stay on this page"));
  }, [session]);
  const advanceJob = async (job) => {
    const next = { Saved: "applied", Applied: "interviewing", Interviewing: "offer", Offer: "archived" }[job.status];
    if (!next || !job.id || typeof job.id !== "string") return;
    setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: next === "interviewing" ? "Interviewing" : next.charAt(0).toUpperCase() + next.slice(1) } : item));
    try { await request("organizationParticipantJobsUpdate", [session, { jobId: job.id, status: next }]); setSyncState("Opportunity updated"); } catch (error) { setSyncState(error.message); }
  };

  return <section className="job-tracker" aria-label="Job tracker">
    <div className="tracker-heading">
      <div><h2>Your Job Tracker</h2><div className="tracker-tabs"><button className={tab === "Active" ? "active" : ""} onClick={() => setTab("Active")}>{jobs.filter((job) => job.status !== "Archived").length} <span>TOTAL JOBS</span></button><button className={tab === "Active" ? "active" : ""} onClick={() => setTab("Active")}>Active</button><button className={tab === "Archived" ? "active" : ""} onClick={() => setTab("Archived")}>Archived</button><button onClick={() => setShowFilters(true)}><SlidersHorizontal size={15} /> Partners</button></div></div>
      <div className="tracker-actions"><button className="tracker-outline selected"><Clipboard size={15} /> Tracked Jobs</button><button className="tracker-outline"><BarChart3 size={15} /> Flow Chart</button><button className="tracker-outline" onClick={() => setJobs((current) => current)}><Download size={15} /> Export CSV</button><button className="tracker-outline"><Download size={15} /> Import CSV</button><button className="tracker-primary" onClick={addApplication}>＋ Add Application</button></div>
    </div>
    <div className="tracker-toolbar"><label className="tracker-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for roles or companies" /></label><button className="tracker-select">Applied from <ChevronRight size={16} /> Applied until</button><button className="tracker-select">Job Type <ChevronDown size={16} /></button><button className="tracker-select">Status <ChevronDown size={16} /></button><button className={`tracker-filter ${showFilters ? "active" : ""}`} onClick={() => setShowFilters((current) => !current)}><Filter size={16} /></button></div><p className="tracker-sync-state" role="status">{syncState}</p>
    <div className="tracker-bulk"><span>☑ <b>Manage Jobs</b></span><i /><button onClick={archiveAll}><Archive size={14} /> Archive all</button><div className="tracker-column-wrap"><button onClick={() => setShowColumns((current) => !current)}><b>Visible Columns (5)</b> <ChevronDown size={15} /></button>{showColumns && <div className="tracker-columns-menu">{Object.entries(visible).map(([column, checked]) => <label key={column}><input type="checkbox" checked={checked} onChange={() => toggleColumn(column)} /><span>{column}</span><b>({counts[column] ?? 0})</b></label>)}</div>}</div><span className="tracker-view-label"><Columns3 size={15} /> Columns <b>/</b> ▤ List</span></div>
    {showFilters && <div className="tracker-filter-note"><b>Quick filters</b><button onClick={() => setQuery("remote")}>Remote roles</button><button onClick={() => setQuery("engineer")}>Engineering</button><button onClick={() => { setQuery(""); setShowFilters(false); }}>Clear filters</button></div>}
    <div className="tracker-board">{columns.filter((column) => visible[column]).map((column) => <div className="tracker-column" key={column}><div className="tracker-column-title"><span>⌁</span><b>{column.toUpperCase()}</b><em>({counts[column]})</em></div><div className="tracker-cards">{filtered.filter((job) => job.status === column).map((job) => <article className="tracker-card" key={job.id}><div className={`tracker-logo ${job.color}`}>{React.createElement(job.icon, { size: 22 })}</div><div className="tracker-card-copy"><div className="tracker-card-title"><b>{job.title}</b><button aria-label={`Favorite ${job.title}`}><Heart size={18} /></button></div><span><BuildingIcon /> {job.company}</span>{job.location && <span><MapPin size={13} /> {job.location}</span>}<div className="tracker-card-actions"><a className="text-button" href={job.applicationUrl} target="_blank" rel="noreferrer">Open synthetic application</a><button className="text-button" type="button" onClick={() => advanceJob(job)}>{job.status === "Offer" ? "Archive opportunity" : `Move to ${({ Saved: "Applied", Applied: "Interviewing", Interviewing: "Offer" }[job.status] || "next step")}`}</button></div></div><button className="tracker-more" aria-label="More actions"><MoreHorizontal size={17} /></button></article>)}{counts[column] === 0 && <div className="tracker-empty">No jobs here yet</div>}</div></div>)}</div>
  </section>;
}

function BuildingIcon() { return <Building2 size={13} />; }

function PartnerSidebar({ account, onNavigate }) {
  const role = account?.membership?.role;
  const canManage = ["owner", "admin", "manager"].includes(role);
  return <aside className="partner-sidebar">
    <div className="sidebar-brand"><div className="sidebar-mark">✦</div><div><b>Next Step</b><span>Partner workspace</span></div></div>
    <nav className="partner-nav" aria-label="Partner workspace navigation">
      <button className="partner-nav-item active" onClick={() => onNavigate("overview")}><Home size={18} /> Overview</button>
      <div className="partner-nav-label">WORKSPACE</div>
      <button className="partner-nav-item" onClick={() => onNavigate("participants")}><Users size={18} /> Participants</button>
      {canManage && <><div className="partner-nav-label">RESOURCES</div><button className="partner-nav-item" onClick={() => onNavigate("manage")}><>{role === "manager" ? <Users size={18} /> : <Building2 size={18} />}</> {role === "manager" ? "Staff" : "Locations & staff"}</button></>}
      <button className="partner-nav-item" onClick={() => onNavigate("support")}><HelpCircle size={18} /> Help</button>
    </nav>
    <div className="sidebar-account"><span className="sidebar-avatar">{String(account?.membership?.displayName || "?").slice(0, 1).toUpperCase()}</span><div><b>{account?.membership?.displayName || "Partner staff"}</b><span>{roleLabelText(role)}</span></div></div>
  </aside>;
}
function roleLabelText(role) { return ({ owner: "Partner administrator", admin: "Partner administrator", manager: "Location manager", employee: "Partner staff", staff: "Partner staff" })[role] || "Partner staff"; }

function readBootstrapForm(formElement, fallback) {
  const fields = Array.from(formElement.querySelectorAll("input"));
  return {
    name: fields[0]?.value?.trim() || fallback.name,
    displayName: fields[1]?.value?.trim() || fallback.displayName,
    email: fields[2]?.value?.trim() || fallback.email,
  };
}

export function StaffPortal() {
  const devUsers = [
    { label: "Partner administrator · Robins House", email: "demo-admin@robins-house.test", password: "demo-pass-123" },
    { label: "Location manager · Robins House", email: "manager@robins-house.test", password: "manager-pass-123" },
    { label: "Partner staff · Robins House", email: "staff@robins-house.test", password: "staff-pass-123" },
  ];
  const [session, setSession] = useState(
    () => sessionStorage.getItem("north-star-staff-session") || "",
  );
  const [form, setForm] = useState({ name: "", email: "", displayName: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [invite, setInvite] = useState(null);
  const [staffInvite, setStaffInvite] = useState(null);
  const [staffInviteToken] = useState(() => new URLSearchParams(window.location.search).get("staffInvite") || "");
  const [staffRedeemForm, setStaffRedeemForm] = useState({ email: "", displayName: "" });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [setupForm, setSetupForm] = useState({ name: "", displayName: "", email: "", password: "" });
  const [dashboard, setDashboard] = useState(null);
  const [account, setAccount] = useState(null);
  const setupMode = new URLSearchParams(window.location.search).get("setup") === "1";
  const roleLabel = (role) => ({ owner: "Partner administrator", admin: "Partner administrator", manager: "Location manager", employee: "Partner staff", staff: "Partner staff" })[role] || "Partner staff";
  const role = account?.membership?.role;
  const developerPath = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const chooseDevUser = (event) => {
    const selected = devUsers.find((user) => user.email === event.target.value);
    if (selected) setLoginForm({ email: selected.email, password: selected.password });
  };
  const canManageStaff = ["owner", "admin", "manager"].includes(role);
  const canRecordEmployment = ["owner", "admin", "manager", "employee", "staff"].includes(role);
  const canManageLocations = ["owner", "admin"].includes(role);
  const navigate = (target) => document.getElementById(`lighthouse-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const [participants, setParticipants] = useState([]);
  const [locations, setLocations] = useState([]);
  const [resumeCount, setResumeCount] = useState(0);
  const [prepMetrics, setPrepMetrics] = useState(null);
  const [employmentReport, setEmploymentReport] = useState(null);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");
  const [employmentForm, setEmploymentForm] = useState({ participantId: "", kind: "consent", date: "", employmentGoal: "", serviceType: "", activityType: "job-search", employerName: "", jobTitle: "", status: "saved", exitReason: "" });
  const [locationName, setLocationName] = useState("");
  const [staffForm, setStaffForm] = useState({
    email: "",
    displayName: "",
    role: "employee",
    locationId: "",
  });
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (session) return undefined;
    const timer = setTimeout(() => {
      const fields = Array.from(
        document.querySelectorAll(".partner-page .lighthouse-form input"),
      );
      if (fields.length >= 3 && fields.some((field) => field.value))
        setForm({
          name: fields[0].value,
          displayName: fields[1].value,
          email: fields[2].value,
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [session]);
  const refresh = async () => {
    try {
      setDashboard(await request("organizationDashboard", session));
      setAccount(await request("organizationStaffAccount", session));
      setParticipants(await request("organizationListParticipants", session));
      setLocations(await request("organizationListLocations", session));
      setResumeCount((await request("organizationResumeCount", session)).count);
      if (["owner", "admin", "manager"].includes(account?.membership?.role || role)) setPrepMetrics(await request("interview-prep/metrics", { sessionToken: session }));
      if (["owner", "admin", "manager"].includes(account?.membership?.role || role)) setEmploymentReport(await request("employment-report", { sessionToken: session, from: reportFrom || undefined, to: reportTo || undefined }));
    } catch (error) {
      setMessage(error.message);
    }
  };
  const logout = () => {
    sessionStorage.removeItem("north-star-staff-session");
    setSession("");
    setDashboard(null);
    setAccount(null);
    setMessage("You have been logged out.");
  };
  useEffect(() => {
    if (session) refresh();
  }, [session]);
  const bootstrap = async (event) => {
    event.preventDefault();
    const fields = event.currentTarget.elements;
    const submitted = {
      name: String(fields.organizationName?.value || form.name).trim(),
      displayName: String(fields.displayName?.value || form.displayName).trim(),
      email: String(fields.email?.value || form.email).trim(),
    };
    if (!submitted.name || !submitted.displayName || !submitted.email) {
      setMessage("Please complete organization name, your name, and work email.");
      return;
    }
    try {
      const result = await request("organizationBootstrap", submitted);
      sessionStorage.setItem("north-star-staff-session", result.token);
      setSession(result.token);
      setMessage("Workspace created.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const createInvite = async (event) => {
    event.preventDefault();
    try {
      setInvite(
        await request("organizationCreateInvite", [
          session,
          { email: inviteEmail },
        ]),
      );
      setInviteEmail("");
      setMessage("Invite ready to share.");
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const createLocation = async (event) => {
    event.preventDefault();
    try {
      await request("organizationCreateLocation", [
        session,
        { name: locationName },
      ]);
      setLocationName("");
      setMessage("Location added.");
      await refresh();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const inviteStaff = async (event) => {
    event.preventDefault();
    try {
      const scopedStaffForm = role === "manager" ? { ...staffForm, locationId: account?.membership?.locationId } : staffForm;
      setStaffInvite(await request("organizationCreateStaffInvite", [session, scopedStaffForm]));
      setStaffForm({
        email: "",
        displayName: "",
        role: "employee",
        locationId: staffForm.locationId,
      });
      setMessage("Staff invitation ready to share.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const redeemStaffInvite = async (event) => {
    event.preventDefault();
    try {
      const result = await request("organizationRedeemStaffInvite", { inviteToken: staffInviteToken, ...staffRedeemForm });
      sessionStorage.setItem("north-star-staff-session", result.token);
      window.history.replaceState({}, "", window.location.pathname);
      setSession(result.token);
      setMessage("Your staff account is ready.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const login = async (event) => {
    event.preventDefault();
    try { const result = await request("organizationLogin", loginForm); sessionStorage.setItem("north-star-staff-session", result.token); setSession(result.token); setMessage("Signed in."); }
    catch (error) { setMessage(error.message); }
  };
  const setup = async (event) => {
    event.preventDefault();
    try { const result = await request("organizationBootstrap", setupForm); sessionStorage.setItem("north-star-staff-session", result.token); setSession(result.token); window.history.replaceState({}, "", window.location.pathname); setMessage("Workspace created."); }
    catch (error) { setMessage(error.message); }
  };
  const recordEmployment = async (event) => {
    event.preventDefault();
    const date = employmentForm.date || new Date().toISOString().slice(0, 10);
    const input = { participantId: employmentForm.participantId, kind: employmentForm.kind, status: employmentForm.kind === "consent" ? "granted" : employmentForm.status, employmentGoal: employmentForm.employmentGoal, consentType: "employment_outcomes", serviceType: employmentForm.serviceType, serviceDate: date, activityType: employmentForm.activityType, activityDate: date, employerName: employmentForm.employerName, jobTitle: employmentForm.jobTitle, startDate: date, enrollmentDate: date, exitDate: date, exitReason: employmentForm.exitReason, appliedAt: ["applied", "interview", "offer"].includes(employmentForm.status) ? date : null, interviewAt: ["interview", "offer"].includes(employmentForm.status) ? date : null, offerAt: employmentForm.status === "offer" ? date : null };
    try {
      await request("employment-support/save", [session, input]);
      setEmploymentForm((current) => ({ ...current, date: "", employmentGoal: "", serviceType: "", employerName: "", jobTitle: "", exitReason: "" }));
      setMessage("Employment support recorded.");
      await refresh();
    } catch (error) { setMessage(error.message); }
  };
  const revokeConsent = async (participantId) => {
    if (!window.confirm("Revoke this participant's consent for aggregate employment reporting?")) return;
    try {
      await request("employment-consent/revoke", [session, { participantId }]);
      setMessage("Aggregate reporting consent revoked.");
      await refresh();
    } catch (error) { setMessage(error.message); }
  };
  const exportEmploymentReport = () => {
    if (!employmentReport?.metrics || employmentReport.privacy?.suppressed) return;
    const rows = [
      ["Metric", "Value"],
      ["period_from", employmentReport.period?.from || "all"],
      ["period_to", employmentReport.period?.to || "all"],
      ...Object.entries(employmentReport.metrics),
      ["participants_in_scope", employmentReport.privacy.participantCount],
      ["consented_participants", employmentReport.privacy.consentedParticipantCount],
      ...Object.entries(employmentReport.missingData || {}).map(([key, value]) => [`missing_${key}`, value]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `next-step-employment-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const refreshEmploymentReport = async () => {
    try {
      setEmploymentReport(await request("employment-report", { sessionToken: session, from: reportFrom || undefined, to: reportTo || undefined }));
      setMessage("Employment report refreshed.");
    } catch (error) { setMessage(error.message); }
  };
  if (!session && staffInviteToken)
    return (
      <section className="lighthouse-page partner-page">
        <div className="lighthouse-topbar"><Brand partner /><a href="#help"><HelpCircle size={16} /> Help</a></div>
        <main className="lighthouse-content setup-content">
          <span className="lighthouse-kicker">STAFF INVITATION</span>
          <h1>Join your partner workspace.</h1>
          <p className="lighthouse-lede">Confirm the email address that received this invitation and choose the name your team will see.</p>
          <form className="lighthouse-form" onSubmit={redeemStaffInvite}>
            <label>Work email<input required type="email" autoComplete="email" value={staffRedeemForm.email} onChange={(event) => setStaffRedeemForm({ ...staffRedeemForm, email: event.target.value })} placeholder="you@organization.org" /></label>
            <label>Your name<input required autoComplete="name" value={staffRedeemForm.displayName} onChange={(event) => setStaffRedeemForm({ ...staffRedeemForm, displayName: event.target.value })} placeholder="Your name" /></label>
            <label>Create password<input required minLength={8} type="password" autoComplete="new-password" value={staffRedeemForm.password || ""} onChange={(event) => setStaffRedeemForm({ ...staffRedeemForm, password: event.target.value })} placeholder="At least 8 characters" /></label>
            <button className="lighthouse-primary" type="submit">Accept invitation <ArrowRight size={16} /></button>
          </form>
          {message && <p className="lighthouse-message" role="alert">{message}</p>}
          <PrivacyNote />
        </main>
      </section>
    );
  if (!session && !setupMode)
    return (
      <section className="lighthouse-page partner-page">
        <div className="lighthouse-topbar">
          <Brand partner />
          <a href="#help">
            <HelpCircle size={16} /> Help
          </a>
        </div>
        <main className="lighthouse-content setup-content">
          <span className="lighthouse-kicker">PARTNER LOGIN</span>
          <h1>Welcome back.</h1>
          <p className="lighthouse-lede">Sign in to open your partner workspace.</p>
          {developerPath && <label className="dev-user-picker">Local test user<select defaultValue="" onChange={chooseDevUser}><option value="">Choose a seeded partner user…</option>{devUsers.map((user) => <option key={user.email} value={user.email}>{user.label}</option>)}</select></label>}
          <form className="lighthouse-form" onSubmit={login}>
            <label>Work email<input required type="email" autoComplete="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="you@organization.org" /></label>
            <label>Password<input required type="password" autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Your password" /></label>
            <button className="lighthouse-primary" type="submit">Sign in <ArrowRight size={16} /></button>
          </form>
          {message && <p className="lighthouse-message" role="alert">{message}</p>}
          <PrivacyNote />
        </main>
      </section>
    );
  if (!session && setupMode)
    return (
      <section className="lighthouse-page partner-page"><div className="lighthouse-topbar"><Brand partner /></div><main className="lighthouse-content setup-content"><span className="lighthouse-kicker">LIGHTHOUSE OWNER</span><h1>Create a partner organization.</h1><p className="lighthouse-lede">Set up a partner organization and its first administrator. This page is for Lighthouse platform owners only.</p><form className="lighthouse-form" onSubmit={setup}><label>Partner organization name<input required value={setupForm.name} onChange={(event) => setSetupForm({ ...setupForm, name: event.target.value })} placeholder="Harbor House" /></label><label>Partner administrator name<input required value={setupForm.displayName} onChange={(event) => setSetupForm({ ...setupForm, displayName: event.target.value })} placeholder="Administrator name" /></label><label>Administrator work email<input required type="email" value={setupForm.email} onChange={(event) => setSetupForm({ ...setupForm, email: event.target.value })} placeholder="admin@partner.org" /></label><label>Administrator password<input required minLength={8} type="password" autoComplete="new-password" value={setupForm.password} onChange={(event) => setSetupForm({ ...setupForm, password: event.target.value })} placeholder="At least 8 characters" /></label><button className="lighthouse-primary" type="submit">Create partner organization <ArrowRight size={16} /></button></form>{message && <p className="lighthouse-message" role="alert">{message}</p>}<PrivacyNote /></main></section>
    );
  const count = dashboard?.counts?.participants ?? 0;
  const staffView = ["employee", "staff"].includes(role);
  const inviteCount = dashboard?.events?.find((event) => event.eventType === "participant_invited")?.count ?? 0;
  const onboardedCount = dashboard?.events?.find((event) => event.eventType === "participant_onboarded")?.count ?? 0;
  return (
    <section className="lighthouse-page partner-page">
      <PartnerSidebar account={account} onNavigate={navigate} />
      <div className="partner-workspace">
      <div className="lighthouse-topbar">
        <Brand partner />
          <div className="topbar-right">
            <span className="privacy-chip">
              <ShieldCheck size={15} /> Privacy first
            </span>
            <button className="text-button" onClick={refresh}>
              <RefreshCw size={15} /> Refresh
            </button>
            <details className="account-menu">
              <summary><span className="account-avatar">{String(account?.membership?.displayName || "?").slice(0, 1).toUpperCase()}</span><span>Account</span></summary>
              <div className="account-panel">
                <strong>{account?.membership?.displayName || "Staff account"}</strong>
                <span>{account?.membership?.email || ""}</span>
                <small>{account?.membership?.role || "staff"}</small>
                <button className="outline-button" type="button" onClick={logout}>Log out</button>
              </div>
            </details>
          </div>
      </div>
      <main className="lighthouse-content">
        <div className="page-heading">
          <div>
            <span className="lighthouse-kicker">PARTNER WORKSPACE</span>
            <h1>{dashboard?.organization?.name || "Your partner workspace"}</h1>
            <p className="lighthouse-lede">
              A clear view of your program and the people you support.
            </p>
          </div>
          <span className="role-pill">{roleLabel(account?.membership?.role)}</span>
        </div>
        <section id="lighthouse-overview" className="snapshot-section">
          <div className="section-title">
            <div>
              <span className="lighthouse-kicker">PROGRAM SNAPSHOT</span>
              <h2>People in your program</h2>
            </div>
            <span className="muted-label">Aggregate information only</span>
          </div>
          <div className="snapshot-grid">
            <div>
              <Users size={20} />
              <b>{count}</b>
              <span>Participants</span>
            </div>
            {staffView ? <><div><Check size={20} /><b>{onboardedCount}</b><span>People onboarded</span></div><div><FileText size={20} /><b>{resumeCount}</b><span>Resumes uploaded</span></div></> : <><div><Building2 size={20} /><b>{dashboard?.locations?.length || locations.length}</b><span>Locations</span></div><div><FileText size={20} /><b>{resumeCount}</b><span>Resumes uploaded</span></div></>}
          </div>
        </section>
         {canManageStaff && ["owner", "admin", "manager"].includes(role) && <section id="lighthouse-interview-metrics" className="snapshot-section prep-metrics"><div className="section-title"><div><span className="lighthouse-kicker">EMPLOYMENT SUPPORT</span><h2>Interview Prep engagement</h2></div><span className="muted-label">Aggregate only · minimum cohort 5</span></div>{prepMetrics?.suppressed ? <div className="empty-state"><ShieldCheck size={24} /><b>Metrics are hidden for privacy</b><span>At least five participants must have started preparation before aggregate results are shown.</span></div> : <div className="snapshot-grid"><div><Target size={20} /><b>{prepMetrics?.metrics?.startedParticipants || 0}</b><span>Participants started</span></div><div><Check size={20} /><b>{prepMetrics?.metrics?.sessionsCompleted || 0}</b><span>Sessions completed</span></div><div><BarChart3 size={20} /><b>{prepMetrics?.metrics?.completionRate || 0}%</b><span>Completion rate</span></div><div><Award size={20} /><b>{prepMetrics?.metrics?.averageRubricScore == null ? "—" : `${prepMetrics.metrics.averageRubricScore}/100`}</b><span>Average delivery rubric</span></div></div>}</section>}
         {canManageStaff && ["owner", "admin", "manager"].includes(role) && <section id="lighthouse-employment-report" className="snapshot-section prep-metrics"><div className="section-title"><div><span className="lighthouse-kicker">OUTCOMES REPORT</span><h2>Employment support</h2></div><div className="section-actions"><span className="muted-label">Aggregate only · selected dates</span>{employmentReport?.metrics && !employmentReport?.privacy?.suppressed && <button className="outline-button" type="button" onClick={exportEmploymentReport}><Download size={15} /> Export CSV</button>}</div></div><div className="report-period"><label>From<input type="date" value={reportFrom} onChange={(event) => setReportFrom(event.target.value)} /></label><label>To<input type="date" value={reportTo} onChange={(event) => setReportTo(event.target.value)} /></label><button className="outline-button" type="button" onClick={refreshEmploymentReport}>Refresh report</button></div>{employmentReport?.empty ? <div className="empty-state"><BarChart3 size={24} /><b>No participants in scope yet</b><span>Invite participants to begin recording employment goals and support.</span></div> : employmentReport?.privacy?.suppressed ? <div className="empty-state"><ShieldCheck size={24} /><b>Report hidden for privacy</b><span>Aggregate employment outcomes appear after at least five participants are in scope.</span></div> : <><div className="snapshot-grid"><div><Users size={20} /><b>{employmentReport?.privacy?.participantCount || 0}</b><span>Participants in scope</span></div><div><Target size={20} /><b>{employmentReport?.metrics?.employmentGoalsRecorded || 0}</b><span>Goals recorded</span></div><div><Check size={20} /><b>{employmentReport?.metrics?.servicesDelivered || 0}</b><span>Services delivered</span></div><div><BriefcaseBusiness size={20} /><b>{employmentReport?.metrics?.jobActivitiesRecorded || 0}</b><span>Job activities</span></div><div><BriefcaseBusiness size={20} /><b>{employmentReport?.metrics?.placementsStarted || 0}</b><span>Placements started</span></div><div><Timer size={20} /><b>{employmentReport?.metrics?.retentionCheckins || 0}</b><span>Retention check-ins</span></div><div><Archive size={20} /><b>{employmentReport?.metrics?.noOutcomeExits || 0}</b><span>No-outcome exits</span></div></div><div className="report-note"><span>Missing data</span><span>Consent {employmentReport?.missingData?.consent || 0} · goals {employmentReport?.missingData?.employmentGoal || 0} · enrollment {employmentReport?.missingData?.enrollment || 0} · outcome/exit {employmentReport?.missingData?.outcomeOrExit || 0}</span></div></>}</section>}
        <section id="lighthouse-invite" className="invite-hero">
          <div><span className="lighthouse-kicker">NEXT STEP</span><h2>Invite a participant</h2><p>Send a secure, single-use invitation. You only need their email address.</p></div>
          <form className="invite-form" onSubmit={createInvite}><label className="sr-only" htmlFor="participant-email">Participant email</label><input id="participant-email" required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="participant@example.org" /><button className="lighthouse-primary" type="submit">Create invite <ArrowRight size={16} /></button></form>
        </section>
         {invite && <div className="invite-result" role="status"><div><Check size={18} /><div><b>Invite created</b><span>Copy this code now. It is shown only once and expires in 72 hours.</span></div></div><code>{invite.inviteToken}</code><button className="outline-button" onClick={() => navigator.clipboard?.writeText(invite.inviteToken)}><Clipboard size={15} /> Copy code</button></div>}
         {canRecordEmployment && <section id="lighthouse-record-employment" className="snapshot-section"><div className="section-title"><div><span className="lighthouse-kicker">WORKFORCE RECORD</span><h2>Record employment support</h2></div><span className="muted-label">No clinical or treatment data</span></div><form className="compact-form employment-record-form" onSubmit={recordEmployment}><label>Participant<select required value={employmentForm.participantId} onChange={(event) => setEmploymentForm({ ...employmentForm, participantId: event.target.value })}><option value="">Select a participant</option>{participants.map((participant) => <option key={participant.id} value={participant.id}>{participant.displayName}</option>)}</select></label><label>Record type<select value={employmentForm.kind} onChange={(event) => setEmploymentForm({ ...employmentForm, kind: event.target.value })}><option value="consent">Consent for aggregate reporting</option><option value="profile">Employment goal</option><option value="enrollment">Program enrollment</option><option value="service">Workforce service</option><option value="job_activity">Job activity</option><option value="job_opportunity">Application / interview / offer</option><option value="placement">Placement</option><option value="retention">Retention check-in</option><option value="exit">Exit / no outcome</option></select></label>{employmentForm.kind !== "consent" && <label>Date<input type="date" value={employmentForm.date} onChange={(event) => setEmploymentForm({ ...employmentForm, date: event.target.value })} /></label>}{employmentForm.kind === "profile" && <label>Employment goal<input required value={employmentForm.employmentGoal} onChange={(event) => setEmploymentForm({ ...employmentForm, employmentGoal: event.target.value })} placeholder="Target role or work goal" /></label>}{employmentForm.kind === "service" && <label>Service type<input required value={employmentForm.serviceType} onChange={(event) => setEmploymentForm({ ...employmentForm, serviceType: event.target.value })} placeholder="Job-search assistance" /></label>}{employmentForm.kind === "job_activity" && <label>Activity type<input required value={employmentForm.activityType} onChange={(event) => setEmploymentForm({ ...employmentForm, activityType: event.target.value })} placeholder="Application, interview, training…" /></label>}{["job_opportunity", "placement"].includes(employmentForm.kind) && <><label>Employer<input required value={employmentForm.employerName} onChange={(event) => setEmploymentForm({ ...employmentForm, employerName: event.target.value })} /></label><label>Job title<input required value={employmentForm.jobTitle} onChange={(event) => setEmploymentForm({ ...employmentForm, jobTitle: event.target.value })} /></label></>}{employmentForm.kind === "job_opportunity" && <label>Status<select value={employmentForm.status} onChange={(event) => setEmploymentForm({ ...employmentForm, status: event.target.value })}><option value="saved">Saved</option><option value="applied">Applied</option><option value="interview">Interview</option><option value="offer">Offer</option><option value="closed">Closed</option></select></label>}{employmentForm.kind === "exit" && <label>Exit reason<input required value={employmentForm.exitReason} onChange={(event) => setEmploymentForm({ ...employmentForm, exitReason: event.target.value })} placeholder="No outcome, withdrew, completed…" /></label>}<button className="outline-button" type="submit" disabled={!employmentForm.participantId}>Save record <Check size={15} /></button></form></section>}
         <section id="lighthouse-participants" className="directory-section">
          <div className="section-title">
            <div>
              <span className="lighthouse-kicker">PARTICIPANT DIRECTORY</span>
              <h2>People in scope</h2>
            </div>
            <span className="muted-label">{count} total</span>
          </div>
          {participants.length ? (
            <div className="directory-list">
              {participants.map((participant) => (
                <div className="directory-row" key={participant.id}>
                  <div className="avatar">
                    {String(participant.displayName || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div>
                    <b>{participant.displayName}</b>
                    <span>{participant.email}</span>
                  </div>
                  <em>Active</em>
                  {canManageStaff && <button className="text-button" type="button" onClick={() => revokeConsent(participant.id)}>Revoke reporting consent</button>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={24} />
              <b>No participants yet</b>
              <span>Create an invite above to get started.</span>
            </div>
          )}
        </section>
        {canManageStaff && <div id="lighthouse-manage" className="admin-tools">
          <details>
              <summary>
              <Plus size={15} /> {role === "manager" ? "Manage staff" : "Manage locations and staff"}
            </summary>
            <div className="admin-tools-grid">
              {canManageLocations && <form className="compact-form" onSubmit={createLocation}>
                <h3>Locations</h3>
                <label>
                  New location
                  <input
                    required
                    value={locationName}
                    onChange={(event) => setLocationName(event.target.value)}
                    placeholder="Downtown site"
                  />
                </label>
                <button className="outline-button" type="submit">
                  Add location
                </button>
                <small>
                  {locations.map((location) => location.name).join(" · ") ||
                    "No locations added yet."}
                </small>
              </form>}
              <form className="compact-form" onSubmit={inviteStaff}>
                <h3>Invite staff</h3>
                <label>
                  Name
                  <input
                    required
                    value={staffForm.displayName}
                    onChange={(event) =>
                      setStaffForm({
                        ...staffForm,
                        displayName: event.target.value,
                      })
                    }
                    placeholder="Program employee"
                  />
                </label>
                <label>
                  Work email
                  <input
                    required
                    type="email"
                    value={staffForm.email}
                    onChange={(event) =>
                      setStaffForm({ ...staffForm, email: event.target.value })
                    }
                    placeholder="employee@example.org"
                  />
                </label>
                <label>
                  Role
                  <select
                    value={staffForm.role}
                    onChange={(event) =>
                      setStaffForm({ ...staffForm, role: event.target.value })
                    }
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Location manager</option>
                  </select>
                </label>
                {role === "manager" ? <label>Location<input readOnly value={locations.find((location) => location.id === account?.membership?.locationId)?.name || "Assigned location"} /></label> : <label>Location<select required value={staffForm.locationId} onChange={(event) => setStaffForm({ ...staffForm, locationId: event.target.value })}><option value="">Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
                <button className="outline-button" type="submit">
                  Create staff invitation
                </button>
                {staffInvite && <div className="invite-result compact-invite" role="status"><div><Check size={18} /><div><b>Invitation ready</b><span>Share this link. It expires in 72 hours and works once.</span></div></div><code>{`${window.location.origin}${window.location.pathname}?staffInvite=${staffInvite.inviteToken}`}</code><button type="button" className="outline-button" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?staffInvite=${staffInvite.inviteToken}`)}><Clipboard size={15} /> Copy link</button></div>}
              </form>
            </div>
          </details>
        </div>}
        {message && (
          <p className="lighthouse-message" role="status">
            {message}
          </p>
        )}
      </main>
      </div>
    </section>
  );
}

function DocumentsView({ tab, setTab, search, setSearch, documents = [], onUpload }) {
  const cards = [
    { title: "New Resume", text: "Craft and tailor to job description", icon: FileText },
    { title: "New Cover Letter", text: "Create and customize with AI", icon: FileText },
    { title: "New Template", text: "Create a reusable cover letter template", icon: Clipboard },
    { title: "Question Response", text: "Generate tailored responses to application questions", icon: MessageCircle },
  ];
  const rows = tab === "Resumes" ? [{ name: "Josh_Rice_resume", status: "Uploaded", type: "PDF", detail: "Default", created: "Aug 25, 2026, 8:34 PM", edited: "Aug 25, 2026, 8:34 PM" }] : [];
  const filtered = rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()));
  const documentType = tab === "Cover Letters" ? "cover_letter" : "resume";
  const visibleRows = documents.length ? documents.filter((row) => row.documentType === documentType && row.fileName.toLowerCase().includes(search.toLowerCase())).map((row) => ({ name: row.fileName, type: row.mimeType.includes("pdf") ? "PDF" : "DOC", detail: "Private", created: new Date(row.createdAt).toLocaleString(), edited: new Date(row.updatedAt).toLocaleString(), id: row.id })) : filtered;
  return <div className="documents-view">
    <div className="document-actions-grid">{cards.map(({ title, text, icon: Icon }) => <button className="document-action-card" key={title} type="button" onClick={() => title === "New Cover Letter" && setTab("Cover Letters")}><span className="document-action-icon"><Icon size={22} /></span><span><b>{title}</b><small>{text}</small></span><Plus size={20} /></button>)}</div>
    <div className="document-tabs" role="tablist">{["Resumes", "Cover Letters", "Templates"].map((item) => <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}><FileText size={15} /> {item}</button>)}</div>
    <div className="document-toolbar"><span>0 selected <button type="button" className="document-delete" disabled>Delete</button></span><div><label className="document-upload"><Upload size={15} /> Upload<input className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => onUpload(event, documentType)} /></label><select aria-label="Document filter"><option>All</option></select><label className="document-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" /></label></div></div>
    <div className="document-table"><div className="document-table-head"><span></span><b>{tab.slice(0, -1).toUpperCase()} NAME</b><b>CREATED</b><b>LAST EDITED</b><b>ACTIONS</b></div>{visibleRows.length ? visibleRows.map((row) => <div className="document-row" key={row.id || row.name}><input type="checkbox" aria-label={`Select ${row.name}`} /><div className="document-name-cell"><span className="document-file-icon"><FileText size={18} /></span><div><b>{row.name}</b><small><em>Uploaded</em><em>{row.type}</em><em>{row.detail}</em></small></div></div><span>{row.created}</span><span>{row.edited}</span><button type="button" className="document-more">Edit&nbsp;&nbsp; More⌄</button></div>) : <div className="document-empty">No {tab.toLowerCase()} yet.</div>}</div>
  </div>;
}

function InterviewPrepView({ session, profile, onMessage }) {
  const [data, setData] = useState(null); const [context, setContext] = useState(null); const [mode, setMode] = useState("hub"); const [index, setIndex] = useState(0); const [response, setResponse] = useState(""); const [confidence, setConfidence] = useState(3); const [selected, setSelected] = useState(null); const [feedback, setFeedback] = useState(null); const [remaining, setRemaining] = useState(90); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const load = async () => { setLoading(true); try { const result = await request("organizationParticipantInterviewPrep", session); setData(result); setContext(result.contexts[0] || null); } catch (error) { onMessage(error.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [session]);
  const ensureContext = async () => { if (context) return context; const result = await request("organizationParticipantInterviewPrepSave", [session, { title: "My interview preparation", sessionType: "fundamentals", status: "started" }]); await load(); return { id: result.contextId, title: "My interview preparation" }; };
  const saveResult = async (type, itemKey, extra = {}) => { setSaving(true); try { const current = await ensureContext(); await request("organizationParticipantInterviewPrepSave", [session, { contextId: current.id?.startsWith("pending-") ? undefined : current.id, title: current.title, employmentPlanId: current.employmentPlanId, jobOpportunityId: current.jobOpportunityId, sessionType: type, status: "completed", results: [{ resultType: type, itemKey, answer: extra.answer, score: extra.score || 0, confidence, responseText: extra.responseText || "", improvementArea: extra.improvementArea }] }]); await load(); setFeedback(extra); onMessage("Progress saved to your private preparation history."); } catch (error) { onMessage(error.message); } finally { setSaving(false); } };
  useEffect(() => { if (mode !== "simulation" || !response) return undefined; const timer = setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [mode, response]);
  if (loading) return <section className="prep-panel" aria-live="polite"><p>Loading your private preparation space…</p></section>;
  const catalog = data?.catalog || {}; const cards = catalog.cards || []; const quiz = catalog.quiz || []; const simulations = catalog.simulation || []; const fundamentals = catalog.fundamentals || []; const current = mode === "flashcards" ? cards[index % Math.max(cards.length, 1)] : mode === "questions" ? quiz[index % Math.max(quiz.length, 1)] : mode === "fundamentals" || mode === "drills" ? fundamentals[index % Math.max(fundamentals.length, 1)] : simulations[index % Math.max(simulations.length, 1)];
  const back = <button className="text-button" onClick={() => { setMode("hub"); setResponse(""); setSelected(null); setFeedback(null); }}>Back to preparation</button>;
  if (mode === "hub") return <div className="prep-layout"><section className="prep-panel prep-hero"><div><span className="lighthouse-kicker">PRACTICE WITH PURPOSE</span><h2>Build confidence for your next conversation.</h2><p>Practice real interview skills, see why a score changed, and keep the next weak area visible. Your responses and scores are private to you.</p>{data?.availableContexts?.length > 0 && <label className="prep-context-picker">Prepare for<select value={context?.jobOpportunityId || context?.employmentPlanId || ""} onChange={(event) => { const chosen = data.availableContexts.find((item) => item.id === event.target.value); setContext(chosen ? { id: `pending-${chosen.id}`, title: chosen.label, jobOpportunityId: chosen.kind === "job_opportunity" ? chosen.id : null, employmentPlanId: chosen.kind === "employment_plan" ? chosen.id : null } : null); }}><option value="">General preparation</option>{data.availableContexts.map((item) => <option key={`${item.kind}-${item.id}`} value={item.id}>{item.label}</option>)}</select></label>}</div><div className="prep-score"><Award size={20} /><b>{data?.progress?.averageScore ?? "—"}</b><small>average rubric score</small></div></section><div className="prep-card-grid"><button className="prep-card" onClick={() => { setIndex(0); setRemaining(90); setMode("simulation"); }}><Timer size={20} /><b>Timed interview simulation</b><span>{simulations.length} role-grounded prompts with explainable structure, relevance, clarity, and reflection feedback.</span><strong>Start simulation <ArrowRight size={14} /></strong></button><button className="prep-card" onClick={() => { setIndex(0); setMode("questions"); }}><Target size={20} /><b>A–E knowledge questions</b><span>{quiz.length} questions with immediate correctness feedback and explanations.</span><strong>Practice questions <ArrowRight size={14} /></strong></button><button className="prep-card" onClick={() => { setIndex(0); setMode("flashcards"); }}><RefreshCw size={20} /><b>Flashcards</b><span>{cards.length} review cards with confidence ratings and private practice progress.</span><strong>Review flashcards <ArrowRight size={14} /></strong></button><button className="prep-card" onClick={() => { setIndex(0); setMode("fundamentals"); }}><Brain size={20} /><b>Fundamentals</b><span>Build reusable answers for stories, tradeoffs, role fit, and interviewer questions.</span><strong>Practice fundamentals <ArrowRight size={14} /></strong></button><button className="prep-card" onClick={() => { setIndex(0); setMode("drills"); }}><Target size={20} /><b>Targeted drills</b><span>Turn a weak area into one focused practice rep with a clear cue.</span><strong>Start a drill <ArrowRight size={14} /></strong></button></div><section className="prep-panel"><div className="section-title"><div><span className="lighthouse-kicker">YOUR HISTORY</span><h2>Private progress</h2></div><span className="muted-label">{data?.sessions?.length || 0} sessions · {data?.progress?.streak || 0} day streak</span></div>{data?.sessions?.length ? <div className="prep-history">{data.sessions.slice(0, 8).map((item) => <div key={item.id}><span>{item.sessionType}</span><b>{item.score?.overall ?? 0}/100</b><small>{new Date(item.startedAt).toLocaleDateString()}</small></div>)}</div> : <p className="muted-copy">Complete a practice activity to start your private history.</p>}</section></div>;
  if (mode === "flashcards") return <section className="prep-panel prep-activity"><span className="lighthouse-kicker">FLASHCARD {index + 1} OF {cards.length}</span><h2>{current?.front}</h2><p className="prep-explanation">{current?.back}</p><div className="prep-tip"><b>Confidence check</b><span>How ready do you feel explaining this in your own words?</span><div className="confidence-row">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={confidence === value ? "selected" : ""} onClick={() => setConfidence(value)} aria-label={`${value} out of 5 confidence`}>{value}</button>)}</div></div><div className="prep-actions"><button className="lighthouse-primary" disabled={saving} onClick={() => { saveResult("flashcards", current.key, { score: confidence * 20, confidence }); setIndex((value) => value + 1); }}>Save rating <Check size={16} /></button>{back}</div>{feedback && <p className="prep-feedback" role="status">Saved. Next rep: keep the answer concrete and connected to evidence.</p>}</section>;
  if (mode === "questions") return <section className="prep-panel prep-activity"><span className="lighthouse-kicker">KNOWLEDGE CHECK · {index + 1} OF {quiz.length}</span><h2>{current?.question}</h2><p className="prep-explanation">Choose the strongest approach. Lighthouse records the answer and explanation in your private history.</p><div className="answer-options">{current?.options?.map((option) => <button key={option} className={selected === option[0] ? "selected" : ""} onClick={() => { if (!selected) { setSelected(option[0]); saveResult("questions", current.key, { answer: option[0], score: option[0] === current.answer ? 100 : 0 }); } }}>{option}</button>)}</div>{selected && <div className="prep-tip" role="status"><b>{selected === current.answer ? "Correct" : `The strongest answer is ${current.answer}`}</b><span>{current.explanation}</span></div>}{selected && <button className="lighthouse-primary" onClick={() => { setIndex((value) => value + 1); setSelected(null); setFeedback(null); }}>Next question <ArrowRight size={15} /></button>}{back}</section>;
  if (mode === "fundamentals" || mode === "drills") return <section className="prep-panel prep-activity"><span className="lighthouse-kicker">{mode === "drills" ? "TARGETED DRILL" : "FUNDAMENTALS"} · {index + 1} OF {fundamentals.length}</span><h2>{current?.title}</h2><p>{current?.prompt}</p><div className="prep-tip"><b>Practice cue</b><span>{current?.cue}</span></div><textarea value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Write a short practice answer…" aria-label="Practice answer" rows={7} /><div className="prep-actions"><button className="lighthouse-primary" disabled={!response.trim() || saving} onClick={() => { saveResult("drill", current.key, { responseText: response, score: confidence * 20 }); setResponse(""); setIndex((value) => (value + 1) % fundamentals.length); }}>Save practice <Check size={16} /></button>{back}</div><div className="prep-privacy"><ShieldCheck size={15} /> Private to {profile.participant.displayName}. No recordings or AI processing are used.</div></section>;
  return <section className="prep-panel prep-activity"><span className="lighthouse-kicker">SIMULATION · QUESTION {index + 1} OF {simulations.length}</span><h2>{current?.prompt}</h2><p className="prep-explanation">You have a 90-second practice window. The server grades structure, relevance, clarity, reflection, and communication signals deterministically.</p><p className="prep-timer" aria-live="polite"><Timer size={16} /> {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p><textarea value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Type your answer here…" aria-label="Interview answer" rows={8} /><div className="prep-actions"><button className="lighthouse-primary" disabled={!response.trim() || saving} onClick={() => { saveResult("simulation", current.key, { responseText: response }); setResponse(""); setRemaining(90); setIndex((value) => (value + 1) % simulations.length); }}>Save answer and continue <ArrowRight size={15} /></button>{back}</div>{feedback?.score && <div className="prep-tip" role="status"><b>Saved for review</b><span>Rubric feedback will appear in your private history after the server response.</span></div>}<div className="prep-privacy"><ShieldCheck size={15} /> Private to {profile.participant.displayName}. Typed responses only; audio, recordings, and AI processing are unavailable in Lighthouse.</div></section>;
}

function ParticipantPortal() {
  const devUsers = [
    { label: "Participant Demo · Robins House", email: "participant.login@robins-house.test", password: "participant-pass-123" },
    { label: "Alex Johnson · Robins House", email: "alex.johnson@example.test", password: "alex-pass-123" },
    { label: "Jordan Lee · Robins House", email: "jordan.lee@example.test", password: "jordan-pass-123" },
  ];
  const [session, setSession] = useState(
    () => {
      const querySession = new URLSearchParams(window.location.search).get("session");
      if (querySession) {
        sessionStorage.setItem("lighthouse-participant-session", querySession);
        window.history.replaceState({}, "", window.location.pathname);
        return querySession;
      }
      return sessionStorage.getItem("lighthouse-participant-session") || "";
    },
  );
  const [inviteToken, setInviteToken] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [profile, setProfile] = useState(null);
  const [link, setLink] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState(() => readParticipantUiState(session, "activeView", "home"));
  const [documentTab, setDocumentTab] = useState(() => readParticipantUiState(session, "documentTab", "Resumes"));
  const [documentSearch, setDocumentSearch] = useState("");
  useEffect(() => {
    if (!session) return;
    const storageKey = `lighthouse-participant-ui:${session}`;
    try { localStorage.setItem(storageKey, JSON.stringify({ activeView, documentTab })); } catch { /* Storage may be unavailable in private browsing. */ }
  }, [session, activeView, documentTab]);
  useEffect(() => {
    if (session)
      request("organizationParticipantMe", session)
        .then(setProfile)
        .catch(() => {
          sessionStorage.removeItem("lighthouse-participant-session");
          setSession("");
        });
  }, [session]);
  useEffect(() => { if (session) request("organizationParticipantDocuments", session).then(setDocuments).catch(() => setDocuments([])); }, [session]);
  const redeem = async (event) => {
    event.preventDefault();
    try {
      const result = await request("organizationRedeemInvite", {
        inviteToken,
        displayName,
        password: loginForm.password,
      });
      sessionStorage.setItem("lighthouse-participant-session", result.token);
      setSession(result.token);
      setProfile({
        participant: result.participant,
        organization: result.organization,
      });
      setMessage("You are connected.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const login = async (event) => {
    event.preventDefault();
    try {
      const result = await request("organizationParticipantLogin", loginForm);
      sessionStorage.setItem("lighthouse-participant-session", result.token);
      setSession(result.token);
      setProfile({ participant: result.participant, organization: result.organization });
      setMessage("Signed in.");
    } catch (error) { setMessage(error.message); }
  };
  const issueLink = async () => {
    try {
      setLink(await request("organizationIssueExtensionLink", session));
      setMessage("Your one-time extension code is ready.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const uploadDocument = async (event, documentType = "resume") => {
    const file = event.target.files?.[0]; if (!file) return;
    const dataBase64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.onerror = reject; reader.readAsDataURL(file); });
    try { await request("organizationUploadDocument", [session, { fileName: file.name, mimeType: file.type, documentType, dataBase64 }]); setDocuments(await request("organizationParticipantDocuments", session)); setMessage(`${documentType === "cover_letter" ? "Cover letter" : "Resume"} uploaded. Only you can see the document.`); } catch (error) { setMessage(error.message); } finally { event.target.value = ""; }
  };
  const developerPath =
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const chooseDevUser = (event) => {
    const selected = devUsers.find((user) => user.email === event.target.value);
    if (selected) setLoginForm({ email: selected.email, password: selected.password });
  };
  const seedDeveloperScenario = async () => {
    try {
      const result = await request("organizationDevelopmentSeed", {});
      sessionStorage.setItem(
        "lighthouse-participant-session",
        result.participantSession.token,
      );
      sessionStorage.setItem(
        "north-star-dev-staff-session",
        result.staffSession.token,
      );
      setSession(result.participantSession.token);
      setProfile({
        participant: result.participantSession.participant,
        organization: result.participantSession.organization,
      });
      setLink(result.extension);
      setMessage(`Developer scenario ready for ${result.organization.name}.`);
    } catch (error) {
      setMessage(error.message);
    }
  };
  if (!session || !profile)
    return (
      <section className="lighthouse-page participant-page">
        <div className="lighthouse-topbar">
          <Brand />
          <a href="#help">
            <HelpCircle size={16} /> Help
          </a>
        </div>
        <main className="lighthouse-content participant-content">
          <div className="participant-intro">
            <span className="lighthouse-kicker">WELCOME</span>
            <h1>Your next opportunity starts here.</h1>
            <p className="lighthouse-lede">
              Track the opportunities you are working on, get help completing
              applications, and keep your career information in one private place.
              Your information stays yours.
            </p>
          </div>
          <div className="participant-grid">
            <div className="join-panel">
              <div className="step-line">
                <span className="step-number">1</span>
                <b>Join with your invite</b>
                <span className="step-rule" />
                <span className="step-muted">2 You’re in</span>
              </div>
              <p>Use the invite code your organization gave you to create your Next Step login.</p>
              <form className="lighthouse-form" onSubmit={redeem}>
                <label>
                  Invite code
                  <input
                    required
                    value={inviteToken}
                    onChange={(event) => setInviteToken(event.target.value)}
                    placeholder="Paste your invite code"
                    autoComplete="one-time-code"
                  />
                </label>
                <label>
                  Your name
                  <input
                    required
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>
                <label>
                  Create a password
                  <input required minLength={8} type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="At least 8 characters" autoComplete="new-password" />
                </label>
                <button className="lighthouse-primary" type="submit">
                  Join workspace <ArrowRight size={16} />
                </button>
              </form>
            </div>
            <div className="join-panel participant-login-panel">
              <div className="step-line"><span className="step-number">2</span><b>Already have an account?</b></div>
              <p>Use the same Next Step login on this site and in ApplyPilot.</p>
              {developerPath && <label className="dev-user-picker">Local test user<select defaultValue="" onChange={chooseDevUser}><option value="">Choose a seeded participant…</option>{devUsers.map((user) => <option key={user.email} value={user.email}>{user.label}</option>)}</select></label>}
              <form className="lighthouse-form" onSubmit={login}>
                <label>Email<input required type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="you@example.org" autoComplete="email" /></label>
                <label>Password<input required type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Your password" autoComplete="current-password" /></label>
                <button className="lighthouse-primary" type="submit">Log in <ArrowRight size={16} /></button>
              </form>
            </div>
            <PrivacyNote />
          </div>
          {developerPath && (
            <div className="developer-tools">
              <b>Developer test path</b>
              <span>Only visible in local development.</span>
              <button
                className="outline-button"
                type="button"
                onClick={seedDeveloperScenario}
              >
                Seed local test scenario
              </button>
            </div>
          )}
          {message && (
            <p className="lighthouse-message" role="status">
              {message}
            </p>
          )}
          <footer className="lighthouse-footer">
            <span>Need help getting started?</span>
            <a href="#help">
              Contact support <ArrowRight size={14} />
            </a>
          </footer>
        </main>
      </section>
    );
  const logout = () => {
    sessionStorage.removeItem("lighthouse-participant-session");
    setSession("");
    setProfile(null);
    setLink(null);
    setActiveView("home");
  };
  const views = {
    home: {
      label: "Overview",
      title: `Welcome, ${profile.participant.displayName}.`,
      lede: `Your private workspace with ${profile.organization.name}. Keep every opportunity and application moving forward.`,
    },
    saved: { label: "Saved opportunities", title: "Saved opportunities", lede: "Jobs you want to come back to live here." },
    applications: { label: "Applications", title: "Your applications", lede: "Track what you have started, what needs attention, and what is next." },
    interviews: { label: "Interview prep", title: "Interview prep", lede: "Prepare for conversations with practical guidance and notes." },
    messages: { label: "Messages", title: "Messages", lede: "Stay connected with the staff supporting your goals." },
    profile: { label: "Profile", title: "Your profile", lede: "Review the information used to support your applications." },
    documents: { label: "Documents", title: "My Documents", lede: "Manage and tailor all of your job application documents here." },
  };
  const view = views[activeView];
  return (
    <section className="lighthouse-page participant-page">
      <div className="participant-shell">
        <aside className="participant-sidebar">
          <Brand />
          <nav className="participant-nav" aria-label="Participant workspace">
            <button className={activeView === "home" ? "active" : ""} onClick={() => setActiveView("home")}><Home size={17} /> Overview</button>
            <button className={activeView === "saved" ? "active" : ""} onClick={() => setActiveView("saved")}><BriefcaseBusiness size={17} /> Saved opportunities</button>
            <button className={activeView === "applications" ? "active" : ""} onClick={() => setActiveView("applications")}><Clipboard size={17} /> Applications</button>
            <button className={activeView === "interviews" ? "active" : ""} onClick={() => setActiveView("interviews")}><Check size={17} /> Interview prep</button>
            <button className={activeView === "messages" ? "active" : ""} onClick={() => setActiveView("messages")}><MessageCircle size={17} /> Messages</button>
            <button className={activeView === "documents" ? "active" : ""} onClick={() => setActiveView("documents")}><FileText size={17} /> Documents</button>
          </nav>
          <div className="participant-nav-bottom">
            <button className={activeView === "profile" ? "active" : ""} onClick={() => setActiveView("profile")}><UserRound size={17} /> Profile</button>
            <button onClick={logout}><ArrowRight size={17} /> Log out</button>
          </div>
        </aside>
        <div className="participant-main">
          <div className="lighthouse-topbar">
            <Brand />
            <div className="topbar-right"><span className="privacy-chip"><ShieldCheck size={15} /> Privacy first</span><a href="#help"><HelpCircle size={16} /> Help</a></div>
          </div>
          <main className="lighthouse-content participant-content">
            <div className="participant-intro"><span className="lighthouse-kicker">{view.label.toUpperCase()}</span><h1>{view.title}</h1><p className="lighthouse-lede">{view.lede}</p></div>
            {activeView === "documents" ? <DocumentsView tab={documentTab} setTab={setDocumentTab} search={documentSearch} setSearch={setDocumentSearch} documents={documents} onUpload={uploadDocument} /> : activeView === "applications" ? <JobTrackerView session={session} /> : activeView === "interviews" ? <InterviewPrepView session={session} profile={profile} onMessage={setMessage} /> : activeView === "home" ? <>
              <div className="participant-stat-grid"><div><BriefcaseBusiness size={20} /><b>0</b><span>Saved opportunities</span></div><div><Clipboard size={20} /><b>0</b><span>Applications in progress</span></div><div><Check size={20} /><b>0</b><span>Interviews coming up</span></div></div>
              <div className="participant-card-grid"><section className="participant-card"><span className="lighthouse-kicker">NEXT STEP</span><h2>Save an opportunity to get started</h2><p>When a job is shared with you, save it here so you can open it later and work through the application at your pace.</p><button className="outline-button" onClick={() => setActiveView("saved")}>View saved opportunities <ArrowRight size={15} /></button></section><section className="participant-card"><span className="lighthouse-kicker">YOUR SUPPORT</span><h2>Need help with an application?</h2><p>Your staff can help you review an opportunity, prepare answers, and keep track of what is left to do.</p><button className="outline-button" onClick={() => setActiveView("messages")}>Open messages <ArrowRight size={15} /></button></section></div>
            </> : <section className="participant-empty"><div className="connected-icon">{activeView === "messages" ? <MessageCircle size={20} /> : <BriefcaseBusiness size={20} />}</div><h2>{activeView === "profile" ? profile.participant.displayName : `Nothing here yet`}</h2><p>{activeView === "saved" ? "Saved opportunities shared with you will appear here." : activeView === "applications" ? "Applications you begin will appear here with their next step." : activeView === "interviews" ? "Upcoming interviews and preparation notes will appear here." : activeView === "messages" ? "Messages from your support team will appear here." : `Connected to ${profile.organization.name}.`}</p></section>}
            {message && <p className="lighthouse-message" role="status">{message}</p>}
            <footer className="lighthouse-footer"><span>Your career workspace is private by default.</span><a href="#help">Get help <ArrowRight size={14} /></a></footer>
          </main>
        </div>
      </div>
    </section>
  );
}

export default function OrganizationPortal({ participant = false }) {
  return participant ? <ParticipantPortal /> : <StaffPortal />;
}
