const tokenKey = "resgen.token";

const state = {
  token: localStorage.getItem(tokenKey) ?? null,
  profile: null,
  experiences: [],
  educations: [],
  resume: null,
  resumePdfUrl: null,
};

const els = {
  messages: document.querySelector("#messages"),
  loginSection: document.querySelector("#login-section"),
  loginForm: document.querySelector("#login-form"),
  signoutBtn: document.querySelector("#signout-btn"),
  authState: document.querySelector("#auth-state"),
  profileSection: document.querySelector("#profile-section"),
  profileForm: document.querySelector("#profile-form"),
  profilePreview: document.querySelector("#profile-preview"),
  experienceSection: document.querySelector("#experience-section"),
  experienceForm: document.querySelector("#experience-form"),
  experienceList: document.querySelector("#experience-list"),
  experienceRefresh: document.querySelector("#experience-refresh"),
  experienceClear: document.querySelector("#experience-clear"),
  educationSection: document.querySelector("#education-section"),
  educationForm: document.querySelector("#education-form"),
  educationList: document.querySelector("#education-list"),
  educationRefresh: document.querySelector("#education-refresh"),
  educationClear: document.querySelector("#education-clear"),
  resumeSection: document.querySelector("#resume-section"),
  resumeGenerate: document.querySelector("#resume-generate"),
  resumeGeneratePdf: document.querySelector("#resume-generate-pdf"),
  resumeDownload: document.querySelector("#resume-download"),
  resumeFrame: document.querySelector("#resume-frame"),
  resumeOutput: document.querySelector("#resume-output"),
};

function setToken(token) {
  state.token = token;
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
  updateAuthUI();
}

function updateAuthUI() {
  const authed = Boolean(state.token);
  els.authState.textContent = authed
    ? "Authenticated"
    : "Not signed in";
  toggle(els.signoutBtn, authed);
  toggle(els.loginSection, !authed);
  toggle(els.profileSection, authed);
  toggle(els.experienceSection, authed);
  toggle(els.educationSection, authed);
  toggle(els.resumeSection, authed);
  if (authed) {
    void fetchAllData();
  } else {
    state.profile = null;
    state.experiences = [];
    state.educations = [];
    state.resume = null;
    if (state.resumePdfUrl) {
      URL.revokeObjectURL(state.resumePdfUrl);
      state.resumePdfUrl = null;
    }
    renderProfile(null);
    renderExperiences([]);
    renderEducations([]);
    renderResume(null);
    renderResumePdf(null);
  }
}

function toggle(el, visible) {
  if (!el) return;
  el.classList.toggle("hidden", !visible);
}

function setMessage(text, type = "info") {
  if (!els.messages) return;
  els.messages.innerHTML = text
    ? `<span class="${type}">${text}</span>`
    : "";
  if (text) {
    window.setTimeout(() => {
      if (els.messages.innerText.trim() === text.trim()) {
        els.messages.textContent = "";
      }
    }, 5000);
  }
}

function toJSON(response) {
  if (response.status === 204) return null;
  return response.json();
}

function buildRequestOptions(options = {}) {
  const opts = { ...options };
  const headers = new Headers(opts.headers ?? {});
  if (state.token) {
    headers.set("Authorization", `Bearer ${state.token}`);
  }
  if (opts.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  opts.headers = headers;
  return opts;
}

async function throwResponseError(response) {
  let message = `${response.status} ${response.statusText}`;
  try {
    const data = await response.clone().json();
    if (typeof data?.message === "string") {
      message = data.message;
    }
  } catch {
    // ignore body parse failures
  }
  throw new Error(message);
}

async function apiFetch(path, options = {}) {
  const opts = buildRequestOptions(options);
  try {
    const res = await fetch(path, opts);
    if (!res.ok) {
      await throwResponseError(res);
    }
    return await toJSON(res);
  } catch (err) {
    throw err instanceof Error ? err : new Error("Network request failed");
  }
}

async function apiFetchBlob(path, options = {}) {
  const opts = buildRequestOptions(options);
  try {
    const res = await fetch(path, opts);
    if (!res.ok) {
      await throwResponseError(res);
    }
    return await res.blob();
  } catch (err) {
    throw err instanceof Error ? err : new Error("Network request failed");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    username: data.get("username"),
    password: data.get("password"),
  };
  try {
    setMessage("Signing in...");
    const result = await apiFetch("/api/login", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (result?.token) {
      setToken(result.token);
      setMessage("Signed in", "success");
      form.reset();
    } else {
      throw new Error("Login response missing token");
    }
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to sign in", "error");
  }
}

async function fetchAllData() {
  await Promise.allSettled([
    fetchProfile(),
    fetchExperiences(),
    fetchEducations(),
  ]);
}

async function fetchProfile() {
  try {
    const profile = await apiFetch("/api/users/profile");
    if (profile) {
      state.profile = profile;
      renderProfile(profile);
    } else {
      renderProfile(null);
    }
  } catch (err) {
    console.warn("fetchProfile", err);
    renderProfile(null);
  }
}

function renderProfile(profile) {
  if (!els.profileForm || !els.profilePreview) return;
  const form = els.profileForm;
  form.name.value = profile?.name ?? "";
  form.title.value = profile?.title ?? "";
  form.targetRole.value = profile?.targetRole ?? "";
  form.email.value = profile?.email ?? "";
  form.phone.value = profile?.phone ?? "";
  form.skills.value = (profile?.skills ?? []).join(", ");
  if (profile) {
    const display = {
      ...profile,
      skills: profile.skills?.join(", ") ?? "",
    };
    els.profilePreview.textContent = JSON.stringify(display, null, 2);
  } else {
    els.profilePreview.textContent = "Profile not set";
  }
}

async function handleProfileSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const skills = (data.get("skills") ?? "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const payload = {
    name: data.get("name"),
    title: emptyOrNull(data.get("title")),
    targetRole: emptyOrNull(data.get("targetRole")),
    email: emptyOrNull(data.get("email")),
    phone: emptyOrNull(data.get("phone")),
    skills,
  };
  try {
    setMessage("Saving profile...");
    const result = await apiFetch("/api/users/profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.profile = result;
    renderProfile(result);
    setMessage("Profile saved", "success");
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to save profile", "error");
  }
}

async function fetchExperiences() {
  try {
    const experiences = await apiFetch("/api/users/experience");
    if (Array.isArray(experiences)) {
      state.experiences = experiences;
      renderExperiences(experiences);
    } else {
      renderExperiences([]);
    }
  } catch (err) {
    console.warn("fetchExperiences", err);
    renderExperiences([]);
  }
}

function renderExperiences(items) {
  if (!els.experienceList) return;
  if (!items?.length) {
    els.experienceList.innerHTML =
      '<li class="list-item">No experience records yet.</li>';
    return;
  }
  const html = items
    .map((item) => {
      const bullets = (item.bullets ?? []).map(
        (bullet) => `<li>${escapeHtml(bullet)}</li>`
      );
      return `
        <li class="list-item">
          <strong>${escapeHtml(item.title)} @ ${escapeHtml(item.company)}</strong>
          <span>${escapeHtml(item.startDate)} → ${
        item.endDate ? escapeHtml(item.endDate) : "Present"
      }</span>
          <span>${escapeHtml(item.location ?? "")}</span>
          ${
            bullets.length
              ? `<ul>${bullets.join("")}</ul>`
              : ""
          }
        </li>`;
    })
    .join("");
  els.experienceList.innerHTML = html;
}

async function handleExperienceSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const bullets = (data.get("bullets") ?? "")
    .toString()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const payload = {
    company: data.get("company"),
    title: data.get("title"),
    location: emptyOrNull(data.get("location")),
    startDate: data.get("startDate"),
    endDate: emptyOrNull(data.get("endDate")),
    bullets,
  };
  try {
    setMessage("Saving experience...");
    await apiFetch("/api/users/experience", {
      method: "POST",
      body: JSON.stringify([payload]),
    });
    form.reset();
    await fetchExperiences();
    setMessage("Experience saved", "success");
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to save experience", "error");
  }
}

async function clearExperiences() {
  if (!confirm("Delete all experience records?")) return;
  try {
    await apiFetch("/api/users/experience", { method: "DELETE" });
    await fetchExperiences();
    setMessage("Experiences deleted", "success");
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to delete experiences", "error");
  }
}

async function fetchEducations() {
  try {
    const educations = await apiFetch("/api/users/education");
    if (Array.isArray(educations)) {
      state.educations = educations;
      renderEducations(educations);
    } else {
      renderEducations([]);
    }
  } catch (err) {
    console.warn("fetchEducations", err);
    renderEducations([]);
  }
}

function renderEducations(items) {
  if (!els.educationList) return;
  if (!items?.length) {
    els.educationList.innerHTML =
      '<li class="list-item">No education records yet.</li>';
    return;
  }
  const html = items
    .map((item) => {
      const year = item.year ? ` (${escapeHtml(item.year.toString())})` : "";
      return `
        <li class="list-item">
          <strong>${escapeHtml(item.credential)} @ ${escapeHtml(
        item.school
      )}</strong>
          <span>${year}</span>
        </li>`;
    })
    .join("");
  els.educationList.innerHTML = html;
}

async function handleEducationSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const payload = {
    school: data.get("school"),
    credential: data.get("credential"),
    year: emptyOrNull(data.get("year"))
      ? Number(data.get("year"))
      : undefined,
  };
  try {
    setMessage("Saving education...");
    await apiFetch("/api/users/education", {
      method: "POST",
      body: JSON.stringify([payload]),
    });
    form.reset();
    await fetchEducations();
    setMessage("Education saved", "success");
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to save education", "error");
  }
}

async function clearEducations() {
  if (!confirm("Delete all education records?")) return;
  try {
    await apiFetch("/api/users/education", { method: "DELETE" });
    await fetchEducations();
    setMessage("Educations deleted", "success");
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to delete educations", "error");
  }
}

async function handleGenerateResume() {
  try {
    setMessage("Generating resume...");
    const resume = await apiFetch("/api/resume", { method: "POST" });
    state.resume = resume;
    renderResume(resume);
    setMessage("Resume generated", "success");
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to generate resume", "error");
  }
}

async function handleGenerateResumePdf() {
  try {
    setMessage("Generating resume PDF...");
    const blob = await apiFetchBlob("/api/resume/pdf", {
      method: "POST",
    });
    const url = URL.createObjectURL(blob);
    if (state.resumePdfUrl) {
      URL.revokeObjectURL(state.resumePdfUrl);
    }
    state.resumePdfUrl = url;
    renderResumePdf(url);
    setMessage("Resume PDF ready", "success");
  } catch (err) {
    console.error(err);
    setMessage(err.message ?? "Unable to generate resume PDF", "error");
  }
}

function renderResume(resume) {
  if (!els.resumeOutput) return;
  if (!resume) {
    els.resumeOutput.textContent =
      "Generate a resume to see the model output.";
  } else {
    els.resumeOutput.textContent = JSON.stringify(resume, null, 2);
  }
}

function renderResumePdf(url) {
  if (!els.resumeFrame || !els.resumeDownload) return;
  if (!url) {
    els.resumeFrame.removeAttribute("src");
    toggle(els.resumeFrame, false);
    els.resumeDownload.removeAttribute("href");
    toggle(els.resumeDownload, false);
    return;
  }

  if (els.resumeFrame.src !== url) {
    els.resumeFrame.src = url;
  }
  toggle(els.resumeFrame, true);
  els.resumeDownload.href = url;
  toggle(els.resumeDownload, true);
}

function handleSignOut() {
  setToken(null);
  setMessage("Signed out", "success");
}

function emptyOrNull(value) {
  const str = value?.toString().trim();
  return str ? str : null;
}

function escapeHtml(value) {
  return value
    ? value
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
    : "";
}

function init() {
  updateAuthUI();
  els.loginForm?.addEventListener("submit", handleLogin);
  els.profileForm?.addEventListener("submit", handleProfileSubmit);
  els.experienceForm?.addEventListener("submit", handleExperienceSubmit);
  els.educationForm?.addEventListener("submit", handleEducationSubmit);
  els.experienceRefresh?.addEventListener("click", fetchExperiences);
  els.educationRefresh?.addEventListener("click", fetchEducations);
  els.experienceClear?.addEventListener("click", clearExperiences);
  els.educationClear?.addEventListener("click", clearEducations);
  els.resumeGenerate?.addEventListener("click", handleGenerateResume);
  els.resumeGeneratePdf?.addEventListener("click", handleGenerateResumePdf);
  els.signoutBtn?.addEventListener("click", handleSignOut);
}

document.addEventListener("DOMContentLoaded", init);
