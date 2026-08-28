import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Clipboard,
  HelpCircle,
  Home,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import "./organization.css";

const routes = {
  organizationBootstrap: "bootstrap",
  organizationDashboard: "dashboard",
  organizationListParticipants: "participants",
  organizationCreateInvite: "invite/create",
  organizationRedeemInvite: "invite/redeem",
  organizationParticipantMe: "participant/me",
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
};
const apiOrigin =
  import.meta.env.DEV &&
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    ? "http://127.0.0.1:8787"
    : "";
const request = async (name, payload) => {
  if (window.desktopShell?.[name])
    return window.desktopShell[name](
      ...(Array.isArray(payload) ? payload : [payload]),
    );
  const body = Array.isArray(payload)
    ? { sessionToken: payload[0], input: payload[1] }
    : (payload ?? {});
  const response = await fetch(
    `${apiOrigin}/api/organization/${routes[name] || name}`,
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
      `Organization API returned an unreadable response (${response.status}). Start the Lighthouse API server and try again.`,
    );
  }
  if (!response.ok)
    throw new Error(
      result.error || `Organization request failed (${response.status}).`,
    );
  return result;
};

function Brand({ partner = false }) {
  return (
    <div className="lighthouse-brand">
      <div className="lighthouse-mark" aria-hidden="true">
        ✦
      </div>
      <div>
        <b>{partner ? "North Star" : "Lighthouse Jobs"}</b>
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

function PartnerSidebar({ account, onNavigate }) {
  const role = account?.membership?.role;
  const canManage = ["owner", "admin", "manager"].includes(role);
  return <aside className="partner-sidebar">
    <div className="sidebar-brand"><div className="sidebar-mark">✦</div><div><b>North Star</b><span>Partner workspace</span></div></div>
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
  const canManageStaff = ["owner", "admin", "manager"].includes(role);
  const canManageLocations = ["owner", "admin"].includes(role);
  const navigate = (target) => document.getElementById(`lighthouse-${target}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const [participants, setParticipants] = useState([]);
  const [locations, setLocations] = useState([]);
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
            {staffView ? <><div><Check size={20} /><b>{onboardedCount}</b><span>People onboarded</span></div><div><ArrowRight size={20} /><b>{inviteCount}</b><span>Invites sent</span></div></> : <><div><Building2 size={20} /><b>{dashboard?.locations?.length || locations.length}</b><span>Locations</span></div><div><Users size={20} /><b>{inviteCount}</b><span>Invites sent</span></div></>}
          </div>
        </section>
        <section id="lighthouse-invite" className="invite-hero">
          <div><span className="lighthouse-kicker">NEXT STEP</span><h2>Invite a participant</h2><p>Send a secure, single-use invitation. You only need their email address.</p></div>
          <form className="invite-form" onSubmit={createInvite}><label className="sr-only" htmlFor="participant-email">Participant email</label><input id="participant-email" required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="participant@example.org" /><button className="lighthouse-primary" type="submit">Create invite <ArrowRight size={16} /></button></form>
        </section>
        {invite && <div className="invite-result" role="status"><div><Check size={18} /><div><b>Invite created</b><span>Copy this code now. It is shown only once and expires in 72 hours.</span></div></div><code>{invite.inviteToken}</code><button className="outline-button" onClick={() => navigator.clipboard?.writeText(invite.inviteToken)}><Clipboard size={15} /> Copy code</button></div>}
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

function ParticipantPortal() {
  const [session, setSession] = useState(
    () => sessionStorage.getItem("lighthouse-participant-session") || "",
  );
  const [inviteToken, setInviteToken] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [profile, setProfile] = useState(null);
  const [link, setLink] = useState(null);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("home");
  useEffect(() => {
    if (session)
      request("organizationParticipantMe", session)
        .then(setProfile)
        .catch(() => {
          sessionStorage.removeItem("lighthouse-participant-session");
          setSession("");
        });
  }, [session]);
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
  const developerPath =
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
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
              <p>Use the invite code your organization gave you to create your Lighthouse login.</p>
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
              <p>Use the same Lighthouse login on this site and in ApplyPilot.</p>
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
            {activeView === "home" ? <>
              <div className="participant-stat-grid"><div><BriefcaseBusiness size={20} /><b>0</b><span>Saved opportunities</span></div><div><Clipboard size={20} /><b>0</b><span>Applications in progress</span></div><div><Check size={20} /><b>0</b><span>Interviews coming up</span></div></div>
              <div className="participant-card-grid"><section className="participant-card"><span className="lighthouse-kicker">NEXT STEP</span><h2>Save an opportunity to get started</h2><p>When a job is shared with you, save it here so you can open it later and work through the application at your pace.</p><button className="outline-button" onClick={() => setActiveView("saved")}>View saved opportunities <ArrowRight size={15} /></button></section><section className="participant-card"><span className="lighthouse-kicker">YOUR SUPPORT</span><h2>Need help with an application?</h2><p>Your staff can help you review an opportunity, prepare answers, and keep track of what is left to do.</p><button className="outline-button" onClick={() => setActiveView("messages")}>Open messages <ArrowRight size={15} /></button></section></div>
              <section className="participant-card extension-card"><div><span className="lighthouse-kicker">OPTIONAL CONNECTION</span><h2>Connect ApplyPilot</h2><p>Use a one-time code to connect the browser helper when you are ready to fill out an application. Staff cannot see your applications, documents, or email.</p></div><button className="lighthouse-primary" onClick={issueLink}>Generate extension code <ArrowRight size={16} /></button>{link && <div className="code-result"><code>{link.code}</code><span>Expires {new Date(link.expiresAt).toLocaleString()}</span></div>}</section>
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
