import React, { useState } from "react";
import { motion } from "motion/react";
import { Chrome, AlertCircle } from "lucide-react";
import brandLogo from "../assets/logo.png";

interface LoginPageProps {
  onGoogleSignIn: () => Promise<void>;
  onTermsAccepted: () => void;
  onPrivacyAccepted?: () => void;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onShowTerms: () => void;
  onShowPrivacy: () => void;
  isLoading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onGoogleSignIn,
  onTermsAccepted,
  onPrivacyAccepted,
  termsAccepted,
  privacyAccepted,
  onShowTerms,
  onShowPrivacy,
  isLoading,
}) => {
  const [error, setError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    if (!termsAccepted || !privacyAccepted) {
      setError("Veuillez accepter les conditions d'utilisation et la politique de confidentialité");
      return;
    }

    try {
      setIsSigningIn(true);
      setError("");
      await onGoogleSignIn();
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
      console.error(err);
      setIsSigningIn(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 flex items-center justify-center z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.img
            src={brandLogo}
            alt="A-Wolf"
            className="w-24 h-24 mx-auto mb-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">A-Wolf</h1>
          <p className="text-gray-600">Collaborative Workspace</p>
        </div>

        {/* Description */}
        <motion.p
          className="text-center text-sm text-gray-600 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Connectez-vous pour gérer vos tâches, calendrier et collaborer avec votre équipe
        </motion.p>

        {/* Error Message */}
        {error && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        {/* Google Sign In Button */}
        <motion.button
          onClick={handleSignIn}
          disabled={isSigningIn || isLoading || !termsAccepted || !privacyAccepted}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileHover={{ scale: !isSigningIn && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: !isSigningIn && !isLoading ? 0.98 : 1 }}
        >
          <Chrome className="w-5 h-5" />
          {isSigningIn || isLoading ? "Connexion en cours..." : "Se connecter avec Google"}
        </motion.button>

        {/* Terms & Privacy Checkboxes */}
        <motion.div
          className="mt-6 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={onTermsAccepted}
              className="mt-1 w-4 h-4 accent-violet-600 rounded cursor-pointer"
            />
            <div className="flex-1 text-sm">
              <span className="text-gray-700">J'accepte les</span>
              <button
                type="button"
                onClick={onShowTerms}
                className="text-violet-600 hover:text-violet-700 underline ml-1"
              >
                conditions d'utilisation
              </button>
            </div>
          </label>

          <label className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={onPrivacyAccepted}
              className="mt-1 w-4 h-4 accent-violet-600 rounded cursor-pointer"
            />
            <div className="flex-1 text-sm">
              <span className="text-gray-700">J'accepte la</span>
              <button
                type="button"
                onClick={onShowPrivacy}
                className="text-violet-600 hover:text-violet-700 underline ml-1"
              >
                politique de confidentialité
              </button>
            </div>
          </label>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-center text-xs text-gray-500 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Vos données sont sécurisées et stockées localement
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
