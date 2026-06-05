import React, { useState } from "react";
import { motion } from "motion/react";
import { Loader, Eye, EyeOff, LogIn } from "lucide-react";
import brandLogo from "../assets/logo.png";

interface LoginPageProps {
  onLoginSuccess: () => void;
  isLoading: boolean;
  onGoogleSignIn: () => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  isLoading,
  onGoogleSignIn,
}) => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (!agreedToTerms || !agreedToPrivacy) {
      setError("Vous devez accepter les conditions d'utilisation et la politique de confidentialité");
      return;
    }

    try {
      setError(null);
      await onGoogleSignIn();
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion. Veuillez réessayer.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50 overflow-y-auto">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-white/20"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <img
              src={brandLogo}
              alt="A-Wolf"
              className="w-14 h-14 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            A-Wolf
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Votre espace collaboratif d'études
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading || !agreedToTerms || !agreedToPrivacy}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mb-6 shadow-lg hover:shadow-xl disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Se connecter avec Google
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500 font-medium">ou</span>
          </div>
        </div>

        {/* Checkboxes for Terms & Privacy */}
        <div className="space-y-3 mb-6">
          {/* Terms */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-slate-300 accent-purple-600 cursor-pointer"
              />
            </div>
            <div className="flex-1 text-sm">
              <span className="text-slate-700">J'accepte les</span>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-purple-600 hover:text-purple-700 font-bold underline ml-1"
              >
                conditions d'utilisation
              </button>
            </div>
          </label>

          {/* Privacy */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-slate-300 accent-purple-600 cursor-pointer"
              />
            </div>
            <div className="flex-1 text-sm">
              <span className="text-slate-700">J'accepte la</span>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-purple-600 hover:text-purple-700 font-bold underline ml-1"
              >
                politique de confidentialité
              </button>
            </div>
          </label>
        </div>

        {/* Info text */}
        <p className="text-center text-xs text-slate-500 font-medium">
          Pas de compte ? Créez-en un en cliquant sur "Se connecter avec Google"
        </p>
      </motion.div>

      {/* Terms Modal */}
      {showTermsModal && (
        <TermsModal onClose={() => setShowTermsModal(false)} />
      )}

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
      )}
    </div>
  );
};

interface ModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<ModalProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Conditions d'Utilisation</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6 text-slate-700 text-sm leading-relaxed">
          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">1. Utilisation du Service</h3>
            <p>
              A-Wolf est une plateforme collaborative d'études conçue pour les étudiants. En acceptant ces
              conditions, vous acceptez d'utiliser la plateforme conformément à la loi et de manière responsable.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">2. Compte Utilisateur</h3>
            <p>
              Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion. Vous
              acceptez de ne pas partager votre compte avec d'autres utilisateurs et de notifier A-Wolf en
              cas d'utilisation non autorisée.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">3. Contenu Utilisateur</h3>
            <p>
              En soumettant du contenu sur A-Wolf, vous garantissez que vous possédez ou avez le droit
              d'utiliser ce contenu. Vous accordez à A-Wolf une licence pour utiliser, reproduire et
              distribuer votre contenu sur la plateforme.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">4. Limitations de Responsabilité</h3>
            <p>
              A-Wolf est fourni "en l'état" sans garantie d'aucune sorte. A-Wolf ne sera pas responsable
              des dommages indirects, accidentels ou consécutifs découlant de l'utilisation de la plateforme.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">5. Modifications du Service</h3>
            <p>
              A-Wolf se réserve le droit de modifier ou d'interrompre le service à tout moment, avec ou sans
              préavis. Nous aviserons les utilisateurs de tout changement important.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">6. Résiliation</h3>
            <p>
              A-Wolf peut résilier votre compte si vous violez ces conditions ou si vous utilisez le service
              de manière abusive. Vous pouvez aussi résilier votre compte à tout moment.
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-slate-100 border-t border-slate-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PrivacyModal: React.FC<ModalProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Politique de Confidentialité</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6 text-slate-700 text-sm leading-relaxed">
          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">1. Collecte de Données</h3>
            <p>
              A-Wolf collecte les informations personnelles que vous fournissez lors de l'inscription, y
              compris votre nom, adresse e-mail et profil Google. Nous collectons également les données
              d'utilisation pour améliorer le service.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">2. Utilisation des Données</h3>
            <p>
              Vos données personnelles sont utilisées pour : fournir et améliorer le service, communiquer
              avec vous, gérer votre compte, et effectuer des analyses statistiques.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">3. Stockage Sécurisé</h3>
            <p>
              Votre token Google OAuth est stocké de manière sécurisée via le système de gestion des
              credentials du système d'exploitation (Keytar). Les données sensibles ne sont jamais stockées
              en texte clair.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">4. Partage de Données</h3>
            <p>
              A-Wolf ne partage pas vos données personnelles avec des tiers sans votre consentement explicite,
              sauf dans les cas requis par la loi ou pour fournir le service.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">5. Droits des Utilisateurs</h3>
            <p>
              Vous avez le droit d'accéder, de corriger ou de supprimer vos données personnelles. Pour
              exercer ces droits, contactez-nous via les informations de contact disponibles dans l'app.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">6. Cookies et Suivi</h3>
            <p>
              A-Wolf utilise les cookies localement pour améliorer votre expérience utilisateur. Nous ne
              suivons pas votre activité en dehors de notre plateforme.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-lg text-slate-900 mb-3">7. Modifications de la Politique</h3>
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications
              seront publiées sur cette page avec une date de mise à jour.
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 bg-slate-100 border-t border-slate-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
