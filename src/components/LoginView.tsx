import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Lock, FileText, Check, X, ExternalLink, Calendar, HelpCircle } from "lucide-react";
import { useCollab } from "../context/CollabContext";
import brandLogo from "../assets/logo.png";

interface LoginViewProps {
  loginWithGoogle: (clientId?: string) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({ loginWithGoogle }) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [shakeCheckbox, setShakeCheckbox] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLocalAuthModal, setShowLocalAuthModal] = useState(false);
  const { loginWithCredentials, registerLocalAccount } = useCollab() as any;
  const [localUsername, setLocalUsername] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [localError, setLocalError] = useState(""); // Fix: erreur inline dans le modal

  // Ouvre la modale locale après vérification des CGU, et réinitialise les champs
  const handleLocalAuthOpen = () => {
    if (!acceptedTerms) {
      setShakeCheckbox(true);
      setTimeout(() => setShakeCheckbox(false), 500);
      return;
    }
    setLocalUsername("");
    setLocalPassword("");
    setLocalError("");
    setShowLocalAuthModal(true);
  };


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-100/40 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-100/40 blur-3xl" />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl relative z-10 flex flex-col items-center text-center"
      >
        {/* Brand Header */}
        <div className="w-24 h-24 flex items-center justify-center mb-6 bg-white rounded-2xl p-1 shadow-2xs border border-slate-100">
          <img src={brandLogo} alt="A-Wolf Logo" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display mb-2">
          Bienvenue sur A-Wolf
        </h1>
        <p className="text-xs text-slate-500 font-medium max-w-sm mb-8 leading-relaxed">
          Votre espace de travail et emploi du temps universitaire intelligent, parfaitement synchronisé avec vos cours et révisions.
        </p>

        {/* Consent Checkbox */}
        <div 
          className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border mb-6 transition-all ${
            shakeCheckbox 
              ? "border-red-400 bg-red-50/30 animate-shake" 
              : acceptedTerms 
                ? "border-purple-200 bg-purple-50/10" 
                : "border-slate-100 bg-slate-50/30"
          }`}
        >
          <div className="relative flex items-center mt-0.5">
            <input
              type="checkbox"
              id="accept-terms-cb"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="sr-only cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setAcceptedTerms(!acceptedTerms)}
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                acceptedTerms 
                  ? "bg-purple-600 border-transparent text-white shadow-sm" 
                  : "border-slate-300 bg-white hover:border-purple-400"
              }`}
            >
              {acceptedTerms && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
          </div>
          
          <label htmlFor="accept-terms-cb" className="text-[11px] text-slate-600 text-left leading-normal cursor-pointer select-none">
            J'accepte les{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowTermsModal(true);
              }}
              className="text-purple-600 font-bold hover:underline inline"
            >
              Conditions d'Utilisation
            </button>{" "}
            et la{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowPrivacyModal(true);
              }}
              className="text-purple-600 font-bold hover:underline inline"
            >
              Politique de Confidentialité
            </button>.
          </label>
        </div>

        {/* Bouton Connexion locale */}
        <div className="w-full mt-4 mb-4 flex flex-col gap-3">
          <button
            onClick={handleLocalAuthOpen}
            className="w-full py-3.5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-md active:scale-[0.98] border cursor-pointer bg-purple-600 hover:bg-purple-700 text-white border-transparent"
          >
            Se connecter / Créer un compte
          </button>
        </div>

        {/* Google Authentication Button — Coming Soon */}
        <div className="w-full relative">
          <button
            disabled
            className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-3 border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-70"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block shrink-0 opacity-50">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>Se connecter avec Google</span>
          </button>
          {/* Badge Coming Soon */}
          <span className="absolute -top-2.5 -right-2 bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            Bientôt
          </span>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-1.5 mt-8 text-[10px] text-slate-400 font-semibold justify-center">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Connexion sécurisée via Google OAuth</span>
        </div>
      </motion.div>

      {/* ----------------- MODAL: Conditions d'Utilisation ----------------- */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-extrabold text-sm text-slate-950 font-display flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-purple-600" />
                  Conditions d'Utilisation de A-Wolf
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto text-xs text-slate-650 space-y-4 pr-1 leading-relaxed text-left font-medium">
                <p className="font-bold text-slate-800">Dernière mise à jour : 11 Juin 2026</p>
                <p>
                  Bienvenue sur l'application A-Wolf. En utilisant nos services, vous acceptez sans réserve les présentes conditions d'utilisation.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">1. Description du Service</h4>
                <p>
                  A-Wolf est un outil d'accompagnement académique permettant de gérer votre emploi du temps, vos tâches, vos notes d'études et de synchroniser vos événements avec Google Agenda.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">2. Connexion et Initialisation</h4>
                <p>
                  Afin de fonctionner de manière optimale, l'application requiert une authentification via votre compte Google. Cette connexion permet d'initialiser votre profil étudiant et d'assurer la synchronisation bidirectionnelle de vos calendriers.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">3. Responsabilités de l'Utilisateur</h4>
                <p>
                  Vous êtes responsable de l'exactitude des informations fournies. Vous vous engagez à ne pas perturber le bon fonctionnement de l'application ni à contourner les mécanismes de sécurité intégrés.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">4. Propriété Intellectuelle</h4>
                <p>
                  Tous les droits afférents aux visuels, interfaces, codes et logos de A-Wolf restent la propriété exclusive de l'équipe de développement.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">5. Limitation de Responsabilité</h4>
                <p>
                  L'application est fournie "en l'état", sans garantie de disponibilité ininterrompue. Nous ne saurions être tenus responsables d'éventuels retards ou absences dus à une mauvaise synchronisation des calendriers.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all cursor-pointer shadow-md shadow-purple-600/10"
                >
                  Accepter et Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- MODAL: Politique de Confidentialité ----------------- */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-extrabold text-sm text-slate-950 font-display flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-purple-600" />
                  Politique de Confidentialité de A-Wolf
                </h3>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto text-xs text-slate-650 space-y-4 pr-1 leading-relaxed text-left font-medium">
                <p className="font-bold text-slate-800">Dernière mise à jour : 11 Juin 2026</p>
                <p>
                  Chez A-Wolf, nous accordons une importance primordiale à la protection de vos données personnelles et à votre vie privée.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">1. Données Collectées</h4>
                <p>
                  Lorsque vous vous authentifiez avec Google, nous accédons à :
                  <br />- Vos informations de profil de base (Nom complet, adresse e-mail).
                  <br />- Vos données d'agenda Google Calendar (uniquement pour importer et exporter vos cours et révisions).
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">2. Utilisation des Données</h4>
                <p>
                  Vos données sont utilisées exclusivement pour le fonctionnement de l'application A-Wolf sur votre appareil. Elles permettent d'alimenter votre emploi du temps et de planifier vos alertes.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">3. Stockage et Sécurité</h4>
                <p>
                  Vos informations d'agenda et de profil sont stockées de façon sécurisée localement dans le stockage de votre navigateur (localStorage/Electron cache). Aucune de vos données privées n'est transférée ou hébergée sur nos serveurs.
                </p>

                <h4 className="font-extrabold text-slate-900 mt-2">4. Droits des Utilisateurs</h4>
                <p>
                  Vous conservez un contrôle total sur vos données. Vous pouvez révoquer les accès à tout moment en vous déconnectant simplement de votre compte Google depuis l'application, ce qui supprimera instantanément toutes vos données d'agenda locales de notre cache.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowPrivacyModal(false);
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs hover:shadow-lg transition-all cursor-pointer shadow-md shadow-purple-600/10"
                >
                  Accepter et Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOCAL AUTH MODAL */}
      <AnimatePresence>
        {showLocalAuthModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 shadow-2xl relative"
            >
              {/* En-tête modal */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Accès local</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Créer un compte ou se connecter.</p>
                </div>
                <button
                  onClick={() => setShowLocalAuthModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Champs de saisie */}
              <div className="grid gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nom d'utilisateur</label>
                  <input
                    value={localUsername}
                    onChange={e => { setLocalUsername(e.target.value); setLocalError(""); }}
                    onKeyDown={e => e.key === "Enter" && (document.getElementById("local-pw-input") as HTMLInputElement)?.focus()}
                    placeholder="ex: jean123"
                    autoFocus
                    autoComplete="username"
                    className={`w-full bg-white border rounded-xl px-3 py-2.5 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                      localError && !localUsername.trim() ? "border-red-400 bg-red-50/30" : "border-slate-200"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mot de passe</label>
                  <input
                    id="local-pw-input"
                    value={localPassword}
                    onChange={e => { setLocalPassword(e.target.value); setLocalError(""); }}
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    className={`w-full bg-white border rounded-xl px-3 py-2.5 text-slate-800 text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all ${
                      localError && !localPassword ? "border-red-400 bg-red-50/30" : "border-slate-200"
                    }`}
                  />
                </div>
              </div>

              {/* Message d'erreur inline */}
              {localError && (
                <div className="mt-3 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  {localError}
                </div>
              )}

              {/* Boutons d'action */}
              <div className="flex flex-col gap-2 mt-4">
                <button
                  disabled={isLoggingIn || !localUsername.trim() || !localPassword}
                  onClick={async () => {
                    setLocalError("");
                    if (!localUsername.trim() || !localPassword) {
                      setLocalError("Veuillez remplir tous les champs.");
                      return;
                    }
                    setIsLoggingIn(true);
                    try {
                      await loginWithCredentials(localUsername.trim(), localPassword);
                      setShowLocalAuthModal(false);
                    } catch (err) {
                      setLocalError(err instanceof Error ? err.message : "Erreur de connexion");
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </span>
                  ) : "Se connecter"}
                </button>
                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-slate-100" />
                  <span className="mx-3 text-[10px] text-slate-400 font-semibold">ou</span>
                  <div className="flex-1 border-t border-slate-100" />
                </div>
                <button
                  disabled={isLoggingIn || !localUsername.trim() || !localPassword}
                  onClick={async () => {
                    setLocalError("");
                    if (!localUsername.trim() || !localPassword) {
                      setLocalError("Veuillez remplir tous les champs.");
                      return;
                    }
                    if (localPassword.length < 4) {
                      setLocalError("Le mot de passe doit contenir au moins 4 caractères.");
                      return;
                    }
                    setIsLoggingIn(true);
                    try {
                      await registerLocalAccount(localUsername.trim(), localPassword, localUsername.trim());
                      setShowLocalAuthModal(false);
                    } catch (err) {
                      setLocalError(err instanceof Error ? err.message : "Erreur lors de la création de compte");
                    } finally {
                      setIsLoggingIn(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 font-black text-sm transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Créer un nouveau compte
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-400">Les données sont stockées localement sur votre appareil.</p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
