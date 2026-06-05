// "use client";

// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { FormEvent, useState } from "react";
// import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// import { auth } from "@/lib/firebase";
// import { createInitialCertifications } from "@/lib/certifications";
// import { greyOrangeEmailErrorMessage, isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";
// import PasswordField from "@/components/auth/PasswordField";
// const TEAM_OPTIONS = ['TAC','Change Management','Client Director','CEM','CAC','IM','Management'];

// export default function SignupPage() {
//   const router = useRouter();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [team, setTeam] = useState(TEAM_OPTIONS[0]);
//   const [error, setError] = useState<string | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [success, setSuccess] = useState<string | null>(null);

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setError(null);
//     setSuccess(null);

//     if (!name.trim()) {
//       setError("Please enter your full name.");
//       return;
//     }

//     if (!email.trim()) {
//       setError("Please enter your email address.");
//       return;
//     }

//     const normalizedEmail = normalizeEmail(email);
//     if (!isGreyOrangeEmail(normalizedEmail)) {
//       setError(greyOrangeEmailErrorMessage());
//       return;
//     }

//     if (!password || password.length < 6) {
//       setError("Password must be at least 6 characters long.");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
//       await updateProfile(credential.user, {
//         displayName: name.trim(),
//       });

//       const teamPolicyResponse = await fetch(`/api/firebase/team-policy?team=${encodeURIComponent(team)}`);
//       const teamPolicy = teamPolicyResponse.ok
//         ? await teamPolicyResponse.json()
//         : { allowedLevel: 0 };

//       const response = await fetch("/api/firebase/store", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           collection: "users",
//           docId: credential.user.uid,
//           data: {
//             uid: credential.user.uid,
//             name: name.trim(),
//             email: normalizedEmail,
//             team,
//             role: "learner",
//             level: 0,
//             allowedLevel: typeof teamPolicy.allowedLevel === "number" ? teamPolicy.allowedLevel : 0,
//             allowedLevelSource: "team",
//             certifications: createInitialCertifications(
//               typeof teamPolicy.allowedLevel === "number" ? teamPolicy.allowedLevel : 0
//             ),
//             createdAt: new Date().toISOString(),
//           },
//           merge: true,
//         }),
//       });

//       if (!response.ok) {
//         let serverError = "Failed to store account metadata.";

//         try {
//           const responseBody = (await response.json()) as { error?: string };
//           if (responseBody?.error) {
//             serverError = responseBody.error;
//           }
//         } catch {
//           // Ignore JSON parse failures and fall back to the default message.
//         }

//         throw new Error(serverError);
//       }

//       setSuccess("Account created successfully in Firebase. You can now sign in.");
//       setName("");
//       setEmail("");
//       setPassword("");
//       setTeam(TEAM_OPTIONS[0]);

//       router.push("/");
//     } catch (caughtError) {
//       const message =
//         caughtError instanceof Error
//           ? caughtError.message
//           : "Unable to create account. Please try again.";
//       setError(message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }

//   return (
//     <main
//       id="loginScreen"
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         padding: "24px",
//       }}
//     >
//       <div className="login-wrap" style={{ width: "100%", maxWidth: "480px" }}>
//         <div className="login-logo" style={{ textAlign: "center", marginBottom: "24px" }}>
//           <div className="go-logo" style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
//             <div className="go-logo-badge" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#FF6B00", color: "#fff", height: "40px", width: "40px", borderRadius: "10px", fontWeight: 800 }}>
//               GO
//             </div>
//             <span className="go-logo-text" style={{ color: "#e8edf5", fontSize: "18px", fontWeight: 700 }}>
//               GreyOrange
//             </span>
//           </div>
//           <div className="login-title" style={{ fontSize: "28px", fontWeight: 800, marginBottom: "6px" }}>
//             Create your ACE Academy account
//           </div>
//         </div>

//         <div className="login-card" style={{ background: "#161b27", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.11)", padding: "30px" }}>
//           {error ? (
//             <div className="login-err" style={{ display: "block", marginBottom: "16px" }}>{error}</div>
//           ) : null}
//           {success ? (
//             <div
//               className="login-err"
//               style={{
//                 display: "block",
//                 marginBottom: "16px",
//                 background: "rgba(16,185,129,0.12)",
//                 borderColor: "rgba(16,185,129,0.28)",
//                 color: "#a7f3d0",
//               }}
//             >
//               {success}
//             </div>
//           ) : null}

//           <form onSubmit={handleSubmit}>
//             <div className="field">
//               <label htmlFor="signupName">Full Name</label>
//               <input
//                 id="signupName"
//                 type="text"
//                 placeholder="Alex Morgan"
//                 value={name}
//                 onChange={(event) => setName(event.target.value)}
//                 autoComplete="name"
//                 required
//               />
//             </div>

//             <div className="field">
//               <label htmlFor="signupEmail">Email Address</label>
//               <input
//                 id="signupEmail"
//                 type="email"
//                 placeholder="you@greyorange.com"
//                 value={email}
//                 onChange={(event) => setEmail(event.target.value)}
//                 autoComplete="email"
//                 required
//               />
//               <p style={{ marginTop: "6px", fontSize: "12px", color: "#8a95a8" }}>
//                 GreyOrange organization email only (@greyorange.com)
//               </p>
//             </div>

//             <PasswordField
//               id="signupPassword"
//               label="Password"
//               placeholder="Create a password"
//               value={password}
//               onChange={setPassword}
//               autoComplete="new-password"
//               minLength={6}
//               required
//             />

//             <div className="field">
//               <label htmlFor="signupTeam">Team</label>
//               <select
//                 id="signupTeam"
//                 value={team}
//                 onChange={(event) => setTeam(event.target.value)}
//                 style={{
//                   width: "100%",
//                   background: "#1e2536",
//                   border: "1px solid rgba(255,255,255,0.06)",
//                   borderRadius: "10px",
//                   color: "#e8edf5",
//                   padding: "11px 14px",
//                   fontSize: "14px",
//                 }}
//               >
//                 {TEAM_OPTIONS.map((teamOption) => (
//                   <option value={teamOption} key={teamOption}>
//                     {teamOption}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <button className="btn-login" type="submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
//               {isSubmitting ? "Creating account..." : "Create account"}
//             </button>
//           </form>

//           <div style={{ marginTop: "14px", textAlign: "center" }}>
//             <Link href="/" style={{ color: "#a78bfa", fontSize: "12px", textDecoration: "underline" }}>
//               Back to sign in
//             </Link>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createInitialCertifications } from "@/lib/certifications";
import { greyOrangeEmailErrorMessage, isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";
import PasswordField from "@/components/auth/PasswordField";
const TEAM_OPTIONS = ['TAC','Change Management','Client Director','CEM','CAC','IM','Management'];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [team, setTeam] = useState(TEAM_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isGreyOrangeEmail(normalizedEmail)) {
      setError(greyOrangeEmailErrorMessage());
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await updateProfile(credential.user, {
        displayName: name.trim(),
      });

      const teamPolicyResponse = await fetch(`/api/firebase/team-policy?team=${encodeURIComponent(team)}`);
      const teamPolicy = teamPolicyResponse.ok
        ? await teamPolicyResponse.json()
        : { allowedLevel: 0 };

      const response = await fetch("/api/firebase/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection: "users",
          docId: credential.user.uid,
          data: {
            uid: credential.user.uid,
            name: name.trim(),
            email: normalizedEmail,
            team,
            role: "learner",
            level: 0,
            allowedLevel: typeof teamPolicy.allowedLevel === "number" ? teamPolicy.allowedLevel : 0,
            allowedLevelSource: "team",
            certifications: createInitialCertifications(
              typeof teamPolicy.allowedLevel === "number" ? teamPolicy.allowedLevel : 0
            ),
            createdAt: new Date().toISOString(),
          },
          merge: true,
        }),
      });

      if (!response.ok) {
        let serverError = "Failed to store account metadata.";

        try {
          const responseBody = (await response.json()) as { error?: string };
          if (responseBody?.error) {
            serverError = responseBody.error;
          }
        } catch {
          // Ignore JSON parse failures and fall back to the default message.
        }

        throw new Error(serverError);
      }

      setSuccess("Account created successfully in Firebase. You can now sign in.");
      setName("");
      setEmail("");
      setPassword("");
      setTeam(TEAM_OPTIONS[0]);

      router.push("/");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create account. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      id="loginScreen"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "#0b0e14", // Added matching dark background matching design
      }}
    >
      <div 
        className="login-wrap" 
        style={{ 
          width: "100%", 
          maxWidth: "1100px", // Expanded to allow side-by-side positioning
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "64px",
          flexWrap: "wrap"
        }}
      >
        {/* Left Section: Text & Branding */}
        <div className="login-logo" style={{ textAlign: "center", flex: "1 1 400px", maxWidth: "500px" }}>
          <div className="go-logo" style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div className="go-logo-badge" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#FF6B00", color: "#fff", height: "46px", width: "46px", borderRadius: "10px", fontWeight: 800, fontSize: "18px" }}>
              GO
            </div>
            <span className="go-logo-text" style={{ color: "#e8edf5", fontSize: "22px", fontWeight: 700 }}>
              GreyOrange
            </span>
          </div>
          <div className="login-title" style={{ fontSize: "42px", fontWeight: 800, marginBottom: "16px", color: "#ffffff", lineHeight: "1.2" }}>
            Create your <span style={{ background: "linear-gradient(to right, #b493ff, #fbcfe8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ACE Academy</span> account
          </div>
        </div>

        {/* Right Section: Form Card */}
        <div className="login-card" style={{ background: "#161b27", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "40px", flex: "1 1 420px", maxWidth: "460px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
          {error ? (
            <div className="login-err" style={{ display: "block", marginBottom: "16px" }}>{error}</div>
          ) : null}
          {success ? (
            <div
              className="login-err"
              style={{
                display: "block",
                marginBottom: "16px",
                background: "rgba(16,185,129,0.12)",
                borderColor: "rgba(16,185,129,0.28)",
                color: "#a7f3d0",
              }}
            >
              {success}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="signupName">Full Name</label>
              <input
                id="signupName"
                type="text"
                placeholder="Alex Morgan"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="signupEmail">Email Address</label>
              <input
                id="signupEmail"
                type="email"
                placeholder="you@greyorange.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              {/* <p style={{ marginTop: "6px", fontSize: "12px", color: "#8a95a8" }}>
                GreyOrange organization email only (@greyorange.com)
              </p> */}
            </div>

            <PasswordField
              id="signupPassword"
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={6}
              required
            />

            <div className="field">
              <label htmlFor="signupTeam">Team</label>
              <select
                id="signupTeam"
                value={team}
                onChange={(event) => setTeam(event.target.value)}
                style={{
                  width: "100%",
                  background: "#1e2536",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  color: "#e8edf5",
                  padding: "11px 14px",
                  fontSize: "14px",
                }}
              >
                {TEAM_OPTIONS.map((teamOption) => (
                  <option value={teamOption} key={teamOption}>
                    {teamOption}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-login" type="submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div style={{ marginTop: "14px", textAlign: "center" }}>
            <Link href="/" style={{ color: "#a78bfa", fontSize: "12px", textDecoration: "underline" }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
